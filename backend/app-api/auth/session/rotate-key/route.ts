import { sanitizeUserForClient } from "@/lib/server/app-state";
import {
  issueSessionBundleFromRequest,
  rotateSigningKey,
  validateRefreshSessionCsrf,
} from "@/lib/server/session-security";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "auth-rotate-key",
    maxRequests: 20,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const sessionContext = await validateRefreshSessionCsrf(request);
  if (!sessionContext) {
    return jsonWithSecurity({ ok: false, message: "Sesión inválida" }, { status: 401 });
  }

  const rotated = await rotateSigningKey(sessionContext.session.sessionId);
  if (!rotated) {
    return jsonWithSecurity({ ok: false, message: "No se pudo rotar la clave" }, { status: 401 });
  }

  const bundle = await issueSessionBundleFromRequest(request);
  if (!bundle) {
    return jsonWithSecurity({ ok: false, message: "No se pudo emitir la sesión" }, { status: 401 });
  }

  return jsonWithSecurity({
    ok: true,
    user: sanitizeUserForClient(bundle.user),
    auth: bundle.auth,
  });
}
