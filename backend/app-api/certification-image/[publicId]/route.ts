import { prisma } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/app-state";
import { canViewerAccessCertificationAsset } from "@/lib/server/certification-assets";
import { verifyCertificationMediaToken } from "@/lib/server/certification-media";
import { getStoredObject } from "@/lib/server/object-storage";
import {
  findLegacyCertificationAssetByPublicId,
  isMissingTableError,
} from "@/lib/server/media-compat";
import { enforceRateLimit, textWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ publicId: string }> },
) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "certification-image-secure-read",
    maxRequests: 120,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const { publicId } = await context.params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const variant = searchParams.get("variant") === "thumb" ? "thumb" : "full";

  if (!verifyCertificationMediaToken(token, { publicId, mediaKind: "image" })) {
    return textWithSecurity("No autorizado", { status: 403 });
  }

  let asset;

  try {
    asset = await prisma.certificationAsset.findUnique({
      where: { publicId },
      include: {
        owner: {
          include: {
            profile: {
              select: {
                profileVisibility: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    if (isMissingTableError(error, "CertificationAsset")) {
      asset = await findLegacyCertificationAssetByPublicId(prisma, {
        publicId,
        mediaKind: "image",
      });
    } else {
      throw error;
    }
  }

  if (!asset || asset.mediaKind !== "image") {
    return textWithSecurity("Archivo no encontrado", { status: 404 });
  }

  const authUser = await getSessionUser(request);
  if (asset.visibility !== "public") {
    const access = await canViewerAccessCertificationAsset(prisma, authUser, asset);
    if (!access) {
      return textWithSecurity("No autorizado", { status: 403 });
    }
  }

  const storageKey =
    variant === "thumb" ? asset.thumbnailStorageKey ?? asset.storageKey : asset.storageKey;
  const storedObject = await getStoredObject({
    storageKey,
    contentType: asset.mimeType || "image/webp",
  });
  if (!storedObject) {
    return textWithSecurity("Archivo no encontrado", { status: 404 });
  }

  return textWithSecurity(storedObject.body, {
    status: 200,
    headers: {
      "Content-Type": storedObject.contentType,
      "Cache-Control": "private, max-age=300, must-revalidate",
    },
  });
}
