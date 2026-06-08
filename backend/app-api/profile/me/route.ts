import type { AppUser, CandidateProfile, CompanyProfile } from "@/types/profile";
import { rowToUser } from "@/lib/server/app-state";
import { requireAuthUser } from "@/lib/server/api-auth";
import {
  deleteCertificationAssetsByPublicIds,
  listCertificationAssetPublicIds,
  parseCertificationProfileJson,
} from "@/lib/server/certification-assets";
import {
  replaceCandidateExperiences,
  replaceCandidateStructuredSkills,
} from "@/lib/server/candidate-profile-store";
import {
  ensurePrivateMediaAssetsForProfile,
  syncAvatarAssetVisibility,
} from "@/lib/server/private-media-assets";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";
import { sanitizeOwnUserForClient } from "@/lib/server/user-client";
import { prisma } from "@/lib/server/db";
import {
  candidateProfilePatchToProfileUpdateInput,
  companyProfilePatchToProfileUpdateInput,
} from "@/lib/server/profile-patch";
import { sanitizeCandidateProfilePatch } from "@/lib/server/candidate/profile-patch";
import { sanitizeCompanyProfilePatch } from "@/lib/server/company/profile-patch";
import { censorProfanityInPayload } from "@/lib/server/profanity-guard";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  return jsonWithSecurity({ ok: true, user: sanitizeOwnUserForClient(auth) });
}

export async function PATCH(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "profile-update",
    maxRequests: 20,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const body = (await request.json()) as Partial<AppUser>;
    const sanitizedPatch = auth.role === "candidate"
      ? sanitizeCandidateProfilePatch(body as Partial<CandidateProfile>)
      : sanitizeCompanyProfilePatch(body as Partial<CompanyProfile>);
    const patch = await censorProfanityInPayload(sanitizedPatch);

    const nextDisplayName =
      auth.role === "candidate"
        ? patch.nombre?.trim() || auth.displayName
        : (patch as Partial<CompanyProfile>).companyName?.trim() ||
          patch.nombre?.trim() ||
          auth.displayName;

    const currentProfile =
      auth.role === "candidate"
        ? await prisma.profile.findUnique({
            where: { userId: auth.id },
            select: { certificationProfileJson: true },
          })
        : null;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: auth.id },
        data: {
          displayName: nextDisplayName,
        },
      });

      await tx.profile.update({
        where: { userId: auth.id },
        data:
          auth.role === "candidate"
            ? candidateProfilePatchToProfileUpdateInput(patch as Partial<CandidateProfile>)
            : companyProfilePatchToProfileUpdateInput(patch as Partial<CompanyProfile>),
      });

      if (auth.role === "candidate" && "profileVisibility" in patch) {
        await syncAvatarAssetVisibility(tx, auth.id, (patch as Partial<CandidateProfile>).profileVisibility);
      }

      if (auth.role === "candidate") {
        if ("structuredSkills" in patch) {
          await replaceCandidateStructuredSkills(tx as typeof prisma, auth.id, (patch as Partial<CandidateProfile>).structuredSkills);
        }

        if ("experiencia" in patch) {
          await replaceCandidateExperiences(tx as typeof prisma, auth.id, (patch as Partial<CandidateProfile>).experiencia ?? []);
        }
      }

      return tx.user.findUnique({
        where: { id: auth.id },
        include: {
          profile: true,
        },
      });
    });

    if (!updated?.profile) {
      return jsonWithSecurity({ ok: false, message: "Perfil no disponible" }, { status: 404 });
    }

    if (auth.role === "candidate") {
      const nextPrivateMedia = await ensurePrivateMediaAssetsForProfile(prisma, {
        ownerUserId: auth.id,
        profileVisibility: updated.profile.profileVisibility,
        avatarStoredFileName: updated.profile.avatarStoredFileName,
        avatarAssetPublicId: updated.profile.avatarAssetPublicId,
        cvStoredFileName: updated.profile.cvStoredFileName,
        cvAssetPublicId: updated.profile.cvAssetPublicId,
      });
      updated.profile.avatarAssetPublicId = nextPrivateMedia.avatarAssetPublicId ?? null;
      updated.profile.cvAssetPublicId = nextPrivateMedia.cvAssetPublicId ?? null;
    }

    const updatedUser = rowToUser(updated, updated.profile);

    if (auth.role === "candidate" && "certificationProfile" in patch) {
      const updatedCandidate = updatedUser as CandidateProfile;
      const previousProfile = parseCertificationProfileJson(currentProfile?.certificationProfileJson ?? null);
      const previousAssetPublicIds = new Set(listCertificationAssetPublicIds(previousProfile));
      const nextAssetPublicIds = new Set(listCertificationAssetPublicIds(updatedCandidate.certificationProfile));
      const deletedAssetPublicIds = [...previousAssetPublicIds].filter((value) => !nextAssetPublicIds.has(value));

      await deleteCertificationAssetsByPublicIds(prisma, auth.id, deletedAssetPublicIds);
    }

    return jsonWithSecurity({
      ok: true,
      user: sanitizeOwnUserForClient(updatedUser),
    });
  } catch {
    return jsonWithSecurity({ ok: false, message: "No se pudo actualizar el perfil" }, { status: 500 });
  }
}
