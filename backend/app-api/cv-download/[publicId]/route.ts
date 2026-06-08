import { prisma } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/app-state";
import { sanitizeDownloadName } from "@/lib/server/file-security";
import {
  findLegacyPrivateMediaAssetByPublicId,
  isMissingTableError,
} from "@/lib/server/media-compat";
import { getStoredObject, headStoredObject } from "@/lib/server/object-storage";
import { canViewerAccessPrivateMediaAsset } from "@/lib/server/private-media-assets";
import { verifyPrivateMediaToken } from "@/lib/server/private-media";
import { enforceRateLimit, textWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

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
                cv: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    if (isMissingTableError(error, "PrivateMediaAsset")) {
      return findLegacyPrivateMediaAssetByPublicId(prisma, { publicId, mediaType: "cv" });
    }

    throw error;
  }
}

async function authorize(request: Request, publicId: string) {
  const asset = await getAsset(publicId);
  if (!asset || asset.mediaType !== "cv") {
    return { response: textWithSecurity("Archivo no encontrado", { status: 404 }) };
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!verifyPrivateMediaToken(token, { publicId, mediaType: "cv" })) {
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
    scope: "cv-secure-head",
    maxRequests: 60,
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
    scope: "cv-secure-read",
    maxRequests: 40,
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

  const downloadName = sanitizeDownloadName(
    ("cvName" in result.asset ? result.asset.cvName : result.asset.owner?.profile?.cv) ??
      "CV_TalentSyncro.pdf",
    "CV_TalentSyncro.pdf",
  );

  const storedObject = await getStoredObject({
    storageKey: result.asset.storageKey,
    contentType: "application/pdf",
  });
  if (!storedObject) {
    return textWithSecurity("Archivo no encontrado", { status: 404 });
  }

  return textWithSecurity(storedObject.body, {
    status: 200,
    headers: {
      "Content-Type": storedObject.contentType,
      "Content-Disposition": `attachment; filename="${downloadName}"`,
      "Cache-Control": "private, max-age=1800, must-revalidate",
    },
  });
}
