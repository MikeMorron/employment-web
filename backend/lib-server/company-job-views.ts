import type { PrismaClient } from "@prisma/client";
import type {
  CandidateApplication,
  CandidateApplicationStatus,
  CompanyApplicant,
  CompanyJobPost,
} from "@/types/workflows";
import { candidateToApplicantStage } from "@/lib/server/app-state-notifications";
import { encodeCompanyJobForCompany } from "@/lib/server/opaque-refs";

export function dbJobToCompanyJobPost(row: {
  id: string;
  ownerCompanyId: string;
  companyName: string;
  title: string;
  location: string;
  modality: string;
  salary: string | null;
  description: string;
  tagsJson: string | null;
  status: string;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CompanyJobPost {
  return {
    id: row.id,
    ownerCompanyId: row.ownerCompanyId,
    companyName: row.companyName,
    title: row.title,
    location: row.location,
    modality: row.modality,
    salary: row.salary ?? undefined,
    description: row.description,
    tags: row.tagsJson ? (JSON.parse(row.tagsJson) as string[]) : [],
    status: row.status as CompanyJobPost["status"],
    featured: row.featured,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    applicants: [],
  };
}

export async function buildCompanyJobViews(
  prismaClient: PrismaClient,
  companyId: string,
): Promise<CompanyJobPost[]> {
  const jobs = await prismaClient.job.findMany({
    where: { ownerCompanyId: companyId },
    orderBy: { updatedAt: "desc" },
  });

  const jobIds = jobs.map((job) => job.id);
  const applications = jobIds.length
    ? await prismaClient.application.findMany({
        where: {
          jobId: { in: jobIds },
          status: { not: "withdrawn" },
        },
        orderBy: { lastUpdatedAt: "desc" },
      })
    : [];

  const applicantsByJobId = applications.reduce<Record<string, CompanyApplicant[]>>((accumulator, application) => {
    const existingApplicants = accumulator[application.jobId] ?? [];
    if (existingApplicants.some((item) => item.candidateId === application.candidateId)) {
      return accumulator;
    }

    const matchScore = Number(String(application.fitLabel).replace(/[^\d]/g, "")) || 0;
    const applicant: CompanyApplicant = {
      id: application.id,
      candidateId: application.candidateId,
      name: application.candidateName,
      role: application.title,
      location: application.location,
      matchScore,
      stage: candidateToApplicantStage(application.status as CandidateApplicationStatus),
      appliedAt: application.appliedAt.toISOString(),
      source: "direct",
    };

    existingApplicants.push(applicant);
    accumulator[application.jobId] = existingApplicants;
    return accumulator;
  }, {});

  return jobs.map((job) =>
    encodeCompanyJobForCompany({
      ...dbJobToCompanyJobPost(job),
      applicants: applicantsByJobId[job.id] ?? [],
      applicantCount: (applicantsByJobId[job.id] ?? []).length,
    }),
  );
}

export function buildApplicantStage(application: {
  id: string;
  candidateId: string;
  jobId: string;
  status: string;
  matchScore: number | null;
  coverNote: string | null;
  appliedAt: Date;
  lastUpdatedAt: Date;
}) {
  return {
    id: application.id,
    candidateId: application.candidateId,
    jobId: application.jobId,
    status: application.status as CandidateApplication["status"],
    matchScore: application.matchScore ?? undefined,
    coverNote: application.coverNote ?? undefined,
    appliedAt: application.appliedAt.toISOString(),
    lastUpdatedAt: application.lastUpdatedAt.toISOString(),
  };
}
