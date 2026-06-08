export type UserRole = "candidate" | "company" | "admin";

export type CandidatePlan = "basic" | "boosted" | "pro";
export type CompanyPlan = "free" | "basic" | "pro" | "business" | "premium";
export type Plan = CandidatePlan | CompanyPlan;
export type PlanTier = Plan;

export type CandidateFeature =
  | "create_profile"
  | "apply_to_jobs"
  | "appear_in_search"
  | "receive_matches"
  | "save_jobs"
  | "notifications"
  | "ranking_boost_boosted"
  | "ranking_boost_pro"
  | "see_profile_views"
  | "featured_profile"
  | "priority_matching";

export type CompanyFeature =
  | "create_company"
  | "post_limited_job"
  | "view_basic_candidates"
  | "receive_applications"
  | "multi_active_jobs"
  | "featured_jobs"
  | "smart_matching"
  | "advanced_filters"
  | "analytics"
  | "recommended_candidates";

export type Feature = CandidateFeature | CompanyFeature;

export type DerivedPermissions = {
  canApplyToJobs: boolean;
  canPostJobs: boolean;
  canViewCandidates: boolean;
  canViewApplicants: boolean;
  canBoostProfile: boolean;
  canAccessInsights: boolean;
  canManageCompanyProfile: boolean;
};

export type AccountBase = {
  id: string;
  email: string;
  role: UserRole;
  plan: Plan;
  displayName: string;
};
