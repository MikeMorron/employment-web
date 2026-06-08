"use client";

import { startTransition, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useAuthUser } from "@/hooks/use-auth-user";
import type { ActivationSummary, RetentionTaskRecord } from "@/types/product";

type ActivationResponse = {
  ok: boolean;
  activationSummary?: ActivationSummary;
  retentionTasks?: RetentionTaskRecord[];
};

export function useProductActivation() {
  const { authUser } = useAuthUser();
  const userId = authUser?.id ?? null;
  const [activationSummary, setActivationSummary] = useState<ActivationSummary | null>(null);
  const [retentionTasks, setRetentionTasks] = useState<RetentionTaskRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!userId) {
        startTransition(() => {
          setActivationSummary(null);
          setRetentionTasks([]);
        });
        return;
      }

      const response = await apiRequest<ActivationResponse>("/api/product/activation");
      if (!cancelled && response.ok) {
        startTransition(() => {
          setActivationSummary(response.data?.activationSummary ?? null);
          setRetentionTasks(response.data?.retentionTasks ?? []);
        });
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return {
    activationSummary,
    retentionTasks,
  };
}
