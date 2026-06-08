export function filterNotificationIds(
  notificationIds: string[] | null,
  validNotificationIds: ReadonlySet<string>,
) {
  if (!notificationIds) {
    return null;
  }

  return notificationIds.filter((id) => validNotificationIds.has(id));
}
