import type { RetentionTaskRecord } from "@/types/product";
import type { AppUser, CandidateProfile } from "@/types/profile";
import type { ProductState } from "@/lib/server/product-engine-notification-utils";
import { buildCandidateNotifications } from "@/lib/server/candidate/product-engine-notifications";
import {
  buildCompanyNotifications,
  getCompanyApplicants,
} from "@/lib/server/company/product-engine-notifications";

function isCandidate(user: AppUser): user is CandidateProfile {
  return user.role === "candidate";
}

export function buildDerivedNotifications(
  state: ProductState,
  user: AppUser,
  retentionTasks: RetentionTaskRecord[],
) {
  if (isCandidate(user)) {
    return buildCandidateNotifications(state, user, retentionTasks);
  }

  return buildCompanyNotifications(state, user, retentionTasks);
}

export { getCompanyApplicants };
