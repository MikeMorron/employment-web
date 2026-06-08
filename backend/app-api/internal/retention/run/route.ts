import { runRetentionDispatch } from "@/lib/server/retention-runner";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  jsonWithSecurity,
} from "@/lib/server/security";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.RETENTION_RUNNER_SECRET;
  return Boolean(secret) && request.headers.get("x-retention-secret") === secret;
}

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "internal-retention-run",
    maxRequests: 5,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  if (!isAuthorized(request)) {
    return jsonWithSecurity({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const result = await runRetentionDispatch(
    typeof body.limit === "number" ? Math.max(1, Math.min(body.limit, 100)) : 20,
  );

  return jsonWithSecurity({
    ok: true,
    ...result,
  });
}
