import type { DbProfile, DbProfileCreateInput, DbUser, DbUserCreateInput } from "@/lib/server/db-types";
import { normalizeCandidatePlan } from "@/lib/candidate-plan";
import { parseCandidatePlanState } from "@/lib/server/candidate-plan-state";
import { parseCompanyPlanState } from "@/lib/server/company-plan-state";
import type { AdminProfile, AppUser, CandidateProfile, CompanyProfile } from "@/types/profile";

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function stringifyJson(value: unknown) {
  return JSON.stringify(value ?? null);
}

export function rowToUser(user: DbUser, profile: DbProfile | null | undefined): AppUser {
  if (!profile) {
    throw new Error(`Perfil faltante para usuario ${user.id}`);
  }

  const base = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    nombre: profile.nombre,
    rol: profile.rol,
    ubicacion: profile.ubicacion ?? undefined,
    telefono: profile.telefono ?? undefined,
    website: profile.website ?? undefined,
    avatar: profile.avatar ?? undefined,
    avatarStoredFileName: profile.avatarStoredFileName ?? undefined,
    avatarAssetPublicId: profile.avatarAssetPublicId ?? undefined,
  };

  if (user.role === "candidate") {
    const candidatePlanState = parseCandidatePlanState(profile.candidatePlanStateJson, new Date());

    return {
      ...base,
      role: "candidate",
      plan: normalizeCandidatePlan(user.plan as CandidateProfile["plan"] | "free" | "premium"),
      tipoRegistro: profile.tipoRegistro === "persona" ? "persona" : undefined,
      modalidadTrabajo: profile.modalidadTrabajo ?? undefined,
      expectativaSalarial: profile.expectativaSalarial ?? undefined,
      expectativaSalarialMin: profile.expectativaSalarialMin ?? undefined,
      expectativaSalarialMax: profile.expectativaSalarialMax ?? undefined,
      jornada: profile.jornada ?? undefined,
      resumenPerfil: profile.resumenPerfil ?? undefined,
      categoriasEnfoque: parseJson<string[]>(profile.categoriasEnfoqueJson, []),
      cv: profile.cv ?? undefined,
      cvStoredFileName: profile.cvStoredFileName ?? undefined,
      cvAssetPublicId: profile.cvAssetPublicId ?? undefined,
      bio: profile.bio ?? undefined,
      idiomas: parseJson<CandidateProfile["idiomas"]>(profile.idiomasJson, []),
      disponibilidadViaje: profile.disponibilidadViaje ?? undefined,
      movilidad: profile.movilidad ?? undefined,
      skills: parseJson<string[]>(profile.skillsJson, []),
      structuredSkills: parseJson<CandidateProfile["structuredSkills"]>(profile.candidateSkillsJson, []),
      experiencia: parseJson<CandidateProfile["experiencia"]>(profile.experienciaJson, []),
      professionalProfile: parseJson<CandidateProfile["professionalProfile"]>(profile.professionalProfileJson, {
        socialLinks: {},
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
        preferredTeamSize: undefined,
        preferredIndustries: [],
        preferredProductTypes: [],
      }),
      educationProfile: parseJson<CandidateProfile["educationProfile"]>(profile.educationProfileJson, {
        records: [],
      }),
      certificationProfile: parseJson<CandidateProfile["certificationProfile"]>(profile.certificationProfileJson, {
        records: [],
      }),
      workPreferences: parseJson<CandidateProfile["workPreferences"]>(profile.workPreferencesJson, {
        preferredWorkModes: [],
        preferredLocations: [],
        preferredEmploymentTypes: [],
      }),
      locationProfile: parseJson<CandidateProfile["locationProfile"]>(profile.locationProfileJson, {}),
      profileQuality: parseJson<CandidateProfile["profileQuality"]>(profile.profileQualityJson, {}),
      profileVisibility:
        profile.profileVisibility === "public" ||
        profile.profileVisibility === "private" ||
        profile.profileVisibility === "recruiters_only"
          ? profile.profileVisibility
          : undefined,
      currentPlanId: candidatePlanState.currentPlanId,
      currentPlanWindowEndsAt: candidatePlanState.currentPlanWindowEndsAt ?? undefined,
      boostActiveUntil: candidatePlanState.boostActiveUntil ?? undefined,
      boostInventory: candidatePlanState.boostInventory,
      applicationQuotaLimit: candidatePlanState.applicationQuotaLimit,
      applicationQuotaWindowStartedAt: candidatePlanState.applicationQuotaWindowStartedAt,
      applicationQuotaWindowEndsAt: candidatePlanState.applicationQuotaWindowEndsAt,
    };
  }

  if (user.role === "company") {
    const companyPlanState = parseCompanyPlanState(profile.companyPlanStateJson, new Date());

    return {
      ...base,
      role: "company",
      plan: user.plan as CompanyProfile["plan"],
      tipoRegistro: profile.tipoRegistro === "empresa" ? "empresa" : undefined,
      companyName: profile.companyName ?? user.displayName,
      industry: profile.industry ?? "",
      companySize: profile.companySize ?? "",
      companyDescription: profile.companyDescription ?? "",
      companyCulture: profile.companyCulture ?? undefined,
      companyMission: profile.companyMission ?? undefined,
      companyVision: profile.companyVision ?? undefined,
      companyContactEmail: profile.companyContactEmail ?? undefined,
      companyWebsite: profile.companyWebsite ?? undefined,
      companyLocation: profile.companyLocation ?? undefined,
      companyBenefits: parseJson<string[]>(profile.companyBenefitsJson, []),
      companySocialLinks: parseJson<string[]>(profile.companySocialLinksJson, []),
      companyBanner: profile.companyBanner ?? undefined,
      activeJobs: profile.activeJobs ?? 0,
      verificationStatus:
        profile.verificationStatus === "verified" ||
        profile.verificationStatus === "pending" ||
        profile.verificationStatus === "unverified"
          ? profile.verificationStatus
          : "pending",
      analyticsSummary: parseJson<CompanyProfile["analyticsSummary"]>(profile.analyticsSummaryJson, {
        profileViews: 0,
        applications: 0,
        conversionRate: 0,
      }),
      planStatus:
        profile.planStatus === "inactive" ||
        profile.planStatus === "pending" ||
        profile.planStatus === "active" ||
        profile.planStatus === "past_due" ||
        profile.planStatus === "cancelled"
          ? profile.planStatus
          : undefined,
      currentPeriodEnd: profile.currentPeriodEnd?.toISOString() ?? undefined,
      hiringFocus: parseJson<string[]>(profile.hiringFocusJson, []),
      billingHistory: [],
      currentPlanId: companyPlanState.currentPlanId,
      collaboratorLimit: companyPlanState.collaboratorLimit,
    };
  }

  return {
    ...base,
    role: "admin",
    plan: user.plan as AdminProfile["plan"],
    tipoRegistro: "admin",
    permissions: ["users:manage", "jobs:manage", "roles:manage", "overview:read"],
  };
}

export function userToUserCreateInput(user: AppUser): DbUserCreateInput {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    plan: user.plan,
  };
}

export function userToProfileCreateInput(user: AppUser): DbProfileCreateInput {
  if (user.role === "candidate") {
    return {
      userId: user.id,
      nombre: user.nombre,
      rol: user.rol,
      tipoRegistro: user.tipoRegistro ?? "persona",
      ubicacion: user.ubicacion ?? null,
      telefono: user.telefono ?? null,
      website: user.website ?? null,
      avatar: user.avatar ?? null,
      avatarStoredFileName: user.avatarStoredFileName ?? null,
      avatarAssetPublicId: user.avatarAssetPublicId ?? null,
      modalidadTrabajo: user.modalidadTrabajo ?? null,
      expectativaSalarial: user.expectativaSalarial ?? null,
      expectativaSalarialMin: user.expectativaSalarialMin ?? null,
      expectativaSalarialMax: user.expectativaSalarialMax ?? null,
      jornada: user.jornada ?? null,
      resumenPerfil: user.resumenPerfil ?? null,
      categoriasEnfoqueJson: stringifyJson(user.categoriasEnfoque ?? []),
      cv: user.cv ?? null,
      cvStoredFileName: user.cvStoredFileName ?? null,
      cvAssetPublicId: user.cvAssetPublicId ?? null,
      bio: user.bio ?? null,
      idiomasJson: stringifyJson(user.idiomas ?? []),
      disponibilidadViaje: user.disponibilidadViaje ?? null,
      movilidad: user.movilidad ?? null,
      skillsJson: stringifyJson(user.skills),
      candidateSkillsJson: stringifyJson(user.structuredSkills ?? []),
      experienciaJson: stringifyJson(user.experiencia),
      professionalProfileJson: stringifyJson(
        user.professionalProfile ?? {
          socialLinks: {},
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
          preferredTeamSize: undefined,
          preferredIndustries: [],
          preferredProductTypes: [],
        },
      ),
      educationProfileJson: stringifyJson(user.educationProfile ?? { records: [] }),
      certificationProfileJson: stringifyJson(user.certificationProfile ?? { records: [] }),
      workPreferencesJson: stringifyJson(
        user.workPreferences ?? {
          preferredWorkModes: [],
          preferredLocations: [],
          preferredEmploymentTypes: [],
        },
      ),
      locationProfileJson: stringifyJson(user.locationProfile ?? {}),
      profileQualityJson: stringifyJson(user.profileQuality ?? {}),
      profileVisibility: user.profileVisibility ?? null,
      candidatePlanStateJson: stringifyJson({
        currentPlanId: user.currentPlanId ?? "free",
        currentPlanWindowEndsAt: user.currentPlanWindowEndsAt ?? null,
        boostActiveUntil: user.boostActiveUntil ?? null,
        boostInventory: user.boostInventory ?? [],
        applicationQuotaLimit: user.applicationQuotaLimit ?? 3,
        applicationQuotaWindowStartedAt: user.applicationQuotaWindowStartedAt ?? new Date().toISOString(),
        applicationQuotaWindowEndsAt: user.applicationQuotaWindowEndsAt ?? new Date().toISOString(),
      }),
    };
  }

  if (user.role === "admin") {
    return {
      userId: user.id,
      nombre: user.nombre,
      rol: user.rol,
      tipoRegistro: user.tipoRegistro ?? "admin",
      ubicacion: user.ubicacion ?? null,
      telefono: user.telefono ?? null,
      website: user.website ?? null,
      avatar: user.avatar ?? null,
      avatarStoredFileName: user.avatarStoredFileName ?? null,
      avatarAssetPublicId: user.avatarAssetPublicId ?? null,
    };
  }

  return {
    userId: user.id,
    nombre: user.nombre,
    rol: user.rol,
    tipoRegistro: user.tipoRegistro ?? "empresa",
    ubicacion: user.ubicacion ?? null,
    telefono: user.telefono ?? null,
    website: user.website ?? null,
    avatar: user.avatar ?? null,
    avatarStoredFileName: user.avatarStoredFileName ?? null,
    avatarAssetPublicId: user.avatarAssetPublicId ?? null,
    companyName: user.companyName,
    industry: user.industry,
    companySize: user.companySize,
    companyDescription: user.companyDescription,
    companyCulture: user.companyCulture ?? null,
    companyMission: user.companyMission ?? null,
    companyVision: user.companyVision ?? null,
    companyContactEmail: user.companyContactEmail ?? null,
    companyWebsite: user.companyWebsite ?? null,
    companyLocation: user.companyLocation ?? null,
    companyBenefitsJson: stringifyJson(user.companyBenefits ?? []),
    companySocialLinksJson: stringifyJson(user.companySocialLinks ?? []),
    companyBanner: user.companyBanner ?? null,
    activeJobs: user.activeJobs,
    verificationStatus: user.verificationStatus,
    analyticsSummaryJson: stringifyJson(user.analyticsSummary),
    planStatus: user.planStatus ?? null,
    currentPeriodEnd: user.currentPeriodEnd ? new Date(user.currentPeriodEnd) : null,
    companyPlanStateJson: stringifyJson({
      currentPlanId: user.currentPlanId ?? "company-basic",
      currentPlanActivatedAt: user.currentPeriodEnd ?? null,
      currentPlanWindowEndsAt: user.currentPeriodEnd ?? null,
      collaboratorLimit: user.collaboratorLimit ?? 0,
    }),
    hiringFocusJson: stringifyJson(user.hiringFocus),
  };
}
