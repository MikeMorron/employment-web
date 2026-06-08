import type { CandidatePlan, CompanyPlan } from "@/types/account";
import { isActiveCandidateApplicationStatus } from "@/lib/application-status";
import type { MatchRankingMetadata, MatchResult } from "@/types/matching";
import type { AppUser, CandidateProfile } from "@/types/profile";
import type { Vacancy } from "@/types/vacancy";
import type { CandidateApplication } from "@/types/workflows";
import { normalizeCompanyPlan } from "@/lib/company-plan-model";

export type CandidateCommercialPlan = "basic" | "boosted" | "pro";
export type CandidateInsightDepth = "none" | "basic" | "advanced";
export type CandidateRankingSurface =
  | "candidate_feed"
  | "candidate_matches"
  | "company_search"
  | "company_applicants";

export type CandidatePlanFeatures = {
  role: "candidate";
  sourcePlan: CandidatePlan;
  plan: CandidateCommercialPlan;
  rankingMultiplier: number;
  matchVisibilityBoost: number;
  activeApplicationsLimit: number;
  showInsights: boolean;
  insightDepth: CandidateInsightDepth;
  profileHighlight: boolean;
  priorityInSearch: boolean;
  profileAnalytics: boolean;
  enhancedNotifications: boolean;
  notificationBatchSize: number;
  notificationWindowDays: number;
};

export type CompanyPlanFeatures = {
  role: "company";
  plan: CompanyPlan;
  rankingMultiplier: number;
  matchVisibilityBoost: number;
  canUseAnalytics: boolean;
  canFeatureJobs: boolean;
};

export type UserPlanFeatures = CandidatePlanFeatures | CompanyPlanFeatures;

const CANDIDATE_PLAN_FEATURES: Record<CandidateCommercialPlan, Omit<CandidatePlanFeatures, "role" | "sourcePlan" | "plan">> = {
  basic: {
    rankingMultiplier: 1,
    matchVisibilityBoost: 1,
    activeApplicationsLimit: 7,
    showInsights: false,
    insightDepth: "none",
    profileHighlight: false,
    priorityInSearch: false,
    profileAnalytics: false,
    enhancedNotifications: false,
    notificationBatchSize: 2,
    notificationWindowDays: 7,
  },
  boosted: {
    rankingMultiplier: 1.12,
    matchVisibilityBoost: 1.12,
    activeApplicationsLimit: 15,
    showInsights: false,
    insightDepth: "none",
    profileHighlight: false,
    priorityInSearch: false,
    profileAnalytics: false,
    enhancedNotifications: true,
    notificationBatchSize: 4,
    notificationWindowDays: 14,
  },
  pro: {
    rankingMultiplier: 1.32,
    matchVisibilityBoost: 1.35,
    activeApplicationsLimit: 30,
    showInsights: true,
    insightDepth: "advanced",
    profileHighlight: true,
    priorityInSearch: true,
    profileAnalytics: true,
    enhancedNotifications: true,
    notificationBatchSize: 6,
    notificationWindowDays: 21,
  },
};

function roundFactor(value: number) {
  return Math.round(value * 1000) / 1000;
}

function clampFactor(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildBasicCandidateSummary(level: MatchResult["level"]) {
  if (level === "high") {
    return "Tu perfil muestra afinidad competitiva para esta vacante.";
  }

  if (level === "medium") {
    return "Hay una compatibilidad parcial para esta vacante.";
  }

  return "La compatibilidad actual con esta vacante es limitada.";
}

export function normalizeCandidatePlan(
  plan: CandidatePlan | CandidateProfile["plan"] | "free" | "premium" | null | undefined,
): CandidateCommercialPlan {
  if (plan === "pro") {
    return plan;
  }

  if (plan === "boosted") {
    return "boosted";
  }

  if (plan === "premium") {
    return "pro";
  }

  if (plan === "basic" || plan === "free") {
    return "basic";
  }

  return "basic";
}

export function getCandidatePlanFeatures(
  planOrUser: CandidatePlan | Pick<CandidateProfile, "plan">,
): CandidatePlanFeatures {
  const sourcePlan = typeof planOrUser === "string" ? planOrUser : planOrUser.plan;
  const normalizedPlan = normalizeCandidatePlan(sourcePlan);

  return {
    role: "candidate",
    sourcePlan,
    plan: normalizedPlan,
    ...CANDIDATE_PLAN_FEATURES[normalizedPlan],
  };
}

export function hasCandidateActiveBoost(
  candidate:
    | Pick<CandidateProfile, "plan" | "boostActiveUntil">
    | CandidatePlan
    | null
    | undefined,
  now = Date.now(),
) {
  if (candidate && typeof candidate !== "string") {
    if (candidate.boostActiveUntil) {
      const activeUntil = new Date(candidate.boostActiveUntil).getTime();
      if (Number.isFinite(activeUntil) && activeUntil > now) {
        return true;
      }
    }

    const normalizedPlan = normalizeCandidatePlan(candidate.plan);
    return normalizedPlan === "boosted" || normalizedPlan === "pro";
  }

  const normalizedPlan = normalizeCandidatePlan(candidate);
  return normalizedPlan === "boosted" || normalizedPlan === "pro";
}

export function getUserPlanFeatures(user: Pick<AppUser, "role" | "plan">): UserPlanFeatures {
  if (user.role === "candidate") {
    return getCandidatePlanFeatures(user.plan as CandidatePlan);
  }

  const plan = normalizeCompanyPlan(user.plan as CompanyPlan);
  return {
    role: "company",
    plan,
    rankingMultiplier: plan === "premium" ? 1.16 : plan === "business" ? 1.08 : plan === "pro" ? 1.03 : 1,
    matchVisibilityBoost: plan === "premium" ? 1.22 : plan === "business" ? 1.1 : 1,
    canUseAnalytics: plan === "business" || plan === "premium",
    canFeatureJobs: plan === "business" || plan === "premium",
  };
}

export function isCandidatePlanFeatures(features: UserPlanFeatures): features is CandidatePlanFeatures {
  return features.role === "candidate";
}

export function getCandidateActiveApplicationsCount(
  applications: CandidateApplication[],
  candidateId: string,
) {
  return applications.filter(
    (application) =>
      application.candidateId === candidateId &&
      isActiveCandidateApplicationStatus(application.status),
  ).length;
}

export function getRemainingActiveApplications(
  applications: CandidateApplication[],
  candidate: Pick<CandidateProfile, "id" | "plan">,
) {
  const features = getCandidatePlanFeatures(candidate);
  const used = getCandidateActiveApplicationsCount(applications, candidate.id);

  return Math.max(0, features.activeApplicationsLimit - used);
}

export function canCandidateAccessVacancy(
  candidate: Pick<CandidateProfile, "plan">,
  vacancy: Vacancy,
  now = Date.now(),
) {
  void candidate;
  void vacancy;
  void now;
  return true;
}

export function getCandidateRankingActivityFactor(metadata: MatchRankingMetadata = {}) {
  let factor = metadata.isRecentlyActive ? 1.08 : 0.97;

  if (metadata.isEntityActive === false) {
    factor *= 0.92;
  }

  if (typeof metadata.profileCompleteness === "number") {
    factor *= clampFactor(0.9 + metadata.profileCompleteness * 0.2, 0.9, 1.1);
  }

  if (metadata.isPaused || metadata.isClosed) {
    factor *= 0.35;
  }

  return roundFactor(factor);
}

export function getCandidateRankingRecencyFactor(
  metadata: MatchRankingMetadata = {},
  features: CandidatePlanFeatures,
  surface: CandidateRankingSurface,
) {
  let factor = 1;

  if (metadata.isPublishedRecently) {
    factor *=
      surface === "candidate_feed" || surface === "candidate_matches"
        ? features.priorityInSearch
          ? 1.08
          : 1.04
        : 1.03;
  }

  return roundFactor(factor);
}

export function calculateCandidateRankScore(
  baseScore: number,
  features: CandidatePlanFeatures,
  metadata: MatchRankingMetadata = {},
  surface: CandidateRankingSurface = "candidate_feed",
) {
  let score =
    baseScore *
    features.rankingMultiplier *
    getCandidateRankingActivityFactor(metadata) *
    getCandidateRankingRecencyFactor(metadata, features, surface);

  if (surface === "company_search" || surface === "company_applicants") {
    score *= features.matchVisibilityBoost;

    if (metadata.companyPlan === "premium" && metadata.hasActiveBoost) {
      score *= 1.14;
    }

    if (features.priorityInSearch) {
      score += 12;
    }

    if (features.profileHighlight) {
      score += 6;
    }
  }

  return Math.max(0, Math.round(score));
}

export function getPlanAwareCandidateMatchResult(
  result: MatchResult,
  candidate: Pick<CandidateProfile, "plan">,
) {
  const features = getCandidatePlanFeatures(candidate);

  if (features.insightDepth === "advanced") {
    return result;
  }

  if (features.insightDepth === "basic") {
    return {
      ...result,
      strengths: result.strengths.slice(0, 2),
      gaps: result.gaps.slice(0, 1),
      warnings: result.warnings.slice(0, 1),
    };
  }

  return {
    ...result,
    strengths: [],
    gaps: [],
    warnings: [],
    suggestedAction: undefined,
    summary: buildBasicCandidateSummary(result.level),
  };
}
