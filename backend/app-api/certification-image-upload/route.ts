import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { promisify } from "node:util";
import {
  ensureUploadsDir,
  getImageExtension,
  isValidImageBuffer,
  sanitizeFileSegment,
  sanitizeStoredUserId,
  UPLOADS_DIR,
} from "@/lib/server/file-security";
import {
  buildCertificationImageAccessUrl,
  createCertificationMediaPublicId,
} from "@/lib/server/certification-media";
import { prisma } from "@/lib/server/db";
import { isMissingTableError } from "@/lib/server/media-compat";
import { deleteStoredObject, putStoredObject } from "@/lib/server/object-storage";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  jsonWithSecurity,
} from "@/lib/server/security";
import { requireAuthUser } from "@/lib/server/api-auth";

const execFileAsync = promisify(execFile);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const THUMB_WIDTH = 320;
const THUMB_HEIGHT = 240;
const FULL_MAX_WIDTH = 1200;

export const runtime = "nodejs";

function buildDisplayBaseName(issuer: string, program: string, firstName: string) {
  const issuerSegment = sanitizeFileSegment(issuer, 40) || "entidad";
  const programSegment = sanitizeFileSegment(program, 40) || "programa";
  const firstNameSegment = sanitizeFileSegment(firstName, 30) || "usuario";
  return `${issuerSegment}_${programSegment}_${firstNameSegment}`;
}

function normalizeAssetVisibility(profileVisibility: string | undefined) {
  if (
    profileVisibility === "public" ||
    profileVisibility === "private" ||
    profileVisibility === "recruiters_only"
  ) {
    return profileVisibility;
  }

  return "private";
}

async function buildOptimizedImages(
  sourcePath: string,
  fullOutputPath: string,
  thumbOutputPath: string,
) {
  const fullVariants = [
    { width: FULL_MAX_WIDTH, quality: 82 },
    { width: 1100, quality: 76 },
    { width: 1000, quality: 72 },
  ];
  const thumbVariants = [
    { width: THUMB_WIDTH, height: THUMB_HEIGHT, quality: 78 },
    { width: 300, height: 225, quality: 72 },
    { width: 280, height: 210, quality: 68 },
  ];

  for (const variant of fullVariants) {
    await execFileAsync("/usr/bin/magick", [
      sourcePath,
      "-auto-orient",
      "-strip",
      "-resize",
      `${variant.width}x${variant.width}>`,
      "-define",
      "webp:method=6",
      "-quality",
      String(variant.quality),
      fullOutputPath,
    ]);

    const stats = await fs.stat(fullOutputPath);
    if (stats.size <= 500 * 1024) {
      break;
    }
  }

  for (const variant of thumbVariants) {
    await execFileAsync("/usr/bin/magick", [
      sourcePath,
      "-auto-orient",
      "-strip",
      "-resize",
      `${variant.width}x${variant.height}^`,
      "-gravity",
      "center",
      "-extent",
      `${variant.width}x${variant.height}`,
      "-define",
      "webp:method=6",
      "-quality",
      String(variant.quality),
      thumbOutputPath,
    ]);

    const stats = await fs.stat(thumbOutputPath);
    if (stats.size <= 100 * 1024) {
      break;
    }
  }

  const [
    { stdout: fullIdentify },
    { stdout: thumbIdentify },
  ] = await Promise.all([
    execFileAsync("/usr/bin/magick", ["identify", "-format", "%w %h", fullOutputPath]),
    execFileAsync("/usr/bin/magick", ["identify", "-format", "%w %h", thumbOutputPath]),
  ]);

  const [fullWidth = "0", fullHeight = "0"] = fullIdentify.trim().split(/\s+/);
  const [thumbWidth = "0", thumbHeight = "0"] = thumbIdentify.trim().split(/\s+/);

  return {
    fullWidth: Number(fullWidth) || FULL_MAX_WIDTH,
    fullHeight: Number(fullHeight) || FULL_MAX_WIDTH,
    thumbWidth: Number(thumbWidth) || THUMB_WIDTH,
    thumbHeight: Number(thumbHeight) || THUMB_HEIGHT,
  };
}

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "certification-image-upload",
    maxRequests: 12,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const issuer = String(formData.get("issuer") ?? "");
    const program = String(formData.get("program") ?? "");
    const firstNameInput = String(formData.get("firstName") ?? "");

    if (!(file instanceof File)) {
      return jsonWithSecurity({ ok: false, message: "Archivo inválido" }, { status: 400 });
    }

    const extension = getImageExtension(file);
    if (!extension) {
      return jsonWithSecurity(
        { ok: false, message: "Solo se aceptan archivos PNG o JPG" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonWithSecurity(
        { ok: false, message: "La imagen supera el límite de 5 MB" },
        { status: 400 },
      );
    }

    const sanitizedUserId = sanitizeStoredUserId(auth.id);
    if (!sanitizedUserId) {
      return jsonWithSecurity({ ok: false, message: "Usuario inválido" }, { status: 400 });
    }

    const firstName =
      sanitizeFileSegment(firstNameInput.trim().split(/\s+/)[0] ?? "", 30) ||
      sanitizeFileSegment(auth.displayName.trim().split(/\s+/)[0] ?? "", 30) ||
      "usuario";
    const displayBaseName = buildDisplayBaseName(issuer, program, firstName);
    const timestamp = Date.now();
    const baseStoredName = `certification_${sanitizedUserId}_${timestamp}`;
    const sourcePath = `${UPLOADS_DIR}/${baseStoredName}.${extension}`;
    const fullOutputPath = `${UPLOADS_DIR}/${baseStoredName}_full.webp`;
    const thumbOutputPath = `${UPLOADS_DIR}/${baseStoredName}_thumb.webp`;
    const displayFileName = `${displayBaseName}.webp`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    if (!isValidImageBuffer(fileBuffer, extension)) {
      return jsonWithSecurity(
        { ok: false, message: "Solo se aceptan archivos PNG o JPG válidos" },
        { status: 400 },
      );
    }

    await ensureUploadsDir();
    await fs.writeFile(sourcePath, fileBuffer);

    try {
      await execFileAsync("/usr/bin/clamscan", ["--no-summary", sourcePath]);
      const dimensions = await buildOptimizedImages(sourcePath, fullOutputPath, thumbOutputPath);
      const [fullStats, thumbStats] = await Promise.all([
        fs.stat(fullOutputPath),
        fs.stat(thumbOutputPath),
        putStoredObject({
          storageKey: `${baseStoredName}_full.webp`,
          body: await fs.readFile(fullOutputPath),
          contentType: "image/webp",
          cacheControl: "private, max-age=300, must-revalidate",
        }),
        putStoredObject({
          storageKey: `${baseStoredName}_thumb.webp`,
          body: await fs.readFile(thumbOutputPath),
          contentType: "image/webp",
          cacheControl: "private, max-age=300, must-revalidate",
        }),
      ]);

      let asset = {
        id: `legacy-${baseStoredName}`,
        publicId: createCertificationMediaPublicId(),
      };

      try {
        const createdAsset = await prisma.certificationAsset.create({
          data: {
            publicId: asset.publicId,
            ownerUserId: auth.id,
            mediaKind: "image",
            visibility: normalizeAssetVisibility(
              auth.role === "candidate" ? auth.profileVisibility : undefined,
            ),
            permissionsJson: JSON.stringify({
              allowedViewerIds: [],
              allowedCompanyIds: [],
            }),
            storageKey: `${baseStoredName}_full.webp`,
            thumbnailStorageKey: `${baseStoredName}_thumb.webp`,
            mimeType: "image/webp",
          },
        });
        asset = createdAsset;
      } catch (error) {
        if (!isMissingTableError(error, "CertificationAsset")) {
          throw error;
        }
      }

      await fs.rm(sourcePath, { force: true });

      return jsonWithSecurity({
        ok: true,
        assetId: asset.id,
        assetPublicId: asset.publicId,
        displayFileName,
        fullUrl: buildCertificationImageAccessUrl(asset.publicId, "full"),
        thumbUrl: buildCertificationImageAccessUrl(asset.publicId, "thumb"),
        fullWidth: dimensions.fullWidth,
        fullHeight: dimensions.fullHeight,
        thumbWidth: dimensions.thumbWidth,
        thumbHeight: dimensions.thumbHeight,
        fullSizeBytes: fullStats.size,
        thumbSizeBytes: thumbStats.size,
        message: "Certificado cargado correctamente",
      });
    } catch (error) {
      await Promise.all([
        fs.rm(sourcePath, { force: true }),
        fs.rm(fullOutputPath, { force: true }),
        fs.rm(thumbOutputPath, { force: true }),
        deleteStoredObject(`${baseStoredName}_full.webp`),
        deleteStoredObject(`${baseStoredName}_thumb.webp`),
      ]);

      const code = (error as { code?: number }).code;
      if (code === 1) {
        return jsonWithSecurity(
          { ok: false, message: "No se pudo procesar la imagen" },
          { status: 400 },
        );
      }

      return jsonWithSecurity(
        { ok: false, message: "No se pudo cargar la imagen" },
        { status: 500 },
      );
    }
  } catch {
    return jsonWithSecurity(
      { ok: false, message: "No se pudo cargar la imagen" },
      { status: 500 },
    );
  }
}
