"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { apiRequest } from "@/lib/api";
import { clearCachedResource, fetchCachedResource, primeCachedResource } from "@/lib/client/resource-cache";
import type { Vacancy } from "@/types/vacancy";

const SAVED_VACANCIES_EVENT = "talentoco:saved-vacancies-updated";

type SavedVacanciesResponse = {
  ok: boolean;
  savedIds?: string[];
  savedVacancies?: Vacancy[];
};

type SavedVacanciesSnapshot = {
  userId: string;
  savedIds: string[];
  savedVacancies: Vacancy[];
};

export function useSavedVacancies() {
  const { authUser } = useAuthUser();
  const [savedIds, setSavedIdsState] = useState<string[]>([]);
  const [savedVacancies, setSavedVacanciesState] = useState<Vacancy[]>([]);
  const [savedVacanciesLoading, setSavedVacanciesLoading] = useState(true);
  const [pendingSavedIds, setPendingSavedIds] = useState<string[]>([]);
  const savedIdsRef = useRef<string[]>([]);
  const savedMutationVersionRef = useRef(0);

  const applySnapshot = useCallback((snapshot: SavedVacanciesSnapshot) => {
    savedIdsRef.current = snapshot.savedIds;
    setSavedIdsState(snapshot.savedIds);
    setSavedVacanciesState(snapshot.savedVacancies);
    setSavedVacanciesLoading(false);
  }, []);

  const dispatchSnapshot = useCallback((snapshot: SavedVacanciesSnapshot) => {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(new CustomEvent(SAVED_VACANCIES_EVENT, { detail: snapshot }));
  }, []);

  useEffect(() => {
    savedIdsRef.current = savedIds;
  }, [savedIds]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleSavedVacanciesUpdate = (event: Event) => {
      const detail = (event as CustomEvent<SavedVacanciesSnapshot>).detail;
      if (!authUser || authUser.role !== "candidate" || detail.userId !== authUser.id) {
        return;
      }

      applySnapshot(detail);
    };

    window.addEventListener(SAVED_VACANCIES_EVENT, handleSavedVacanciesUpdate as EventListener);

    return () => {
      window.removeEventListener(SAVED_VACANCIES_EVENT, handleSavedVacanciesUpdate as EventListener);
    };
  }, [applySnapshot, authUser]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const startedAtVersion = savedMutationVersionRef.current;

      if (authUser?.role !== "candidate") {
        startTransition(() => {
          setSavedIdsState([]);
          setSavedVacanciesState([]);
          setSavedVacanciesLoading(false);
          setPendingSavedIds([]);
        });
        clearCachedResource("saved-vacancies:");
        if (authUser) {
          dispatchSnapshot({ userId: authUser.id, savedIds: [], savedVacancies: [] });
        }
        return;
      }

      try {
        setSavedVacanciesLoading(true);

        const data = await fetchCachedResource<SavedVacanciesResponse>(
          `saved-vacancies:${authUser.id}`,
          "/api/saved-vacancies",
        );

        if (!cancelled && startedAtVersion === savedMutationVersionRef.current) {
          startTransition(() => {
            const snapshot = {
              userId: authUser.id,
              savedIds: data.savedIds ?? [],
              savedVacancies: data.savedVacancies ?? [],
            };
            applySnapshot(snapshot);
          });
        }
      } catch {
        if (!cancelled) {
          startTransition(() => {
            setSavedIdsState([]);
            setSavedVacanciesState([]);
            setSavedVacanciesLoading(false);
          });
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [applySnapshot, authUser, dispatchSnapshot]);

  const refresh = useCallback(async () => {
    if (authUser?.role !== "candidate") {
      setSavedIdsState([]);
      setSavedVacanciesState([]);
      savedIdsRef.current = [];
      setSavedVacanciesLoading(false);
      setPendingSavedIds([]);
      return;
    }

    setSavedVacanciesLoading(true);
    const response = await apiRequest<SavedVacanciesResponse>("/api/saved-vacancies");
    if (response.ok && response.data?.savedIds) {
      primeCachedResource(`saved-vacancies:${authUser.id}`, response.data);
      const snapshot = {
        userId: authUser.id,
        savedIds: response.data.savedIds,
        savedVacancies: response.data.savedVacancies ?? [],
      };
      applySnapshot(snapshot);
      setPendingSavedIds([]);
      return;
    }
    setSavedVacanciesLoading(false);
  }, [applySnapshot, authUser]);

  const setSavedIds = useCallback(async (updater: string[] | ((current: string[]) => string[])) => {
    const nextSavedIds = typeof updater === "function" ? updater(savedIdsRef.current) : updater;

    if (authUser?.role !== "candidate") {
      return;
    }

    const currentSavedIds = savedIdsRef.current;
    const isRemoving = nextSavedIds.length < currentSavedIds.length;
    const changedIds = Array.from(
      new Set([
        ...currentSavedIds.filter((id) => !nextSavedIds.includes(id)),
        ...nextSavedIds.filter((id) => !currentSavedIds.includes(id)),
      ]),
    );

    savedMutationVersionRef.current += 1;

    savedIdsRef.current = nextSavedIds;
    setSavedIdsState(nextSavedIds);
    setPendingSavedIds((current) => Array.from(new Set([...current, ...changedIds])));
    if (isRemoving) {
      setSavedVacanciesState((current) =>
        current.filter((vacancy) => nextSavedIds.includes(vacancy.id)),
      );
    }

    const response = await apiRequest<SavedVacanciesResponse>("/api/saved-vacancies", {
      method: "PUT",
      body: JSON.stringify({ savedIds: nextSavedIds }),
    });

    if (response.ok && response.data?.savedIds) {
      primeCachedResource(`saved-vacancies:${authUser.id}`, response.data);
      const snapshot = {
        userId: authUser.id,
        savedIds: response.data.savedIds,
        savedVacancies: response.data.savedVacancies ?? [],
      };
      applySnapshot(snapshot);
      dispatchSnapshot(snapshot);
      setPendingSavedIds((current) => current.filter((id) => !changedIds.includes(id)));
      return;
    }

    setPendingSavedIds((current) => current.filter((id) => !changedIds.includes(id)));
    void refresh();
  }, [applySnapshot, authUser, dispatchSnapshot, refresh]);

  const toggleSave = useCallback((id: string) => {
    if (pendingSavedIds.includes(id)) {
      return;
    }

    void setSavedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }, [pendingSavedIds, setSavedIds]);

  return {
    savedIds,
    savedVacancies,
    savedVacanciesLoading,
    pendingSavedIds,
    setSavedIds,
    toggleSave,
    refreshSavedVacancies: refresh,
  };
}
