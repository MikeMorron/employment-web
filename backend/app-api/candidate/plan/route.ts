import { requireCandidateUser } from "@/lib/server/api-auth";
import {
  buildCandidatePlanSnapshot,
  purchaseCandidateBoostPlan,
} from "@/lib/server/plan-purchase-service";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";
import type { CandidateBoostPlanId } from "@/lib/plan-catalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireCandidateUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  return jsonWithSecurity({
    ok: true,
    ...(await buildCandidatePlanSnapshot(auth.id)),
  });
}

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const auth = await requireCandidateUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "candidate-plan-purchase",
    maxRequests: 20,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const body = (await request.json()) as { planId?: CandidateBoostPlanId };
    const snapshot = await purchaseCandidateBoostPlan(auth.id, body.planId ?? "free");
    return jsonWithSecurity({ ok: true, ...snapshot });
  } catch (error) {
    return jsonWithSecurity(
      { ok: false, message: error instanceof Error ? error.message : "No se pudo comprar el plan." },
      { status: 400 },
    );
  }
}
