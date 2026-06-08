"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const HISTORY_KEY = "ts_route_history";
const MAX_ENTRIES = 10;

export function RouteHistoryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(HISTORY_KEY);
      const history: string[] = raw ? JSON.parse(raw) : [];
      const updated = [pathname, ...history.filter((p) => p !== pathname)].slice(
        0,
        MAX_ENTRIES,
      );
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // no-op
    }
  }, [pathname]);

  return null;
}
