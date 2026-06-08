import { requireCompanyUser } from "@/lib/server/api-auth";
import { createCompanyChatInvite } from "@/backend/lib-server/chat-service";
import {
  decodeCompanyApplicationId,
  decodeCompanyApplicationIdStrict,
  decodeCompanyCandidateId,
  decodeCompanyCandidateIdStrict,
} from "@/lib/server/opaque-refs";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "chat-invite-create",
    maxRequests: 20,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const body = (await request.json()) as { applicationId?: string; candidateId?: string };
    const rawApplicationId = body.applicationId?.trim() ?? "";
    const rawCandidateId = body.candidateId?.trim() ?? "";
    const applicationId =
      decodeCompanyApplicationIdStrict(rawApplicationId) ??
      decodeCompanyApplicationId(rawApplicationId);
    const candidateId =
      decodeCompanyCandidateIdStrict(rawCandidateId) ??
      decodeCompanyCandidateId(rawCandidateId);

    if (!applicationId && !candidateId) {
      return jsonWithSecurity({ ok: false, message: "Postulación o candidato inválido" }, { status: 400 });
    }

    const result = await createCompanyChatInvite({
      companyUserId: auth.id,
      applicationId,
      candidateUserId: candidateId,
    });

    return jsonWithSecurity({
      ok: true,
      inviteId: result.inviteId,
      candidateId: result.candidateId,
      sentAt: result.sentAt,
      notificationDelivered: result.notificationDelivered,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo crear la invitación";

    const mappedMessage =
      message === "APPLICATION_NOT_FOUND"
        ? "La postulación no existe o no pertenece a tu empresa"
        : message === "APPLICATION_NOT_ACTIVE"
          ? "Solo puedes invitar postulaciones activas del proceso"
          : message === "APPLICATION_REQUIRED"
            ? "Este perfil debe postularse primero o tener un boost activo para poder invitarlo."
            : message === "NO_PUBLISHED_JOB_AVAILABLE"
              ? "Publica al menos una vacante activa antes de invitar candidatos sin postulación."
              : message === "CANDIDATE_NOT_FOUND"
                ? "No se encontró el candidato para crear la invitación."
            : message === "AUTO_MESSAGE_REQUIRED"
              ? "Define primero el mensaje automático en Ajustes"
            : message === "INVITE_NOTIFICATION_FAILED"
              ? "La invitación no pudo entregarse en la bandeja de notificaciones. Inténtalo de nuevo."
            : message === "CONVERSATION_ALREADY_ACTIVE"
              ? "Ya existe un chat activo para esta postulación"
              : message === "INVITE_ALREADY_PENDING"
                ? "Ya hay una invitación pendiente para esta postulación"
                : message === "INVITE_COOLDOWN_ACTIVE"
                  ? "Debes esperar antes de volver a invitar a este candidato"
                  : "No se pudo crear la invitación";

    const status =
      message === "APPLICATION_NOT_FOUND"
        ? 404
        : message === "CANDIDATE_NOT_FOUND"
          ? 404
          : message === "NO_PUBLISHED_JOB_AVAILABLE" || message === "APPLICATION_REQUIRED"
            ? 409
        : message === "AUTO_MESSAGE_REQUIRED"
          ? 400
          : message === "INVITE_NOTIFICATION_FAILED"
            ? 503
          : message === "INVITE_ALREADY_PENDING" ||
              message === "INVITE_COOLDOWN_ACTIVE" ||
              message === "CONVERSATION_ALREADY_ACTIVE"
            ? 409
            : 400;

    return jsonWithSecurity({ ok: false, message: mappedMessage }, { status });
  }
}
