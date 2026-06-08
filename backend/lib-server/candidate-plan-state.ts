import { randomUUID } from "node:crypto";
import type { CandidateBoostInventoryItem } from "@/types/profile";
import {
  FREE_CANDIDATE_APPLICATIONS,
  FREE_CANDIDATE_WINDOW_DAYS,
  getCandidateBoostPlan,
  type CandidateBoostPlan,
  type CandidateBoostPlanId,
} from "@/lib/plan-catalog";

export type CandidatePlanState = {
  currentPlanId: CandidateBoostPlanId;
  currentPlanActivatedAt: string | null;
  currentPlanWindowEndsAt: string | null;
  boostActiveUntil: string | null;
  boostInventory: CandidateBoostInventoryItem[];
  applicationQuotaLimit: number;
  applicationQuotaWindowStartedAt: string;
  applicationQuotaWindowEndsAt: string;
};

function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

function addHours(base: Date, hours: number) {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

export function createDefaultCandidatePlanState(now = new Date()): CandidatePlanState {
  return {
    currentPlanId: "free",
    currentPlanActivatedAt: null,
    currentPlanWindowEndsAt: null,
    boostActiveUntil: null,
    boostInventory: [],
    applicationQuotaLimit: FREE_CANDIDATE_APPLICATIONS,
    applicationQuotaWindowStartedAt: now.toISOString(),
    applicationQuotaWindowEndsAt: addDays(now, FREE_CANDIDATE_WINDOW_DAYS).toISOString(),
  };
}

export function parseCandidatePlanState(value: string | null | undefined, now = new Date()) {
  if (!value) {
    return createDefaultCandidatePlanState(now);
  }

  try {
    const parsed = JSON.parse(value) as Partial<CandidatePlanState>;
    return normalizeCandidatePlanState(parsed, now);
  } catch {
    return createDefaultCandidatePlanState(now);
  }
}

export function normalizeCandidatePlanState(
  value: Partial<CandidatePlanState> | null | undefined,
  now = new Date(),
): CandidatePlanState {
  const fallback = createDefaultCandidatePlanState(now);
  const next: CandidatePlanState = {
    currentPlanId:
      value?.currentPlanId === "starter-boost" ||
      value?.currentPlanId === "basic-boost" ||
      value?.currentPlanId === "mid-boost" ||
      value?.currentPlanId === "high-boost" ||
      value?.currentPlanId === "pro-boost" ||
      value?.currentPlanId === "free"
        ? value.currentPlanId
        : fallback.currentPlanId,
    currentPlanActivatedAt: value?.currentPlanActivatedAt ?? fallback.currentPlanActivatedAt,
    currentPlanWindowEndsAt: value?.currentPlanWindowEndsAt ?? fallback.currentPlanWindowEndsAt,
    boostActiveUntil: value?.boostActiveUntil ?? fallback.boostActiveUntil,
    boostInventory: Array.isArray(value?.boostInventory)
      ? value.boostInventory
          .map((item) => ({
            id: typeof item.id === "string" ? item.id : randomUUID(),
            sourcePlanId: typeof item.sourcePlanId === "string" ? item.sourcePlanId : "starter-boost",
            durationHours: Number.isFinite(item.durationHours) ? Math.max(1, Math.round(item.durationHours)) : 24,
            totalUses: Number.isFinite(item.totalUses) ? Math.max(1, Math.round(item.totalUses)) : 1,
            remainingUses: Number.isFinite(item.remainingUses) ? Math.max(0, Math.round(item.remainingUses)) : 0,
            createdAt: typeof item.createdAt === "string" ? item.createdAt : now.toISOString(),
          }))
          .filter((item) => item.remainingUses > 0)
      : [],
    applicationQuotaLimit:
      typeof value?.applicationQuotaLimit === "number"
        ? Math.max(FREE_CANDIDATE_APPLICATIONS, Math.round(value.applicationQuotaLimit))
        : fallback.applicationQuotaLimit,
    applicationQuotaWindowStartedAt:
      typeof value?.applicationQuotaWindowStartedAt === "string"
        ? value.applicationQuotaWindowStartedAt
        : fallback.applicationQuotaWindowStartedAt,
    applicationQuotaWindowEndsAt:
      typeof value?.applicationQuotaWindowEndsAt === "string"
        ? value.applicationQuotaWindowEndsAt
        : fallback.applicationQuotaWindowEndsAt,
  };

  const windowEndsAt = new Date(next.applicationQuotaWindowEndsAt);
  if (Number.isNaN(windowEndsAt.getTime()) || windowEndsAt.getTime() <= now.getTime()) {
    return createDefaultCandidatePlanState(now);
  }

  if (
    next.currentPlanWindowEndsAt &&
    new Date(next.currentPlanWindowEndsAt).getTime() <= now.getTime()
  ) {
    next.currentPlanId = "free";
    next.currentPlanActivatedAt = null;
    next.currentPlanWindowEndsAt = null;
  }

  return next;
}

export function getCandidatePlanRank(planId: CandidateBoostPlanId) {
  return getCandidateBoostPlan(planId)?.rank ?? 0;
}

export function applyCandidateBoostPurchase(
  currentState: CandidatePlanState,
  plan: CandidateBoostPlan,
  now = new Date(),
) {
  const state = normalizeCandidatePlanState(currentState, now);
  const nextPlanWindowEndsAt = addDays(now, 30).toISOString();

  const nextInventory = [...state.boostInventory];
  const groupedHours = new Map<number, number>();

  for (const durationHours of plan.boostHours) {
    groupedHours.set(durationHours, (groupedHours.get(durationHours) ?? 0) + 1);
  }

  for (const [durationHours, totalUses] of groupedHours.entries()) {
    nextInventory.push({
      id: randomUUID(),
      sourcePlanId: plan.id,
      durationHours,
      totalUses,
      remainingUses: totalUses,
      createdAt: now.toISOString(),
    });
  }

  return {
    ...state,
    currentPlanId: plan.id,
    currentPlanActivatedAt: now.toISOString(),
    currentPlanWindowEndsAt: nextPlanWindowEndsAt,
    boostInventory: nextInventory,
    applicationQuotaLimit: state.applicationQuotaLimit + plan.additionalApplications,
    applicationQuotaWindowEndsAt: addDays(
      new Date(state.applicationQuotaWindowStartedAt),
      Math.max(
        FREE_CANDIDATE_WINDOW_DAYS,
        plan.applicationWindowDays,
      ),
    ).toISOString(),
  } satisfies CandidatePlanState;
}

export function consumeCandidateBoost(
  currentState: CandidatePlanState,
  durationHours: number,
  quantity: number,
  now = new Date(),
) {
  const state = normalizeCandidatePlanState(currentState, now);
  const safeQuantity = Math.max(1, Math.min(10, Math.round(quantity)));
  const inventoryIndex = state.boostInventory.findIndex(
    (item) => item.durationHours === durationHours && item.remainingUses >= safeQuantity,
  );

  if (inventoryIndex < 0) {
    return null;
  }

  const nextInventory = state.boostInventory.map((item, index) =>
    index === inventoryIndex
      ? {
          ...item,
          remainingUses: item.remainingUses - safeQuantity,
        }
      : item,
  ).filter((item) => item.remainingUses > 0);

  const activeBase =
    state.boostActiveUntil && new Date(state.boostActiveUntil).getTime() > now.getTime()
      ? new Date(state.boostActiveUntil)
      : now;

  return {
    ...state,
    boostInventory: nextInventory,
    boostActiveUntil: addHours(activeBase, durationHours * safeQuantity).toISOString(),
  } satisfies CandidatePlanState;
}

export function serializeCandidatePlanState(state: CandidatePlanState) {
  return JSON.stringify(state);
}
