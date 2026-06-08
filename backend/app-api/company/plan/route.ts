import { requireCompanyUser } from "@/lib/server/api-auth";
import {
  buildCompanyPlanSnapshot,
  purchaseCompanySubscriptionPlan,
} from "@/lib/server/plan-purchase-service";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";
import type { CompanySubscriptionPlanId } from "@/lib/plan-catalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  return jsonWithSecurity({
    ok: true,
    ...(await buildCompanyPlanSnapshot(auth.id)),
  });
}

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "company-plan-purchase",
    maxRequests: 20,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const body = (await request.json()) as { planId?: CompanySubscriptionPlanId };
    const snapshot = await purchaseCompanySubscriptionPlan(auth.id, body.planId ?? "company-basic");
    return jsonWithSecurity({ ok: true, ...snapshot });
  } catch (error) {
    return jsonWithSecurity(
      { ok: false, message: error instanceof Error ? error.message : "No se pudo comprar el plan." },
      { status: 400 },
    );
  }
}
