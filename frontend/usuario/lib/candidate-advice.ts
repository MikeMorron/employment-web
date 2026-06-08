import type { CandidateProfile } from "@/types/profile";

export const DEFAULT_CANDIDATE_ADVICE_MINIMUM_SCORE = 50;

type CandidateAdviceInput = Pick<
  CandidateProfile,
  | "categoriasEnfoque"
  | "rol"
  | "skills"
  | "ubicacion"
  | "locationProfile"
  | "workPreferences"
  | "modalidadTrabajo"
  | "telefono"
  | "cv"
>;

export type CandidateAdviceContext = {
  focusCategories: string[];
  roleFallback: string | null;
  topSkills: string[];
  preferredLocations: string[];
  preferredModality: string | null;
  minimumVisibleScore: number;
  hasPhone: boolean;
  hasCv: boolean;
};

export function getCandidateFocusCategories(candidate: CandidateAdviceInput | null) {
  return (candidate?.categoriasEnfoque ?? [])
    .map((category) => category.trim())
    .filter(Boolean);
}

export function getCandidateRoleFallback(candidate: CandidateAdviceInput | null) {
  const normalized = candidate?.rol?.trim();
  return normalized ? normalized : null;
}

export function getCandidateSkillSignals(candidate: CandidateAdviceInput | null) {
  return (candidate?.skills ?? [])
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function getCandidatePreferredLocations(candidate: CandidateAdviceInput | null) {
  return [
    candidate?.ubicacion,
    candidate?.locationProfile?.city,
    candidate?.locationProfile?.region,
    ...(candidate?.workPreferences?.preferredLocations ?? []),
  ]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

export function getCandidatePreferredModality(candidate: CandidateAdviceInput | null) {
  return candidate?.modalidadTrabajo?.trim() || null;
}

export function getCandidateAdviceContext(
  candidate: CandidateAdviceInput | null,
  minimumVisibleScore = DEFAULT_CANDIDATE_ADVICE_MINIMUM_SCORE,
): CandidateAdviceContext {
  return {
    focusCategories: getCandidateFocusCategories(candidate),
    roleFallback: getCandidateRoleFallback(candidate),
    topSkills: getCandidateSkillSignals(candidate),
    preferredLocations: getCandidatePreferredLocations(candidate),
    preferredModality: getCandidatePreferredModality(candidate),
    minimumVisibleScore,
    hasPhone: Boolean(candidate?.telefono?.trim()),
    hasCv: Boolean(candidate?.cv?.trim()),
  };
}
