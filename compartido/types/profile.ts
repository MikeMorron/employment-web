import type { AccountBase } from "@/types/account";
import type { CompanyBillingHistoryEntry } from "@/types/company";

export type LanguageLevelSystem = "CEFR" | "JLPT" | "HSK" | "TOPIK";

export type LanguageProficiency = {
  name: string;
  levelSystem: LanguageLevelSystem;
  level: string;
  languageCode?: string;
  isNative?: boolean;
  certified?: boolean;
  certificateFileName?: string;
  certificateStoredFileName?: string;
  certificateThumbnailStoredFileName?: string;
};

export type CandidateSeniorityLevel =
  | "intern"
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "principal";

export type CandidateAvailabilityStatus =
  | "available_now"
  | "open_30_days"
  | "open_60_days"
  | "interviewing"
  | "not_available";

export type CandidateStructuredSkill = {
  skillName: string;
  canonicalSkill?: string;
  skillCategory?: string;
  skillLevel?: "basic" | "intermediate" | "advanced" | "expert";
  yearsExperience?: number;
  experienceMonths?: number;
  lastUsedAt?: string;
  isCoreSkill?: boolean;
  evidenceSource?: string;
};

export type StructuredSkill = CandidateStructuredSkill;

export type CandidateEducationRecord = {
  educationType?:
    | "primaria"
    | "secundaria_bachillerato"
    | "tecnico_tecnologo"
    | "universidad_pregrado"
    | "especializacion"
    | "maestria"
    | "doctorado"
    | "bootcamp"
    | "curso_certificacion"
    | "autodidacta";
  degreeTitle: string;
  degreeField?: string;
  focusAreas?: string[];
  institutionName?: string;
  startDate?: string;
  endDate?: string;
  city?: string;
  region?: string;
  isCompleted?: boolean;
  isRelevant?: boolean;
};

export type CandidateEducationProfile = {
  highestEducationLevel?: string;
  records: CandidateEducationRecord[];
};

export type CandidateCertificationRecord = {
  certificationName: string;
  canonicalCertification?: string;
  certificationCategory?: string;
  issuer?: string;
  startedAt?: string;
  completedAt?: string;
  proofImageName?: string;
  proofImageAssetId?: string;
  proofImageAssetPublicId?: string;
  proofImageUrl?: string;
  proofImageThumbnailUrl?: string;
  proofImageStoredFileName?: string;
  proofImageThumbnailStoredFileName?: string;
  proofVideoName?: string;
  proofVideoAssetId?: string;
  proofVideoAssetPublicId?: string;
  proofVideoUrl?: string;
  proofVideoStoredFileName?: string;
  issuedAt?: string;
  expiresAt?: string;
  isActive?: boolean;
  isRelevant?: boolean;
};

export type CandidateCertificationProfile = {
  records: CandidateCertificationRecord[];
};

export type CertificationAsset = CandidateCertificationRecord;
export type CertificationProfile = {
  items: CertificationAsset[];
};

export type CandidateWorkPreferences = {
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: "hourly" | "monthly" | "yearly";
  preferredWorkModes?: string[];
  remotePreference?: "required" | "preferred" | "open" | "not_interested";
  preferredLocations?: string[];
  willingToRelocate?: boolean;
  preferredEmploymentTypes?: string[];
  noticePeriodDays?: number;
  availabilityDate?: string;
};

export type CandidateBoostInventoryItem = {
  id: string;
  sourcePlanId: string;
  durationHours: number;
  totalUses: number;
  remainingUses: number;
  createdAt: string;
};

export type CandidateLocationProfile = {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  hasVehicle?: boolean;
  mobilityType?: string;
  canTravel?: boolean;
  travelAvailability?: string;
  canWorkOnsite?: boolean;
};

export type CandidateProfileQualitySignals = {
  profileCompletenessScore?: number;
  experienceClarityScore?: number;
  skillsClarityScore?: number;
  salaryClarityScore?: number;
  educationClarityScore?: number;
  certificationsClarityScore?: number;
  locationClarityScore?: number;
  dataConfidenceScore?: number;
  lastProfileUpdateAt?: string;
  moderationVisibilityPenaltyPct?: number;
  chatWarningsMonth?: number;
  chatSuspendedForReview?: boolean;
  lastModerationWarningAt?: string;
};

export type CandidateProfessionalProfile = {
  socialLinks?: {
    x?: string;
    facebook?: string;
    instagram?: string;
    telegram?: string;
    linkedin?: string;
    github?: string;
  };
  currentJobTitle?: string;
  canonicalRole?: string;
  roleFamily?: string;
  seniorityLevel?: CandidateSeniorityLevel;
  yearsExperienceTotal?: number;
  yearsExperienceRelevant?: number;
  headline?: string;
  professionalSummary?: string;
  openToWork?: boolean;
  availabilityStatus?: CandidateAvailabilityStatus;
  primarySpecialization?: string;
  secondarySpecializations?: string[];
  targetRoleFamilies?: string[];
  preferredRoleTitles?: string[];
  industryExperienceTags?: string[];
  productStageExperience?: string[];
  companyTypeExperience?: string[];
  tools?: string[];
  topSkills?: string[];
  methodologies?: string[];
  platformExperience?: string[];
  preferredCompanyStages?: string[];
  preferredCompanyTypes?: string[];
  preferredTeamSize?: string;
  preferredIndustries?: string[];
  preferredProductTypes?: string[];
  hasExperienceWithDiscovery?: boolean;
  hasExperienceWithExperimentation?: boolean;
  hasExperienceWithDesignSystems?: boolean;
  hasExperienceWithUserResearch?: boolean;
  hasExperienceWithPrototyping?: boolean;
  hasExperienceWithGrowth?: boolean;
  hasExperienceWithMarketplaces?: boolean;
  hasExperienceWithSaas?: boolean;
  hasExperienceWithB2b?: boolean;
  hasExperienceWithMobileProducts?: boolean;
  hasExperienceWithCrossFunctionalTeams?: boolean;
  hasPeopleManagementExperience?: boolean;
};

export type ExperienceItem = {
  rol: string;
  empresa: string;
  empresaNit?: string;
  tiempo: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  durationMonths?: number;
  fechaInicio?: string;
  fechaFin?: string;
  actualidad?: boolean;
  opinion?: string;
  description?: string;
  canonicalRole?: string;
  roleFamily?: string;
  companyIndustry?: string;
  employmentType?: string;
  location?: string;
  workMode?: string;
  achievements?: string;
  skillsUsed?: string[];
  domainTags?: string[];
  functionalTags?: string[];
  teamScope?: string;
  peopleLedCount?: number;
  productsWorkedOn?: string[];
};

export type CandidateProfile = AccountBase & {
  role: "candidate";
  plan: "basic" | "boosted" | "pro";
  nombre: string;
  rol: string;
  ubicacion?: string;
  birthDate?: string;
  birthPlace?: string;
  tipoRegistro?: "persona";
  modalidadTrabajo?: string;
  expectativaSalarial?: string;
  expectativaSalarialMin?: string;
  expectativaSalarialMax?: string;
  jornada?: string;
  resumenPerfil?: string;
  categoriasEnfoque?: string[];
  telefono?: string;
  website?: string;
  avatar?: string;
  avatarStoredFileName?: string;
  avatarAssetPublicId?: string;
  cv?: string;
  cvStoredFileName?: string;
  cvAssetPublicId?: string;
  cvDownloadUrl?: string;
  bio?: string;
  idiomas?: LanguageProficiency[];
  disponibilidadViaje?: string;
  movilidad?: string;
  skills: string[];
  structuredSkills?: CandidateStructuredSkill[];
  experiencia: ExperienceItem[];
  education?: string[];
  certifications?: string[];
  professionalProfile?: CandidateProfessionalProfile;
  educationProfile?: CandidateEducationProfile;
  certificationProfile?: CandidateCertificationProfile;
  workPreferences?: CandidateWorkPreferences;
  locationProfile?: CandidateLocationProfile;
  profileQuality?: CandidateProfileQualitySignals;
  profileVisibility?: "public" | "private" | "recruiters_only";
  currentPlanId?: string;
  currentPlanWindowEndsAt?: string;
  boostActiveUntil?: string;
  boostInventory?: CandidateBoostInventoryItem[];
  applicationQuotaLimit?: number;
  applicationQuotaWindowStartedAt?: string;
  applicationQuotaWindowEndsAt?: string;
  applicationQuotaRemaining?: number;
};

export type CompanyProfile = AccountBase & {
  role: "company";
  plan: "free" | "basic" | "pro" | "business" | "premium";
  slug?: string;
  nombre: string;
  rol: string;
  tipoRegistro?: "empresa";
  ubicacion?: string;
  telefono?: string;
  website?: string;
  avatar?: string;
  avatarStoredFileName?: string;
  avatarAssetPublicId?: string;
  companyName: string;
  industry: string;
  companySize: string;
  companyDescription: string;
  companyCulture?: string;
  companyMission?: string;
  companyVision?: string;
  companyContactEmail?: string;
  companyWebsite?: string;
  companyLocation?: string;
  companyBenefits?: string[];
  companySocialLinks?: string[];
  companyBanner?: string;
  activeJobs: number;
  verificationStatus: "pending" | "verified" | "unverified";
  analyticsSummary: {
    profileViews: number;
    applications: number;
    conversionRate: number;
  };
  planStatus?: "inactive" | "pending" | "active" | "past_due" | "cancelled";
  currentPeriodEnd?: string;
  hiringFocus: string[];
  billingHistory?: CompanyBillingHistoryEntry[];
  currentPlanId?: string;
  collaboratorLimit?: number;
};

export type AdminProfile = AccountBase & {
  role: "admin";
  plan: "free" | "basic" | "pro" | "business" | "premium";
  nombre: string;
  rol: string;
  tipoRegistro?: "admin";
  ubicacion?: string;
  telefono?: string;
  website?: string;
  avatar?: string;
  avatarStoredFileName?: string;
  avatarAssetPublicId?: string;
  permissions?: string[];
};

export type AppUser = CandidateProfile | CompanyProfile | AdminProfile;
