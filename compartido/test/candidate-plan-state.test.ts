import assert from "node:assert/strict";
import { getCandidateBoostPlan } from "@/lib/plan-catalog";
import {
  applyCandidateBoostPurchase,
  consumeCandidateBoost,
  createDefaultCandidatePlanState,
} from "@/lib/server/candidate-plan-state";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("candidate boost purchase adds inventory and application quota", () => {
  const base = createDefaultCandidatePlanState(new Date("2026-05-12T10:00:00.000Z"));
  const plan = getCandidateBoostPlan("pro-boost");
  assert.ok(plan);

  const next = applyCandidateBoostPurchase(base, plan, new Date("2026-05-12T10:00:00.000Z"));
  assert.equal(next.currentPlanId, "pro-boost");
  assert.equal(next.applicationQuotaLimit, 13);
  assert.equal(next.boostInventory.reduce((sum, item) => sum + item.remainingUses, 0), 10);
});

runTest("consuming boosts stacks new time on top of active time", () => {
  const plan = getCandidateBoostPlan("starter-boost");
  assert.ok(plan);

  const purchased = applyCandidateBoostPurchase(
    createDefaultCandidatePlanState(new Date("2026-05-12T10:00:00.000Z")),
    plan,
    new Date("2026-05-12T10:00:00.000Z"),
  );
  const firstUse = consumeCandidateBoost(purchased, 24, 1, new Date("2026-05-12T10:00:00.000Z"));
  assert.ok(firstUse?.boostActiveUntil);

  const stacked = consumeCandidateBoost(
    {
      ...purchased,
      boostInventory: [
        { id: "manual-72", sourcePlanId: "pro-boost", durationHours: 72, totalUses: 1, remainingUses: 1, createdAt: "2026-05-12T10:00:00.000Z" },
      ],
      boostActiveUntil: "2026-05-13T10:00:00.000Z",
    },
    72,
    1,
    new Date("2026-05-12T20:00:00.000Z"),
  );

  assert.equal(stacked?.boostActiveUntil, "2026-05-16T10:00:00.000Z");
});
