import { rowToUser } from "@/lib/server/app-state";
import { ensureCertificationAssetsForProfile } from "@/lib/server/certification-assets";
import { prisma } from "@/lib/server/db";
import {
  decodeCandidateProfileIdStrict,
  decodeCompanyCandidateIdStrict,
} from "@/lib/server/opaque-refs";
import { ensurePrivateMediaAssetsForProfile } from "@/lib/server/private-media-assets";
import { enforceRateLimit, isSafeRouteParam, jsonWithSecurity } from "@/lib/server/security";
import { sanitizeCandidatePublicProfile } from "@/lib/server/candidate/user-client";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "public-profile",
    maxRequests: 60,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const { id } = await context.params;
  if (!isSafeRouteParam(id, 240)) {
    return jsonWithSecurity({ ok: false, message: "Perfil inválido" }, { status: 400 });
  }

  const resolvedId = decodeCompanyCandidateIdStrict(id) ?? decodeCandidateProfileIdStrict(id);
  if (!resolvedId) {
    return jsonWithSecurity({ ok: false, message: "Perfil inválido" }, { status: 400 });
  }

  const profileRow = await prisma.user.findUnique({
    where: { id: resolvedId },
    include: { profile: true },
  });

  if (!profileRow?.profile) {
    return jsonWithSecurity({ ok: false, message: "Perfil no encontrado" }, { status: 404 });
  }

  if (profileRow.role === "candidate") {
    const nextCertificationProfile = await ensureCertificationAssetsForProfile(prisma, {
      ownerUserId: profileRow.id,
      profileVisibility: profileRow.profile.profileVisibility,
      certificationProfileJson: profileRow.profile.certificationProfileJson,
    });
    profileRow.profile.certificationProfileJson = JSON.stringify(nextCertificationProfile);
  }

  const nextPrivateMedia = await ensurePrivateMediaAssetsForProfile(prisma, {
    ownerUserId: profileRow.id,
    profileVisibility: profileRow.profile.profileVisibility,
    avatarStoredFileName: profileRow.profile.avatarStoredFileName,
    avatarAssetPublicId: profileRow.profile.avatarAssetPublicId,
    cvStoredFileName: profileRow.profile.cvStoredFileName,
    cvAssetPublicId: profileRow.profile.cvAssetPublicId,
  });
  profileRow.profile.avatarAssetPublicId = nextPrivateMedia.avatarAssetPublicId ?? null;
  profileRow.profile.cvAssetPublicId = nextPrivateMedia.cvAssetPublicId ?? null;

  const profile = rowToUser(profileRow, profileRow.profile);

  if (profile.role !== "candidate") {
    return jsonWithSecurity({ ok: false, message: "Perfil no encontrado" }, { status: 404 });
  }

  if (profile.profileVisibility !== "public") {
    return jsonWithSecurity({ ok: false, message: "Perfil no disponible" }, { status: 404 });
  }

  return jsonWithSecurity({
    ok: true,
    user: sanitizeCandidatePublicProfile(profile),
    isOwner: false,
  });
}
