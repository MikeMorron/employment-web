import { qualifiesAsFeaturedVacancy } from "@/lib/utils";
import type { Vacancy } from "@/types/vacancy";

export type VacancyBadgeSignals = {
  isFeatured: boolean;
};

export function getVacancyBadgeSignals(jobs: Vacancy[]) {
  return Object.fromEntries(
    jobs.map((job) => [
      job.id,
      {
        isFeatured: qualifiesAsFeaturedVacancy(job),
      } satisfies VacancyBadgeSignals,
    ]),
  ) as Record<string, VacancyBadgeSignals>;
}
