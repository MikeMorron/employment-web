import { canCandidateAccessVacancy } from "@/lib/candidate-plan";
import type { CandidateProfile } from "@/types/profile";
import type { Vacancy } from "@/types/vacancy";

export function buildCandidateVacancyFeed(
  vacancies: Vacancy[],
  candidate?: CandidateProfile | null,
) {
  const unified = vacancies.filter((job) => job.publicadorTipo !== "persona");

  if (!candidate) {
    return unified;
  }

  return unified.filter((job) => canCandidateAccessVacancy(candidate, job));
}
