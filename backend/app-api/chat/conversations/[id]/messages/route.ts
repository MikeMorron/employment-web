import { requireAuthUser } from "@/lib/server/api-auth";
import { listConversationMessagesPage } from "@/backend/lib-server/chat-service";
import { enforceRateLimit, isSafeRouteParam, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "chat-messages-read",
    maxRequests: 120,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const { id } = await context.params;
  if (!isSafeRouteParam(id, 200)) {
    return jsonWithSecurity({ ok: false, message: "Conversación inválida" }, { status: 400 });
  }

  const url = new URL(request.url);
  const before = url.searchParams.get("before");

  try {
    const result = await listConversationMessagesPage({
      userId: auth.id,
      conversationId: id,
      before,
      limit: 20,
    });

    return jsonWithSecurity({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar los mensajes";
    return jsonWithSecurity(
      {
        ok: false,
        message:
          message === "INVALID_CURSOR"
            ? "Cursor inválido"
            : message === "CONVERSATION_NOT_FOUND"
              ? "La conversación no existe"
              : "No se pudieron cargar los mensajes",
      },
      { status: message === "CONVERSATION_NOT_FOUND" ? 404 : 400 },
    );
  }
}
