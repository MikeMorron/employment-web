"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { CandidateApplicationNotification } from "@/types/notifications";

export function useApplicationNotifications(userId: string | null | undefined) {
  const [notifications, setNotifications] = useState<CandidateApplicationNotification[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!userId) {
        startTransition(() => {
          setNotifications([]);
        });
        return;
      }

      const response = await apiRequest<{
        ok: boolean;
        applicationNotifications?: CandidateApplicationNotification[];
      }>("/api/preferences/notifications");

      if (!cancelled && response.ok && response.data?.applicationNotifications) {
        startTransition(() => {
          setNotifications(response.data!.applicationNotifications!);
        });
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    const response = await apiRequest<{
      ok: boolean;
      applicationNotifications?: CandidateApplicationNotification[];
    }>("/api/preferences/notifications");

    if (response.ok && response.data?.applicationNotifications) {
      setNotifications(response.data.applicationNotifications);
    }
  }, [userId]);

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [notifications],
  );

  const unreadCount = sortedNotifications.filter((item) => !item.read).length;

  const persistReadIds = useCallback(async (readIds: string[]) => {
    await apiRequest("/api/preferences/notifications", {
      method: "PATCH",
      body: JSON.stringify({ readIds }),
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((current) => {
      const next = current.map((item) => (item.id === id ? { ...item, read: true } : item));
      void persistReadIds(next.filter((item) => item.read).map((item) => item.id));
      return next;
    });
  }, [persistReadIds]);

  const markAllAsRead = useCallback(() => {
    setNotifications((current) => {
      const next = current.map((item) => ({ ...item, read: true }));
      void persistReadIds(next.map((item) => item.id));
      return next;
    });
  }, [persistReadIds]);

  return {
    notifications: sortedNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshApplicationNotifications: refresh,
  };
}
