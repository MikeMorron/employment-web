import { presentCompanyJobAsVacancy } from "@/lib/company-jobs";
import { getCandidateJobMatch } from "@/lib/matching";
import { getMarketplaceVacancyById } from "@/lib/server/marketplace-vacancies";
import {
  createApplicationId,
} from "@/lib/server/app-state";
import { buildApplicationNotification } from "@/lib/server/app-state-notifications";
import { parseCandidatePlanState } from "@/lib/server/candidate-plan-state";
import { prisma } from "@/lib/server/db";
import { decodeCandidateJobId, encodeApplicationForCandidate } from "@/lib/server/opaque-refs";
import { queueApplicationReceivedEmail } from "@/lib/server/retention-engine";
import { requireCandidatePlanContext } from "@/lib/server/plan-middleware";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";
import {
  isActiveCandidateApplicationStatus,
  normalizeCandidateApplicationStatus,
} from "@/lib/application-status";
import type { Vacancy } from "@/types/vacancy";
import type { CandidateApplication, CompanyJobPost } from "@/types/workflows";

export const runtime = "nodejs";

const ARCHIVED_APPLICATION_STATUSES = new Set([
  "withdrawn",
  "rejected",
  "not_selected",
  "process_closed",
  "vacancy_cancelled",
  "offer_rejected",
]);

function isQuotaConsumingApplicationStatus(status: unknown) {
  return isActiveCandidateApplicationStatus(
    normalizeCandidateApplicationStatus(String(status) as CandidateApplication["status"]),
  );
}

async function findVacancy(jobId: string): Promise<Vacancy | null> {
  const marketplace = await getMarketplaceVacancyById(jobId);
  if (marketplace) {
    return marketplace;
  }

  const companyJob = await prisma.job.findUnique({
    where: { id: jobId },
  });
  if (!companyJob) {
    return null;
  }

  return presentCompanyJobAsVacancy({
    id: companyJob.id,
    ownerCompanyId: companyJob.ownerCompanyId,
    companyName: companyJob.companyName,
    title: companyJob.title,
    location: companyJob.location,
    modality: companyJob.modality,
    salary: companyJob.salary ?? undefined,
    description: companyJob.description,
    tags: companyJob.tagsJson ? (JSON.parse(companyJob.tagsJson) as string[]) : [],
    status: companyJob.status as CompanyJobPost["status"],
    featured: companyJob.featured,
    createdAt: companyJob.createdAt.toISOString(),
    updatedAt: companyJob.updatedAt.toISOString(),
    applicants: [],
  });
}

export async function GET(request: Request) {
  const context = await requireCandidatePlanContext(request);
  if (context instanceof Response) {
    return context;
  }

  const { user } = context;
  const applications = await prisma.application.findMany({
    where: { candidateId: user.id },
    orderBy: { lastUpdatedAt: "desc" },
  });
  const archivedApplications = applications.filter((application) =>
    ARCHIVED_APPLICATION_STATUSES.has(String(application.status).toLowerCase()) &&
    application.lastUpdatedAt.getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000,
  );

  return jsonWithSecurity({
    ok: true,
    applications: applications.map((application) => encodeApplicationForCandidate({
      id: application.id,
      candidateId: application.candidateId,
      candidateName: application.candidateName,
      jobId: application.jobId,
      title: application.title,
      companyName: application.companyName,
      location: application.location,
      modality: application.modality,
      salary: application.salary ?? undefined,
      status: application.status as CandidateApplication["status"],
      appliedAt: application.appliedAt.toISOString(),
      lastUpdatedAt: application.lastUpdatedAt.toISOString(),
      fitLabel: application.fitLabel,
    })),
    archivedApplications: archivedApplications.map((application) => encodeApplicationForCandidate({
      id: application.id,
      candidateId: application.candidateId,
      candidateName: application.candidateName,
      jobId: application.jobId,
      title: application.title,
      companyName: application.companyName,
      location: application.location,
      modality: application.modality,
      salary: application.salary ?? undefined,
      status: application.status as CandidateApplication["status"],
      appliedAt: application.appliedAt.toISOString(),
      lastUpdatedAt: application.lastUpdatedAt.toISOString(),
      fitLabel: application.fitLabel,
    })),
  });
}

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const context = await requireCandidatePlanContext(request);
  if (context instanceof Response) {
    return context;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "applications-create",
    maxRequests: 20,
    windowMs: 60_000,
    userId: context.user.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const { user } = context;
    const body = (await request.json()) as { jobId?: string };
    const jobId = decodeCandidateJobId(body.jobId?.trim() ?? "");
    if (!jobId) {
      return jsonWithSecurity({ ok: false, message: "Vacante inválida" }, { status: 400 });
    }

    const vacancy = await findVacancy(jobId);
    if (!vacancy || vacancy.publicadorTipo === "persona") {
      return jsonWithSecurity({ ok: false, message: "Vacante no disponible" }, { status: 404 });
    }

    const existingApplication = await prisma.application.findFirst({
      where: {
        candidateId: user.id,
        jobId,
      },
    });
    if (existingApplication && isQuotaConsumingApplicationStatus(existingApplication.status)) {
      return jsonWithSecurity({ ok: false, message: "Ya tienes una postulación activa" }, { status: 409 });
    }

    const [currentApplications, profile] = await Promise.all([
      prisma.application.findMany({
        where: { candidateId: user.id },
        orderBy: { lastUpdatedAt: "desc" },
      }),
      prisma.profile.findUnique({
        where: { userId: user.id },
        select: { candidatePlanStateJson: true },
      }),
    ]);
    const candidatePlanState = parseCandidatePlanState(profile?.candidatePlanStateJson, new Date());
    const applicationsUsedInQuotaWindow = currentApplications.filter((application) => {
      const timestamp = application.appliedAt.getTime();
      return (
        isQuotaConsumingApplicationStatus(application.status) &&
        timestamp >= new Date(candidatePlanState.applicationQuotaWindowStartedAt).getTime() &&
        timestamp <= new Date(candidatePlanState.applicationQuotaWindowEndsAt).getTime()
      );
    }).length;

    if (applicationsUsedInQuotaWindow >= candidatePlanState.applicationQuotaLimit) {
      return jsonWithSecurity(
        {
          ok: false,
          message: `Llegaste al límite de ${candidatePlanState.applicationQuotaLimit} postulaciones disponibles en tu ventana actual.`,
        },
        { status: 403 },
      );
    }

    const now = new Date().toISOString();
    const candidateName = user.nombre ?? user.displayName ?? user.email;
    const applicationId = existingApplication?.id ?? createApplicationId(user.id, jobId);
    const nextApplication: CandidateApplication = {
      id: applicationId,
      candidateId: user.id,
      candidateName,
      jobId,
      title: vacancy.titulo,
      companyName: vacancy.empresa ?? vacancy.publicadorNombre ?? "TalentSyncro",
      location: vacancy.ubicacion ?? "Colombia",
      modality: vacancy.modalidad ?? "Modalidad flexible",
      salary: vacancy.salario,
      status: "application_submitted",
      appliedAt: now,
      lastUpdatedAt: now,
      fitLabel: `${getCandidateJobMatch(user, vacancy).visibleScore}%`,
    };

    const notification = buildApplicationNotification(user.id, nextApplication, "application_submitted");

    await prisma.$transaction([
      existingApplication
        ? prisma.application.update({
            where: { id: existingApplication.id },
            data: {
              candidateName: nextApplication.candidateName,
              title: nextApplication.title,
              companyName: nextApplication.companyName,
              location: nextApplication.location,
              modality: nextApplication.modality,
              salary: nextApplication.salary ?? null,
              status: nextApplication.status,
              appliedAt: new Date(nextApplication.appliedAt),
              lastUpdatedAt: new Date(nextApplication.lastUpdatedAt),
              fitLabel: nextApplication.fitLabel,
            },
          })
        : prisma.application.create({
            data: {
              id: nextApplication.id,
              candidateId: nextApplication.candidateId,
              candidateName: nextApplication.candidateName,
              jobId: nextApplication.jobId,
              title: nextApplication.title,
              companyName: nextApplication.companyName,
              location: nextApplication.location,
              modality: nextApplication.modality,
              salary: nextApplication.salary ?? null,
              status: nextApplication.status,
              appliedAt: new Date(nextApplication.appliedAt),
              lastUpdatedAt: new Date(nextApplication.lastUpdatedAt),
              fitLabel: nextApplication.fitLabel,
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
          status: notification.status ?? nextApplication.status,
        },
      }),
    ]);

    const ownedJob = await prisma.job.findUnique({
      where: { id: nextApplication.jobId },
      select: { ownerCompanyId: true },
    });
    if (ownedJob?.ownerCompanyId) {
      await queueApplicationReceivedEmail(prisma, ownedJob.ownerCompanyId, nextApplication);
    }

    const applications = await prisma.application.findMany({
      where: { candidateId: user.id },
      orderBy: { lastUpdatedAt: "desc" },
    });

    return jsonWithSecurity({
      ok: true,
      application: encodeApplicationForCandidate(nextApplication),
      applications: applications.map((application) => encodeApplicationForCandidate({
        id: application.id,
        candidateId: application.candidateId,
        candidateName: application.candidateName,
        jobId: application.jobId,
        title: application.title,
        companyName: application.companyName,
        location: application.location,
        modality: application.modality,
        salary: application.salary ?? undefined,
        status: application.status as CandidateApplication["status"],
        appliedAt: application.appliedAt.toISOString(),
        lastUpdatedAt: application.lastUpdatedAt.toISOString(),
        fitLabel: application.fitLabel,
      })),
    });
  } catch {
    return jsonWithSecurity({ ok: false, message: "No se pudo crear la postulación" }, { status: 500 });
  }
}
