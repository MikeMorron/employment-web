"use client";

import { useEffect, useState } from "react";

export const AUTO_REFRESH_MS = 10 * 60 * 1000;
export const MANUAL_REFRESH_WINDOW_MS = 60 * 60 * 1000;
export const MANUAL_REFRESH_LIMIT = 3;

export type RefreshState = {
  lastFetchedAt: number;
  manualRefreshes: number[];
};

export function getRefreshStorageKey(companyId: string) {
  return `company-dashboard-refresh:${companyId}`;
}

export function readRefreshState(companyId: string): RefreshState {
  if (typeof window === "undefined") {
    return { lastFetchedAt: Date.now(), manualRefreshes: [] };
  }

  try {
    const raw = window.localStorage.getItem(getRefreshStorageKey(companyId));
    if (!raw) {
      return { lastFetchedAt: Date.now(), manualRefreshes: [] };
    }

    const parsed = JSON.parse(raw) as Partial<RefreshState>;
    return {
      lastFetchedAt: typeof parsed.lastFetchedAt === "number" ? parsed.lastFetchedAt : Date.now(),
      manualRefreshes: Array.isArray(parsed.manualRefreshes) ? parsed.manualRefreshes.filter((value): value is number => typeof value === "number") : [],
    };
  } catch {
    return { lastFetchedAt: Date.now(), manualRefreshes: [] };
  }
}

export function writeRefreshState(companyId: string, state: RefreshState) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(getRefreshStorageKey(companyId), JSON.stringify(state));
  }
}

export function formatRemaining(ms: number) {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60_000));
  if (totalMinutes >= 60) {
    return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  }

  return `${totalMinutes} min`;
}

export function useRefreshClock() {
  const [clockTick, setClockTick] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setClockTick(Date.now()), 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  return clockTick;
}
