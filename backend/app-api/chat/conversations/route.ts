import { requireAuthUser } from "@/lib/server/api-auth";
import { listChatSurfaceForUser } from "@/backend/lib-server/chat-service";
import { isMissingTableError } from "@/lib/server/db-errors";
import { enforceRateLimit, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "chat-conversations-read",
    maxRequests: 90,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const surface = await listChatSurfaceForUser(auth);
    return jsonWithSecurity({ ok: true, ...surface });
  } catch (error) {
    if (isMissingTableError(error)) {
      return jsonWithSecurity({
        ok: true,
        conversations: [],
        pendingInvites: [],
        degraded: true,
        message: "El sistema de chat aún no está migrado en la base de datos.",
      });
    }

    throw error;
  }
}
