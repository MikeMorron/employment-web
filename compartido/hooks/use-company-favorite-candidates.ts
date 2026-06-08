"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { apiRequest } from "@/lib/api";

type CompanyPreferencesResponse = {
  ok: boolean;
  favoriteCandidateIds?: string[];
  message?: string;
};

export function useCompanyFavoriteCandidates() {
  const { authUser } = useAuthUser();
  const [favoriteCandidateIds, setFavoriteCandidateIds] = useState<string[]>([]);
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<string[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const idsRef = useRef<string[]>([]);

  useEffect(() => {
    idsRef.current = favoriteCandidateIds;
  }, [favoriteCandidateIds]);

  const refreshFavoriteCandidates = useCallback(async () => {
    if (authUser?.role !== "company") {
      startTransition(() => {
        setFavoriteCandidateIds([]);
        setPendingFavoriteIds([]);
        setFavoritesLoading(false);
      });
      return;
    }

    setFavoritesLoading(true);
    const response = await apiRequest<CompanyPreferencesResponse>("/api/company/preferences");
    if (response.ok) {
      startTransition(() => {
        setFavoriteCandidateIds(response.data?.favoriteCandidateIds ?? []);
        setPendingFavoriteIds([]);
        setFavoritesLoading(false);
      });
      return;
    }

    setFavoritesLoading(false);
  }, [authUser?.role]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (authUser?.role !== "company") {
        if (!cancelled) {
          startTransition(() => {
            setFavoriteCandidateIds([]);
            setPendingFavoriteIds([]);
            setFavoritesLoading(false);
          });
        }
        return;
      }

      setFavoritesLoading(true);
      const response = await apiRequest<CompanyPreferencesResponse>("/api/company/preferences");
      if (!cancelled && response.ok) {
        startTransition(() => {
          setFavoriteCandidateIds(response.data?.favoriteCandidateIds ?? []);
          setPendingFavoriteIds([]);
          setFavoritesLoading(false);
        });
        return;
      }

      if (!cancelled) {
        setFavoritesLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [authUser?.role]);

  const toggleFavoriteCandidate = useCallback(async (candidateId: string) => {
    if (authUser?.role !== "company" || pendingFavoriteIds.includes(candidateId)) {
      return false;
    }

    const previous = idsRef.current;
    const nextIds = previous.includes(candidateId)
      ? previous.filter((id) => id !== candidateId)
      : [...previous, candidateId];

    idsRef.current = nextIds;
    setFavoriteCandidateIds(nextIds);
    setPendingFavoriteIds((current) => [...current, candidateId]);

    const response = await apiRequest<CompanyPreferencesResponse>("/api/company/preferences", {
      method: "PATCH",
      body: JSON.stringify({ favoriteCandidateIds: nextIds }),
    });

    setPendingFavoriteIds((current) => current.filter((id) => id !== candidateId));

    if (response.ok) {
      const resolvedIds = response.data?.favoriteCandidateIds ?? nextIds;
      idsRef.current = resolvedIds;
      setFavoriteCandidateIds(resolvedIds);
      return true;
    }

    idsRef.current = previous;
    setFavoriteCandidateIds(previous);
    return response.data?.message ?? false;
  }, [authUser?.role, pendingFavoriteIds]);

  return {
    favoriteCandidateIds,
    pendingFavoriteIds,
    favoritesLoading,
    refreshFavoriteCandidates,
    toggleFavoriteCandidate,
  };
}
