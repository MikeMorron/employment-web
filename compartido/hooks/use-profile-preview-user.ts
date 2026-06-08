"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/compartido/lib/api";
import type { AppUser } from "@/compartido/types/profile";

export function useProfilePreviewUser() {
  const searchParams = useSearchParams();
  const previewId = searchParams.get("preview");
  const [previewUser, setPreviewUser] = useState<AppUser | null>(null);
  const [previewResolved, setPreviewResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!previewId) {
        setPreviewUser(null);
        setPreviewResolved(true);
        return;
      }

      setPreviewResolved(false);
      const response = await apiRequest<{ ok: boolean; user?: AppUser }>(`/api/profiles/${previewId}`);
      if (!cancelled) {
        setPreviewUser(response.ok ? (response.data?.user ?? null) : null);
        setPreviewResolved(true);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [previewId]);

  return {
    previewId,
    previewUser,
    previewResolved,
  };
}
