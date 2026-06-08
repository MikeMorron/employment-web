import assert from "node:assert/strict";
import { decodeOpaqueId, encodeOpaqueId } from "@/lib/server/opaque-id";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

process.env.OPAQUE_ID_SECRET ??= "test-opaque-id-secret-64-chars-000000000000000000000000";

runTest("opaque ids round-trip raw ids for the expected kind and scope", () => {
  const opaqueId = encodeOpaqueId("job", "sample-trabajo-001", "candidate");

  assert.equal(
    decodeOpaqueId(opaqueId, { kind: "job", scope: "candidate" }),
    "sample-trabajo-001",
  );
});

runTest("opaque ids are stable for the same kind, scope, and raw id", () => {
  const first = encodeOpaqueId("job", "sample-trabajo-001", "candidate");
  const second = encodeOpaqueId("job", "sample-trabajo-001", "candidate");

  assert.equal(first, second);
});

runTest("opaque ids reject mismatched kinds", () => {
  const opaqueId = encodeOpaqueId("job", "sample-trabajo-001", "candidate");

  assert.equal(
    decodeOpaqueId(opaqueId, { kind: "application", scope: "candidate" }),
    null,
  );
});

runTest("opaque ids reject tampered payloads", () => {
  const opaqueId = encodeOpaqueId("job", "sample-trabajo-001", "candidate");
  const parts = opaqueId.split(".");
  const encrypted = parts[3] ?? "";
  const tamperedEncrypted =
    encrypted.length > 3
      ? `${encrypted.slice(0, 2)}x${encrypted.slice(3)}`
      : `${encrypted}x`;
  const tampered = [parts[0], parts[1], parts[2], tamperedEncrypted].join(".");

  assert.equal(
    decodeOpaqueId(tampered, { kind: "job", scope: "candidate" }),
    null,
  );
});
