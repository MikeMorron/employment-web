import type { PrismaClient } from "@prisma/client";
import type {
  CandidateCertificationProfile,
  CandidateProfile,
} from "@/types/profile";

type MediaCompatStore = Pick<PrismaClient, "profile">;

export function isMissingTableError(
  error: unknown,
  modelName?: "PrivateMediaAsset" | "CertificationAsset",
) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    meta?: {
      modelName?: unknown;
    };
  };

  if (candidate.code !== "P2021") {
    return false;
  }

  if (!modelName) {
    return true;
  }

  return candidate.meta?.modelName === modelName;
}

function parseCertificationProfileJson(value: string | null | undefined) {
  if (!value) {
    return { records: [] } satisfies CandidateCertificationProfile;
  }

  try {
    const parsed = JSON.parse(value) as CandidateCertificationProfile;
    return {
      records: Array.isArray(parsed.records) ? parsed.records : [],
    } satisfies CandidateCertificationProfile;
  } catch {
    return { records: [] } satisfies CandidateCertificationProfile;
  }
}

function normalizeCandidateVisibility(
  value: string | null | undefined,
): CandidateProfile["profileVisibility"] {
  return value === "public" || value === "private" || value === "recruiters_only"
    ? value
    : "private";
}

export async function findLegacyPrivateMediaAssetByPublicId(
  prisma: MediaCompatStore,
  input: {
    publicId: string;
    mediaType: "avatar" | "cv";
  },
) {
  const selectKey =
    input.mediaType === "avatar"
      ? {
          avatarAssetPublicId: true,
          avatarStoredFileName: true,
        }
      : {
          cvAssetPublicId: true,
          cvStoredFileName: true,
          cv: true,
        };

  const profileRow = await prisma.profile.findFirst({
    where:
      input.mediaType === "avatar"
        ? { avatarAssetPublicId: input.publicId }
        : { cvAssetPublicId: input.publicId },
    select: {
      userId: true,
      profileVisibility: true,
      ...selectKey,
      user: {
        select: {
          id: true,
          role: true,
          profile: {
            select: {
              profileVisibility: true,
            },
          },
        },
      },
    },
  });

  if (!profileRow?.user) {
    return null;
  }

  const storageKey =
    input.mediaType === "avatar"
      ? profileRow.avatarStoredFileName
      : profileRow.cvStoredFileName;

  if (!storageKey?.trim()) {
    return null;
  }

  return {
    id: `legacy-${input.mediaType}-${profileRow.userId}`,
    publicId: input.publicId,
    ownerUserId: profileRow.userId,
    mediaType: input.mediaType,
    visibility:
      input.mediaType === "avatar" && profileRow.profileVisibility === "public"
        ? "public"
        : "private",
    permissionsJson: null,
    storageKey,
    mimeType:
      input.mediaType === "cv"
        ? "application/pdf"
        : storageKey.toLowerCase().endsWith(".png")
          ? "image/png"
          : "image/jpeg",
    owner: {
      id: profileRow.user.id,
      role: profileRow.user.role,
      profile: {
        profileVisibility: profileRow.user.profile?.profileVisibility ?? null,
      },
    },
    cvName: "cv" in profileRow ? profileRow.cv ?? null : null,
  };
}

export async function findLegacyCertificationAssetByPublicId(
  prisma: MediaCompatStore,
  input: {
    publicId: string;
    mediaKind: "image" | "video";
  },
) {
  const profiles = await prisma.profile.findMany({
    where: {
      certificationProfileJson: {
        not: null,
      },
    },
    select: {
      userId: true,
      profileVisibility: true,
      certificationProfileJson: true,
      user: {
        select: {
          id: true,
          role: true,
          profile: {
            select: {
              profileVisibility: true,
            },
          },
        },
      },
    },
  });

  for (const profileRow of profiles) {
    const certificationProfile = parseCertificationProfileJson(
      profileRow.certificationProfileJson,
    );

    for (const record of certificationProfile.records) {
      const matches =
        input.mediaKind === "image"
          ? record.proofImageAssetPublicId === input.publicId
          : record.proofVideoAssetPublicId === input.publicId;

      if (!matches) {
        continue;
      }

      const storageKey =
        input.mediaKind === "image"
          ? record.proofImageStoredFileName?.trim() || null
          : record.proofVideoStoredFileName?.trim() || null;

      if (!storageKey || !profileRow.user) {
        return null;
      }

      return {
        id: `legacy-${input.mediaKind}-${profileRow.userId}`,
        publicId: input.publicId,
        ownerUserId: profileRow.userId,
        mediaKind: input.mediaKind,
        visibility: normalizeCandidateVisibility(profileRow.profileVisibility),
        permissionsJson: null,
        storageKey,
        thumbnailStorageKey:
          input.mediaKind === "image"
            ? record.proofImageThumbnailStoredFileName?.trim() || null
            : null,
        mimeType: input.mediaKind === "video" ? "video/mp4" : "image/webp",
        owner: {
          id: profileRow.user.id,
          role: profileRow.user.role,
          profile: {
            profileVisibility: profileRow.user.profile?.profileVisibility ?? null,
          },
        },
      };
    }
  }

  return null;
}
