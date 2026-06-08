"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { vacancyCategories } from "@/data/colombia-locations";
import { apiRequest } from "@/lib/api";
import { clearCachedResource, fetchCachedResource, primeCachedResource } from "@/lib/client/resource-cache";
import type { Vacancy } from "@/types/vacancy";

const searchableCategoryOptions = vacancyCategories.filter((category) => category !== "Todas");

function normalizeSearchCategory(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return searchableCategoryOptions.find((category) => category.toLowerCase() === normalized) ?? null;
}

export function useCategoryInterest(query: string) {
  const { authUser } = useAuthUser();
  const authUserId = authUser?.id ?? null;
  const [detailCategoryClicks, setDetailCategoryClicks] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!authUserId) {
        startTransition(() => {
          setDetailCategoryClicks({});
        });
        clearCachedResource("category-interest:");
        return;
      }

      try {
        const data = await fetchCachedResource<{ ok: boolean; clicks?: Record<string, number> }>(
          `category-interest:${authUserId}`,
          "/api/preferences/category-interest",
        );

        if (!cancelled) {
          startTransition(() => {
            setDetailCategoryClicks(data.clicks ?? {});
          });
        }
      } catch {
        if (!cancelled) {
          startTransition(() => {
            setDetailCategoryClicks({});
          });
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [authUserId]);

  const qualifiedInterestCategories = useMemo(
    () =>
      Object.entries(detailCategoryClicks)
        .filter(
          ([category, clicks]) =>
            clicks >= 5 &&
            searchableCategoryOptions.includes(
              category as (typeof searchableCategoryOptions)[number],
            ),
        )
        .map(([category]) => category),
    [detailCategoryClicks],
  );

  const registerDetailClick = (job: Vacancy) => {
    const matchedQueryCategory = normalizeSearchCategory(query);

    if (!matchedQueryCategory || !(job.etiquetas ?? []).includes(matchedQueryCategory)) {
      return;
    }

    setDetailCategoryClicks((current) => {
      const next = {
        ...current,
        [matchedQueryCategory]: (current[matchedQueryCategory] ?? 0) + 1,
      };
      if (authUserId) {
        primeCachedResource(`category-interest:${authUserId}`, { ok: true, clicks: next });
      }
      return next;
    });

    if (!authUserId) {
      return;
    }

    void apiRequest("/api/preferences/category-interest", {
      method: "PATCH",
      body: JSON.stringify({ category: matchedQueryCategory, increment: 1 }),
    });
  };

  return {
    detailCategoryClicks,
    qualifiedInterestCategories,
    registerDetailClick,
  };
}
