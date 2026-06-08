import { applicantToCandidateStatus, buildApplicationNotification } from "@/lib/server/app-state-notifications";
import { requireCompanyUser } from "@/lib/server/api-auth";
import { prisma } from "@/lib/server/db";
import { getCompanyCandidateMatch } from "@/lib/matching";
import { presentCompanyJobAsVacancy } from "@/lib/company-jobs";
import { getCompanyCalibrationRecords, recalibrateCompanyMatching } from "@/lib/server/matching-calibration";
import { dbJobToCompanyJobPost } from "@/lib/server/company-job-views";
import { rowToUser } from "@/lib/server/app-state";
import { recordMatchingFeedback } from "@/lib/server/product-engine";
import { queueApplicationStatusChangedEmail } from "@/lib/server/retention-engine";
import { decodeCompanyApplicationIdStrict } from "@/lib/server/opaque-refs";
import { hasCandidateActiveBoost } from "@/lib/candidate-plan";
import { enforceRateLimit, enforceTrustedOrigin, isSafeRouteParam, jsonWithSecurity } from "@/lib/server/security";
import type { CandidateApplication, CompanyApplicant } from "@/types/workflows";

export const runtime = "nodejs";

const ALLOWED_COMPANY_STAGES: CompanyApplicant["stage"][] = [
  "new",
  "review",
  "shortlist",
  "interview",
  "offer",
  "rejected",
];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "company-applications-patch",
    maxRequests: 30,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const { id } = await context.params;
  if (!isSafeRouteParam(id, 240)) {
    return jsonWithSecurity({ ok: false, message: "Identificador inválido" }, { status: 400 });
  }

  const applicationId = decodeCompanyApplicationIdStrict(id);
  if (!applicationId) {
    return jsonWithSecurity({ ok: false, message: "Identificador inválido" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as { stage?: CompanyApplicant["stage"] };
    const stage = body.stage;
    if (!stage || !ALLOWED_COMPANY_STAGES.includes(stage)) {
      return jsonWithSecurity({ ok: false, message: "Etapa inválida" }, { status: 400 });
    }

    let updated: CandidateApplication | null = null;
    let feedbackCandidateId: string | null = null;
    let feedbackJobId: string | null = null;
    let feedbackOutcome: string | null = null;
    const current = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!current) {
      return jsonWithSecurity({ ok: false, message: "Postulación no encontrada" }, { status: 404 });
    }
    const job = await prisma.job.findUnique({
      where: { id: current.jobId },
    });
    if (!job || job.ownerCompanyId !== auth.id) {
      return jsonWithSecurity({ ok: false, message: "Postulación no encontrada" }, { status: 404 });
    }

    updated = {
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
      status: applicantToCandidateStatus(stage),
      appliedAt: current.appliedAt.toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      fitLabel: current.fitLabel,
    };
    feedbackCandidateId = updated.candidateId;
    feedbackJobId = updated.jobId;
    feedbackOutcome = updated.status;

    const candidateNotification = buildApplicationNotification(
      current.candidateId,
      updated,
      updated.status,
    );

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
          id: candidateNotification.id,
          userId: candidateNotification.userId,
          type: candidateNotification.type,
          title: candidateNotification.title,
          message: candidateNotification.message,
          createdAt: new Date(candidateNotification.createdAt),
          read: false,
          applicationId: candidateNotification.applicationId ?? null,
          jobId: candidateNotification.jobId ?? null,
          status: candidateNotification.status ?? updated.status,
        },
      }),
    ]);

    if (!updated) {
      return jsonWithSecurity({ ok: false, message: "Postulación no encontrada" }, { status: 404 });
    }
    const responseApplication = updated as CandidateApplication;

    const scoreDeltaByStage: Record<CompanyApplicant["stage"], number> = {
      new: 0,
      review: 4,
      shortlist: 10,
      interview: 14,
      offer: 20,
      rejected: -12,
    };

    if (feedbackCandidateId && feedbackJobId && feedbackOutcome) {
      const candidateRow = await prisma.user.findUnique({
        where: { id: feedbackCandidateId },
        include: { profile: true },
      });
      const dbJob = await prisma.job.findUnique({
        where: { id: feedbackJobId },
      });
      const candidate = candidateRow?.profile ? rowToUser(candidateRow, candidateRow.profile) : null;
      const calibration = await getCompanyCalibrationRecords(prisma, auth.id);
      const match =
        candidate && candidate.role === "candidate" && dbJob
          ? getCompanyCandidateMatch(presentCompanyJobAsVacancy(dbJobToCompanyJobPost(dbJob)), candidate, {
              calibration,
              ranking: {
                metadata: {
                  isRecentlyActive: Boolean(candidate.bio || candidate.cv),
                  isEntityActive: candidate.profileVisibility !== "private",
                  profileCompleteness:
                    [candidate.cv, candidate.bio, candidate.idiomas?.length, candidate.expectativaSalarial, candidate.modalidadTrabajo]
                      .filter(Boolean)
                      .length / 5,
                  companyPlan: auth.plan,
                  hasActiveBoost: hasCandidateActiveBoost(candidate),
                },
                candidate,
                surface: "company_applicants",
              },
            })
          : null;

      await recordMatchingFeedback(prisma, {
        companyId: auth.id,
        candidateId: feedbackCandidateId,
        jobId: feedbackJobId,
        stage,
        outcome: feedbackOutcome,
        scoreDelta: scoreDeltaByStage[stage],
        context: {
          source: "company_pipeline",
          factors: match?.breakdown ?? {},
        },
      });
      await queueApplicationStatusChangedEmail(prisma, feedbackCandidateId, responseApplication);
      await recalibrateCompanyMatching(prisma, auth.id);
    }

    return jsonWithSecurity({ ok: true, application: responseApplication });
  } catch {
    return jsonWithSecurity({ ok: false, message: "No se pudo mover la postulación" }, { status: 500 });
  }
}
