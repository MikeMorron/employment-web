"use client";

import { useMemo } from "react";
import { canCandidateAccessVacancy, getPlanAwareCandidateMatchResult } from "@/lib/candidate-plan";
import { getCandidateJobMatch } from "@/lib/matching";
import { getVacancyBadgeSignals } from "@/lib/vacancy-popularity";
import {
  maxDays,
  getOccupationMatchScore,
  getVacancyPriority,
  getVacancySalaryFloorCop,
  hasUrgentTag,
  matchesCategoryFilter,
  matchesSalaryFilter,
  minExperience,
  type FilterDraft,
} from "@/components/vacancies/job-dashboard-utils";
import type { CandidateProfile } from "@/types/profile";
import type { MatchResult } from "@/types/matching";
import type { Vacancy } from "@/types/vacancy";

type DashboardSort =
  | "relevancia"
  | "mi-ocupacion"
  | "recientes"
  | "antiguas"
  | "mejor-paga"
  | "alta-demanda";

type UseJobDashboardFeedInput = {
  vacancyFeed: Vacancy[];
  candidateViewer: CandidateProfile | null;
  appliedFilters: FilterDraft;
  query: string;
  sortBy: DashboardSort;
  occupationTerms: string[];
};

function getSearchableVacancyText(job: Vacancy) {
  return [
    job.titulo,
    job.empresa,
    job.ubicacion,
    job.departamento,
    job.municipio,
    job.modalidad,
    job.descripcion,
    job.fuente,
    ...(job.etiquetas ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildJobMatchResults(candidateViewer: CandidateProfile | null, jobs: Vacancy[]) {
  if (!candidateViewer) {
    return {};
  }

  return Object.fromEntries(
    jobs.map((job) => [
      job.id,
      getCandidateJobMatch(candidateViewer, job, {
        ranking: {
          metadata: {
            isPublishedRecently: (job.diasDesdePublicacion ?? maxDays) <= 14,
            isRecentlyActive: true,
            isEntityActive: true,
            profileCompleteness:
              [job.descripcion, job.ubicacion, job.salario || job.salarioMinimoMillones, job.modalidad]
                .filter(Boolean)
                .length / 4,
          },
          candidate: candidateViewer,
          surface: "candidate_feed",
        },
      }),
    ]),
  ) as Record<string, MatchResult>;
}

export function useJobDashboardFeed({
  vacancyFeed,
  candidateViewer,
  appliedFilters,
  query,
  sortBy,
  occupationTerms,
}: UseJobDashboardFeedInput) {
  const allJobs = useMemo(() => vacancyFeed, [vacancyFeed]);

  const discoverableJobs = useMemo(() => {
    if (!candidateViewer) {
      return allJobs;
    }

    return allJobs.filter((job) => canCandidateAccessVacancy(candidateViewer, job));
  }, [allJobs, candidateViewer]);

  const jobMatchResults = useMemo(
    () => buildJobMatchResults(candidateViewer, discoverableJobs),
    [candidateViewer, discoverableJobs],
  );

  const jobRankScores = useMemo(() => {
    if (!candidateViewer) {
      return {};
    }

    return Object.fromEntries(
      discoverableJobs.map((job) => {
        const result = jobMatchResults[job.id];
        return [job.id, result?.rankingScore ?? 0];
      }),
    ) as Record<string, number>;
  }, [candidateViewer, discoverableJobs, jobMatchResults]);

  const badgeSignalsByJobId = useMemo(
    () => getVacancyBadgeSignals(allJobs),
    [allJobs],
  );

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return discoverableJobs
      .filter((job) => {
        const matchesQuery = !normalizedQuery || getSearchableVacancyText(job).includes(normalizedQuery);
        const matchesModality =
          appliedFilters.modalidad === "Todo" || job.modalidad === appliedFilters.modalidad;
        const matchesUrgent =
          !appliedFilters.urgente || hasUrgentTag(job.etiquetas);
        const matchesDepartment =
          appliedFilters.departamento === "Todos" || job.departamento === appliedFilters.departamento;
        const matchesMunicipality =
          appliedFilters.municipio === "Todos" || job.municipio === appliedFilters.municipio;
        const matchesCategory = matchesCategoryFilter(appliedFilters.categoria, job);
        const matchesSalary = matchesSalaryFilter(job, appliedFilters.salario);
        const matchesExperience =
          (job.experienciaMinimaAnos ?? minExperience) <= appliedFilters.experiencia;

        return (
          matchesQuery &&
          matchesModality &&
          matchesUrgent &&
          matchesDepartment &&
          matchesMunicipality &&
          matchesCategory &&
          matchesSalary &&
          matchesExperience
        );
      })
      .sort((a, b) => {
        if (sortBy === "mi-ocupacion") {
          const occupationDifference =
            getOccupationMatchScore(b, occupationTerms) -
            getOccupationMatchScore(a, occupationTerms);

          if (occupationDifference !== 0) {
            return occupationDifference;
          }
        }

        if (sortBy === "recientes") {
          return (a.diasDesdePublicacion ?? maxDays) - (b.diasDesdePublicacion ?? maxDays);
        }

        if (sortBy === "antiguas") {
          return (b.diasDesdePublicacion ?? maxDays) - (a.diasDesdePublicacion ?? maxDays);
        }

        if (sortBy === "mejor-paga") {
          return (getVacancySalaryFloorCop(b) ?? 0) - (getVacancySalaryFloorCop(a) ?? 0);
        }

        if (sortBy === "alta-demanda") {
          return (b.aplicantes ?? 0) - (a.aplicantes ?? 0);
        }

        const priorityDifference = getVacancyPriority(a) - getVacancyPriority(b);
        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        const rankDifference = (jobRankScores[b.id] ?? 0) - (jobRankScores[a.id] ?? 0);
        if (rankDifference !== 0) {
          return rankDifference;
        }

        return (a.diasDesdePublicacion ?? maxDays) - (b.diasDesdePublicacion ?? maxDays);
      });
  }, [appliedFilters, discoverableJobs, jobRankScores, occupationTerms, query, sortBy]);

  const filteredJobsKey = useMemo(
    () => filteredJobs.map((job) => job.id).join("|"),
    [filteredJobs],
  );
  const previewJobs = useMemo(() => filteredJobs.slice(0, 3), [filteredJobs]);
  const lockedPreviewJobs = useMemo(() => filteredJobs.slice(3, 9), [filteredJobs]);
  const lockedJobsCount = Math.max(filteredJobs.length - previewJobs.length, 0);

  return {
    allJobs,
    discoverableJobs,
    filteredJobs,
    filteredJobsKey,
    previewJobs,
    lockedPreviewJobs,
    lockedJobsCount,
    jobMatchResults,
    selectedJobMatchFor(candidate: CandidateProfile | null, job: Vacancy | null) {
      if (!candidate || !job || !jobMatchResults[job.id]) {
        return null;
      }

      return getPlanAwareCandidateMatchResult(jobMatchResults[job.id], candidate);
    },
    badgeSignalsByJobId,
  };
}
