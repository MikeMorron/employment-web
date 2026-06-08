import type { RetentionTaskRecord } from "@/types/product";
import type { CandidateProfile } from "@/types/profile";
import {
  buildNotification,
  buildSharedRetentionMessage,
  type ProductState,
  uniqueNotifications,
} from "@/lib/server/product-engine-notification-utils";

function buildCandidateRetentionMessage(task: RetentionTaskRecord) {
  return buildSharedRetentionMessage(task)
    ?? "Todavía no llegas a tu primer valor. Completa este paso para destrabar el producto.";
}

export function buildCandidateNotifications(
  state: ProductState,
  user: CandidateProfile,
  retentionTasks: RetentionTaskRecord[],
) {
  const highInterestCategories = Object.entries(
    state.preferences.categoryInterestByUserId[user.id] ?? {},
  )
    .filter(([, clicks]) => clicks >= 5)
    .map(([category]) => category);

  const recommendedJobs = state.companyJobs
    .filter((job) => job.status === "published")
    .filter((job) => highInterestCategories.some((category) => job.tags.includes(category)))
    .slice(0, 3)
    .map((job) =>
      buildNotification({
        id: `recommended-job:${user.id}:${job.id}`,
        userId: user.id,
        type: "recommended_job",
        category: "insight",
        title: `Nueva vacante para ${job.title}`,
        message: `${job.companyName} publicó una vacante que encaja con las categorías que vienes explorando.`,
        jobId: job.id,
        entityId: job.id,
        status: "recommended",
        linkHref: `/vacantes?q=${encodeURIComponent(job.title)}`,
      }),
    );

  const retentionNotifications = retentionTasks
    .filter((task) => task.status === "scheduled")
    .slice(0, 2)
    .map((task) =>
      buildNotification({
        id: `retention:${task.id}`,
        userId: user.id,
        type: "retention_reminder",
        category: "retention",
        title: String(task.payload?.title ?? "Sigue avanzando"),
        message: buildCandidateRetentionMessage(task),
        entityId: task.id,
        status: task.status,
        linkHref: typeof task.payload?.ctaHref === "string" ? task.payload.ctaHref : "/vacantes",
        metadata:
          task.kind === "profile_incomplete"
            ? { consumeOnDelivery: true, kind: task.kind, actionLabel: "Completar perfil" }
            : task.kind === "saved_job_reminder"
              ? { kind: task.kind, actionLabel: "Ver guardadas" }
              : { kind: task.kind },
      }),
    );

  return uniqueNotifications([
    ...recommendedJobs,
    ...retentionNotifications,
  ]);
}
