export type CompanyPlanState = {
  currentPlanId: "company-basic" | "company-pro" | "company-business" | "company-premium";
  currentPlanActivatedAt: string | null;
  currentPlanWindowEndsAt: string | null;
  collaboratorLimit: number;
};

function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

export function createDefaultCompanyPlanState(now = new Date()): CompanyPlanState {
  return {
    currentPlanId: "company-basic",
    currentPlanActivatedAt: now.toISOString(),
    currentPlanWindowEndsAt: null,
    collaboratorLimit: 0,
  };
}

export function parseCompanyPlanState(value: string | null | undefined, now = new Date()) {
  if (!value) {
    return createDefaultCompanyPlanState(now);
  }

  try {
    const parsed = JSON.parse(value) as Partial<CompanyPlanState>;
    return {
      currentPlanId:
        parsed.currentPlanId === "company-pro" ||
        parsed.currentPlanId === "company-business" ||
        parsed.currentPlanId === "company-premium" ||
        parsed.currentPlanId === "company-basic"
          ? parsed.currentPlanId
          : "company-basic",
      currentPlanActivatedAt: typeof parsed.currentPlanActivatedAt === "string" ? parsed.currentPlanActivatedAt : now.toISOString(),
      currentPlanWindowEndsAt: typeof parsed.currentPlanWindowEndsAt === "string" ? parsed.currentPlanWindowEndsAt : null,
      collaboratorLimit:
        typeof parsed.collaboratorLimit === "number" ? Math.max(0, Math.round(parsed.collaboratorLimit)) : 0,
    } satisfies CompanyPlanState;
  } catch {
    return createDefaultCompanyPlanState(now);
  }
}

export function serializeCompanyPlanState(state: CompanyPlanState) {
  return JSON.stringify(state);
}

export function getCompanyPlanWindowEndsAt(now = new Date()) {
  return addDays(now, 30).toISOString();
}
