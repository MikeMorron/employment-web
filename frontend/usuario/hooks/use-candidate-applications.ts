"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { isActiveCandidateApplicationStatus } from "@/lib/application-status";
import { apiRequest } from "@/lib/api";
import { clearCachedResource, fetchCachedResource, primeCachedResource } from "@/lib/client/resource-cache";
import { useVacancyFeed } from "@/hooks/use-vacancy-feed";
import { getCandidateJobMatch } from "@/lib/matching";
import { qualifiesAsFeaturedVacancy } from "@/lib/utils";
import type { CandidateProfile } from "@/types/profile";
import type { Vacancy } from "@/types/vacancy";
import type { CandidateApplication, CandidateApplicationStatus } from "@/types/workflows";

type CandidateSearchHistoryEntry = {
  query: string;
  searchedAt: string;
  category?: string;
  modality?: string;
  department?: string;
  municipality?: string;
};

const STATUS_SEQUENCE: CandidateApplicationStatus[] = [
  "application_submitted",
  "application_received",
  "in_review",
  "preselected",
  "in_evaluation",
  "shortlisted",
  "in_decision",
  "offer_sent",
];

function buildLatestApplicationsByJobId(applications: CandidateApplication[]) {
  return applications.reduce<Record<string, CandidateApplication>>((accumulator, application) => {
    const current = accumulator[application.jobId];

    if (!current) {
      accumulator[application.jobId] = application;
      return accumulator;
    }

    const currentTimestamp = new Date(current.lastUpdatedAt || current.appliedAt).getTime();
    const nextTimestamp = new Date(application.lastUpdatedAt || application.appliedAt).getTime();

    if (nextTimestamp >= currentTimestamp) {
      accumulator[application.jobId] = application;
    }

    return accumulator;
  }, {});
}

function tokenizeSearchHistory(searches: CandidateSearchHistoryEntry[]) {
  return Array.from(
    new Set(
      searches
        .flatMap((entry) => [
          entry.query,
          entry.category,
          entry.modality,
          entry.department,
          entry.municipality,
        ])
        .filter(Boolean)
        .flatMap((value) =>
          String(value)
            .toLowerCase()
            .split(/[^a-z0-9áéíóúñü+#./-]+/i)
            .map((token) => token.trim())
            .filter((token) => token.length >= 3),
        ),
    ),
  );
}

function getSearchInterestScore(job: Vacancy, searchTokens: string[]) {
  if (searchTokens.length === 0) {
    return 0;
  }

  const searchableText = [
    job.titulo,
    job.empresa,
    job.ubicacion,
    job.modalidad,
    job.descripcion,
    ...(job.etiquetas ?? []),
    ...(job.requiredSkills ?? []),
    ...(job.optionalSkills ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let matchedTokens = 0;
  for (const token of searchTokens) {
    if (searchableText.includes(token)) {
      matchedTokens += 1;
    }
  }

  return Math.min(matchedTokens * 6, 30);
}

export function useCandidateApplications(candidate: CandidateProfile | null) {
  const { vacancies } = useVacancyFeed(
    candidate ? `vacancy-feed:${candidate.id}` : "vacancy-feed:guest",
  );
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [archivedApplications, setArchivedApplications] = useState<CandidateApplication[]>([]);
  const [recentSearches, setRecentSearches] = useState<CandidateSearchHistoryEntry[]>([]);
  const [recommendationSeed] = useState(() => Math.floor(Date.now() / 86_400_000));

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!candidate) {
        startTransition(() => {
          setApplications([]);
          setArchivedApplications([]);
        });
        clearCachedResource("applications:");
        return;
      }

      try {
        const data = await fetchCachedResource<{ ok: boolean; applications?: CandidateApplication[]; archivedApplications?: CandidateApplication[] }>(
          `applications:${candidate.id}`,
          "/api/applications",
        );

        if (!cancelled) {
          startTransition(() => {
            setApplications(data.applications ?? []);
            setArchivedApplications(data.archivedApplications ?? []);
          });
        }
      } catch {
        if (!cancelled) {
          startTransition(() => {
            setApplications([]);
            setArchivedApplications([]);
          });
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [candidate]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!candidate) {
        startTransition(() => {
          setRecentSearches([]);
        });
        return;
      }

      const response = await apiRequest<{
        ok: boolean;
        searches?: CandidateSearchHistoryEntry[];
      }>("/api/preferences/search-history");

      if (!cancelled && response.ok) {
        startTransition(() => {
          setRecentSearches(response.data?.searches ?? []);
        });
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [candidate]);

  const refresh = useCallback(async () => {
    if (!candidate) {
      setApplications([]);
      return;
    }

    const response = await apiRequest<{ ok: boolean; applications?: CandidateApplication[]; archivedApplications?: CandidateApplication[] }>("/api/applications");
    if (response.ok && response.data?.applications) {
      primeCachedResource(`applications:${candidate.id}`, response.data);
      setApplications(response.data.applications);
      setArchivedApplications(response.data.archivedApplications ?? []);
    }
  }, [candidate]);

  const activeApplications = useMemo(
    () => applications.filter((application) => isActiveCandidateApplicationStatus(application.status)),
    [applications],
  );

  const appliedJobIds = useMemo(
    () => activeApplications.map((application) => application.jobId),
    [activeApplications],
  );

  const applicationsByJobId = useMemo(
    () => buildLatestApplicationsByJobId(activeApplications),
    [activeApplications],
  );

  const latestApplicationsByJobId = useMemo(
    () => buildLatestApplicationsByJobId(applications),
    [applications],
  );

  const applyToJob = useCallback(async (job: Vacancy) => {
    if (!candidate) {
      return false;
    }

    const response = await apiRequest<{ ok: boolean; message?: string; application?: CandidateApplication; applications?: CandidateApplication[]; archivedApplications?: CandidateApplication[] }>(
      "/api/applications",
      {
        method: "POST",
        body: JSON.stringify({ jobId: job.id }),
      },
    );

    if (response.ok && response.data?.applications) {
      primeCachedResource(`applications:${candidate.id}`, response.data);
      setApplications(response.data.applications);
      setArchivedApplications(response.data.archivedApplications ?? []);
      return response.data.application ?? true;
    }

    return response.data?.message ?? false;
  }, [candidate]);

  const withdrawApplication = useCallback(async (applicationId: string) => {
    const response = await apiRequest<{ ok: boolean; application?: CandidateApplication }>(`/api/applications/${applicationId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "withdraw" }),
    });

    if (response.ok && response.data?.application) {
      const archivedApplication = response.data.application;
      setApplications((current) =>
        {
          const next = current.map((application) =>
          application.id === archivedApplication.id ? archivedApplication : application,
          );
          if (candidate) {
            primeCachedResource(`applications:${candidate.id}`, {
              ok: true,
              applications: next,
              archivedApplications: [
                ...archivedApplications.filter(
                  (application) => application.id !== archivedApplication.id,
                ),
                archivedApplication,
              ],
            });
          }
          return next;
        },
      );
      setArchivedApplications((current) => {
        const next = [...current.filter((application) => application.id !== response.data!.application!.id), response.data!.application!];
        return next.filter((application) =>
          ["withdrawn", "rejected", "not_selected", "process_closed", "vacancy_cancelled", "offer_rejected"].includes(String(application.status).toLowerCase()),
        );
      });
    }
  }, [archivedApplications, candidate]);

  const advanceApplication = useCallback(async (applicationId: string) => {
    setApplications((current) => {
      const existing = current.find((application) => application.id === applicationId);
      if (!existing || !isActiveCandidateApplicationStatus(existing.status)) {
        return current;
      }

      const currentIndex = STATUS_SEQUENCE.indexOf(existing.status);
      const nextStatus =
        currentIndex >= 0 && currentIndex < STATUS_SEQUENCE.length - 1
          ? STATUS_SEQUENCE[currentIndex + 1]
          : existing.status;

      return current.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              status: nextStatus,
              lastUpdatedAt: new Date().toISOString(),
            }
          : application,
      );
    });
  }, []);

  const seededRecommendations = useMemo(() => {
    if (!candidate) {
      return [];
    }

    const appliedJobIdSet = new Set(appliedJobIds);
    const searchTokens = tokenizeSearchHistory(recentSearches);

    const candidates = vacancies
      .filter(
        (job) =>
          job.publicadorTipo === "empresa" &&
          (job.destacada === true || qualifiesAsFeaturedVacancy(job)) &&
          !appliedJobIdSet.has(job.id),
      )
      .map((job) => ({
        job,
        score:
          getCandidateJobMatch(candidate, job).visibleScore +
          getSearchInterestScore(job, searchTokens),
      }))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return (left.job.diasDesdePublicacion ?? Number.MAX_SAFE_INTEGER) -
          (right.job.diasDesdePublicacion ?? Number.MAX_SAFE_INTEGER);
      })
      .slice(0, 6);

    if (candidates.length === 0) {
      return [];
    }

    return [candidates[recommendationSeed % candidates.length]!.job];
  }, [appliedJobIds, candidate, recentSearches, recommendationSeed, vacancies]);

  return {
    applications,
    archivedApplications,
    applicationsByJobId,
    latestApplicationsByJobId,
    appliedJobIds,
    seededRecommendations,
    applyToJob,
    withdrawApplication,
    advanceApplication,
    refreshCandidateApplications: refresh,
  };
}
