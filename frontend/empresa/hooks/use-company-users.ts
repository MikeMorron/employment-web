"use client";

import { startTransition, useEffect, useState } from "react";
import { apiRequest } from "@/compartido/lib/api";
import type { RegisteredUserPreview } from "@/compartido/types/admin";

type CompanyUsersResponse = {
  ok: boolean;
  users?: RegisteredUserPreview[];
};

export function useCompanyUsers(companyId: string | null | undefined) {
  const [users, setUsers] = useState<RegisteredUserPreview[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!companyId) {
        startTransition(() => setUsers([]));
        return;
      }

      const response = await apiRequest<CompanyUsersResponse>("/api/company/users");
      if (!cancelled && response.ok) {
        startTransition(() => setUsers(response.data?.users ?? []));
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return users;
}
