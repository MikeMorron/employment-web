"use client";

import { startTransition, useEffect, useState } from "react";
import { apiRequest } from "@/compartido/lib/api";
import type { AppUser } from "@/compartido/types/profile";
import type { CompanyChatCandidateDirectoryItem } from "@/compartido/types/chat";

type CandidateDirectoryResponse = {
  ok: boolean;
  candidates?: CompanyChatCandidateDirectoryItem[];
};

export function useCompanyChatDirectory(authUser: AppUser | null) {
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [companyCandidates, setCompanyCandidates] = useState<CompanyChatCandidateDirectoryItem[]>([]);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    if (authUser?.role !== "company") {
      startTransition(() => {
        setCompanyCandidates([]);
        setDirectoryLoading(false);
      });
      return;
    }

    let cancelled = false;

    const run = async () => {
      setDirectoryLoading(true);
      const response = await apiRequest<CandidateDirectoryResponse>("/api/chat/candidates");
      if (cancelled) {
        return;
      }

      startTransition(() => {
        setCompanyCandidates(response.ok ? response.data?.candidates ?? [] : []);
        setDirectoryLoading(false);
      });
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id, authUser?.role, refreshNonce]);

  return {
    companyCandidates,
    directoryLoading,
    refreshCompanyCandidates() {
      setRefreshNonce((current) => current + 1);
    },
  };
}
