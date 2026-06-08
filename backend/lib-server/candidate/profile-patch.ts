import type {
  CandidateCertificationProfile,
  CandidateEducationProfile,
  CandidateLocationProfile,
  CandidateProfessionalProfile,
  CandidateProfileQualitySignals,
  CandidateProfile,
  CandidateWorkPreferences,
  LanguageLevelSystem,
} from "@/types/profile";
import { calculateExperienceDurationMonths } from "@/lib/profile-form";
import {
  sanitizeBoolean,
  sanitizeCandidateStructuredSkills,
  sanitizeDateString,
  sanitizeExperienceSkillsUsed,
  sanitizeHttpUrl,
  sanitizeOptionalInteger,
  sanitizeOptionalString,
  sanitizeOptionalSummaryText,
  sanitizePersonNameField,
  sanitizeString,
  sanitizeStringArray,
} from "@/lib/server/profile-patch-shared";
import {
  candidateProfilePatchToProfileUpdateInput as candidateProfilePatchToProfileUpdateInputImpl,
} from "@/lib/server/profile-patch-update-inputs";

export function sanitizeCandidateEducationProfile(value: unknown): CandidateProfile["educationProfile"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { records: [] };
  }

  const input = value as Partial<CandidateEducationProfile>;
  const records = Array.isArray(input.records)
    ? input.records
        .filter((item) => Boolean(item) && typeof item === "object")
        .map((item) => {
          const degreeTitle = sanitizeString(item.degreeTitle, 120);
          if (!degreeTitle) {
            return null;
          }

          return {
            educationType:
              item.educationType === "primaria" ||
              item.educationType === "secundaria_bachillerato" ||
              item.educationType === "tecnico_tecnologo" ||
              item.educationType === "universidad_pregrado" ||
              item.educationType === "especializacion" ||
              item.educationType === "maestria" ||
              item.educationType === "doctorado" ||
              item.educationType === "bootcamp" ||
              item.educationType === "curso_certificacion" ||
              item.educationType === "autodidacta"
                ? item.educationType
                : undefined,
            degreeTitle,
            degreeField: sanitizeOptionalString(item.degreeField, 120),
            focusAreas: sanitizeStringArray(item.focusAreas, 8, 100),
            institutionName: sanitizeOptionalString(item.institutionName, 160),
            startDate: sanitizeDateString(item.startDate),
            endDate: sanitizeDateString(item.endDate),
            city: sanitizeOptionalString(item.city, 80),
            region: sanitizeOptionalString(item.region, 80),
            isCompleted: sanitizeBoolean(item.isCompleted),
            isRelevant: sanitizeBoolean(item.isRelevant),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .slice(0, 12)
    : [];

  return {
    highestEducationLevel: sanitizeOptionalString(input.highestEducationLevel, 80),
    records,
  };
}

export function sanitizeCandidateProfessionalProfile(value: unknown): CandidateProfile["professionalProfile"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      secondarySpecializations: [],
      targetRoleFamilies: [],
      preferredRoleTitles: [],
      industryExperienceTags: [],
      productStageExperience: [],
      companyTypeExperience: [],
      tools: [],
      topSkills: [],
      methodologies: [],
      platformExperience: [],
      preferredCompanyStages: [],
      preferredCompanyTypes: [],
      preferredIndustries: [],
      preferredProductTypes: [],
    };
  }

  const input = value as Partial<CandidateProfessionalProfile>;

  return {
    socialLinks: input.socialLinks
      ? {
          x: sanitizeHttpUrl(input.socialLinks.x),
          facebook: sanitizeHttpUrl(input.socialLinks.facebook),
          instagram: sanitizeHttpUrl(input.socialLinks.instagram),
          telegram: sanitizeHttpUrl(input.socialLinks.telegram),
          linkedin: sanitizeHttpUrl(input.socialLinks.linkedin),
          github: sanitizeHttpUrl(input.socialLinks.github),
        }
      : undefined,
    currentJobTitle: sanitizeOptionalString(input.currentJobTitle, 120),
    canonicalRole: sanitizeOptionalString(input.canonicalRole, 80),
    roleFamily: sanitizeOptionalString(input.roleFamily, 80),
    seniorityLevel:
      input.seniorityLevel === "intern" ||
      input.seniorityLevel === "junior" ||
      input.seniorityLevel === "mid" ||
      input.seniorityLevel === "senior" ||
      input.seniorityLevel === "lead" ||
      input.seniorityLevel === "principal"
        ? input.seniorityLevel
        : undefined,
    yearsExperienceTotal: sanitizeOptionalInteger(input.yearsExperienceTotal, 80),
    yearsExperienceRelevant: sanitizeOptionalInteger(input.yearsExperienceRelevant, 80),
    headline: sanitizeOptionalString(input.headline, 140),
    professionalSummary: sanitizeOptionalSummaryText(input.professionalSummary, 150),
    openToWork: sanitizeBoolean(input.openToWork),
    availabilityStatus:
      input.availabilityStatus === "available_now" ||
      input.availabilityStatus === "open_30_days" ||
      input.availabilityStatus === "open_60_days" ||
      input.availabilityStatus === "interviewing" ||
      input.availabilityStatus === "not_available"
        ? input.availabilityStatus
        : undefined,
    primarySpecialization: sanitizeOptionalString(input.primarySpecialization, 80),
    secondarySpecializations: sanitizeStringArray(input.secondarySpecializations, 8, 80),
    targetRoleFamilies: sanitizeStringArray(input.targetRoleFamilies, 8, 80),
    preferredRoleTitles: sanitizeStringArray(input.preferredRoleTitles, 8, 100),
    industryExperienceTags: sanitizeStringArray(input.industryExperienceTags, 8, 80),
    productStageExperience: sanitizeStringArray(input.productStageExperience, 8, 80),
    companyTypeExperience: sanitizeStringArray(input.companyTypeExperience, 8, 80),
    tools: sanitizeStringArray(input.tools, 12, 80),
    topSkills: sanitizeStringArray(input.topSkills, 8, 80),
    methodologies: sanitizeStringArray(input.methodologies, 12, 80),
    platformExperience: sanitizeStringArray(input.platformExperience, 12, 80),
    preferredCompanyStages: sanitizeStringArray(input.preferredCompanyStages, 8, 80),
    preferredCompanyTypes: sanitizeStringArray(input.preferredCompanyTypes, 8, 80),
    preferredTeamSize: sanitizeOptionalString(input.preferredTeamSize, 80),
    preferredIndustries: sanitizeStringArray(input.preferredIndustries, 8, 80),
    preferredProductTypes: sanitizeStringArray(input.preferredProductTypes, 8, 80),
    hasExperienceWithDiscovery: sanitizeBoolean(input.hasExperienceWithDiscovery),
    hasExperienceWithExperimentation: sanitizeBoolean(input.hasExperienceWithExperimentation),
    hasExperienceWithDesignSystems: sanitizeBoolean(input.hasExperienceWithDesignSystems),
    hasExperienceWithUserResearch: sanitizeBoolean(input.hasExperienceWithUserResearch),
    hasExperienceWithPrototyping: sanitizeBoolean(input.hasExperienceWithPrototyping),
    hasExperienceWithGrowth: sanitizeBoolean(input.hasExperienceWithGrowth),
    hasExperienceWithMarketplaces: sanitizeBoolean(input.hasExperienceWithMarketplaces),
    hasExperienceWithSaas: sanitizeBoolean(input.hasExperienceWithSaas),
    hasExperienceWithB2b: sanitizeBoolean(input.hasExperienceWithB2b),
    hasExperienceWithMobileProducts: sanitizeBoolean(input.hasExperienceWithMobileProducts),
    hasExperienceWithCrossFunctionalTeams: sanitizeBoolean(input.hasExperienceWithCrossFunctionalTeams),
    hasPeopleManagementExperience: sanitizeBoolean(input.hasPeopleManagementExperience),
  };
}

export function sanitizeCandidateCertificationProfile(value: unknown): CandidateProfile["certificationProfile"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { records: [] };
  }

  const input = value as Partial<CandidateCertificationProfile>;
  const records = Array.isArray(input.records)
    ? input.records
        .filter((item) => Boolean(item) && typeof item === "object")
        .map((item) => {
          const certificationName = sanitizeString(item.certificationName, 120);
          if (!certificationName) {
            return null;
          }

          return {
            certificationName,
            canonicalCertification: sanitizeOptionalString(item.canonicalCertification, 100),
            certificationCategory: sanitizeOptionalString(item.certificationCategory, 80),
            issuer: sanitizeOptionalString(item.issuer, 120),
            startedAt: sanitizeDateString(item.startedAt),
            completedAt: sanitizeDateString(item.completedAt),
            proofImageName: sanitizeOptionalString(item.proofImageName, 160),
            proofImageAssetId: sanitizeOptionalString(item.proofImageAssetId, 80),
            proofImageAssetPublicId: sanitizeOptionalString(item.proofImageAssetPublicId, 80),
            proofImageUrl: sanitizeHttpUrl(item.proofImageUrl),
            proofImageThumbnailUrl: sanitizeHttpUrl(item.proofImageThumbnailUrl),
            proofImageStoredFileName: sanitizeOptionalString(item.proofImageStoredFileName, 220),
            proofImageThumbnailStoredFileName: sanitizeOptionalString(item.proofImageThumbnailStoredFileName, 220),
            proofVideoName: sanitizeOptionalString(item.proofVideoName, 160),
            proofVideoAssetId: sanitizeOptionalString(item.proofVideoAssetId, 80),
            proofVideoAssetPublicId: sanitizeOptionalString(item.proofVideoAssetPublicId, 80),
            proofVideoUrl: sanitizeHttpUrl(item.proofVideoUrl),
            proofVideoStoredFileName: sanitizeOptionalString(item.proofVideoStoredFileName, 220),
            issuedAt: sanitizeDateString(item.issuedAt),
            expiresAt: sanitizeDateString(item.expiresAt),
            isActive: sanitizeBoolean(item.isActive),
            isRelevant: sanitizeBoolean(item.isRelevant),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .slice(0, 20)
    : [];

  return { records };
}

export function sanitizeCandidateWorkPreferences(value: unknown): CandidateProfile["workPreferences"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      preferredWorkModes: [],
      preferredLocations: [],
      preferredEmploymentTypes: [],
    };
  }

  const input = value as Partial<CandidateWorkPreferences>;

  return {
    expectedSalaryMin: sanitizeOptionalInteger(input.expectedSalaryMin, 1_000_000_000),
    expectedSalaryMax: sanitizeOptionalInteger(input.expectedSalaryMax, 1_000_000_000),
    salaryCurrency: sanitizeOptionalString(input.salaryCurrency, 16),
    salaryPeriod:
      input.salaryPeriod === "hourly" ||
      input.salaryPeriod === "monthly" ||
      input.salaryPeriod === "yearly"
        ? input.salaryPeriod
        : undefined,
    preferredWorkModes: sanitizeStringArray(input.preferredWorkModes, 4, 40),
    remotePreference:
      input.remotePreference === "required" ||
      input.remotePreference === "preferred" ||
      input.remotePreference === "open" ||
      input.remotePreference === "not_interested"
        ? input.remotePreference
        : undefined,
    preferredLocations: sanitizeStringArray(input.preferredLocations, 8, 100),
    willingToRelocate: sanitizeBoolean(input.willingToRelocate),
    preferredEmploymentTypes: sanitizeStringArray(input.preferredEmploymentTypes, 6, 60),
    noticePeriodDays: sanitizeOptionalInteger(input.noticePeriodDays, 365),
    availabilityDate: sanitizeDateString(input.availabilityDate),
  };
}

export function sanitizeCandidateLocationProfile(value: unknown): CandidateProfile["locationProfile"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const input = value as Partial<CandidateLocationProfile>;

  return {
    country: sanitizeOptionalString(input.country, 80),
    city: sanitizeOptionalString(input.city, 80),
    region: sanitizeOptionalString(input.region, 80),
    timezone: sanitizeOptionalString(input.timezone, 60),
    hasVehicle: sanitizeBoolean(input.hasVehicle),
    mobilityType: sanitizeOptionalString(input.mobilityType, 80),
    canTravel: sanitizeBoolean(input.canTravel),
    travelAvailability: sanitizeOptionalString(input.travelAvailability, 80),
    canWorkOnsite: sanitizeBoolean(input.canWorkOnsite),
  };
}

export function sanitizeCandidateProfileQuality(value: unknown): CandidateProfile["profileQuality"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const input = value as Partial<CandidateProfileQualitySignals>;

  return {
    profileCompletenessScore: sanitizeOptionalInteger(input.profileCompletenessScore, 100),
    experienceClarityScore: sanitizeOptionalInteger(input.experienceClarityScore, 100),
    skillsClarityScore: sanitizeOptionalInteger(input.skillsClarityScore, 100),
    salaryClarityScore: sanitizeOptionalInteger(input.salaryClarityScore, 100),
    educationClarityScore: sanitizeOptionalInteger(input.educationClarityScore, 100),
    certificationsClarityScore: sanitizeOptionalInteger(input.certificationsClarityScore, 100),
    locationClarityScore: sanitizeOptionalInteger(input.locationClarityScore, 100),
    dataConfidenceScore: sanitizeOptionalInteger(input.dataConfidenceScore, 100),
    lastProfileUpdateAt: sanitizeDateString(input.lastProfileUpdateAt),
  };
}

function sanitizeCandidateExperience(value: unknown): CandidateProfile["experiencia"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      rol: sanitizeString(item.rol, 120),
      empresa: sanitizeString(item.empresa, 160),
      empresaNit: sanitizeOptionalString(item.empresaNit, 32),
      tiempo: sanitizeString(item.tiempo, 80),
      fechaInicio: sanitizeOptionalString(item.fechaInicio, 20),
      fechaFin: sanitizeOptionalString(item.fechaFin, 20),
      actualidad: typeof item.actualidad === "boolean" ? item.actualidad : undefined,
      durationMonths:
        calculateExperienceDurationMonths(
          sanitizeOptionalString(item.fechaInicio, 20),
          sanitizeOptionalString(item.fechaFin, 20),
          typeof item.actualidad === "boolean" ? item.actualidad : undefined,
        ) ?? sanitizeOptionalInteger(item.durationMonths, 960),
      opinion: sanitizeOptionalString(item.opinion, 400),
      description: sanitizeOptionalString(item.description, 600),
      canonicalRole: sanitizeOptionalString(item.canonicalRole, 80),
      roleFamily: sanitizeOptionalString(item.roleFamily, 80),
      companyIndustry: sanitizeOptionalString(item.companyIndustry, 80),
      employmentType: sanitizeOptionalString(item.employmentType, 60),
      location: sanitizeOptionalString(item.location, 120),
      workMode: sanitizeOptionalString(item.workMode, 60),
      achievements: sanitizeOptionalString(item.achievements, 400),
      skillsUsed: sanitizeExperienceSkillsUsed(item.skillsUsed, 12, 140, 500),
      domainTags: sanitizeStringArray(item.domainTags, 8, 80),
      functionalTags: sanitizeStringArray(item.functionalTags, 8, 80),
      teamScope: sanitizeOptionalString(item.teamScope, 80),
      peopleLedCount: sanitizeOptionalInteger(item.peopleLedCount, 500),
      productsWorkedOn: sanitizeStringArray(item.productsWorkedOn, 8, 100),
    }))
    .filter((item) => item.rol && item.empresa && item.tiempo)
    .slice(0, 12);
}

function sanitizeCandidateLanguages(value: unknown): CandidateProfile["idiomas"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const name = sanitizeString(item.name, 80);
      const level = sanitizeString(item.level, 24);
      const levelSystem = item.levelSystem;

      if (
        !name ||
        !level ||
        (levelSystem !== "CEFR" &&
          levelSystem !== "JLPT" &&
          levelSystem !== "HSK" &&
          levelSystem !== "TOPIK")
      ) {
        return null;
      }

      return {
        name,
        level,
        levelSystem: levelSystem as LanguageLevelSystem,
        languageCode: sanitizeOptionalString(item.languageCode, 16),
        isNative: sanitizeBoolean(item.isNative),
        certified: sanitizeBoolean(item.certified),
        certificateFileName: sanitizeOptionalString(item.certificateFileName, 160),
        certificateStoredFileName: sanitizeOptionalString(item.certificateStoredFileName, 220),
        certificateThumbnailStoredFileName: sanitizeOptionalString(item.certificateThumbnailStoredFileName, 220),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 10);
}

export function sanitizeCandidateProfilePatch(input: Partial<CandidateProfile>) {
  const next: Partial<CandidateProfile> = {};

  if ("nombre" in input) next.nombre = sanitizePersonNameField(input.nombre, 25);
  if ("rol" in input) next.rol = sanitizePersonNameField(input.rol, 25);
  if ("ubicacion" in input) next.ubicacion = sanitizeOptionalString(input.ubicacion, 120);
  if ("modalidadTrabajo" in input) next.modalidadTrabajo = sanitizeOptionalString(input.modalidadTrabajo, 80);
  if ("expectativaSalarial" in input) next.expectativaSalarial = sanitizeOptionalString(input.expectativaSalarial, 64);
  if ("expectativaSalarialMin" in input) next.expectativaSalarialMin = sanitizeOptionalString(input.expectativaSalarialMin, 64);
  if ("expectativaSalarialMax" in input) next.expectativaSalarialMax = sanitizeOptionalString(input.expectativaSalarialMax, 64);
  if ("jornada" in input) next.jornada = sanitizeOptionalString(input.jornada, 80);
  if ("resumenPerfil" in input) next.resumenPerfil = sanitizeOptionalSummaryText(input.resumenPerfil, 150);
  if ("categoriasEnfoque" in input) next.categoriasEnfoque = sanitizeStringArray(input.categoriasEnfoque, 6, 60);
  if ("telefono" in input) next.telefono = sanitizeOptionalString(input.telefono, 40);
  if ("website" in input) next.website = sanitizeHttpUrl(input.website);
  if ("bio" in input) next.bio = sanitizeOptionalString(input.bio, 400);
  if ("idiomas" in input) next.idiomas = sanitizeCandidateLanguages(input.idiomas);
  if ("disponibilidadViaje" in input) next.disponibilidadViaje = sanitizeOptionalString(input.disponibilidadViaje, 80);
  if ("movilidad" in input) next.movilidad = sanitizeOptionalString(input.movilidad, 80);
  if ("skills" in input) next.skills = sanitizeStringArray(input.skills, 20, 60);
  if ("structuredSkills" in input) next.structuredSkills = sanitizeCandidateStructuredSkills(input.structuredSkills);
  if ("experiencia" in input) next.experiencia = sanitizeCandidateExperience(input.experiencia);
  if ("professionalProfile" in input) next.professionalProfile = sanitizeCandidateProfessionalProfile(input.professionalProfile);
  if ("educationProfile" in input) next.educationProfile = sanitizeCandidateEducationProfile(input.educationProfile);
  if ("certificationProfile" in input) next.certificationProfile = sanitizeCandidateCertificationProfile(input.certificationProfile);
  if ("workPreferences" in input) next.workPreferences = sanitizeCandidateWorkPreferences(input.workPreferences);
  if ("locationProfile" in input) next.locationProfile = sanitizeCandidateLocationProfile(input.locationProfile);
  if ("profileQuality" in input) next.profileQuality = sanitizeCandidateProfileQuality(input.profileQuality);
  if ("profileVisibility" in input) {
    next.profileVisibility =
      input.profileVisibility === "private" ||
      input.profileVisibility === "recruiters_only" ||
      input.profileVisibility === "public"
        ? input.profileVisibility
        : "public";
  }

  return next;
}

export {
  candidateProfilePatchToProfileUpdateInputImpl as candidateProfilePatchToProfileUpdateInput,
  sanitizeCandidateStructuredSkills,
};
