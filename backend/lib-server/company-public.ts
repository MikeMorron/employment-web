import { slugifyCompanyName } from "@/lib/company-public-slug";
import {
  findCompanyWithPublishedJobsByName,
  findCompanyWithPublishedJobsBySlug,
} from "@/lib/server/query-company-public";
import type { CompanyProfile } from "@/types/profile";
import type { CompanyJobPost } from "@/types/workflows";

export type PublicCompanySocialLink = {
  kind: "linkedin" | "facebook" | "x" | "instagram" | "website";
  href?: string;
};

export type PublicCompanyMediaItem = {
  kind: "image" | "video";
  src: string;
  label: string;
};

export type PublicCompanyJob = {
  id: string;
  title: string;
  location: string;
  modality: string;
  salary?: string;
};

export type PublicCompanyProfile = {
  id: string;
  slug: string;
  name: string;
  logoLabel: string;
  avatarUrl?: string;
  bannerUrl?: string;
  about: string;
  mission?: string;
  vision?: string;
  focus: string[];
  workModes: string[];
  contact: string[];
  socialLinks: PublicCompanySocialLink[];
  activeJobs: PublicCompanyJob[];
  location?: string;
  area?: string;
  companySize?: string;
  media: PublicCompanyMediaItem[];
  profileHref: string;
};

function normalizeCompanyName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getCompanyInitials(name: string) {
  const tokens = name
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  return tokens.slice(0, 2).map((token) => token[0]?.toUpperCase() ?? "").join("") || "EM";
}

function toExternalHref(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  if (normalized.includes(".")) {
    return `https://${normalized}`;
  }

  return undefined;
}

function buildSocialLinks(company: CompanyProfile) {
  const externalLinks = (company.companySocialLinks ?? [])
    .map((item) => toExternalHref(item))
    .filter(Boolean) as string[];
  const websiteHref = toExternalHref(company.companyWebsite ?? company.website);

  return [
    {
      kind: "linkedin" as const,
      href: externalLinks.find((item) => item.includes("linkedin.com")),
    },
    {
      kind: "facebook" as const,
      href: externalLinks.find((item) => item.includes("facebook.com")),
    },
    {
      kind: "x" as const,
      href: externalLinks.find((item) => item.includes("x.com") || item.includes("twitter.com")),
    },
    {
      kind: "instagram" as const,
      href: externalLinks.find((item) => item.includes("instagram.com")),
    },
    {
      kind: "website" as const,
      href: websiteHref,
    },
  ];
}

function buildContact(company: CompanyProfile) {
  return [
    company.companyContactEmail?.trim(),
    company.telefono?.trim(),
    toExternalHref(company.companyWebsite ?? company.website)?.replace(/^https?:\/\//, ""),
  ].filter(Boolean) as string[];
}

function buildMedia(company: CompanyProfile) {
  const items: PublicCompanyMediaItem[] = [];

  if (company.companyBanner?.trim()) {
    items.push({
      kind: "image",
      src: company.companyBanner.trim(),
      label: "Banner",
    });
  }

  if (company.avatar?.trim()) {
    items.push({
      kind: "image",
      src: company.avatar.trim(),
      label: "Logo",
    });
  }

  return items;
}

function buildActiveJobs(company: CompanyProfile, jobs: CompanyJobPost[]) {
  return jobs
    .filter((job) => job.status === "published")
    .filter(
      (job) =>
        job.ownerCompanyId === company.id ||
        normalizeCompanyName(job.companyName) === normalizeCompanyName(company.companyName),
    )
    .map((job) => ({
      id: job.id,
      title: job.title,
      location: job.location,
      modality: job.modality,
      salary: job.salary,
    }));
}

function toPublicCompanyProfile(company: CompanyProfile, jobs: CompanyJobPost[]): PublicCompanyProfile {
  const activeJobs = buildActiveJobs(company, jobs);
  const name = company.companyName || company.displayName;

  return {
    id: company.id,
    slug: slugifyCompanyName(name),
    name,
    logoLabel: getCompanyInitials(name),
    avatarUrl: company.avatar?.trim() || undefined,
    bannerUrl: company.companyBanner?.trim() || undefined,
    about: company.companyDescription?.trim() || "Empresa sin resumen disponible.",
    mission: company.companyMission?.trim() || undefined,
    vision: company.companyVision?.trim() || undefined,
    focus: company.hiringFocus?.length ? company.hiringFocus : company.companyBenefits ?? [],
    workModes: activeJobs.length
      ? Array.from(new Set(activeJobs.map((job) => job.modality).filter(Boolean)))
      : ["Modalidad por definir"],
    contact: buildContact(company),
    socialLinks: buildSocialLinks(company),
    activeJobs,
    location: company.companyLocation?.trim() || company.ubicacion?.trim() || undefined,
    area: company.industry?.trim() || undefined,
    companySize: company.companySize?.trim() || undefined,
    media: buildMedia(company),
    profileHref: `/empresa/${slugifyCompanyName(name)}`,
  };
}

export async function getPublicCompanyProfileBySlug(slug: string) {
  const company = await findCompanyWithPublishedJobsBySlug(slug);

  if (!company?.profile) {
    return null;
  }

  const mappedCompany = {
    id: company.id,
    role: "company",
    plan: "basic",
    displayName: company.displayName,
    nombre: company.profile.nombre,
    rol: company.profile.rol,
    email: "",
    tipoRegistro: "empresa",
    ubicacion: company.profile.ubicacion ?? undefined,
    telefono: company.profile.telefono ?? undefined,
    website: company.profile.website ?? undefined,
    avatar: company.avatarUrl,
    avatarAssetPublicId: company.profile.avatarAssetPublicId ?? undefined,
    companyName: company.profile.companyName ?? company.displayName,
    industry: company.profile.industry ?? "",
    companySize: company.profile.companySize ?? "",
    companyDescription: company.profile.companyDescription ?? "",
    companyCulture: company.profile.companyCulture ?? undefined,
    companyMission: company.profile.companyMission ?? undefined,
    companyVision: company.profile.companyVision ?? undefined,
    companyContactEmail: company.profile.companyContactEmail ?? undefined,
    companyWebsite: company.profile.companyWebsite ?? undefined,
    companyLocation: company.profile.companyLocation ?? undefined,
    companyBenefits: company.profile.companyBenefitsJson ? (JSON.parse(company.profile.companyBenefitsJson) as string[]) : [],
    companySocialLinks: company.profile.companySocialLinksJson ? (JSON.parse(company.profile.companySocialLinksJson) as string[]) : [],
    companyBanner: company.profile.companyBanner ?? undefined,
    activeJobs: (company.jobs ?? []).length,
    verificationStatus: company.profile.verificationStatus === "verified" ? "verified" : "pending",
    analyticsSummary: company.profile.analyticsSummaryJson
      ? (JSON.parse(company.profile.analyticsSummaryJson) as CompanyProfile["analyticsSummary"])
      : { profileViews: 0, applications: 0, conversionRate: 0 },
    hiringFocus: company.profile.hiringFocusJson ? (JSON.parse(company.profile.hiringFocusJson) as string[]) : [],
    billingHistory: [],
  } satisfies CompanyProfile;

  const mappedJobs = (company.jobs ?? []).map((job) => ({
    id: job.id,
    ownerCompanyId: job.ownerCompanyId,
    companyName: job.companyName,
    title: job.title,
    location: job.location,
    modality: job.modality,
    salary: job.salary ?? undefined,
    description: job.description,
    tags: job.tagsJson ? (JSON.parse(job.tagsJson) as string[]) : [],
    status: job.status as CompanyJobPost["status"],
    featured: job.featured,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    applicants: [],
  }));

  return toPublicCompanyProfile(mappedCompany, mappedJobs);
}

export async function getPublicCompanyProfileByName(name: string) {
  const company = await findCompanyWithPublishedJobsByName(name);
  if (!company?.profile) {
    return null;
  }

  return getPublicCompanyProfileBySlug(slugifyCompanyName(company.profile.companyName ?? company.displayName));
}
