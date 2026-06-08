"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { apiRequest } from "@/lib/api";
import { clearCachedResource, fetchCachedResource, primeCachedResource } from "@/lib/client/resource-cache";
import {
  buildNextReadNotificationIds,
  countUnreadNotifications,
  filterVisibleReadNotificationIds,
} from "@/lib/notifications/read-state";
import type { ProductNotification } from "@/types/notifications";
import type { NotificationCenterItem, NotificationCenterPreferences } from "@/types/notification-center";

function toNotificationCenterItem(item: ProductNotification): NotificationCenterItem {
  const isCompanyOffer = item.metadata?.inboxKind === "chat_process_invite";
  const inviteId = typeof item.metadata?.inviteId === "string" ? item.metadata.inviteId : undefined;

  return {
    id: item.id,
    type:
      isCompanyOffer
        ? "companyOffer"
        : item.category === "workflow"
        ? "application"
        : item.category === "insight"
          ? "trending"
          : "anuncio",
    title: item.title,
    text: item.message,
    accent: item.category,
    meta: new Date(item.createdAt).toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    }),
    applicationId: item.applicationId,
    jobId: item.jobId,
    inviteId,
    linkHref: isCompanyOffer ? "/invitaciones" : item.linkHref,
    actionLabel:
      typeof item.metadata?.actionLabel === "string"
        ? item.metadata.actionLabel
        : isCompanyOffer
          ? "Ver oferta"
          : undefined,
  };
}

function mergeUniqueIds(...groups: string[][]) {
  return Array.from(new Set(groups.flat()));
}

export function useNotifications() {
  const { authUser } = useAuthUser();
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [hiddenNotificationIds, setHiddenNotificationIds] = useState<string[]>([]);
  const [notificationPreferences, setNotificationPreferencesState] = useState<NotificationCenterPreferences>({
    anuncio: true,
    application: true,
  });
  const [applicationNotifications, setApplicationNotifications] = useState<NotificationCenterItem[]>([]);

  const applyNotificationSnapshot = (payload: {
    preferences?: NotificationCenterPreferences;
    readIds?: string[];
    hiddenIds?: string[];
    applicationNotifications?: ProductNotification[];
  }) => {
    const serverNotifications = payload.applicationNotifications ?? [];
    setReadNotificationIds(
      mergeUniqueIds(
        payload.readIds ?? [],
        serverNotifications.filter((item) => item.read).map((item) => item.id),
      ),
    );
    setHiddenNotificationIds(payload.hiddenIds ?? []);
    setNotificationPreferencesState(
      payload.preferences ?? { anuncio: true, application: true },
    );
    setApplicationNotifications(serverNotifications.map(toNotificationCenterItem));
  };

  const buildCachedSnapshot = (payload: {
    preferences?: NotificationCenterPreferences;
    readIds?: string[];
    hiddenIds?: string[];
    applicationNotifications?: NotificationCenterItem[];
  }) => {
    if (!authUser) {
      return null;
    }

    const nextReadIds = payload.readIds ?? readNotificationIds;
    const nextHiddenIds = payload.hiddenIds ?? hiddenNotificationIds;
    const nextApplicationNotifications =
      payload.applicationNotifications ?? applicationNotifications;

    return {
      ok: true,
      preferences: payload.preferences ?? notificationPreferences,
      readIds: nextReadIds,
      hiddenIds: nextHiddenIds,
      applicationNotifications: nextApplicationNotifications.map((item) => ({
        id: item.id,
        userId: authUser.id,
        type:
          item.type === "trending"
            ? ("recommended_job" as const)
            : item.type === "companyOffer"
              ? ("application_offer" as const)
            : ("application_submitted" as const),
        category:
          item.type === "trending" ? ("insight" as const) : ("workflow" as const),
        title: item.title,
        message: item.text,
        createdAt: new Date().toISOString(),
        read: nextReadIds.includes(item.id),
        applicationId: item.applicationId ?? undefined,
        jobId: item.jobId ?? undefined,
        linkHref: item.linkHref,
        metadata: item.actionLabel ? { actionLabel: item.actionLabel } : undefined,
        status:
          item.type === "trending"
            ? "recommended"
            : item.type === "companyOffer"
              ? "pending"
              : "application_submitted",
      })),
    };
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!authUser) {
        startTransition(() => {
          setReadNotificationIds([]);
          setHiddenNotificationIds([]);
          setNotificationPreferencesState({ anuncio: true, application: true });
          setApplicationNotifications([]);
        });
        clearCachedResource("notifications:");
        return;
      }

      try {
        const data = await fetchCachedResource<{
          ok: boolean;
          preferences?: NotificationCenterPreferences;
          readIds?: string[];
          hiddenIds?: string[];
          applicationNotifications?: ProductNotification[];
        }>(`notifications:${authUser.id}`, "/api/preferences/notifications");

        if (!cancelled) {
          startTransition(() => {
            applyNotificationSnapshot(data);
          });
        }
      } catch {
        if (!cancelled) {
          startTransition(() => {
            setReadNotificationIds([]);
            setHiddenNotificationIds([]);
            setNotificationPreferencesState({ anuncio: true, application: true });
            setApplicationNotifications([]);
          });
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [authUser]);

  const notificationItems = useMemo(() => {
    return applicationNotifications.filter((item) => {
      if (hiddenNotificationIds.includes(item.id)) {
        return false;
      }

      if (item.type === "application") {
        return notificationPreferences.application;
      }

      if (item.type === "anuncio") {
        return notificationPreferences.anuncio;
      }

      return true;
    });
  }, [
    applicationNotifications,
    hiddenNotificationIds,
    notificationPreferences.application,
    notificationPreferences.anuncio,
  ]);

  const visibleNotificationIds = useMemo(
    () => new Set(notificationItems.map((item) => item.id)),
    [notificationItems],
  );

  const normalizedReadNotificationIds = readNotificationIds.filter(
    (id) => visibleNotificationIds.has(id),
  );
  const effectiveReadNotificationIds = filterVisibleReadNotificationIds(
    normalizedReadNotificationIds,
    visibleNotificationIds,
  );

  const unreadNotificationCount = countUnreadNotifications(
    notificationItems,
    effectiveReadNotificationIds,
  );

  const groupedNotifications = useMemo(
    () => ({
      anuncio: notificationItems.filter((item) => item.type === "anuncio"),
      application: notificationItems.filter((item) => item.type === "application"),
      companyOffer: notificationItems.filter((item) => item.type === "companyOffer"),
      trending: notificationItems.filter((item) => item.type === "trending"),
    }),
    [notificationItems],
  );

  const persist = async (payload: {
    preferences?: NotificationCenterPreferences;
    readIds?: string[];
    hiddenIds?: string[];
    markAllRead?: boolean;
  }) => {
    if (!authUser) {
      return;
    }

    const optimisticSnapshot = buildCachedSnapshot({
      preferences: payload.preferences,
      readIds: payload.readIds,
      hiddenIds: payload.hiddenIds,
    });

    if (optimisticSnapshot) {
      primeCachedResource(`notifications:${authUser.id}`, optimisticSnapshot);
    }

    const response = await apiRequest<{
      ok: boolean;
      preferences?: NotificationCenterPreferences;
      readIds?: string[];
      hiddenIds?: string[];
      applicationNotifications?: ProductNotification[];
    }>("/api/preferences/notifications", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      startTransition(() => {
        applyNotificationSnapshot({
          preferences: response.data?.preferences ?? payload.preferences,
          readIds: response.data?.readIds ?? payload.readIds,
          hiddenIds: response.data?.hiddenIds ?? payload.hiddenIds,
          applicationNotifications: response.data?.applicationNotifications,
        });
      });

      const responseSnapshot = buildCachedSnapshot({
        preferences: response.data?.preferences ?? payload.preferences,
        readIds: response.data?.readIds ?? payload.readIds,
        hiddenIds: response.data?.hiddenIds ?? payload.hiddenIds,
        applicationNotifications:
          response.data?.applicationNotifications?.map(toNotificationCenterItem) ?? undefined,
      });

      if (responseSnapshot) {
        primeCachedResource(`notifications:${authUser.id}`, responseSnapshot);
      }
    }
  };

  const markAllNotificationsAsRead = () => {
    const nextReadIds = notificationItems.map((item) => item.id);
    setReadNotificationIds(nextReadIds);
    void persist({ markAllRead: true, readIds: nextReadIds });
  };

  const toggleNotificationReadState = (id: string) => {
    setReadNotificationIds((current) => {
      const next = buildNextReadNotificationIds(current, id);
      void persist({ readIds: next });
      return next;
    });
  };

  const toggleNotificationPreference = (
    type: keyof NotificationCenterPreferences,
  ) => {
    setNotificationPreferencesState((current: NotificationCenterPreferences) => {
      const next = {
        ...current,
        [type]: !current[type],
      };
      void persist({ preferences: next });
      return next;
    });
  };

  const removeNotification = (id: string) => {
    removeNotifications([id]);
  };

  const removeNotifications = (ids: string[]) => {
    if (ids.length === 0) {
      return;
    }

    const idSet = new Set(ids);
    setApplicationNotifications((current) => current.filter((item) => !idSet.has(item.id)));
    setHiddenNotificationIds((current) => {
      const next = Array.from(new Set([...current, ...ids]));
      void persist({ hiddenIds: next });
      return next;
    });
    setReadNotificationIds((current) => current.filter((entry) => !idSet.has(entry)));
  };

  return {
    readNotificationIds,
    notificationPreferences,
    notificationItems,
    groupedNotifications,
    effectiveReadNotificationIds,
    unreadNotificationCount,
    markAllNotificationsAsRead,
    toggleNotificationReadState,
    toggleNotificationPreference,
    removeNotification,
    removeNotifications,
  };
}
