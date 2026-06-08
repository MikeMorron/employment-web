"use client";

import { startTransition, useEffect, useState } from "react";
import { apiRequest } from "@/compartido/lib/api";
import type { CandidateProfile } from "@/compartido/types/profile";

type CompanyCandidatesResponse = {
  ok: boolean;
  candidates?: CandidateProfile[];
};

export function useCompanyCandidates(companyId: string | null | undefined) {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!companyId) {
        startTransition(() => setCandidates([]));
        return;
      }

      const response = await apiRequest<CompanyCandidatesResponse>("/api/company/candidates");
      if (!cancelled && response.ok) {
        startTransition(() => setCandidates(response.data?.candidates ?? []));
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return candidates;
}
