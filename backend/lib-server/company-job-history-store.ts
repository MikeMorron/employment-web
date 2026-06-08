import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { CompanyJobHistoryEntry, CompanyJobPost } from "@/types/workflows";
import { dbJobToCompanyJobPost } from "@/lib/server/company-job-views";

const HISTORY_KEY = "cancelledJobHistory";
const MAX_HISTORY_ITEMS = 20;

type DashboardConfig = Record<string, unknown> & {
  cancelledJobHistory?: CompanyJobHistoryEntry[];
};

function parseDashboardConfig(value: string | null | undefined): DashboardConfig {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as DashboardConfig
      : {};
  } catch {
    return {};
  }
}

function getHistory(config: DashboardConfig) {
  return Array.isArray(config[HISTORY_KEY])
    ? config[HISTORY_KEY]!.filter((entry) => entry?.id && entry?.job?.id)
    : [];
}

async function readPreference(prisma: PrismaClient, companyId: string) {
  return prisma.preference.findUnique({
    where: { userId: companyId },
    select: { companyDashboardConfigJson: true },
  });
}

async function writeHistory(
  prisma: PrismaClient,
  companyId: string,
  config: DashboardConfig,
  history: CompanyJobHistoryEntry[],
) {
  await prisma.preference.upsert({
    where: { userId: companyId },
    create: {
      userId: companyId,
      companyDashboardConfigJson: JSON.stringify({
        ...config,
        [HISTORY_KEY]: history.slice(0, MAX_HISTORY_ITEMS),
      }),
    },
    update: {
      companyDashboardConfigJson: JSON.stringify({
        ...config,
        [HISTORY_KEY]: history.slice(0, MAX_HISTORY_ITEMS),
      }),
    },
  });
}

export async function listCompanyJobHistory(prisma: PrismaClient, companyId: string) {
  const preference = await readPreference(prisma, companyId);
  const config = parseDashboardConfig(preference?.companyDashboardConfigJson);
  return getHistory(config);
}

export async function archiveCompanyJob(
  prisma: PrismaClient,
  companyId: string,
  job: CompanyJobPost,
) {
  const preference = await readPreference(prisma, companyId);
  const config = parseDashboardConfig(preference?.companyDashboardConfigJson);
  const existing = getHistory(config).filter((entry) => entry.job.id !== job.id);
  const archivedJob: CompanyJobHistoryEntry = {
    id: randomUUID(),
    archivedAt: new Date().toISOString(),
    job: {
      id: job.id,
      ownerCompanyId: job.ownerCompanyId,
      companyName: job.companyName,
      companyVerificationStatus: job.companyVerificationStatus,
      title: job.title,
      location: job.location,
      modality: job.modality,
      salary: job.salary,
      description: job.description,
      tags: job.tags,
      status: "draft",
      featured: job.featured,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    },
  };

  await writeHistory(prisma, companyId, config, [archivedJob, ...existing]);
}

export async function archiveCompanyDbJob(
  prisma: PrismaClient,
  companyId: string,
  row: Parameters<typeof dbJobToCompanyJobPost>[0],
) {
  await archiveCompanyJob(prisma, companyId, dbJobToCompanyJobPost(row));
}

export async function deleteCompanyJobHistoryEntry(
  prisma: PrismaClient,
  companyId: string,
  historyId: string,
) {
  const preference = await readPreference(prisma, companyId);
  const config = parseDashboardConfig(preference?.companyDashboardConfigJson);
  const history = getHistory(config);
  const nextHistory = history.filter((entry) => entry.id !== historyId);

  if (nextHistory.length === history.length) {
    return false;
  }

  await writeHistory(prisma, companyId, config, nextHistory);
  return true;
}
