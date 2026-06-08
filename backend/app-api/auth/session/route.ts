import { buildClearedSessionCookie, sanitizeUserForClient } from "@/lib/server/app-state";
import { isDatabaseUnavailableError } from "@/lib/server/db-errors";
import { issueSessionBundleFromRequest } from "@/lib/server/session-security";
import { enforceRateLimit, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "auth-session",
    maxRequests: 120,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const session = await issueSessionBundleFromRequest(request);

    if (!session?.user) {
      const response = jsonWithSecurity({ ok: true, user: null });
      response.headers.set("Set-Cookie", buildClearedSessionCookie(request));
      return response;
    }

    return jsonWithSecurity({
      ok: true,
      user: sanitizeUserForClient(session.user),
      auth: session.auth,
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const response = jsonWithSecurity({ ok: true, user: null, degraded: true });
      response.headers.set("Set-Cookie", buildClearedSessionCookie(request));
      return response;
    }

    throw error;
  }
}
