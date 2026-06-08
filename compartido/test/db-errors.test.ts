import assert from "node:assert/strict";
import { isDatabaseUnavailableError } from "@/lib/server/db-errors";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("database unavailable detector matches prisma reachability errors", () => {
  const error = new Error(
    "PrismaClientInitializationError: Can't reach database server at `/tmp/talentoco-pg-run:5432`",
  );

  assert.equal(isDatabaseUnavailableError(error), true);
});

runTest("database unavailable detector ignores unrelated failures", () => {
  const error = new Error("TypeError: Cannot read properties of undefined");

  assert.equal(isDatabaseUnavailableError(error), false);
});
