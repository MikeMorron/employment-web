import { canWithdrawCandidateApplication } from "@/lib/application-status";
import { buildApplicationNotification } from "@/lib/server/app-state-notifications";
import { requireCandidateUser } from "@/lib/server/api-auth";
import { prisma } from "@/lib/server/db";
import { decodeCandidateApplicationId, encodeApplicationForCandidate } from "@/lib/server/opaque-refs";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";
import type { CandidateApplication } from "@/types/workflows";

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
    scope: "applications-patch",
    maxRequests: 30,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const { id } = await context.params;
  const applicationId = decodeCandidateApplicationId(id);

  try {
    const body = (await request.json()) as { action?: "withdraw" };
    if (body.action !== "withdraw") {
      return jsonWithSecurity({ ok: false, message: "Acción inválida" }, { status: 400 });
    }

    const current = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!current || current.candidateId !== auth.id) {
      return jsonWithSecurity({ ok: false, message: "Postulación no encontrada" }, { status: 404 });
    }

    if (!canWithdrawCandidateApplication(current.status as never)) {
      return jsonWithSecurity({
        ok: true,
        application: encodeApplicationForCandidate({
          id: current.id,
          candidateId: current.candidateId,
          candidateName: current.candidateName,
          jobId: current.jobId,
          vacancyTitle: current.title,
          title: current.title,
          companyName: current.companyName,
          location: current.location,
          modality: current.modality,
          salary: current.salary ?? undefined,
          status: current.status as CandidateApplication["status"],
          appliedAt: current.appliedAt.toISOString(),
          lastUpdatedAt: current.lastUpdatedAt.toISOString(),
          fitLabel: current.fitLabel,
        }),
      });
    }

    const updated = {
      id: current.id,
      candidateId: current.candidateId,
      candidateName: current.candidateName,
      jobId: current.jobId,
      vacancyTitle: current.title,
      title: current.title,
      companyName: current.companyName,
      location: current.location,
      modality: current.modality,
      salary: current.salary ?? undefined,
      status: "withdrawn" as const,
      appliedAt: current.appliedAt.toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      fitLabel: current.fitLabel,
    };
    const notification = buildApplicationNotification(auth.id, updated, "withdrawn");

    await prisma.$transaction([
      prisma.application.update({
        where: { id: applicationId },
        data: {
          status: updated.status,
          lastUpdatedAt: new Date(updated.lastUpdatedAt),
        },
      }),
      prisma.notification.create({
        data: {
          id: notification.id,
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          createdAt: new Date(notification.createdAt),
          read: false,
          applicationId: notification.applicationId ?? null,
          jobId: notification.jobId ?? null,
          status: notification.status ?? updated.status,
        },
      }),
    ]);

    return jsonWithSecurity({ ok: true, application: encodeApplicationForCandidate(updated) });
  } catch {
    return jsonWithSecurity({ ok: false, message: "No se pudo actualizar la postulación" }, { status: 500 });
  }
}
