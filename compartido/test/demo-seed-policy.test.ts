import assert from "node:assert/strict";
import { shouldAutoSeedDemoData } from "@/lib/server/demo-seed-policy";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("demo seed requires explicit opt-in in development", () => {
  assert.equal(
    shouldAutoSeedDemoData({
      NODE_ENV: "development",
      ALLOW_DEMO_SEED: "true",
    } as NodeJS.ProcessEnv),
    true,
  );
  assert.equal(
    shouldAutoSeedDemoData({
      NODE_ENV: "development",
      ALLOW_DEMO_SEED: "false",
    } as NodeJS.ProcessEnv),
    false,
  );
});

runTest("demo seed is disabled in production even with opt-in", () => {
  assert.equal(
    shouldAutoSeedDemoData({
      NODE_ENV: "production",
      ALLOW_DEMO_SEED: "true",
    } as NodeJS.ProcessEnv),
    false,
  );
});
