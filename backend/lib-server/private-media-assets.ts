import type { PrismaClient } from "@prisma/client";
import { createPrivateMediaPublicId } from "./private-media";

type PrivateMediaAssetStore = Pick<PrismaClient, "privateMediaAsset">;

function inferAvatarMimeType(storedFileName: string) {
  return storedFileName.toLowerCase().endsWith(".png")
    ? "image/png"
    : "image/jpeg";
}

export async function ensurePrivateMediaAssetsForProfile(
  prismaClient: PrivateMediaAssetStore,
  params: {
    ownerUserId: string;
    profileVisibility: string | null | undefined;
    avatarStoredFileName: string | null | undefined;
    avatarAssetPublicId: string | null | undefined;
    cvStoredFileName: string | null | undefined;
    cvAssetPublicId: string | null | undefined;
  },
): Promise<{ avatarAssetPublicId: string | null; cvAssetPublicId: string | null }> {
  let avatarAssetPublicId = params.avatarAssetPublicId ?? null;
  let cvAssetPublicId = params.cvAssetPublicId ?? null;

  if (params.avatarStoredFileName && !avatarAssetPublicId) {
    avatarAssetPublicId = createPrivateMediaPublicId();
    await prismaClient.privateMediaAsset.upsert({
      where: { publicId: avatarAssetPublicId },
      create: {
        publicId: avatarAssetPublicId,
        ownerUserId: params.ownerUserId,
        mediaType: "avatar",
        visibility: params.profileVisibility === "public" ? "public" : "private",
        permissionsJson: JSON.stringify({
          allowedViewerIds: [],
          allowedCompanyIds: [],
        }),
        storageKey: params.avatarStoredFileName,
        mimeType: inferAvatarMimeType(params.avatarStoredFileName),
      },
      update: {
        visibility: params.profileVisibility === "public" ? "public" : "private",
        storageKey: params.avatarStoredFileName,
        mimeType: inferAvatarMimeType(params.avatarStoredFileName),
      },
    });
  }

  if (params.cvStoredFileName && !cvAssetPublicId) {
    cvAssetPublicId = createPrivateMediaPublicId();
    await prismaClient.privateMediaAsset.upsert({
      where: { publicId: cvAssetPublicId },
      create: {
        publicId: cvAssetPublicId,
        ownerUserId: params.ownerUserId,
        mediaType: "cv",
        visibility: "private",
        permissionsJson: JSON.stringify({
          allowedViewerIds: [],
          allowedCompanyIds: [],
        }),
        storageKey: params.cvStoredFileName,
        mimeType: "application/pdf",
      },
      update: {
        storageKey: params.cvStoredFileName,
        mimeType: "application/pdf",
      },
    });
  }

  return { avatarAssetPublicId, cvAssetPublicId };
}

export async function syncAvatarAssetVisibility(
  prismaClient: PrivateMediaAssetStore,
  ownerUserId: string,
  visibility: string | undefined,
): Promise<void> {
  if (!visibility) return;
  await prismaClient.privateMediaAsset.updateMany({
    where: { ownerUserId, mediaType: "avatar" },
    data: { visibility },
  });
}

export async function canViewerAccessPrivateMediaAsset(
  prismaClient: PrivateMediaAssetStore,
  viewerOrParams:
    | {
        publicId: string;
        viewerUserId?: string;
      }
    | ({ id: string } | null),
  providedAsset?: {
    ownerUserId: string;
    mediaType: string;
    visibility: string;
    permissionsJson?: string | null;
    owner?: {
      id?: string;
      role?: string;
      profile?: { profileVisibility?: string | null } | null;
    } | null;
  },
): Promise<boolean> {
  if (providedAsset) {
    const viewer = viewerOrParams as { id: string } | null;
    if (viewer?.id === providedAsset.ownerUserId) {
      return true;
    }

    const visibility = providedAsset.owner?.profile?.profileVisibility ?? providedAsset.visibility;
    return visibility === "public";
  }

  const params = viewerOrParams as {
    publicId: string;
    viewerUserId?: string;
  };
  const asset = await prismaClient.privateMediaAsset.findUnique({
    where: { publicId: params.publicId },
    include: { owner: { include: { profile: true } } },
  });
  if (!asset) return false;
  if (params.viewerUserId === asset.ownerUserId) return true;

  const visibility = asset.owner?.profile?.profileVisibility;
  return visibility === "public";
}

export async function deletePrivateMediaAssetByPublicId(
  prismaClient: PrivateMediaAssetStore,
  ownerUserIdOrPublicId: string,
  publicIdArg?: string,
): Promise<void> {
  const publicId = publicIdArg ?? ownerUserIdOrPublicId;
  const ownerUserId = publicIdArg ? ownerUserIdOrPublicId : undefined;

  await prismaClient.privateMediaAsset.deleteMany({
    where: {
      publicId,
      ...(ownerUserId ? { ownerUserId } : {}),
    },
  });
}
