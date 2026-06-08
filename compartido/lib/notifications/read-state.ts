import type { NotificationCenterItem } from "@/types/notification-center";

export function filterVisibleReadNotificationIds(
  readNotificationIds: string[],
  visibleNotificationIds: Set<string>,
) {
  return readNotificationIds.filter((id) => visibleNotificationIds.has(id));
}

export function buildNextReadNotificationIds(
  currentReadNotificationIds: string[],
  notificationId: string,
) {
  return currentReadNotificationIds.includes(notificationId)
    ? currentReadNotificationIds.filter((id) => id !== notificationId)
    : [...currentReadNotificationIds, notificationId];
}

export function countUnreadNotifications(
  notificationItems: NotificationCenterItem[],
  readNotificationIds: string[],
) {
  const readIds = new Set(readNotificationIds);
  return notificationItems.reduce(
    (count, item) => count + (readIds.has(item.id) ? 0 : 1),
    0,
  );
}
