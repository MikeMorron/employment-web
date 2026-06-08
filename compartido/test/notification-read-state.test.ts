import assert from "node:assert/strict";
import {
  buildNextReadNotificationIds,
  countUnreadNotifications,
  filterVisibleReadNotificationIds,
} from "@/lib/notifications/read-state";
import type { NotificationCenterItem } from "@/types/notification-center";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("notification read toggles only affect the targeted id", () => {
  assert.deepEqual(buildNextReadNotificationIds([], "notice-1"), ["notice-1"]);
  assert.deepEqual(
    buildNextReadNotificationIds(["notice-1", "notice-2"], "notice-1"),
    ["notice-2"],
  );
});

runTest("notification unread counting only considers visible items", () => {
  const items: NotificationCenterItem[] = [
    { id: "notice-1", type: "anuncio", title: "", text: "", accent: "", meta: "" },
    { id: "notice-2", type: "application", title: "", text: "", accent: "", meta: "" },
    { id: "notice-3", type: "trending", title: "", text: "", accent: "", meta: "" },
  ];
  const visibleReadIds = filterVisibleReadNotificationIds(
    ["notice-2", "archived-notice"],
    new Set(items.map((item) => item.id)),
  );

  assert.deepEqual(visibleReadIds, ["notice-2"]);
  assert.equal(countUnreadNotifications(items, visibleReadIds), 2);
});
