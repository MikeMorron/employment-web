import { prisma } from "@/lib/server/db";
import { requireAuthUser } from "@/lib/server/api-auth";
import { buildProductStateForUser } from "@/lib/server/product-context";
import {
  getUserPreferenceSnapshot,
  replaceHiddenNotificationIds,
  replaceNotificationEmailTypes,
  replaceReadNotificationIds,
} from "@/lib/server/preferences-store";
import {
  listAllNotificationInboxIds,
  listHiddenNotificationInboxIds,
  listVisibleNotificationInboxItems,
  mapInboxItemToProductNotification,
  syncNotificationInboxItems,
  toInboxSource,
} from "@/lib/server/notification-inbox";
import { encodeNotificationRefsForCandidate } from "@/lib/server/opaque-refs";
import {
  buildDerivedNotifications,
  syncActivationMilestones,
  syncRetentionTasks,
} from "@/lib/server/product-engine";
import { filterNotificationIds } from "@/lib/server/notification-state";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";
import type { ProductNotification } from "@/types/notifications";

export const runtime = "nodejs";

type NotificationPreferences = {
  anuncio: boolean;
  application: boolean;
};

function isConsumableOnDelivery(notification: ProductNotification) {
  if (notification.id.startsWith("onboarding:")) {
    return true;
  }

  return notification.metadata?.consumeOnDelivery === true;
}

function mergeUniqueIds(current: string[], incoming: string[]) {
  return Array.from(new Set([...current, ...incoming]));
}

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  if (auth.role === "admin") {
    return jsonWithSecurity({
      ok: true,
      notifications: [],
      hiddenIds: [],
      preferences: {
        anuncio: true,
        application: true,
        emailEnabled: true,
        pushEnabled: false,
        emailFrequency: "instant",
        emailTypes: [],
      },
    });
  }

  const state = await buildProductStateForUser(auth);
  const preference = await getUserPreferenceSnapshot(auth.id);
  const preferences = {
    anuncio: preference.notificationAnuncio,
    application: preference.notificationApplication,
    emailEnabled: preference.notificationEmailEnabled,
    pushEnabled: preference.notificationPushEnabled,
    emailFrequency: preference.notificationEmailFrequency ?? "instant",
    emailTypes: preference.emailTypes,
  };
  const legacyReadIds = preference.readIds;
  const legacyHiddenIds = preference.hiddenIds;
  const persistedNotificationRows = await prisma.notification.findMany({
    where: { userId: auth.id },
    orderBy: { createdAt: "desc" },
  });
  const persistedNotifications = persistedNotificationRows
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((notification) => ({
      id: notification.id,
      userId: notification.userId,
      type: notification.type as ProductNotification["type"],
      category: notification.type.startsWith("application_")
        ? "workflow"
        : notification.type === "verification_update"
          ? "trust"
          : "insight",
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt.toISOString(),
      read: notification.read || legacyReadIds.includes(notification.id),
      applicationId: notification.applicationId ?? undefined,
      jobId: notification.jobId ?? undefined,
      status: notification.status,
    }))
    .map((notification) =>
      encodeNotificationRefsForCandidate({
        ...notification,
        category: notification.category as ProductNotification["category"],
      } as ProductNotification),
    ) as ProductNotification[];
  const activationSummary = await syncActivationMilestones(prisma, state, auth);
  const retentionTasks = await syncRetentionTasks(prisma, state, activationSummary, auth, auth.id);
  const derivedNotifications = buildDerivedNotifications(state, auth, retentionTasks)
    .map((notification) => ({
      ...encodeNotificationRefsForCandidate(notification),
      read: legacyReadIds.includes(notification.id),
    }));
  await syncNotificationInboxItems({
    userId: auth.id,
    notifications: [
      ...persistedNotifications.map((notification) => toInboxSource(notification, "persisted")),
      ...derivedNotifications.map((notification) => toInboxSource(notification, "derived")),
    ],
    legacyReadIds,
    legacyHiddenIds,
  });

  const visibleInboxRows = await listVisibleNotificationInboxItems(auth.id);
  const hiddenIds = await listHiddenNotificationInboxIds(auth.id);
  const applicationNotifications = visibleInboxRows.map(mapInboxItemToProductNotification);
  const readIds = visibleInboxRows.filter((row) => row.read).map((row) => row.id);
  const deliveredConsumableIds = applicationNotifications
    .filter(isConsumableOnDelivery)
    .map((notification) => notification.id);

  if (deliveredConsumableIds.length > 0) {
    await prisma.notificationInboxItem.updateMany({
      where: {
        userId: auth.id,
        id: {
          in: deliveredConsumableIds,
        },
      },
      data: {
        hidden: true,
        hiddenAt: new Date(),
      },
    });
  }

  const syncedHiddenIds = mergeUniqueIds(hiddenIds, deliveredConsumableIds);

  await Promise.all([
    replaceReadNotificationIds(auth.id, readIds),
    replaceHiddenNotificationIds(auth.id, syncedHiddenIds),
  ]);

  return jsonWithSecurity({
    ok: true,
    preferences,
    readIds,
    hiddenIds: syncedHiddenIds,
    applicationNotifications,
    activationSummary,
    retentionTasks,
  });
}

export async function PATCH(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "preferences-notifications-write",
    maxRequests: 40,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const body = (await request.json()) as {
      preferences?: NotificationPreferences;
      readIds?: string[];
      hiddenIds?: string[];
      markAllRead?: boolean;
    };

    const sanitizeIds = (value: unknown) =>
      Array.isArray(value)
        ? Array.from(
            new Set(
              value
                .map((id) => String(id).trim())
                .filter(Boolean),
            ),
          ).slice(0, 500)
        : null;

    let payload: {
      preferences: NotificationPreferences & {
        emailEnabled?: boolean;
        pushEnabled?: boolean;
        emailFrequency?: string;
        emailTypes?: string[];
      };
      readIds: string[];
      hiddenIds: string[];
    } = {
      preferences: { anuncio: true, application: true },
      readIds: [],
      hiddenIds: [],
    };

    const currentPreference = await getUserPreferenceSnapshot(auth.id);
    const currentInboxIds = await listAllNotificationInboxIds(auth.id);
    const validReadIds = new Set(currentInboxIds);
    const validHiddenIds = new Set(currentInboxIds);
    const nextPreferences = body.preferences
      ? {
          anuncio: body.preferences.anuncio !== false,
          application: body.preferences.application !== false,
          emailEnabled: currentPreference.notificationEmailEnabled,
          pushEnabled: currentPreference.notificationPushEnabled,
          emailFrequency: currentPreference.notificationEmailFrequency ?? "instant",
          emailTypes: currentPreference.emailTypes,
        }
      : {
          anuncio: currentPreference.notificationAnuncio,
          application: currentPreference.notificationApplication,
          emailEnabled: currentPreference.notificationEmailEnabled,
          pushEnabled: currentPreference.notificationPushEnabled,
          emailFrequency: currentPreference.notificationEmailFrequency ?? "instant",
          emailTypes: currentPreference.emailTypes,
        };
    const requestedReadIds = filterNotificationIds(sanitizeIds(body.readIds), validReadIds);
    const requestedHiddenIds = filterNotificationIds(sanitizeIds(body.hiddenIds), validHiddenIds);
    const currentReadIds = filterNotificationIds(currentPreference.readIds, validReadIds) ?? [];
    const visibleInboxIds = (
      await prisma.notificationInboxItem.findMany({
        where: {
          userId: auth.id,
          hidden: false,
        },
        select: { id: true },
      })
    ).map((row) => row.id);
    const nextReadIds = body.markAllRead
      ? requestedReadIds ?? visibleInboxIds
      : requestedReadIds ?? currentReadIds;
    const nextHiddenIds = requestedHiddenIds
      ? mergeUniqueIds(currentPreference.hiddenIds, requestedHiddenIds)
      : currentPreference.hiddenIds;

    payload = {
      preferences: nextPreferences,
      readIds: nextReadIds,
      hiddenIds: nextHiddenIds,
    };

    await prisma.preference.upsert({
      where: { userId: auth.id },
      update: {
        notificationAnuncio: nextPreferences.anuncio,
        notificationApplication: nextPreferences.application,
        notificationEmailEnabled: nextPreferences.emailEnabled ?? true,
        notificationPushEnabled: nextPreferences.pushEnabled ?? false,
        notificationEmailFrequency: nextPreferences.emailFrequency ?? null,
      },
      create: {
        userId: auth.id,
        notificationAnuncio: nextPreferences.anuncio,
        notificationApplication: nextPreferences.application,
        notificationEmailEnabled: nextPreferences.emailEnabled ?? true,
        notificationPushEnabled: nextPreferences.pushEnabled ?? false,
        notificationEmailFrequency: nextPreferences.emailFrequency ?? null,
      },
    });
    await Promise.all([
      replaceNotificationEmailTypes(auth.id, nextPreferences.emailTypes ?? []),
      replaceReadNotificationIds(auth.id, nextReadIds),
      replaceHiddenNotificationIds(auth.id, nextHiddenIds),
      prisma.notification.updateMany({
        where: {
          userId: auth.id,
          id: {
            in: nextReadIds,
          },
        },
        data: {
          read: true,
        },
      }),
      prisma.notification.updateMany({
        where: {
          userId: auth.id,
          ...(nextReadIds.length > 0
            ? {
                id: {
                  notIn: nextReadIds,
                },
              }
            : {}),
        },
        data: {
          read: false,
        },
      }),
      prisma.notificationInboxItem.updateMany({
        where: {
          userId: auth.id,
          id: {
            in: nextReadIds,
          },
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      }),
      prisma.notificationInboxItem.updateMany({
        where: {
          userId: auth.id,
          ...(nextReadIds.length > 0
            ? {
                id: {
                  notIn: nextReadIds,
                },
              }
            : {}),
        },
        data: {
          read: false,
          readAt: null,
        },
      }),
      prisma.notificationInboxItem.updateMany({
        where: {
          userId: auth.id,
          id: {
            in: nextHiddenIds,
          },
        },
        data: {
          hidden: true,
          hiddenAt: new Date(),
        },
      }),
    ]);

    const applicationNotifications = (await listVisibleNotificationInboxItems(auth.id)).map(
      mapInboxItemToProductNotification,
    );

    return jsonWithSecurity({
      ok: true,
      preferences: payload.preferences,
      readIds: payload.readIds,
      hiddenIds: payload.hiddenIds,
      applicationNotifications,
    });
  } catch {
    return jsonWithSecurity({ ok: false, message: "No se pudieron actualizar las notificaciones" }, { status: 500 });
  }
}
