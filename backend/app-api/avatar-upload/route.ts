import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { promisify } from "node:util";
import {
  ensureUploadsDir,
  getImageExtension,
  isOwnedStoredFile,
  isValidImageBuffer,
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
import { requireAuthUser } from "@/lib/server/api-auth";
import { prisma } from "@/lib/server/db";
import { buildAvatarFileHref } from "@/lib/file-links";
import { isMissingTableError } from "@/lib/server/media-compat";
import { deleteStoredObject, putStoredObject } from "@/lib/server/object-storage";
import { deletePrivateMediaAssetByPublicId } from "@/lib/server/private-media-assets";
import { createPrivateMediaPublicId } from "@/lib/server/private-media";

const execFileAsync = promisify(execFile);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILE_NAME_LENGTH = 20;

export const runtime = "nodejs";

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
    scope: "avatar-upload",
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

    const extension = getImageExtension(file);

    if (!extension) {
      return jsonWithSecurity(
        { ok: false, message: "Solo se aceptan archivos PNG o JPG" },
        { status: 400 },
      );
    }

    const originalBaseName = file.name.replace(/\.(png|jpe?g)$/i, "");
    const sanitizedOriginalBaseName = sanitizeFileSegment(originalBaseName, MAX_FILE_NAME_LENGTH);

    if (!sanitizedOriginalBaseName || sanitizedOriginalBaseName.length > MAX_FILE_NAME_LENGTH) {
      return jsonWithSecurity(
        { ok: false, message: "El nombre de la foto debe tener maximo 20 caracteres" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonWithSecurity(
        { ok: false, message: "La foto supera el limite de 5 MB" },
        { status: 400 },
      );
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
    const storedFileName = `avatar_${sanitizedUserId}_${timestamp}.${extension}`;
    const filePath = `${UPLOADS_DIR}/${storedFileName}`;
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    if (!isValidImageBuffer(fileBuffer, extension)) {
      return jsonWithSecurity(
        { ok: false, message: "Solo se aceptan archivos PNG o JPG válidos" },
        { status: 400 },
      );
    }

    await fs.writeFile(filePath, fileBuffer);

    let nextAssetPublicId: string | null = null;
    let storedObjectUploaded = false;

    try {
      await execFileAsync("/usr/bin/clamscan", ["--no-summary", filePath]);
      await execFileAsync("/usr/bin/magick", ["identify", filePath]);
      await putStoredObject({
        storageKey: storedFileName,
        body: fileBuffer,
        contentType: extension === "png" ? "image/png" : "image/jpeg",
        cacheControl: "private, max-age=1800, must-revalidate",
      });
      storedObjectUploaded = true;
      await fs.rm(filePath, { force: true });

      const currentProfile = await prisma.profile.findUnique({
        where: { userId: auth.id },
        select: {
          avatarStoredFileName: true,
          avatarAssetPublicId: true,
          profileVisibility: true,
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
            mediaType: "avatar",
            visibility: currentProfile.profileVisibility === "public" ? "public" : "private",
            permissionsJson: JSON.stringify({
              allowedViewerIds: [],
              allowedCompanyIds: [],
            }),
            storageKey: storedFileName,
            mimeType: extension === "png" ? "image/png" : "image/jpeg",
          },
        });
        assetPublicId = asset.publicId;
      } catch (error) {
        if (!isMissingTableError(error, "PrivateMediaAsset")) {
          throw error;
        }
      }

      nextAssetPublicId = assetPublicId;

      await prisma.profile.update({
        where: { userId: auth.id },
        data: {
          avatar: null,
          avatarStoredFileName: storedFileName,
          avatarAssetPublicId: assetPublicId,
        },
      });

      const previousStoredFileName = currentProfile.avatarStoredFileName ?? "";
      const previousAssetPublicId = currentProfile.avatarAssetPublicId ?? "";
      if (
        previousStoredFileName &&
        previousStoredFileName !== storedFileName &&
        !previousAssetPublicId &&
        isOwnedStoredFile(previousStoredFileName, auth.id, "avatar")
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
        avatarUrl: buildAvatarFileHref(assetPublicId),
        mimeType: extension === "png" ? "image/png" : "image/jpeg",
        message: "Foto actualizada correctamente",
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
          { ok: false, message: "La imagen no es válida o no se pudo procesar" },
          { status: 400 },
        );
      }

      return jsonWithSecurity(
        { ok: false, message: "No se pudo actualizar la foto" },
        { status: 500 },
      );
    }
  } catch {
    return jsonWithSecurity(
      { ok: false, message: "No se pudo actualizar la foto" },
      { status: 500 },
    );
  }
}
