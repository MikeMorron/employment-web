import { prisma } from "@/lib/server/db";
import type { ProductNotification } from "@/types/notifications";

type NotificationInboxSource = ProductNotification & {
  actionLabel?: string;
  source: "persisted" | "derived";
};

function parseMetadataJson(value: string | null) {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function getActionLabel(notification: ProductNotification) {
  return typeof notification.metadata?.actionLabel === "string"
    ? notification.metadata.actionLabel
    : undefined;
}

export function toInboxSource(notification: ProductNotification, source: "persisted" | "derived"): NotificationInboxSource {
  return {
    ...notification,
    actionLabel: getActionLabel(notification),
    source,
  };
}

export async function syncNotificationInboxItems(input: {
  userId: string;
  notifications: NotificationInboxSource[];
  legacyReadIds: string[];
  legacyHiddenIds: string[];
}) {
  const { userId, notifications, legacyReadIds, legacyHiddenIds } = input;

  if (notifications.length === 0) {
    return;
  }

  await prisma.$transaction(
    notifications.map((notification) =>
      prisma.notificationInboxItem.upsert({
        where: { id: notification.id },
        update: {
          userId,
          type: notification.type,
          category: notification.category,
          source: notification.source,
          title: notification.title,
          message: notification.message,
          linkHref: notification.linkHref ?? null,
          actionLabel: notification.actionLabel ?? null,
          applicationId: notification.applicationId ?? null,
          jobId: notification.jobId ?? null,
          entityId: notification.entityId ?? null,
          status: notification.status ?? null,
          metadataJson: JSON.stringify(notification.metadata ?? null),
          lastSeenAt: new Date(),
        },
        create: {
          id: notification.id,
          userId,
          type: notification.type,
          category: notification.category,
          source: notification.source,
          title: notification.title,
          message: notification.message,
          linkHref: notification.linkHref ?? null,
          actionLabel: notification.actionLabel ?? null,
          applicationId: notification.applicationId ?? null,
          jobId: notification.jobId ?? null,
          entityId: notification.entityId ?? null,
          status: notification.status ?? null,
          metadataJson: JSON.stringify(notification.metadata ?? null),
          deliveredAt: new Date(notification.createdAt),
          lastSeenAt: new Date(),
          read: notification.read || legacyReadIds.includes(notification.id),
          readAt:
            notification.read || legacyReadIds.includes(notification.id)
              ? new Date()
              : null,
          hidden: legacyHiddenIds.includes(notification.id),
          hiddenAt: legacyHiddenIds.includes(notification.id) ? new Date() : null,
        },
      }),
    ),
  );
}

export async function listVisibleNotificationInboxItems(userId: string) {
  return prisma.notificationInboxItem.findMany({
    where: {
      userId,
      hidden: false,
    },
    orderBy: [
      { deliveredAt: "desc" },
      { updatedAt: "desc" },
    ],
  });
}

export async function listHiddenNotificationInboxIds(userId: string) {
  const rows = await prisma.notificationInboxItem.findMany({
    where: {
      userId,
      hidden: true,
    },
    select: { id: true },
  });

  return rows.map((row) => row.id);
}

export async function listAllNotificationInboxIds(userId: string) {
  const rows = await prisma.notificationInboxItem.findMany({
    where: { userId },
    select: { id: true },
  });

  return rows.map((row) => row.id);
}

export function mapInboxItemToProductNotification(
  row: Awaited<ReturnType<typeof listVisibleNotificationInboxItems>>[number],
): ProductNotification {
  const metadata = parseMetadataJson(row.metadataJson);

  return {
    id: row.id,
    userId: row.userId,
    type: row.type as ProductNotification["type"],
    category: row.category as ProductNotification["category"],
    title: row.title,
    message: row.message,
    createdAt: row.deliveredAt.toISOString(),
    read: row.read,
    applicationId: row.applicationId ?? undefined,
    jobId: row.jobId ?? undefined,
    entityId: row.entityId ?? undefined,
    status: row.status ?? undefined,
    linkHref: row.linkHref ?? undefined,
    metadata:
      row.actionLabel && !metadata
        ? { actionLabel: row.actionLabel }
        : row.actionLabel
          ? { ...(metadata ?? {}), actionLabel: row.actionLabel }
          : metadata,
  };
}
