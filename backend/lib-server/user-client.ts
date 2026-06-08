import {
  type AppUser,
} from "@/types/profile";
import {
  sanitizeCandidateForClient,
  sanitizeCandidatePublicProfile,
  sanitizeOwnCandidateForClient,
} from "@/lib/server/candidate/user-client";
import {
  sanitizeAdminForClient,
  sanitizeOwnAdminForClient,
} from "@/lib/server/admin/user-client";
import {
  sanitizeCompanyForClient,
  sanitizeOwnCompanyForClient,
} from "@/lib/server/company/user-client";

export function sanitizeUserForClient<T extends AppUser>(user: T): T {
  if (user.role === "candidate") {
    return sanitizeCandidateForClient(user) as T;
  }

  if (user.role === "admin") {
    return sanitizeAdminForClient(user) as T;
  }

  return sanitizeCompanyForClient(user) as T;
}

export function sanitizeOwnUserForClient<T extends AppUser>(user: T): T {
  if (user.role === "candidate") {
    return sanitizeOwnCandidateForClient(user) as T;
  }

  if (user.role === "admin") {
    return sanitizeOwnAdminForClient(user) as T;
  }

  return sanitizeOwnCompanyForClient(user) as T;
}

export { sanitizeCandidatePublicProfile };
