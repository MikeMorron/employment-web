import { randomUUID } from "node:crypto";
/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ActivationMilestoneRecord,
  ActivationSummary,
} from "@/types/product";
import type { AppState } from "@/lib/server/app-state";
import type { AppUser, CandidateProfile, CompanyProfile } from "@/types/profile";
import { mapRetentionTaskRecord, syncRetentionQueueForUser } from "@/lib/server/retention-engine";
import { buildDerivedNotifications, getCompanyApplicants } from "@/lib/server/product-engine-notifications";
import {
  getCandidateProfileCompleteness,
} from "@/lib/server/candidate/profile-completeness";
import {
  getCompanyProfileCompleteness,
} from "@/lib/server/company/profile-completeness";

type ProductState = Pick<AppState, "companyJobs" | "applications" | "preferences">;

export { buildDerivedNotifications };

function toJson(value: unknown) {
  return JSON.stringify(value ?? null);
}

function isCandidate(user: AppUser): user is CandidateProfile {
  return user.role === "candidate";
}

function isCompany(user: AppUser): user is CompanyProfile {
  return user.role === "company";
}

export function getActivationSummary(state: ProductState, user: AppUser): ActivationSummary {
  if (isCandidate(user)) {
    const applications = state.applications.filter((item) => item.candidateId === user.id);
    const savedJobs = state.preferences.savedVacanciesByUserId[user.id] ?? [];
    const profileScore = getCandidateProfileCompleteness(user);
    const milestones: ActivationMilestoneRecord[] = [
      {
        key: "candidate_profile_complete",
        title: "Completa tu perfil",
        description: "Agrega skills, experiencia, CV y salario para subir tu visibilidad.",
        status: profileScore >= 80 ? "completed" : profileScore > 0 ? "in_progress" : "locked",
        score: profileScore,
        completedAt: profileScore >= 80 ? new Date().toISOString() : null,
        ctaHref: "/perfil/me",
      },
      {
        key: "candidate_first_saved_job",
        title: "Guarda una vacante",
        description: "Empieza a construir shortlist para volver más rápido.",
        status: savedJobs.length > 0 ? "completed" : "locked",
        score: savedJobs.length > 0 ? 100 : 0,
        completedAt: savedJobs.length > 0 ? new Date().toISOString() : null,
        ctaHref: "/vacantes",
      },
      {
        key: "candidate_first_application",
        title: "Aplica a tu primera vacante",
        description: "Ese es el primer valor real del producto para candidato.",
        status: applications.length > 0 ? "completed" : "locked",
        score: applications.length > 0 ? 100 : 0,
        completedAt: applications[0]?.appliedAt ?? null,
        ctaHref: "/vacantes",
      },
      {
        key: "candidate_visibility_enabled",
        title: "Activa tu visibilidad",
        description: "Haz visible tu perfil para reclutadores y mejora tu ranking.",
        status:
          user.profileVisibility === "public" || user.profileVisibility === "recruiters_only"
            ? "completed"
            : "locked",
        score:
          user.profileVisibility === "public" || user.profileVisibility === "recruiters_only"
            ? 100
            : 0,
        completedAt:
          user.profileVisibility === "public" || user.profileVisibility === "recruiters_only"
            ? new Date().toISOString()
            : null,
        ctaHref: "/perfil/me",
      },
    ];

    return {
      role: "candidate",
      progressPercent: Math.round(
        milestones.reduce((sum, item) => sum + item.score, 0) / Math.max(milestones.length, 1),
      ),
      firstValueReached: applications.length > 0,
      firstValueLabel: "Aplicó a 1 vacante",
      milestones,
    };
  }

  if (!isCompany(user)) {
    return {
      role: "company",
      progressPercent: 100,
      firstValueReached: true,
      firstValueLabel: "Admin activo",
      milestones: [],
    };
  }

  const companyJobs = state.companyJobs.filter((job) => job.ownerCompanyId === user.id);
  const applicants = getCompanyApplicants(state, user.id);
  const profileScore = getCompanyProfileCompleteness(user);
  const milestones: ActivationMilestoneRecord[] = [
    {
      key: "company_profile_complete",
      title: "Completa el perfil empresa",
      description: "Website, cultura, beneficios y ubicación elevan confianza.",
      status: profileScore >= 70 ? "completed" : profileScore > 0 ? "in_progress" : "locked",
      score: profileScore,
      completedAt: profileScore >= 70 ? new Date().toISOString() : null,
      ctaHref: "/perfil/me",
    },
    {
      key: "company_first_job_published",
      title: "Publica tu primera vacante",
      description: "Ese es el primer paso para activar demanda real.",
      status: companyJobs.some((job) => job.status === "published") ? "completed" : "locked",
      score: companyJobs.some((job) => job.status === "published") ? 100 : 0,
      completedAt:
        companyJobs.find((job) => job.status === "published")?.createdAt ?? null,
      ctaHref: "/publicadas",
    },
    {
      key: "company_first_candidate_received",
      title: "Recibe tu primer candidato",
      description: "Ese es el primer valor real del producto para empresa.",
      status: applicants.length > 0 ? "completed" : "locked",
      score: applicants.length > 0 ? 100 : 0,
      completedAt: applicants[0]?.appliedAt ?? null,
      ctaHref: "/candidatos",
    },
    {
      key: "company_first_pipeline_move",
      title: "Mueve un candidato en pipeline",
      description: "Convierte descubrimiento en proceso operativo real.",
      status: applicants.some((item) => item.stage !== "new") ? "completed" : "locked",
      score: applicants.some((item) => item.stage !== "new") ? 100 : 0,
      completedAt: applicants.some((item) => item.stage !== "new") ? new Date().toISOString() : null,
      ctaHref: "/publicadas",
    },
  ];

  return {
    role: "company",
    progressPercent: Math.round(
      milestones.reduce((sum, item) => sum + item.score, 0) / Math.max(milestones.length, 1),
    ),
    firstValueReached: applicants.length > 0,
    firstValueLabel: "Recibió 1 candidato",
    milestones,
  };
}

export async function syncActivationMilestones(
  prisma: {
    $transaction: (args: any[]) => PromiseLike<unknown>;
    activationMilestone: {
      upsert: (...args: any[]) => unknown;
    };
  },
  state: ProductState,
  user: AppUser,
) {
  const summary = getActivationSummary(state, user);

  await prisma.$transaction(
    summary.milestones.map((milestone) =>
      prisma.activationMilestone.upsert({
        where: {
          userId_key: {
            userId: user.id,
            key: milestone.key,
          },
        },
        update: {
          status: milestone.status,
          score: milestone.score,
          detailsJson: toJson({
            title: milestone.title,
            description: milestone.description,
            ctaHref: milestone.ctaHref,
          }),
          completedAt: milestone.completedAt ? new Date(milestone.completedAt) : null,
        },
        create: {
          id: `${user.id}:${milestone.key}`,
          userId: user.id,
          key: milestone.key,
          status: milestone.status,
          score: milestone.score,
          detailsJson: toJson({
            title: milestone.title,
            description: milestone.description,
            ctaHref: milestone.ctaHref,
          }),
          completedAt: milestone.completedAt ? new Date(milestone.completedAt) : null,
        },
      }),
    ),
  );

  return summary;
}

export async function syncRetentionTasks(
  prisma: {
    retentionTask: {
      findMany: (args: any) => PromiseLike<Array<{
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
      }>>;
    };
  },
  state: ProductState,
  summary: ActivationSummary,
  user: AppUser,
  userId: string,
) {
  if (user.role === "admin") {
    return [];
  }

  await syncRetentionQueueForUser(prisma as any, state, user, summary);

  const records = await prisma.retentionTask.findMany({
    where: { userId },
    orderBy: { scheduledAt: "asc" },
  });

  return records.map(mapRetentionTaskRecord);
}

export async function recordMatchingFeedback(
  prisma: {
    matchingFeedback: {
      create: (...args: any[]) => PromiseLike<unknown>;
    };
  },
  input: {
    companyId: string;
    candidateId: string;
    jobId: string;
    stage: string;
    outcome: string;
    scoreDelta: number;
    context?: Record<string, unknown>;
  },
) {
  await prisma.matchingFeedback.create({
    data: {
      id: randomUUID(),
      companyId: input.companyId,
      candidateId: input.candidateId,
      jobId: input.jobId,
      stage: input.stage,
      outcome: input.outcome,
      scoreDelta: input.scoreDelta,
      contextJson: toJson(input.context),
    },
  });
}

export async function getFeedbackSummary(
  prisma: {
    matchingFeedback: {
      findMany: (...args: any[]) => PromiseLike<Array<{ scoreDelta: number }>>;
    };
  },
  companyId: string,
) {
  const rows = await prisma.matchingFeedback.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const accepted = rows.filter((row) => row.scoreDelta > 0).length;
  const rejected = rows.filter((row) => row.scoreDelta < 0).length;

  return {
    acceptedSignals: accepted,
    rejectedSignals: rejected,
    totalSignals: rows.length,
    averageDelta:
      rows.length > 0
        ? Math.round(rows.reduce((sum, row) => sum + row.scoreDelta, 0) / rows.length)
        : 0,
  };
}
