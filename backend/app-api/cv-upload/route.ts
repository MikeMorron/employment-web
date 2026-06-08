import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { promisify } from "node:util";
import {
  ensureUploadsDir,
  getCurrentDateLabel,
  isOwnedStoredFile,
  isPdfBuffer,
  resolveStoredUploadPath,
  sanitizeFileSegment,
  sanitizeStoredUserId,
  UPLOADS_DIR,
} from "@/lib/server/file-security";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  jsonWithSecurity,
} from "@/lib/server/security";
import { requireCandidateUser } from "@/lib/server/api-auth";
import { prisma } from "@/lib/server/db";
import { buildCvDownloadHref } from "@/lib/file-links";
import { isMissingTableError } from "@/lib/server/media-compat";
import { deleteStoredObject, putStoredObject } from "@/lib/server/object-storage";
import { deletePrivateMediaAssetByPublicId } from "@/lib/server/private-media-assets";
import { createPrivateMediaPublicId } from "@/lib/server/private-media";

const execFileAsync = promisify(execFile);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILE_NAME_LENGTH = 80;

export const runtime = "nodejs";

function getDownloadFileName({
  fullName,
  role,
}: {
  fullName: string;
  role: string;
}) {
  const dateLabel = getCurrentDateLabel();
  const normalizedName = sanitizeFileSegment(fullName, MAX_FILE_NAME_LENGTH);
  const normalizedRole = sanitizeFileSegment(role, MAX_FILE_NAME_LENGTH);

  if (normalizedName && normalizedRole) {
    return `${normalizedName}_${normalizedRole}_${dateLabel}.pdf`;
  }

  if (normalizedName) {
    return `${normalizedName}_CV_${dateLabel}.pdf`;
  }

  return `CV_Mario_TalentSyncro_${dateLabel}.pdf`;
}

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const auth = await requireCandidateUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "cv-upload",
    maxRequests: 8,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonWithSecurity({ ok: false, message: "Archivo inválido" }, { status: 400 });
    }

    const lowerName = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" && lowerName.endsWith(".pdf");

    if (!isPdf) {
      return jsonWithSecurity({ ok: false, message: "Solo se aceptan archivos PDF" }, { status: 400 });
    }

    const originalBaseName = file.name.replace(/\.pdf$/i, "");
    const sanitizedOriginalBaseName = sanitizeFileSegment(originalBaseName, MAX_FILE_NAME_LENGTH);

    if (!sanitizedOriginalBaseName || sanitizedOriginalBaseName.length > MAX_FILE_NAME_LENGTH) {
      return jsonWithSecurity(
        { ok: false, message: "El nombre del PDF debe tener maximo 80 caracteres" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonWithSecurity({ ok: false, message: "El PDF supera el limite de 5 MB" }, { status: 400 });
    }

    await ensureUploadsDir();
    const sanitizedUserId = sanitizeStoredUserId(auth.id);

    if (!sanitizedUserId) {
      return jsonWithSecurity(
        { ok: false, message: "Identificador de usuario inválido" },
        { status: 400 },
      );
    }

    const timestamp = Date.now();
    const storedFileName = `cv_${sanitizedUserId}_${timestamp}.pdf`;
    const filePath = `${UPLOADS_DIR}/${storedFileName}`;
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    if (!isPdfBuffer(fileBuffer)) {
      return jsonWithSecurity(
        { ok: false, message: "Solo se aceptan archivos PDF válidos" },
        { status: 400 },
      );
    }

    await fs.writeFile(filePath, fileBuffer);

    let nextAssetPublicId: string | null = null;
    let storedObjectUploaded = false;

    try {
      await execFileAsync("/usr/bin/clamscan", ["--no-summary", filePath]);
      await putStoredObject({
        storageKey: storedFileName,
        body: fileBuffer,
        contentType: "application/pdf",
        cacheControl: "private, max-age=1800, must-revalidate",
      });
      storedObjectUploaded = true;
      await fs.rm(filePath, { force: true });

      const currentProfile = await prisma.profile.findUnique({
        where: { userId: auth.id },
        select: {
          cvStoredFileName: true,
          cvAssetPublicId: true,
        },
      });

      if (!currentProfile) {
        await fs.rm(filePath, { force: true });
        return jsonWithSecurity(
          { ok: false, message: "Perfil no disponible" },
          { status: 404 },
        );
      }

      let assetPublicId = createPrivateMediaPublicId();

      try {
        const asset = await prisma.privateMediaAsset.create({
          data: {
            publicId: assetPublicId,
            ownerUserId: auth.id,
            mediaType: "cv",
            visibility: "private",
            permissionsJson: JSON.stringify({
              allowedViewerIds: [],
              allowedCompanyIds: [],
            }),
            storageKey: storedFileName,
            mimeType: "application/pdf",
          },
        });
        assetPublicId = asset.publicId;
      } catch (error) {
        if (!isMissingTableError(error, "PrivateMediaAsset")) {
          throw error;
        }
      }

      nextAssetPublicId = assetPublicId;

      const downloadFileName = getDownloadFileName({
        fullName: auth.nombre ?? auth.displayName ?? "perfil",
        role: auth.rol ?? "cv",
      });
      await prisma.profile.update({
        where: { userId: auth.id },
        data: {
          cvStoredFileName: storedFileName,
          cv: downloadFileName,
          cvAssetPublicId: assetPublicId,
        },
      });

      const previousStoredFileName = currentProfile.cvStoredFileName ?? "";
      const previousAssetPublicId = currentProfile.cvAssetPublicId ?? "";
      if (
        previousStoredFileName &&
        previousStoredFileName !== storedFileName &&
        !previousAssetPublicId &&
        isOwnedStoredFile(previousStoredFileName, auth.id, "cv")
      ) {
        const previousPath = resolveStoredUploadPath(previousStoredFileName);
        if (previousPath) {
          await fs.rm(previousPath, { force: true });
        }
      }

      if (previousAssetPublicId && previousAssetPublicId !== assetPublicId) {
        await deletePrivateMediaAssetByPublicId(prisma, auth.id, previousAssetPublicId);
      }

      return jsonWithSecurity({
        ok: true,
        downloadFileName,
        downloadUrl: buildCvDownloadHref(assetPublicId),
        message: "CV adjuntado correctamente",
      });
    } catch (error) {
      const code = (error as { code?: number }).code;
      await fs.rm(filePath, { force: true });
      if (storedObjectUploaded) {
        await deleteStoredObject(storedFileName);
      }
      if (nextAssetPublicId) {
        await prisma.privateMediaAsset.deleteMany({
          where: {
            ownerUserId: auth.id,
            publicId: nextAssetPublicId,
          },
        }).catch((deleteError) => {
          if (!isMissingTableError(deleteError, "PrivateMediaAsset")) {
            throw deleteError;
          }
        });
      }

      if (code === 1) {
        return jsonWithSecurity(
          { ok: false, message: "No se pudo adjuntar el CV" },
          { status: 400 },
        );
      }

      return jsonWithSecurity(
        { ok: false, message: "No se pudo adjuntar el CV" },
        { status: 500 },
      );
    }
  } catch {
    return jsonWithSecurity(
      { ok: false, message: "No se pudo adjuntar el CV" },
      { status: 500 },
    );
  }
}
