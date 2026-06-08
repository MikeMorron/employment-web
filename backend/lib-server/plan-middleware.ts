import type { CandidateProfile } from "@/types/profile";
import { getCandidatePlanFeatures, getUserPlanFeatures } from "@/lib/candidate-plan";
import { requireAuthUser, requireCandidateUser, requireCompanyUser } from "@/lib/server/api-auth";

export async function requireUserPlanContext(request: Request) {
  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  return {
    user: auth,
    planFeatures: getUserPlanFeatures(auth),
  };
}

export async function requireCandidatePlanContext(request: Request) {
  const auth = await requireCandidateUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  return {
    user: auth,
    planFeatures: getCandidatePlanFeatures(auth),
  };
}

export async function requireCompanyPlanContext(request: Request) {
  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  return {
    user: auth,
    planFeatures: getUserPlanFeatures(auth),
  };
}

export function getCandidatePlanContext(candidate: Pick<CandidateProfile, "plan">) {
  return {
    user: candidate,
    planFeatures: getCandidatePlanFeatures(candidate),
  };
}
