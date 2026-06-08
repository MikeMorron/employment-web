import type { CompanyPlan } from "@/types/account";
import type {
  CandidateProfile,
  LanguageLevelSystem,
} from "@/types/profile";
import type {
  Vacancy,
  VacancyLanguageRequirement,
  VacancySalaryPeriodicity,
} from "@/types/vacancy";

export type MatchLevel = "low" | "medium" | "high";

export type MatchReasonType = "strength" | "gap" | "warning";
export type MatchImpact = "high" | "medium" | "low";

export type MatchReason = {
  key: string;
  label: string;
  actionLabel?: string;
  type: MatchReasonType;
  weight: number;
  impact: MatchImpact;
  category:
    | "skills"
    | "experience"
    | "salary"
    | "location"
    | "modality"
    | "seniority"
    | "languages"
    | "certifications"
    | "education"
    | "activity";
};

export type MatchBreakdown = {
  skills: number;
  experience: number;
  seniority: number;
  location: number;
  modality: number;
  salary: number;
  education: number;
  languages: number;
  certifications: number;
  activity: number;
};

export type MatchQualitySignals = {
  candidateProfileQuality: number;
  vacancyQuality: number;
  experienceDataQuality: number;
  salaryDataQuality: number;
  languageDataQuality: number;
  requiredSkillsQuality: number;
  hasStructuredSalary: boolean;
  hasClearModality: boolean;
  hasClearExperienceRequirement: boolean;
  hasClearRequiredSkills: boolean;
};

export type MatchDebugInfo = {
  missingData: string[];
  criticalGaps: string[];
  qualitySignals: MatchQualitySignals;
};

export type MatchResult = {
  visibleScore: number;
  rankingScore: number;
  confidenceScore: number;
  level: MatchLevel;
  strengths: MatchReason[];
  gaps: MatchReason[];
  warnings: MatchReason[];
  summary: string;
  suggestedAction?: string;
  breakdown: MatchBreakdown;
  debug: MatchDebugInfo;
};

export type MatchWeights = MatchBreakdown;

export type MatchCalibrationKey =
  | "skills"
  | "experience"
  | "seniority"
  | "modality"
  | "salary"
  | "languages";

export type MatchCalibrationRecord = {
  key: MatchCalibrationKey;
  weight: number;
  minWeight: number;
  maxWeight: number;
  sampleCount: number;
  acceptedCount: number;
  rejectedCount: number;
  lastDelta: number;
  updatedAt?: string;
};

export type MatchPerspective = "candidate" | "company";

export type MatchRankingMetadata = {
  isRecentlyActive?: boolean;
  isPublishedRecently?: boolean;
  isEntityActive?: boolean;
  isPaused?: boolean;
  isClosed?: boolean;
  profileCompleteness?: number;
  companyPlan?: CompanyPlan;
  hasActiveBoost?: boolean;
  visibilityPenaltyPct?: number;
};

export type MatchLanguageRequirement = VacancyLanguageRequirement & {
  required?: boolean;
  source: "structured" | "inferred";
};

export type NormalizedSalaryRange = {
  min: number | null;
  max: number | null;
  currency: string | null;
  periodicity: VacancySalaryPeriodicity;
  confidenceScore: number;
  source: "structured" | "text" | "candidate";
  raw: string | null;
};

export type NormalizedExperienceRange = {
  startDate: string;
  endDate: string;
  current: boolean;
  source: "structured" | "text";
};

export type CandidateExperienceSummary = {
  totalMonths: number;
  totalYears: number;
  confidenceScore: number;
  uncertainEntries: number;
  datedEntries: number;
  overlappingEntriesMerged: number;
  ranges: NormalizedExperienceRange[];
};

export type MatchFactorInput = {
  requiredSkills: string[];
  optionalSkills: string[];
  requiredLanguages: MatchLanguageRequirement[];
  optionalLanguages: MatchLanguageRequirement[];
  requiredCertifications: string[];
  optionalCertifications: string[];
  requiredEducation: string[];
  optionalEducation: string[];
  minimumExperienceYears: number | null;
  seniority: "junior" | "mid" | "senior" | "lead";
  location?: string;
  modality?: "remote" | "hybrid" | "onsite" | "flexible" | "unknown";
  salary: NormalizedSalaryRange | null;
  jobPostedRecently: boolean;
  candidateRecentlyActive: boolean;
};

export type MatchRankingOptions = {
  metadata?: MatchRankingMetadata;
  candidate?: CandidateProfile | null;
  surface?:
    | "candidate_feed"
    | "candidate_matches"
    | "company_search"
    | "company_applicants";
};

export type MatchEvaluationOptions = {
  perspective?: MatchPerspective;
  calibration?: MatchCalibrationRecord[] | null;
  ranking?: MatchRankingOptions;
};

export type MatchEvaluationInput = {
  candidate: CandidateProfile;
  vacancy: Vacancy;
  perspective: MatchPerspective;
  calibration?: MatchCalibrationRecord[] | null;
  ranking?: MatchRankingOptions;
};

export type MatchRankingContext = {
  baseVisibleScore: number;
  metadata: MatchRankingMetadata;
  candidate?: CandidateProfile | null;
  surface:
    | "candidate_feed"
    | "candidate_matches"
    | "company_search"
    | "company_applicants";
};

export type NormalizedLanguage = {
  name: string;
  level: string;
  levelSystem: LanguageLevelSystem;
  proficiencyRank: number;
};
