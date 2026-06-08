import { prisma } from "@/lib/server/db";
import { isDatabaseUnavailableError } from "@/lib/server/db-errors";
import { getSessionUser, isCandidateUser, isCompanyUser } from "@/lib/server/app-state";
import { canCandidateAccessVacancy } from "@/lib/candidate-plan";
import { presentCompanyJobAsVacancy } from "@/lib/company-jobs";
import { buildCompanyCandidateVacancies } from "@/backend/lib-server/company-candidate-vacancies";
import { listDiscoverableCandidates } from "@/lib/server/query-candidates";
import sampleVacancies from "@/data/trabajos-de-muestra.json";
import type { Vacancy } from "@/types/vacancy";

const FEATURED_SAMPLE_VACANCY_IDS = new Set([
  "sample-trabajo-009",
  "sample-trabajo-010",
  "sample-trabajo-013",
  "sample-trabajo-021",
  "sample-trabajo-022",
]);

function cloneVacancy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeMarketplaceVacancy(vacancy: Vacancy) {
  const normalizedVerificationStatus =
    vacancy.companyVerificationStatus ??
    (vacancy.publicadorTipo === "empresa" ? "verified" : undefined);

  if (FEATURED_SAMPLE_VACANCY_IDS.has(vacancy.id)) {
    return {
      ...vacancy,
      destacada: true,
      companyVerificationStatus: normalizedVerificationStatus,
    };
  }

  return {
    ...vacancy,
    companyVerificationStatus: normalizedVerificationStatus,
  };
}

export async function getMarketplaceVacancies() {
  const rows = await prisma.marketplaceVacancy.findMany({
    orderBy: { createdAt: "desc" },
  });

  const databaseVacancies = rows.map((row) =>
    normalizeMarketplaceVacancy(cloneVacancy(JSON.parse(row.vacancyJson) as Vacancy)),
  );
  const sampleById = new Map(
    (sampleVacancies as Vacancy[]).map((job) => [
      job.id,
      normalizeMarketplaceVacancy(cloneVacancy(job)),
    ]),
  );

  for (const job of databaseVacancies) {
    sampleById.set(job.id, job);
  }

  return [...sampleById.values()];
}

export async function getMarketplaceVacancyById(id: string) {
  const row = await prisma.marketplaceVacancy.findUnique({
    where: { id },
  });

  if (row) {
    return normalizeMarketplaceVacancy(cloneVacancy(JSON.parse(row.vacancyJson) as Vacancy));
  }

  const sample = (sampleVacancies as Vacancy[]).find((job) => job.id === id);
  return sample ? normalizeMarketplaceVacancy(cloneVacancy(sample)) : null;
}

export async function vacancyExistsById(id: string) {
  const marketplace = await getMarketplaceVacancyById(id);
  if (marketplace) {
    return true;
  }

  const companyJob = await prisma.job.findUnique({
    where: { id },
    select: { id: true },
  });

  return Boolean(companyJob);
}

export async function getVacancyFeedForRequest(request: Request) {
  let authUser;
  let companyJobs;
  let companyProfiles;
  let marketplaceVacancies;
  let discoverableCandidates;

  try {
    [authUser, companyJobs, companyProfiles, marketplaceVacancies, discoverableCandidates] = await Promise.all([
      getSessionUser(request),
      prisma.job.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.profile.findMany({
        select: {
          userId: true,
          verificationStatus: true,
        },
      }),
      getMarketplaceVacancies(),
      listDiscoverableCandidates({ limit: 200 }),
    ]);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return (sampleVacancies as Vacancy[]).map((job) => cloneVacancy(job));
    }

    throw error;
  }

  if (isCompanyUser(authUser)) {
    return buildCompanyCandidateVacancies(discoverableCandidates);
  }

  const companyVerificationById = new Map(
    companyProfiles.map((profile) => [
      profile.userId,
      profile.verificationStatus === "verified" ? "verified" : "pending",
    ]),
  );

  const publishedCompanyJobs = companyJobs
    .filter((job) => job.status === "published")
    .map((job) =>
      presentCompanyJobAsVacancy({
        id: job.id,
        ownerCompanyId: job.ownerCompanyId,
        companyName: job.companyName,
        companyVerificationStatus:
          companyVerificationById.get(job.ownerCompanyId) === "verified" ? "verified" : "pending",
        title: job.title,
        location: job.location,
        modality: job.modality,
        salary: job.salary ?? undefined,
        description: job.description,
        tags: JSON.parse(job.tagsJson ?? "[]") as string[],
        status: job.status as "draft" | "published" | "paused" | "closed",
        featured: job.featured,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        applicants: [],
      }),
    );

  const marketplaceCompanyVacancies = marketplaceVacancies.filter(
    (job) => job.publicadorTipo !== "persona",
  );
  const unified = [
    ...publishedCompanyJobs.filter(
      (job) => !marketplaceCompanyVacancies.some((marketJob) => marketJob.id === job.id),
    ),
    ...marketplaceCompanyVacancies,
  ];

  if (!isCandidateUser(authUser)) {
    return unified;
  }

  return unified.filter((job) => canCandidateAccessVacancy(authUser, job));
}
