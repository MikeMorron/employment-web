import { prisma } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/app-state";
import {
  findLegacyPrivateMediaAssetByPublicId,
  isMissingTableError,
} from "@/lib/server/media-compat";
import { canViewerAccessPrivateMediaAsset } from "@/lib/server/private-media-assets";
import { verifyPrivateMediaToken } from "@/lib/server/private-media";
import { getStoredObject, headStoredObject } from "@/lib/server/object-storage";
import { enforceRateLimit, textWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

function getContentType(storageKey: string, mimeType: string | null | undefined) {
  if (mimeType?.trim()) {
    return mimeType;
  }

  return storageKey.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
}

async function getAsset(publicId: string) {
  try {
    return await prisma.privateMediaAsset.findUnique({
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
    if (isMissingTableError(error, "PrivateMediaAsset")) {
      return findLegacyPrivateMediaAssetByPublicId(prisma, { publicId, mediaType: "avatar" });
    }

    throw error;
  }
}

async function authorize(request: Request, publicId: string) {
  const asset = await getAsset(publicId);
  if (!asset || asset.mediaType !== "avatar") {
    return { response: textWithSecurity("Archivo no encontrado", { status: 404 }) };
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!verifyPrivateMediaToken(token, { publicId, mediaType: "avatar" })) {
    return { response: textWithSecurity("No autorizado", { status: 403 }) };
  }

  const viewer = await getSessionUser(request);
  const canAccess = await canViewerAccessPrivateMediaAsset(prisma, viewer, asset);
  if (!canAccess) {
    return { response: textWithSecurity("No autorizado", { status: 403 }) };
  }

  return { asset };
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ publicId: string }> },
) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "avatar-secure-head",
    maxRequests: 80,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const { publicId } = await context.params;
  const result = await authorize(request, publicId);
  if ("response" in result) {
    return result.response;
  }

  const head = await headStoredObject(result.asset.storageKey);
  if (!head) {
    return textWithSecurity(null, { status: 404 });
  }

  return textWithSecurity(null, { status: 200 });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ publicId: string }> },
) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "avatar-secure-read",
    maxRequests: 80,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const { publicId } = await context.params;
  const result = await authorize(request, publicId);
  if ("response" in result) {
    return result.response;
  }

  const storedObject = await getStoredObject({
    storageKey: result.asset.storageKey,
    contentType: getContentType(result.asset.storageKey, result.asset.mimeType),
  });
  if (!storedObject) {
    return textWithSecurity("Archivo no encontrado", { status: 404 });
  }

  return textWithSecurity(storedObject.body, {
    status: 200,
    headers: {
      "Content-Type": storedObject.contentType,
      "Cache-Control": "private, max-age=1800, must-revalidate",
    },
  });
}
