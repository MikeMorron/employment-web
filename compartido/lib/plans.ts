import type {
  DerivedPermissions,
  Feature,
  Plan,
  UserRole,
} from "@/types/account";
import { getCandidatePlanFeatures, normalizeCandidatePlan } from "@/lib/candidate-plan";
import { normalizeCompanyPlan } from "@/lib/company-plan-model";
import { companySubscriptionPlans } from "@/lib/plan-catalog";

type CandidatePlanRecord = {
  basic: Feature[];
  boosted: Feature[];
  pro: Feature[];
};

type CompanyPlanRecord = {
  basic: Feature[];
  pro: Feature[];
  business: Feature[];
  premium: Feature[];
};

export const accountPolicy = {
  accountMode: "single-role",
  description:
    "One account maps to one role in this stage to keep onboarding, permissions, navigation, and pricing simple.",
} as const;

export const roleVisibilityRules = {
  candidate: {
    hidden: [
      "other_candidates_applying",
      "applicants_panel",
      "vacancy_metrics",
      "recruiter_tools",
    ],
  },
  company: {
    hidden: [
      "apply_button",
      "my_applications",
      "candidate_boosts",
      "recommended_jobs_for_company",
    ],
  },
} as const;

export const monetizationByRole = {
  candidate: [
    "visibility",
    "priority",
    "early_access",
    "insights",
    "featured_profile",
  ],
  company: [
    "more_active_jobs",
    "featured_jobs",
    "better_matching",
    "analytics",
    "filters_and_pipeline",
  ],
} as const;

export const candidatePlanMatrix: CandidatePlanRecord = {
  basic: [
    "create_profile",
    "apply_to_jobs",
    "appear_in_search",
    "receive_matches",
    "save_jobs",
    "notifications",
  ],
  boosted: [
    "create_profile",
    "apply_to_jobs",
    "appear_in_search",
    "receive_matches",
    "save_jobs",
    "notifications",
    "ranking_boost_boosted",
    "priority_matching",
  ],
  pro: [
    "create_profile",
    "apply_to_jobs",
    "appear_in_search",
    "receive_matches",
    "save_jobs",
    "notifications",
    "ranking_boost_boosted",
    "ranking_boost_pro",
    "see_profile_views",
    "featured_profile",
    "priority_matching",
  ],
};

export const companyPlanMatrix: CompanyPlanRecord = {
  basic: [
    "create_company",
    "post_limited_job",
    "view_basic_candidates",
    "receive_applications",
  ],
  pro: [
    "create_company",
    "post_limited_job",
    "view_basic_candidates",
    "receive_applications",
    "multi_active_jobs",
    "advanced_filters",
  ],
  business: [
    "create_company",
    "post_limited_job",
    "view_basic_candidates",
    "receive_applications",
    "multi_active_jobs",
    "featured_jobs",
    "smart_matching",
    "advanced_filters",
    "analytics",
    "recommended_candidates",
  ],
  premium: [
    "create_company",
    "post_limited_job",
    "view_basic_candidates",
    "receive_applications",
    "multi_active_jobs",
    "featured_jobs",
    "smart_matching",
    "advanced_filters",
    "analytics",
    "recommended_candidates",
  ],
};

export function getPlanLimits(role: UserRole, plan: Plan) {
  if (role === "company") {
    const normalizedPlan = normalizeCompanyPlan(plan);
    const companyPlan =
      companySubscriptionPlans.find((item) => item.planKey === normalizedPlan) ??
      companySubscriptionPlans[0];

    return {
      activeJobs: companyPlan.activeJobs,
      maxPublishedJobs: companyPlan.maxPublishedJobs,
      featuredJobs: normalizedPlan === "business" || normalizedPlan === "premium",
      advancedFilters: normalizedPlan !== "basic",
      analyticsDepth: normalizedPlan === "basic" ? "basic" : "full",
      premiumCandidateQueue: companyPlan.topCandidates,
      urgentJobs: companyPlan.urgentJobs,
      collaboratorLimit: companyPlan.collaboratorLimit,
    } as const;
  }

  return {
    activeApplications:
      plan === "pro" ? 30 : plan === "boosted" ? 15 : 7,
    profileInsights:
      getCandidatePlanFeatures(plan as "basic" | "boosted" | "pro").insightDepth === "advanced" ? "full" : "limited",
    visibility:
      getCandidatePlanFeatures(plan as "basic" | "boosted" | "pro").profileHighlight ? "high" : plan === "boosted" ? "medium" : "standard",
  } as const;
}

export function getAllowedPlansForRole(role: UserRole): Plan[] {
  return role === "candidate"
    ? ["basic", "boosted", "pro"]
    : ["basic", "pro", "business", "premium"];
}

export function getCapabilities(role: UserRole, plan: Plan): Feature[] {
  if (role === "candidate") {
    const allowedPlan =
      plan === "business"
        ? "basic"
        : normalizeCandidatePlan(plan as "basic" | "boosted" | "pro" | "free" | "premium");
    return candidatePlanMatrix[allowedPlan];
  }

  return companyPlanMatrix[normalizeCompanyPlan(plan)];
}

export function canUseFeature(role: UserRole, plan: Plan, feature: Feature) {
  return getCapabilities(role, plan).includes(feature);
}

export function canUpgradeTo(role: UserRole, currentPlan: Plan, targetPlan: Plan) {
  const allowedPlans = getAllowedPlansForRole(role);
  if (!allowedPlans.includes(targetPlan) || !allowedPlans.includes(currentPlan)) {
    return false;
  }

  return allowedPlans.indexOf(targetPlan) > allowedPlans.indexOf(currentPlan);
}

export function canAccess(role: UserRole, plan: Plan, targetPlan: Plan) {
  return getAllowedPlansForRole(role).includes(targetPlan) && canUpgradeTo(role, plan, targetPlan);
}

export function getDerivedPermissions(role: UserRole, plan: Plan): DerivedPermissions {
  return {
    canApplyToJobs: canUseFeature(role, plan, "apply_to_jobs"),
    canPostJobs: canUseFeature(role, plan, "post_limited_job"),
    canViewCandidates: canUseFeature(role, plan, "view_basic_candidates"),
    canViewApplicants: canUseFeature(role, plan, "receive_applications"),
    canBoostProfile:
      canUseFeature(role, plan, "ranking_boost_boosted") ||
      canUseFeature(role, plan, "ranking_boost_pro") ||
      canUseFeature(role, plan, "featured_profile"),
    canAccessInsights:
      canUseFeature(role, plan, "see_profile_views") ||
      canUseFeature(role, plan, "analytics"),
    canManageCompanyProfile: role === "company",
  };
}

export function canApplyToJobs(role: UserRole, plan: Plan) {
  return canUseFeature(role, plan, "apply_to_jobs");
}

export function canViewApplicants(role: UserRole, plan: Plan) {
  return canUseFeature(role, plan, "receive_applications");
}

export function canSearchCandidates(role: UserRole, plan: Plan) {
  return (
    canUseFeature(role, plan, "view_basic_candidates") ||
    canUseFeature(role, plan, "recommended_candidates")
  );
}

export function canPostJobs(role: UserRole, plan: Plan) {
  return canUseFeature(role, plan, "post_limited_job");
}

export function canBoostProfile(role: UserRole, plan: Plan) {
  return (
    canUseFeature(role, plan, "ranking_boost_boosted") ||
    canUseFeature(role, plan, "ranking_boost_pro") ||
    canUseFeature(role, plan, "featured_profile")
  );
}

export function canAccessInsights(role: UserRole, plan: Plan) {
  return (
    canUseFeature(role, plan, "see_profile_views") ||
    canUseFeature(role, plan, "analytics")
  );
}

export function canManageCompanyProfile(role: UserRole) {
  return role === "company";
}
