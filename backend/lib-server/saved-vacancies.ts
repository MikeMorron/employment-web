import { presentCompanyJobAsVacancy } from "@/lib/company-jobs";
import { prisma } from "@/lib/server/db";
import { getMarketplaceVacancies } from "@/lib/server/marketplace-vacancies";
import type { Vacancy } from "@/types/vacancy";

export async function resolveSavedVacancies(jobIds: string[]) {
  if (jobIds.length === 0) {
    return [];
  }

  const uniqueJobIds = Array.from(new Set(jobIds));
  const [marketplaceVacancies, companyJobs] = await Promise.all([
    getMarketplaceVacancies(),
    prisma.job.findMany({
      where: {
        id: {
          in: uniqueJobIds,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const marketplaceVacancyById = new Map(
    marketplaceVacancies.map((vacancy) => [vacancy.id, vacancy] as const),
  );
  const companyVacancyById = new Map(
    companyJobs.map((job) => [
      job.id,
      presentCompanyJobAsVacancy({
        id: job.id,
        ownerCompanyId: job.ownerCompanyId,
        companyName: job.companyName,
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
    ] as const),
  );

  return uniqueJobIds.reduce<Vacancy[]>((accumulator, jobId) => {
    const vacancy = companyVacancyById.get(jobId) ?? marketplaceVacancyById.get(jobId);
    if (vacancy) {
      accumulator.push(vacancy);
    }

    return accumulator;
  }, []);
}

export async function listSavedVacanciesForCandidate(userId: string) {
  const saved = await prisma.savedVacancy.findMany({
    where: { userId },
    orderBy: { jobId: "asc" },
  });
  const savedJobIds = saved.map((item) => item.jobId);

  return {
    savedJobIds,
    savedVacancies: await resolveSavedVacancies(savedJobIds),
  };
}
