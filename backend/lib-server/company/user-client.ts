import { buildAvatarFileHref } from "@/lib/file-links";
import type { CompanyProfile } from "@/types/profile";

function buildCompanyBase(user: CompanyProfile) {
  return {
    id: user.id,
    email: "",
    role: "company" as const,
    plan: user.plan,
    displayName: user.displayName,
    nombre: user.nombre,
    rol: user.rol,
    tipoRegistro: "empresa" as const,
    ubicacion: user.ubicacion ?? undefined,
    avatar: user.avatarAssetPublicId ? buildAvatarFileHref(user.avatarAssetPublicId) : user.avatar ?? undefined,
    companyName: user.companyName,
    industry: user.industry,
    companySize: user.companySize,
    companyDescription: user.companyDescription,
    companyCulture: user.companyCulture ?? undefined,
    companyMission: user.companyMission ?? undefined,
    companyVision: user.companyVision ?? undefined,
    companyLocation: user.companyLocation ?? undefined,
    companyBenefits: [...(user.companyBenefits ?? [])],
    companySocialLinks: [...(user.companySocialLinks ?? [])],
    companyBanner: user.companyBanner ?? undefined,
    activeJobs: user.activeJobs,
    verificationStatus: user.verificationStatus,
    analyticsSummary: {
      ...user.analyticsSummary,
    },
    planStatus: user.planStatus ?? undefined,
    currentPeriodEnd: user.currentPeriodEnd ?? undefined,
    hiringFocus: [...user.hiringFocus],
    billingHistory: [...(user.billingHistory ?? [])],
    currentPlanId: user.currentPlanId ?? undefined,
    collaboratorLimit: user.collaboratorLimit ?? undefined,
  };
}

export function sanitizeCompanyForClient(user: CompanyProfile): CompanyProfile {
  return {
    ...buildCompanyBase(user),
  };
}

export function sanitizeOwnCompanyForClient(user: CompanyProfile): CompanyProfile {
  return {
    ...buildCompanyBase(user),
    telefono: user.telefono ?? undefined,
    website: user.website ?? undefined,
    companyContactEmail: user.companyContactEmail ?? undefined,
    companyWebsite: user.companyWebsite ?? undefined,
  };
}
