import type { AppState } from "@/lib/server/app-state";
import { isCandidateUser, sanitizeUserForClient } from "@/lib/server/app-state";
import type { CandidateProfile } from "@/types/profile";

export function isDiscoverableCandidateProfile(profile: CandidateProfile) {
  return profile.tipoRegistro === "persona" && profile.profileVisibility !== "private";
}

export function getCompanyCandidatePool(state: AppState) {
  return state.users
    .filter(isCandidateUser)
    .filter(isDiscoverableCandidateProfile)
    .map((candidate) => sanitizeUserForClient(candidate));
}

export function getCompanyCandidateMap(state: AppState) {
  return new Map(
    state.users
      .filter(isCandidateUser)
      .map((candidate) => [candidate.id, sanitizeUserForClient(candidate)] as const),
  );
}
