import { prisma } from "@/lib/server/db";
import { getUserPreferenceSnapshot } from "@/lib/server/preferences-store";
import type { AppUser, CandidateProfile, CompanyProfile } from "@/types/profile";
import type { CandidateApplication, CandidateApplicationStatus, CompanyJobPost } from "@/types/workflows";
import type { StoredPreferences } from "@/lib/server/app-state";
import { dbJobToCompanyJobPost } from "@/lib/server/company-job-views";

type ProductState = {
  companyJobs: CompanyJobPost[];
  applications: CandidateApplication[];
  preferences: StoredPreferences;
};

function mapApplications(
  applications: Array<{
    id: string;
    candidateId: string;
    candidateName: string;
    jobId: string;
    title: string;
    companyName: string;
    location: string;
    modality: string;
    salary: string | null;
    status: string;
    appliedAt: Date;
    lastUpdatedAt: Date;
    fitLabel: string;
  }>,
): CandidateApplication[] {
  return applications.map((application) => ({
    id: application.id,
    candidateId: application.candidateId,
    candidateName: application.candidateName,
    jobId: application.jobId,
    title: application.title,
    companyName: application.companyName,
    location: application.location,
    modality: application.modality,
    salary: application.salary ?? undefined,
    status: application.status as CandidateApplicationStatus,
    appliedAt: application.appliedAt.toISOString(),
    lastUpdatedAt: application.lastUpdatedAt.toISOString(),
    fitLabel: application.fitLabel,
  }));
}

function buildPreferenceState(
  user: AppUser,
  preference: Awaited<ReturnType<typeof getUserPreferenceSnapshot>>,
  savedJobIds: string[],
  categoryInterests: Array<{ category: string; clicks: number }>,
): StoredPreferences {
  return {
    savedVacanciesByUserId: {
      [user.id]: savedJobIds,
    },
    categoryInterestByUserId: {
      [user.id]: Object.fromEntries(categoryInterests.map((item) => [item.category, item.clicks])),
    },
    readNotificationsByUserId: {},
    hiddenNotificationsByUserId: {},
    notificationPrefsByUserId: {
      [user.id]: {
        anuncio: preference.notificationAnuncio,
        application: preference.notificationApplication,
        emailEnabled: preference.notificationEmailEnabled,
        pushEnabled: preference.notificationPushEnabled,
        emailFrequency: preference.notificationEmailFrequency,
        emailTypes: preference.emailTypes,
      },
    },
    appSettingsByUserId: {},
    companyFavoriteCandidateIdsByUserId: {},
    companyApplicantNotesByUserId: {},
    companyDashboardConfigByUserId: {},
    billingHistoryByUserId: {},
  };
}

export async function buildProductStateForUser(user: CandidateProfile | CompanyProfile): Promise<ProductState> {
  const jobs = await prisma.job.findMany({
    where: user.role === "company" ? { ownerCompanyId: user.id } : { status: "published" },
    orderBy: { createdAt: "desc" },
  });

  const [preference, savedVacancies, categoryInterests, applications] = await Promise.all([
    getUserPreferenceSnapshot(user.id),
    prisma.savedVacancy.findMany({
      where: { userId: user.id },
      orderBy: { jobId: "asc" },
      select: { jobId: true },
    }),
    prisma.categoryInterest.findMany({
      where: { userId: user.id },
      orderBy: { category: "asc" },
      select: { category: true, clicks: true },
    }),
    prisma.application.findMany({
      where:
        user.role === "candidate"
          ? { candidateId: user.id }
          : { jobId: { in: jobs.map((job) => job.id) } },
      orderBy: { appliedAt: "desc" },
    }),
  ]);

  return {
    companyJobs: jobs.map(dbJobToCompanyJobPost),
    applications: mapApplications(applications),
    preferences: buildPreferenceState(
      user,
      preference,
      savedVacancies.map((item) => item.jobId),
      categoryInterests,
    ),
  };
}
