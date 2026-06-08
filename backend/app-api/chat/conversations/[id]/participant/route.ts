import { requireAuthUser } from "@/lib/server/api-auth";
import { reportChatConversation, updateConversationParticipantState } from "@/backend/lib-server/chat-service";
import { enforceTrustedOrigin, isSafeRouteParam, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const { id } = await context.params;
  if (!isSafeRouteParam(id, 200)) {
    return jsonWithSecurity({ ok: false, message: "Conversación inválida" }, { status: 400 });
  }

  const body = (await request.json()) as {
    muted?: boolean;
    blocked?: boolean;
    markRead?: boolean;
    reportReason?: string;
  };

  try {
    if (typeof body.reportReason === "string" && body.reportReason.trim()) {
      await reportChatConversation({
        userId: auth.id,
        conversationId: id,
        reason: body.reportReason,
      });
      return jsonWithSecurity({ ok: true });
    }

    await updateConversationParticipantState({
      userId: auth.id,
      conversationId: id,
      muted: typeof body.muted === "boolean" ? body.muted : undefined,
      blocked: typeof body.blocked === "boolean" ? body.blocked : undefined,
      markRead: body.markRead === true,
    });

    return jsonWithSecurity({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la conversación";
    return jsonWithSecurity(
      { ok: false, message: message === "REPORT_REASON_REQUIRED" ? "Debes escribir un motivo" : "No se pudo actualizar la conversación" },
      { status: message === "CONVERSATION_NOT_FOUND" ? 404 : 400 },
    );
  }
}
