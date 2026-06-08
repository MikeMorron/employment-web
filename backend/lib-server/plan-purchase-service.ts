import { rowToUser } from "@/lib/server/app-state";
import { prisma } from "@/lib/server/db";
import { createBillingHistoryEntry } from "@/lib/server/preferences-store";
import {
  applyCandidateBoostPurchase,
  consumeCandidateBoost,
  parseCandidatePlanState,
  serializeCandidatePlanState,
} from "@/lib/server/candidate-plan-state";
import {
  getCompanyPlanWindowEndsAt,
  parseCompanyPlanState,
  serializeCompanyPlanState,
} from "@/lib/server/company-plan-state";
import { countRecentPurchases, createPurchaseHistoryEntry, listRecentPurchases } from "@/lib/server/purchase-history";
import { sanitizeOwnUserForClient } from "@/lib/server/user-client";
import {
  candidateBoostPlans,
  companySubscriptionPlans,
  getCandidateBoostPlan,
  getCompanySubscriptionPlan,
  mapCandidateBoostPlanToUserPlan,
  type CandidateBoostPlanId,
  type CompanySubscriptionPlanId,
} from "@/lib/plan-catalog";
import { normalizeCompanyPlan } from "@/lib/company-plan-model";

function subtractDays(base: Date, days: number) {
  return new Date(base.getTime() - days * 24 * 60 * 60 * 1000);
}

function isPlanActive(endsAt: string | null | undefined, now: Date) {
  return Boolean(endsAt && new Date(endsAt).getTime() > now.getTime());
}

export async function buildCandidatePlanSnapshot(userId: string, now = new Date()) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { candidatePlanStateJson: true },
  });
  const state = parseCandidatePlanState(profile?.candidatePlanStateJson, now);
  const recentSince = subtractDays(now, 30);
  const recentPurchases = await listRecentPurchases(userId, "candidate_boost", recentSince);
  const applicationsUsed = await prisma.application.count({
    where: {
      candidateId: userId,
      appliedAt: {
        gte: new Date(state.applicationQuotaWindowStartedAt),
        lte: new Date(state.applicationQuotaWindowEndsAt),
      },
    },
  });
  const currentPlan = getCandidateBoostPlan(state.currentPlanId) ?? candidateBoostPlans[0];
  const currentRank = currentPlan?.rank ?? 0;
  const currentPlanActive = isPlanActive(state.currentPlanWindowEndsAt, now);
  const purchaseCounts = recentPurchases.reduce<Record<string, number>>((acc, item) => {
    acc[item.planId] = (acc[item.planId] ?? 0) + 1;
    return acc;
  }, {});

  return {
    currentPlan,
    state,
    applicationQuotaRemaining: Math.max(0, state.applicationQuotaLimit - applicationsUsed),
    plans: candidateBoostPlans.map((plan) => {
      const count = purchaseCounts[plan.id] ?? 0;
      const purchaseLimitReached =
        plan.maxPurchasesPer30Days > 0 && count >= plan.maxPurchasesPer30Days;
      const downgradeBlocked = currentPlanActive && plan.rank > 0 && plan.rank < currentRank;
      const disabled = plan.id === "free" || purchaseLimitReached || downgradeBlocked;

      return {
        ...plan,
        purchaseCount30d: count,
        disabled,
        disabledReason:
          plan.id === "free"
            ? "current"
            : purchaseLimitReached
              ? "purchase_limit"
              : downgradeBlocked
                ? "downgrade_blocked"
                : null,
      };
    }),
  };
}

export async function purchaseCandidateBoostPlan(userId: string, planId: CandidateBoostPlanId, now = new Date()) {
  const plan = getCandidateBoostPlan(planId);
  if (!plan || plan.id === "free") {
    throw new Error("Plan inválido");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { candidatePlanStateJson: true },
  });
  const currentState = parseCandidatePlanState(profile?.candidatePlanStateJson, now);
  const currentPlan = getCandidateBoostPlan(currentState.currentPlanId) ?? candidateBoostPlans[0];
  const currentPlanActive = isPlanActive(currentState.currentPlanWindowEndsAt, now);

  if (currentPlanActive && plan.rank < currentPlan.rank) {
    throw new Error("No puedes comprar un plan inferior mientras tienes uno superior activo.");
  }

  const recentCount = await countRecentPurchases(userId, plan.id, subtractDays(now, 30));
  if (plan.maxPurchasesPer30Days > 0 && recentCount >= plan.maxPurchasesPer30Days) {
    throw new Error("Ya llegaste al límite de compras de este plan en los últimos 30 días.");
  }

  const nextState = applyCandidateBoostPurchase(currentState, plan, now);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        plan: mapCandidateBoostPlanToUserPlan(plan.id),
      },
    });

    await tx.profile.update({
      where: { userId },
      data: {
        candidatePlanStateJson: serializeCandidatePlanState(nextState),
        planStatus: "active",
        currentPeriodEnd: nextState.currentPlanWindowEndsAt ? new Date(nextState.currentPlanWindowEndsAt) : null,
      },
    });

    await tx.purchaseHistory.create({
      data: {
        userId,
        role: "candidate",
        kind: "candidate_boost",
        planId: plan.id,
        amountCop: plan.priceCop,
        applicationCredits: plan.additionalApplications,
        boostUnitsJson: JSON.stringify(plan.boostHours),
        metadataJson: JSON.stringify({
          applicationWindowDays: plan.applicationWindowDays,
        }),
        startedAt: now,
        endsAt: nextState.currentPlanWindowEndsAt ? new Date(nextState.currentPlanWindowEndsAt) : null,
      },
    });
  });

  return buildCandidatePlanSnapshot(userId, now);
}

export async function activateCandidateBoostInventory(
  userId: string,
  durationHours: number,
  quantity: number,
  now = new Date(),
) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { candidatePlanStateJson: true },
  });
  const currentState = parseCandidatePlanState(profile?.candidatePlanStateJson, now);
  const nextState = consumeCandidateBoost(currentState, durationHours, quantity, now);

  if (!nextState) {
    throw new Error("No tienes suficientes boosts disponibles para esa duración.");
  }

  await prisma.profile.update({
    where: { userId },
    data: {
      candidatePlanStateJson: serializeCandidatePlanState(nextState),
      currentPeriodEnd: nextState.currentPlanWindowEndsAt ? new Date(nextState.currentPlanWindowEndsAt) : null,
    },
  });

  return buildCandidatePlanSnapshot(userId, now);
}

export async function buildCompanyPlanSnapshot(userId: string, now = new Date()) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user?.profile) {
    throw new Error("Empresa no disponible");
  }

  const state = parseCompanyPlanState(user.profile.companyPlanStateJson, now);
  const currentPlan = getCompanySubscriptionPlan(state.currentPlanId) ?? companySubscriptionPlans[0];
  const currentRank = currentPlan.rank;
  const currentPlanActive = isPlanActive(state.currentPlanWindowEndsAt, now);

  return {
    currentPlan,
    state,
    user: sanitizeOwnUserForClient(rowToUser(user, user.profile)),
    plans: companySubscriptionPlans.map((plan) => ({
      ...plan,
      disabled: currentPlanActive && plan.rank <= currentRank,
      disabledReason: currentPlanActive && plan.rank < currentRank
        ? "downgrade_blocked"
        : currentPlanActive && plan.rank === currentRank
          ? "already_active"
          : null,
    })),
  };
}

export async function purchaseCompanySubscriptionPlan(
  userId: string,
  planId: CompanySubscriptionPlanId,
  now = new Date(),
) {
  const plan = getCompanySubscriptionPlan(planId);
  if (!plan) {
    throw new Error("Plan inválido");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user?.profile) {
    throw new Error("Empresa no disponible");
  }

  const currentState = parseCompanyPlanState(user.profile.companyPlanStateJson, now);
  const currentPlan = getCompanySubscriptionPlan(currentState.currentPlanId) ?? companySubscriptionPlans[0];
  const currentPlanActive = isPlanActive(currentState.currentPlanWindowEndsAt, now);

  if (currentPlanActive && plan.rank <= currentPlan.rank) {
    throw new Error("No puedes comprar un plan igual o inferior mientras tu plan actual sigue activo.");
  }

  const nextWindowEndsAt = getCompanyPlanWindowEndsAt(now);
  const nextState = {
    currentPlanId: plan.id,
    currentPlanActivatedAt: now.toISOString(),
    currentPlanWindowEndsAt: nextWindowEndsAt,
    collaboratorLimit: plan.collaboratorLimit,
  };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        plan: plan.planKey,
      },
    });

    await tx.profile.update({
      where: { userId },
      data: {
        planStatus: "active",
        currentPeriodEnd: new Date(nextWindowEndsAt),
        companyPlanStateJson: serializeCompanyPlanState(nextState),
      },
    });
  });

  await createPurchaseHistoryEntry({
    userId,
    role: "company",
    kind: "company_subscription",
    planId: plan.id,
    amountCop: plan.priceCop,
    metadata: {
      collaboratorLimit: plan.collaboratorLimit,
      maxPublishedJobs: plan.maxPublishedJobs,
      activeJobs: plan.activeJobs,
    },
    startedAt: now,
    endsAt: new Date(nextWindowEndsAt),
  });

  await createBillingHistoryEntry({
    userId,
    plan: normalizeCompanyPlan(plan.planKey),
    amountCop: plan.priceCop,
    status: "paid",
    paidAt: now,
    renewalAt: new Date(nextWindowEndsAt),
    description: `Compra del plan ${plan.nameEs}`,
    provider: "internal",
    providerReference: plan.id,
  });

  return buildCompanyPlanSnapshot(userId, now);
}
