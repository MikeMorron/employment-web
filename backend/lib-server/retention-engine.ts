/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "node:crypto";
import type { AppState } from "@/lib/server/app-state";
import type { AppUser, CandidateProfile, CompanyProfile } from "@/types/profile";
import type { CandidateApplication } from "@/types/workflows";
import type { ActivationSummary, RetentionTaskRecord } from "@/types/product";
import {
  getCandidateProfileCompleteness,
  getProfileReminderWindowKey,
  LOW_PROFILE_COMPLETENESS_THRESHOLD,
} from "@/lib/server/profile-completeness";
import { normalizeCompanyPlan } from "@/lib/company-plan-model";
import { getPlanLimits } from "@/lib/plans";

type RetentionQueueState = Pick<AppState, "companyJobs" | "applications" | "preferences">;

type RetentionKind =
  | "new_candidate_match"
  | "new_application_received"
  | "pipeline_stalled"
  | "job_low_conversion"
  | "job_expiring"
  | "plan_limit_reached"
  | "recommended_candidates_available"
  | "application_status_changed"
  | "new_matching_job"
  | "profile_incomplete"
  | "saved_job_reminder"
  | "company_invitation_received"
  | "profile_needs_update"
  | "profile_interest_digest";

type DeliveryChannel = "email" | "push" | "in_app";
type DeliveryStatus = "scheduled" | "processing" | "sent" | "retry" | "failed" | "cancelled";

type NotificationPrefs = {
  emailEnabled: boolean;
  pushEnabled: boolean;
  emailFrequency?: "instant" | "daily" | "digest_3d";
  emailTypes?: string[];
};

type QueueTaskInput = {
  userId: string;
  role: "candidate" | "company";
  kind: RetentionKind;
  channel: DeliveryChannel;
  payload: Record<string, unknown>;
  dedupeKey: string;
  scheduledAt: Date;
  status?: DeliveryStatus;
};

type RetentionTaskStore = {
  retentionTask: {
    upsert: (...args: any[]) => PromiseLike<unknown>;
  };
};

const ROLE_DEFAULT_EMAIL_TYPES: Record<"candidate" | "company", RetentionKind[]> = {
  candidate: [
    "application_status_changed",
    "new_matching_job",
    "profile_interest_digest",
    "profile_incomplete",
    "saved_job_reminder",
    "profile_needs_update",
    "company_invitation_received",
  ],
  company: [
    "new_candidate_match",
    "new_application_received",
    "pipeline_stalled",
    "job_low_conversion",
    "job_expiring",
    "plan_limit_reached",
    "recommended_candidates_available",
  ],
};

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toJson(value: unknown) {
  return JSON.stringify(value ?? null);
}

function isCandidate(user: AppUser): user is CandidateProfile {
  return user.role === "candidate";
}

function isCompany(user: AppUser): user is CompanyProfile {
  return user.role === "company";
}

function getUserNotificationPrefs(state: RetentionQueueState, user: AppUser): NotificationPrefs {
  const stored = state.preferences.notificationPrefsByUserId[user.id];
  const roleKey = user.role === "candidate" ? "candidate" : "company";
  return {
    emailEnabled: stored?.emailEnabled ?? true,
    pushEnabled: stored?.pushEnabled ?? false,
    emailFrequency: stored?.emailFrequency ?? "instant",
    emailTypes:
      stored?.emailTypes && stored.emailTypes.length > 0
        ? stored.emailTypes
        : ROLE_DEFAULT_EMAIL_TYPES[roleKey],
  };
}

function isEmailKindEnabled(prefs: NotificationPrefs, kind: RetentionKind) {
  if (!prefs.emailEnabled) {
    return false;
  }

  return !prefs.emailTypes || prefs.emailTypes.length === 0 || prefs.emailTypes.includes(kind);
}

async function upsertRetentionTask(prisma: RetentionTaskStore, task: QueueTaskInput) {
  await prisma.retentionTask.upsert({
    where: {
      userId_dedupeKey: {
        userId: task.userId,
        dedupeKey: task.dedupeKey,
      },
    },
    update: {
      role: task.role,
      kind: task.kind,
      channel: task.channel,
      status: task.status ?? "scheduled",
      payloadJson: toJson(task.payload),
      scheduledAt: task.scheduledAt,
    },
    create: {
      id: randomUUID(),
      userId: task.userId,
      role: task.role,
      kind: task.kind,
      channel: task.channel,
      status: task.status ?? "scheduled",
      dedupeKey: task.dedupeKey,
      payloadJson: toJson(task.payload),
      scheduledAt: task.scheduledAt,
    },
  });
}

export async function queueRetentionTask(
  prisma: RetentionTaskStore,
  task: QueueTaskInput,
) {
  await upsertRetentionTask(prisma, task);
}

function buildCandidateRetentionTasks(
  state: RetentionQueueState,
  user: CandidateProfile,
  _activationSummary: ActivationSummary,
  prefs: NotificationPrefs,
): QueueTaskInput[] {
  const tasks: QueueTaskInput[] = [];
  const savedJobs = state.preferences.savedVacanciesByUserId[user.id] ?? [];
  const categoryMap = state.preferences.categoryInterestByUserId[user.id] ?? {};
  const profileCompleteness = getCandidateProfileCompleteness(user);
  const matchingJobs = state.companyJobs
    .filter((job) => job.status === "published")
    .filter((job) => job.tags.some((tag) => (categoryMap[tag] ?? 0) >= 5))
    .slice(0, 4);

  if (
    profileCompleteness < LOW_PROFILE_COMPLETENESS_THRESHOLD &&
    isEmailKindEnabled(prefs, "profile_incomplete")
  ) {
    tasks.push({
      userId: user.id,
      role: "candidate",
      kind: "profile_incomplete",
      channel: "email",
      dedupeKey: `profile-incomplete:${user.id}:${getProfileReminderWindowKey()}`,
      scheduledAt: new Date(Date.now() + 1000 * 60 * 30),
      payload: {
        title: "Completa tu perfil",
        ctaHref: "/perfil/me",
        profileCompleteness,
      },
    });
  }

  if (matchingJobs.length > 0 && isEmailKindEnabled(prefs, "new_matching_job")) {
    tasks.push({
      userId: user.id,
      role: "candidate",
      kind: "new_matching_job",
      channel: "email",
      dedupeKey: `matching-jobs:${user.id}:${new Date().toISOString().slice(0, 10)}`,
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60),
      payload: {
        jobs: matchingJobs.map((job) => ({ id: job.id, title: job.title, companyName: job.companyName })),
        ctaHref: "/vacantes",
      },
    });
  }

  if (savedJobs.length > 0 && isEmailKindEnabled(prefs, "saved_job_reminder")) {
    tasks.push({
      userId: user.id,
      role: "candidate",
      kind: "saved_job_reminder",
      channel: "email",
      dedupeKey: `saved-job-reminder:${user.id}:${prefs.emailFrequency ?? "instant"}`,
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 6),
      payload: {
        count: savedJobs.length,
        ctaHref: "/guardado",
      },
    });
  }

  return tasks;
}

function buildCompanyRetentionTasks(
  state: RetentionQueueState,
  user: CompanyProfile,
  activationSummary: ActivationSummary,
  prefs: NotificationPrefs,
): QueueTaskInput[] {
  const tasks: QueueTaskInput[] = [];
  const jobs = state.companyJobs.filter((job) => job.ownerCompanyId === user.id);
  const applicants = state.applications.filter(
    (application) => jobs.some((job) => job.id === application.jobId) && application.status !== "withdrawn",
  );
  const pendingReview = applicants.filter(
    (application) =>
      application.status === "application_submitted" || application.status === "application_received",
  );
  const highMatchCount = applicants.filter((application) => Number(application.fitLabel.replace(/[^\d]/g, "")) >= 85).length;
  const staleJobs = jobs.filter(
    (job) =>
      job.status === "published" &&
      !applicants.some((application) => application.jobId === job.id) &&
      Date.now() - new Date(job.updatedAt).getTime() >= 1000 * 60 * 60 * 24 * 3,
  );
  const planLimits = getPlanLimits("company", normalizeCompanyPlan(user.plan));
  const activeJobsLimit = ("activeJobs" in planLimits ? planLimits.activeJobs : 1) ?? 1;

  if (pendingReview.length > 0 && isEmailKindEnabled(prefs, "pipeline_stalled")) {
    tasks.push({
      userId: user.id,
      role: "company",
      kind: "pipeline_stalled",
      channel: "email",
      dedupeKey: `pipeline-stalled:${user.id}:${prefs.emailFrequency ?? "instant"}`,
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60),
      payload: {
        count: pendingReview.length,
        ctaHref: "/publicadas",
      },
    });
  }

  if (highMatchCount > 0 && isEmailKindEnabled(prefs, "recommended_candidates_available")) {
    tasks.push({
      userId: user.id,
      role: "company",
      kind: "recommended_candidates_available",
      channel: "email",
      dedupeKey: `recommended-candidates:${user.id}:${new Date().toISOString().slice(0, 10)}`,
      scheduledAt: new Date(Date.now() + 1000 * 60 * 45),
      payload: {
        count: highMatchCount,
        ctaHref: "/candidatos",
      },
    });
  }

  if (staleJobs.length > 0 && isEmailKindEnabled(prefs, "job_low_conversion")) {
    tasks.push({
      userId: user.id,
      role: "company",
      kind: "job_low_conversion",
      channel: "email",
      dedupeKey: `job-low-conversion:${user.id}:${prefs.emailFrequency ?? "instant"}`,
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 2),
      payload: {
        jobs: staleJobs.map((job) => ({ id: job.id, title: job.title })),
        ctaHref: "/publicadas",
      },
    });
  }

  if (jobs.filter((job) => ["draft", "published", "paused"].includes(job.status)).length >= activeJobsLimit && isEmailKindEnabled(prefs, "plan_limit_reached")) {
    tasks.push({
      userId: user.id,
      role: "company",
      kind: "plan_limit_reached",
      channel: "email",
      dedupeKey: `plan-limit:${user.id}:${prefs.emailFrequency ?? "instant"}`,
      scheduledAt: new Date(Date.now() + 1000 * 60 * 90),
      payload: {
        activeJobsLimit,
        ctaHref: "/ajustes",
      },
    });
  }

  if (!activationSummary.firstValueReached && isEmailKindEnabled(prefs, "recommended_candidates_available")) {
    tasks.push({
      userId: user.id,
      role: "company",
      kind: "recommended_candidates_available",
      channel: "in_app",
      dedupeKey: `company-first-value:${user.id}`,
      scheduledAt: new Date(Date.now() + 1000 * 60 * 30),
      payload: {
        count: highMatchCount,
        ctaHref: "/candidatos",
      },
    });
  }

  return tasks;
}

export async function syncRetentionQueueForUser(
  prisma: RetentionTaskStore,
  state: RetentionQueueState,
  user: AppUser,
  activationSummary: ActivationSummary,
) {
  const prefs = getUserNotificationPrefs(state, user);
  const tasks = isCandidate(user)
    ? buildCandidateRetentionTasks(state, user, activationSummary, prefs)
    : isCompany(user)
      ? buildCompanyRetentionTasks(state, user, activationSummary, prefs)
      : [];

  for (const task of tasks) {
    await upsertRetentionTask(prisma, task);
  }

  return tasks;
}

export async function queueApplicationReceivedEmail(
  prisma: RetentionTaskStore,
  companyUserId: string,
  application: CandidateApplication,
) {
  const { getUserPreferenceSnapshot } = await import("@/lib/server/preferences-store");
  const snapshot = await getUserPreferenceSnapshot(companyUserId);
  if (
    !snapshot.notificationEmailEnabled ||
    (snapshot.emailTypes.length > 0 && !snapshot.emailTypes.includes("new_application_received"))
  ) {
    return;
  }

  await upsertRetentionTask(prisma, {
    userId: companyUserId,
    role: "company",
    kind: "new_application_received",
    channel: "email",
    status: "scheduled",
    dedupeKey: `new-application:${companyUserId}:${application.id}`,
    scheduledAt: new Date(Date.now() + 1000 * 60 * 5),
    payload: {
      applicationId: application.id,
      candidateName: application.candidateName,
      title: application.title,
      ctaHref: "/publicadas",
    },
  });
}

export async function queueApplicationStatusChangedEmail(
  prisma: RetentionTaskStore,
  candidateUserId: string,
  application: CandidateApplication,
) {
  const { getUserPreferenceSnapshot } = await import("@/lib/server/preferences-store");
  const snapshot = await getUserPreferenceSnapshot(candidateUserId);
  if (
    !snapshot.notificationEmailEnabled ||
    (snapshot.emailTypes.length > 0 && !snapshot.emailTypes.includes("application_status_changed"))
  ) {
    return;
  }

  await upsertRetentionTask(prisma, {
    userId: candidateUserId,
    role: "candidate",
    kind: "application_status_changed",
    channel: "email",
    status: "scheduled",
    dedupeKey: `application-status:${candidateUserId}:${application.id}:${application.status}`,
    scheduledAt: new Date(Date.now() + 1000 * 60 * 5),
    payload: {
      applicationId: application.id,
      status: application.status,
      companyName: application.companyName,
      title: application.title,
      ctaHref: "/postulaciones",
    },
  });
}

export function mapRetentionTaskRecord(record: {
  id: string;
  kind: string;
  channel: string;
  status: string;
  role: string;
  scheduledAt: Date;
  sentAt: Date | null;
  providerMessageId: string | null;
  retries: number;
  lastError: string | null;
  payloadJson: string | null;
}): RetentionTaskRecord {
  return {
    id: record.id,
    kind: record.kind,
    channel: record.channel,
    status: record.status,
    role: record.role,
    scheduledAt: record.scheduledAt.toISOString(),
    sentAt: record.sentAt?.toISOString() ?? null,
    providerMessageId: record.providerMessageId,
    retries: record.retries,
    lastError: record.lastError,
    payload: parseJson<Record<string, unknown> | null>(record.payloadJson, null),
  };
}
