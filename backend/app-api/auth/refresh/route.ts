import { buildSessionCookie, sanitizeUserForClient } from "@/lib/server/app-state";
import { refreshSessionBundle, validateRefreshSessionCsrf } from "@/lib/server/session-security";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "auth-refresh",
    maxRequests: 40,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const sessionContext = await validateRefreshSessionCsrf(request);
  if (!sessionContext) {
    return jsonWithSecurity({ ok: false, message: "Refresh session inválida" }, { status: 401 });
  }

  const refreshed = await refreshSessionBundle(request);
  if (!refreshed) {
    return jsonWithSecurity({ ok: false, message: "No se pudo renovar la sesión" }, { status: 401 });
  }

  const response = jsonWithSecurity({
    ok: true,
    user: sanitizeUserForClient(refreshed.user),
    auth: refreshed.auth,
  });
  response.headers.set("Set-Cookie", buildSessionCookie(refreshed.token, request));
  return response;
}
