import { requireCandidateUser } from "@/lib/server/api-auth";
import { respondToChatInvite } from "@/backend/lib-server/chat-service";
import { enforceRateLimit, enforceTrustedOrigin, isSafeRouteParam, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const auth = await requireCandidateUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "chat-invite-respond",
    maxRequests: 20,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const { id } = await context.params;
  if (!isSafeRouteParam(id, 200)) {
    return jsonWithSecurity({ ok: false, message: "Invitación inválida" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as { action?: "accept" | "reject" };
    if (body.action !== "accept" && body.action !== "reject") {
      return jsonWithSecurity({ ok: false, message: "Acción inválida" }, { status: 400 });
    }

    const result = await respondToChatInvite({
      candidateUserId: auth.id,
      inviteId: id,
      action: body.action,
    });

    return jsonWithSecurity({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "INVITE_NOT_FOUND"
        ? "La invitación ya no está disponible"
        : "No se pudo responder la invitación";

    return jsonWithSecurity({ ok: false, message }, { status: 404 });
  }
}
