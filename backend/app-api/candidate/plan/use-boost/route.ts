import { requireCandidateUser } from "@/lib/server/api-auth";
import { activateCandidateBoostInventory } from "@/lib/server/plan-purchase-service";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

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
    scope: "candidate-plan-use-boost",
    maxRequests: 30,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const body = (await request.json()) as {
      durationHours?: number;
      quantity?: number;
    };
    const snapshot = await activateCandidateBoostInventory(
      auth.id,
      Math.round(body.durationHours ?? 0),
      Math.round(body.quantity ?? 1),
    );
    return jsonWithSecurity({ ok: true, ...snapshot });
  } catch (error) {
    return jsonWithSecurity(
      { ok: false, message: error instanceof Error ? error.message : "No se pudo activar el boost." },
      { status: 400 },
    );
  }
}
