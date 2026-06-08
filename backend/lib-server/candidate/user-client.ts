import { buildAvatarFileHref, buildCvDownloadHref } from "@/lib/file-links";
import {
  buildCertificationImageAccessUrl,
  buildCertificationVideoAccessUrl,
} from "@/lib/server/certification-media";
import type {
  CandidateCertificationProfile,
  CandidateEducationProfile,
  CandidateLocationProfile,
  CandidateProfessionalProfile,
  CandidateProfile,
  CandidateProfileQualitySignals,
  CandidateStructuredSkill,
  CandidateWorkPreferences,
  ExperienceItem,
  LanguageProficiency,
} from "@/types/profile";

function copyLanguages(value: CandidateProfile["idiomas"]): LanguageProficiency[] {
  return Array.isArray(value) ? value.map((item) => ({ ...item })) : [];
}

function copyExperience(value: CandidateProfile["experiencia"]): ExperienceItem[] {
  return Array.isArray(value) ? value.map((item) => ({ ...item })) : [];
}

function copyStructuredSkills(value: CandidateProfile["structuredSkills"]): CandidateStructuredSkill[] {
  return Array.isArray(value) ? value.map((item) => ({ ...item })) : [];
}

function copyProfessionalProfile(
  value: CandidateProfile["professionalProfile"],
): CandidateProfessionalProfile | undefined {
  if (!value) {
    return undefined;
  }

  return {
    ...value,
    socialLinks: value.socialLinks ? { ...value.socialLinks } : undefined,
    secondarySpecializations: [...(value.secondarySpecializations ?? [])],
    targetRoleFamilies: [...(value.targetRoleFamilies ?? [])],
    preferredRoleTitles: [...(value.preferredRoleTitles ?? [])],
    industryExperienceTags: [...(value.industryExperienceTags ?? [])],
    productStageExperience: [...(value.productStageExperience ?? [])],
    companyTypeExperience: [...(value.companyTypeExperience ?? [])],
    tools: [...(value.tools ?? [])],
    topSkills: [...(value.topSkills ?? [])],
    methodologies: [...(value.methodologies ?? [])],
    platformExperience: [...(value.platformExperience ?? [])],
    preferredCompanyStages: [...(value.preferredCompanyStages ?? [])],
    preferredCompanyTypes: [...(value.preferredCompanyTypes ?? [])],
    preferredTeamSize: value.preferredTeamSize,
    preferredIndustries: [...(value.preferredIndustries ?? [])],
    preferredProductTypes: [...(value.preferredProductTypes ?? [])],
  };
}

function copyEducationProfile(
  value: CandidateProfile["educationProfile"],
): CandidateEducationProfile | undefined {
  if (!value) {
    return undefined;
  }

  return {
    highestEducationLevel: value.highestEducationLevel,
    records: Array.isArray(value.records) ? value.records.map((item) => ({ ...item })) : [],
  };
}

function copyCertificationProfile(
  value: CandidateProfile["certificationProfile"],
): CandidateCertificationProfile | undefined {
  if (!value) {
    return undefined;
  }

  return {
    records: Array.isArray(value.records) ? value.records.map((item) => ({ ...item })) : [],
  };
}

function attachCertificationAccessUrls(
  value: CandidateProfile["certificationProfile"],
): CandidateCertificationProfile | undefined {
  const copied = copyCertificationProfile(value);
  if (!copied) {
    return undefined;
  }

  return {
    records: copied.records.map((item) => ({
      ...item,
      proofImageUrl: item.proofImageAssetPublicId
        ? buildCertificationImageAccessUrl(item.proofImageAssetPublicId, "full")
        : undefined,
      proofImageThumbnailUrl: item.proofImageAssetPublicId
        ? buildCertificationImageAccessUrl(item.proofImageAssetPublicId, "thumb")
        : undefined,
      proofVideoUrl: item.proofVideoAssetPublicId
        ? buildCertificationVideoAccessUrl(item.proofVideoAssetPublicId)
        : undefined,
    })),
  };
}

function copyWorkPreferences(
  value: CandidateProfile["workPreferences"],
): CandidateWorkPreferences | undefined {
  if (!value) {
    return undefined;
  }

  return {
    ...value,
    preferredWorkModes: [...(value.preferredWorkModes ?? [])],
    preferredLocations: [...(value.preferredLocations ?? [])],
    preferredEmploymentTypes: [...(value.preferredEmploymentTypes ?? [])],
  };
}

function copyLocationProfile(
  value: CandidateProfile["locationProfile"],
): CandidateLocationProfile | undefined {
  return value ? { ...value } : undefined;
}

function copyProfileQuality(
  value: CandidateProfile["profileQuality"],
): CandidateProfileQualitySignals | undefined {
  return value ? { ...value } : undefined;
}

function normalizeCandidateVisibility(
  value: CandidateProfile["profileVisibility"],
): CandidateProfile["profileVisibility"] {
  return value === "private" || value === "recruiters_only" || value === "public"
    ? value
    : "public";
}

function buildCandidateBase(user: CandidateProfile) {
  return {
    id: user.id,
    email: "",
    role: "candidate" as const,
    plan: user.plan,
    displayName: user.displayName,
    nombre: user.nombre,
    rol: user.rol,
    ubicacion: user.ubicacion ?? undefined,
    tipoRegistro: "persona" as const,
    modalidadTrabajo: user.modalidadTrabajo ?? undefined,
    expectativaSalarial: user.expectativaSalarial ?? undefined,
    expectativaSalarialMin: user.expectativaSalarialMin ?? undefined,
    expectativaSalarialMax: user.expectativaSalarialMax ?? undefined,
    jornada: user.jornada ?? undefined,
    resumenPerfil: user.resumenPerfil ?? undefined,
    categoriasEnfoque: [...(user.categoriasEnfoque ?? [])],
    avatarAssetPublicId: user.avatarAssetPublicId ?? undefined,
    cvAssetPublicId: user.cvAssetPublicId ?? undefined,
    cvDownloadUrl: user.cvAssetPublicId ? buildCvDownloadHref(user.cvAssetPublicId) : undefined,
    bio: user.bio ?? undefined,
    idiomas: copyLanguages(user.idiomas),
    disponibilidadViaje: user.disponibilidadViaje ?? undefined,
    movilidad: user.movilidad ?? undefined,
    skills: [...user.skills],
    structuredSkills: copyStructuredSkills(user.structuredSkills),
    experiencia: copyExperience(user.experiencia),
    education: [...(user.education ?? [])],
    certifications: [...(user.certifications ?? [])],
    professionalProfile: copyProfessionalProfile(user.professionalProfile),
    educationProfile: copyEducationProfile(user.educationProfile),
    certificationProfile: attachCertificationAccessUrls(user.certificationProfile),
    workPreferences: copyWorkPreferences(user.workPreferences),
    locationProfile: copyLocationProfile(user.locationProfile),
    profileQuality: copyProfileQuality(user.profileQuality),
    profileVisibility: normalizeCandidateVisibility(user.profileVisibility),
    currentPlanId: user.currentPlanId ?? undefined,
    currentPlanWindowEndsAt: user.currentPlanWindowEndsAt ?? undefined,
    boostActiveUntil: user.boostActiveUntil ?? undefined,
    boostInventory: Array.isArray(user.boostInventory) ? user.boostInventory.map((item) => ({ ...item })) : [],
    applicationQuotaLimit: user.applicationQuotaLimit ?? undefined,
    applicationQuotaWindowStartedAt: user.applicationQuotaWindowStartedAt ?? undefined,
    applicationQuotaWindowEndsAt: user.applicationQuotaWindowEndsAt ?? undefined,
    applicationQuotaRemaining: user.applicationQuotaRemaining ?? undefined,
  };
}

export function sanitizeCandidateForClient(user: CandidateProfile): CandidateProfile {
  return {
    ...buildCandidateBase(user),
    avatar: user.avatarAssetPublicId ? buildAvatarFileHref(user.avatarAssetPublicId) : undefined,
    cv: user.cv?.trim() || undefined,
  };
}

export function sanitizeOwnCandidateForClient(user: CandidateProfile): CandidateProfile {
  return {
    ...buildCandidateBase(user),
    telefono: user.telefono ?? undefined,
    website: user.website ?? undefined,
    avatar: user.avatarAssetPublicId ? buildAvatarFileHref(user.avatarAssetPublicId) : undefined,
    cv: user.cv?.trim() || undefined,
  };
}

export function sanitizeCandidatePublicProfile(user: CandidateProfile): CandidateProfile {
  return {
    ...buildCandidateBase(user),
    certificationProfile: copyCertificationProfile(user.certificationProfile),
    avatar:
      normalizeCandidateVisibility(user.profileVisibility) === "public" && user.avatarAssetPublicId
        ? buildAvatarFileHref(user.avatarAssetPublicId)
        : undefined,
  };
}
