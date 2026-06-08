import { buildClearedSessionCookie, clearSession, parseCookieValue, sessionCookieName } from "@/lib/server/app-state";
import { validateRefreshSessionCsrf } from "@/lib/server/session-security";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "auth-logout",
    maxRequests: 40,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const sessionContext = await validateRefreshSessionCsrf(request);
  if (!sessionContext) {
    return jsonWithSecurity({ ok: false, message: "Sesión inválida" }, { status: 401 });
  }

  const token = parseCookieValue(request.headers.get("cookie"), sessionCookieName);
  if (token) {
    await clearSession(token);
  }

  const response = jsonWithSecurity({ ok: true });
  response.headers.set("Set-Cookie", buildClearedSessionCookie(request));
  return response;
}
