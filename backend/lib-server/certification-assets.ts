import type { PrismaClient } from "@prisma/client";
import type {
  CandidateCertificationProfile,
  CertificationProfile,
  CertificationAsset,
} from "@/types/profile";

type CertificationProfileLike =
  | CertificationProfile
  | CandidateCertificationProfile
  | undefined;

function getCertificationItems(profile: CertificationProfileLike) {
  if (!profile) {
    return [];
  }

  if ("items" in profile && Array.isArray(profile.items)) {
    return profile.items;
  }

  if ("records" in profile && Array.isArray(profile.records)) {
    return profile.records;
  }

  return [];
}

export function parseCertificationProfileJson(json: string | null | undefined): CertificationProfile {
  if (!json) return { items: [] };
  try {
    const parsed = JSON.parse(json) as CertificationProfile | CandidateCertificationProfile;
    return { items: getCertificationItems(parsed) };
  } catch {
    return { items: [] };
  }
}

export function listCertificationAssetPublicIds(profile: CertificationProfileLike): string[] {
  return getCertificationItems(profile)
    .flatMap((item) => {
      const entry = item as CertificationAsset & {
        mediaPublicId?: string;
        proofImageAssetPublicId?: string;
        proofVideoAssetPublicId?: string;
      };

      return [
        entry.mediaPublicId,
        entry.proofImageAssetPublicId,
        entry.proofVideoAssetPublicId,
      ];
    })
    .filter((id): id is string => Boolean(id));
}

export async function deleteCertificationAssetsByPublicIds(
  prismaClient: PrismaClient,
  ownerUserId: string,
  publicIds: string[],
): Promise<void> {
  if (publicIds.length === 0) return;
  await prismaClient.certificationAsset.deleteMany({
    where: { ownerUserId, publicId: { in: publicIds } },
  });
}

export async function ensureCertificationAssetsForProfile(
  prismaClient: PrismaClient,
  params: {
    ownerUserId: string;
    profileVisibility: string | null | undefined;
    certificationProfileJson: string | null | undefined;
  },
): Promise<CertificationProfile> {
  const existing = parseCertificationProfileJson(params.certificationProfileJson);
  void prismaClient;
  void params.ownerUserId;
  void params.profileVisibility;

  return { items: existing.items };
}

export async function canViewerAccessCertificationAsset(
  prismaClient: PrismaClient,
  paramsOrViewer:
    | {
        ownerUserId: string;
        viewerUserId?: string;
        certificationId: string;
      }
    | ({ id: string } | null),
  providedAsset?: {
    ownerUserId: string;
    visibility?: string;
    owner?: { profile?: { profileVisibility?: string | null } | null } | null;
    certificationId?: string;
    id?: string;
  },
): Promise<boolean> {
  if (providedAsset) {
    const viewer = paramsOrViewer as { id: string } | null;
    if (viewer?.id === providedAsset.ownerUserId) {
      return true;
    }

    const profileVisibility =
      providedAsset.owner?.profile?.profileVisibility ?? providedAsset.visibility ?? "private";
    return profileVisibility === "public";
  }

  const params = paramsOrViewer as {
    ownerUserId: string;
    viewerUserId?: string;
    certificationId: string;
  };
  const profile = await prismaClient.profile.findUnique({
    where: { userId: params.ownerUserId },
    select: { profileVisibility: true },
  });

  if (profile?.profileVisibility === "public") return true;
  if (params.viewerUserId === params.ownerUserId) return true;

  return false;
}
