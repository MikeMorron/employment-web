import { requireAuthUser } from "@/lib/server/api-auth";
import { sendChatMessage } from "@/backend/lib-server/chat-service";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "chat-send-message",
    maxRequests: 40,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const body = (await request.json()) as {
      conversationId?: string;
      body?: string;
    };

    if (!body.conversationId?.trim()) {
      return jsonWithSecurity({ ok: false, message: "Conversación inválida" }, { status: 400 });
    }

    const result = await sendChatMessage({
      user: auth,
      conversationId: body.conversationId.trim(),
      body: body.body ?? "",
    });

    return jsonWithSecurity({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar el mensaje";
    const mappedMessage =
      message === "EMPTY_MESSAGE"
        ? "Escribe un mensaje antes de enviarlo"
        : message === "CONVERSATION_NOT_FOUND"
          ? "La conversación no existe"
          : message === "CONVERSATION_CLOSED"
            ? "La conversación ya no permite mensajes"
            : message === "CONVERSATION_BLOCKED_BY_YOU"
              ? "Bloqueaste esta conversación"
              : message === "CONVERSATION_BLOCKED_BY_PEER"
                ? "La otra persona bloqueó esta conversación"
                : message === "COOLDOWN_ACTIVE"
                  ? "Debes esperar unos segundos antes de volver a escribir"
                  : message === "USER_SUSPENDED_FOR_REVIEW"
                    ? "Tu cuenta quedó suspendida para revisión manual"
                    : "No se pudo enviar el mensaje";

    const status =
      message === "CONVERSATION_NOT_FOUND"
        ? 404
        : message === "COOLDOWN_ACTIVE" ||
            message === "CONVERSATION_BLOCKED_BY_YOU" ||
            message === "CONVERSATION_BLOCKED_BY_PEER" ||
            message === "USER_SUSPENDED_FOR_REVIEW"
          ? 423
          : 400;

    return jsonWithSecurity({ ok: false, message: mappedMessage }, { status });
  }
}
