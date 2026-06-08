import type { ProductNotification } from "@/types/notifications";
import type { RetentionTaskRecord } from "@/types/product";
import type { AppUser } from "@/types/profile";
import {
  buildNotification,
  buildSharedRetentionMessage,
  type ProductState,
  uniqueNotifications,
} from "@/lib/server/product-engine-notification-utils";

function buildCompanyRetentionMessage(task: RetentionTaskRecord) {
  return buildSharedRetentionMessage(task);
}

export function getCompanyApplicants(state: ProductState, companyId: string) {
  const jobs = state.companyJobs.filter((job) => job.ownerCompanyId === companyId);
  const jobById = new Map(jobs.map((job) => [job.id, job]));

  return state.applications
    .filter((application) => jobById.has(application.jobId) && application.status !== "withdrawn")
    .map((application) => ({
      ...application,
      jobTitle: jobById.get(application.jobId)?.title ?? application.title,
      stage:
        application.status === "application_submitted" || application.status === "application_received"
          ? "new"
          : application.status === "in_review"
            ? "review"
            : application.status === "shortlisted"
              ? "shortlist"
              : application.status === "in_evaluation"
                ? "interview"
                : application.status === "offer_sent"
                  ? "offer"
                  : "rejected",
      matchScore: Number(application.fitLabel.replace(/[^\d]/g, "")) || 0,
      candidateId: application.candidateId,
      appliedAt: application.appliedAt,
    }));
}

export function buildCompanyNotifications(
  state: ProductState,
  user: AppUser,
  retentionTasks: RetentionTaskRecord[],
) {
  const companyJobs = state.companyJobs.filter((job) => job.ownerCompanyId === user.id);
  const applicants = getCompanyApplicants(state, user.id);
  const pendingReview = applicants.filter((item) => item.stage === "new");
  const highMatchCandidates = applicants.filter((item) => item.matchScore >= 85 && item.stage === "new");
  const staleJobs = companyJobs.filter(
    (job) =>
      job.status === "published" &&
      !state.applications.some((application) => application.jobId === job.id && application.status !== "withdrawn"),
  );

  const notifications: ProductNotification[] = [];

  if (pendingReview.length > 0) {
    notifications.push(
      buildNotification({
        id: `company-pending-review:${user.id}`,
        userId: user.id,
        type: "company_pending_review",
        category: "workflow",
        title: "Tienes candidatos sin revisar",
        message: `${pendingReview.length} candidatos nuevos siguen pendientes de revisión en tu pipeline.`,
        status: "pending_review",
        linkHref: "/publicadas",
      }),
    );
  }

  for (const candidate of highMatchCandidates.slice(0, 3)) {
    notifications.push(
      buildNotification({
        id: `company-high-match:${user.id}:${candidate.id}`,
        userId: user.id,
        type: "company_high_match_candidate",
        category: "insight",
        title: `Nuevo candidato alto match para ${candidate.jobTitle}`,
        message: `${candidate.candidateName} entra con ${candidate.matchScore}% de match y merece revisión prioritaria.`,
        entityId: candidate.candidateId ?? candidate.id,
        jobId: candidate.jobId,
        status: "high_match",
        linkHref: "/candidatos",
      }),
    );
  }

  for (const job of staleJobs.slice(0, 2)) {
    notifications.push(
      buildNotification({
        id: `company-job-stale:${user.id}:${job.id}`,
        userId: user.id,
        type: "company_job_stale",
        category: "retention",
        title: `Vacante sin actividad: ${job.title}`,
        message: "Esta vacante lleva sin movimiento reciente. Ajusta copy, salario o filtros para reactivarla.",
        entityId: job.id,
        jobId: job.id,
        status: "stale",
        linkHref: "/publicadas",
      }),
    );
  }

  const retentionNotifications = retentionTasks
    .filter((task) => task.status === "scheduled")
    .slice(0, 2)
    .flatMap((task) => {
      const message = buildCompanyRetentionMessage(task);
      if (!message) {
        return [];
      }

      return [
        buildNotification({
          id: `retention:${task.id}`,
          userId: user.id,
          type: "retention_reminder",
          category: "retention",
          title: String(task.payload?.title ?? "Vuelve a tu operación"),
          message,
          entityId: task.id,
          status: task.status,
          linkHref: typeof task.payload?.ctaHref === "string" ? task.payload.ctaHref : "/candidatos",
          metadata: { kind: task.kind },
        }),
      ];
    });

  return uniqueNotifications([...notifications, ...retentionNotifications]);
}
