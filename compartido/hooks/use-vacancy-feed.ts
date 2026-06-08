"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { clearCachedResource, fetchCachedResource, primeCachedResource } from "@/lib/client/resource-cache";
import type { Vacancy } from "@/types/vacancy";

type VacancyFeedResponse = {
  ok: boolean;
  vacancies?: Vacancy[];
};

export function useVacancyFeed(cacheKey = "vacancy-feed") {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const data = await fetchCachedResource<VacancyFeedResponse>(
          cacheKey,
          "/api/vacancies",
        );

        if (!cancelled) {
          startTransition(() => {
            setVacancies(data.vacancies ?? []);
          });
        }

        const freshResponse = await apiRequest<VacancyFeedResponse>("/api/vacancies");
        if (!cancelled && freshResponse.ok && freshResponse.data?.vacancies) {
          primeCachedResource(cacheKey, freshResponse.data);
          startTransition(() => {
            setVacancies(freshResponse.data?.vacancies ?? []);
          });
        }
      } catch {
        if (!cancelled) {
          startTransition(() => {
            setVacancies([]);
          });
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [cacheKey]);

  const refresh = useCallback(async () => {
    const response = await apiRequest<VacancyFeedResponse>("/api/vacancies");

    if (response.ok && response.data?.vacancies) {
      primeCachedResource(cacheKey, response.data);
      setVacancies(response.data.vacancies);
      return response.data.vacancies;
    }

    return [];
  }, [cacheKey]);

  const clear = useCallback(() => {
    clearCachedResource(cacheKey);
    setVacancies([]);
  }, [cacheKey]);

  return {
    vacancies,
    refreshVacancyFeed: refresh,
    clearVacancyFeed: clear,
  };
}
