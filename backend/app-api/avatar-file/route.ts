import { getSessionUser, rowToUser } from "@/lib/server/app-state";
import { prisma } from "@/lib/server/db";
import { deletePrivateMediaAssetByPublicId } from "@/lib/server/private-media-assets";
import { canViewerAccessPrivateMediaAsset } from "@/lib/server/private-media-assets";
import { deleteStoredObject, getStoredObject, headStoredObject } from "@/lib/server/object-storage";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  jsonWithSecurity,
  textWithSecurity,
} from "@/lib/server/security";
import { requireAuthUser } from "@/lib/server/api-auth";

export const runtime = "nodejs";

async function resolveLegacyAvatarRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId")?.trim();
  if (!userId) {
    return null;
  }

  const userRow = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
    },
  });

  if (!userRow?.profile?.avatarStoredFileName?.trim()) {
    return { response: textWithSecurity("Archivo no encontrado", { status: 404 }) };
  }

  const viewer = await getSessionUser(request);
  const appUser = rowToUser(userRow, userRow.profile);

  if (appUser.role === "candidate") {
    const canAccess = await canViewerAccessPrivateMediaAsset(prisma, viewer, {
      ownerUserId: userRow.id,
      mediaType: "avatar",
      visibility: userRow.profile.profileVisibility === "public" ? "public" : "private",
      permissionsJson: null,
      owner: {
        id: userRow.id,
        role: userRow.role,
        profile: {
          profileVisibility: userRow.profile.profileVisibility,
        },
      },
    });

    if (!canAccess) {
      return { response: textWithSecurity("No autorizado", { status: 403 }) };
    }
  } else if (viewer?.id !== userRow.id) {
    return { response: textWithSecurity("No autorizado", { status: 403 }) };
  }

  if (!userRow.profile.avatarStoredFileName) {
    return { response: textWithSecurity("Archivo no encontrado", { status: 404 }) };
  }

  const contentType = userRow.profile.avatarStoredFileName.toLowerCase().endsWith(".png")
    ? "image/png"
    : "image/jpeg";

  return {
    storageKey: userRow.profile.avatarStoredFileName,
    contentType,
  };
}

export async function GET(request: Request) {
  const legacy = await resolveLegacyAvatarRequest(request);
  if (!legacy) {
    return jsonWithSecurity(
      { ok: false, message: "Usa la ruta segura con publicId y token" },
      { status: 410 },
    );
  }

  if ("response" in legacy) {
    return legacy.response;
  }

  try {
    const storedObject = await getStoredObject({
      storageKey: legacy.storageKey,
      contentType: legacy.contentType,
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
  } catch {
    return textWithSecurity("Archivo no encontrado", { status: 404 });
  }
}

export async function HEAD(request: Request) {
  const legacy = await resolveLegacyAvatarRequest(request);
  if (!legacy) {
    return new Response(null, { status: 410 });
  }

  if ("response" in legacy) {
    return legacy.response;
  }

  try {
    const head = await headStoredObject(legacy.storageKey);
    if (!head) {
      return textWithSecurity(null, { status: 404 });
    }
    return textWithSecurity(null, { status: 200 });
  } catch {
    return textWithSecurity(null, { status: 404 });
  }
}

export async function DELETE(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "avatar-delete",
    maxRequests: 10,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const currentProfile = await prisma.profile.findUnique({
    where: { userId: auth.id },
    select: {
      avatarStoredFileName: true,
      avatarAssetPublicId: true,
    },
  });

  await prisma.profile.update({
    where: { userId: auth.id },
    data: {
      avatar: null,
      avatarStoredFileName: null,
      avatarAssetPublicId: null,
    },
  });

  if (currentProfile?.avatarAssetPublicId) {
    await deletePrivateMediaAssetByPublicId(prisma, auth.id, currentProfile.avatarAssetPublicId);
  } else if (currentProfile?.avatarStoredFileName) {
    await deleteStoredObject(currentProfile.avatarStoredFileName);
  }

  return jsonWithSecurity({ ok: true });
}
