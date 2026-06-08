import assert from "node:assert/strict";
import { filterNotificationIds } from "@/lib/server/notification-state";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("notification state keeps only ids that exist in the allowed set", () => {
  const filtered = filterNotificationIds(
    ["notice-1", "notice-2", "notice-x"],
    new Set(["notice-1", "notice-2"]),
  );

  assert.deepEqual(filtered, ["notice-1", "notice-2"]);
});

runTest("notification state returns null when no ids were provided", () => {
  assert.equal(filterNotificationIds(null, new Set(["notice-1"])), null);
});
