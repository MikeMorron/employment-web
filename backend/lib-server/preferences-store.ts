import type { CompanyBillingHistoryEntry } from "@/types/company";
import { prisma } from "@/lib/server/db";

function normalizeEmailFrequency(
  value: string | null | undefined,
): "instant" | "daily" | "digest_3d" | undefined {
  return value === "instant" || value === "daily" || value === "digest_3d" ? value : undefined;
}

export async function listNotificationEmailTypes(userId: string) {
  const rows = await prisma.notificationEmailType.findMany({
    where: { userId },
    orderBy: { emailType: "asc" },
    select: { emailType: true },
  });

  return rows.map((row) => row.emailType);
}

export async function replaceNotificationEmailTypes(userId: string, emailTypes: string[]) {
  const uniqueEmailTypes = Array.from(new Set(emailTypes.map((value) => value.trim()).filter(Boolean)));

  await prisma.$transaction([
    prisma.notificationEmailType.deleteMany({ where: { userId } }),
    ...(uniqueEmailTypes.length > 0
      ? [
          prisma.notificationEmailType.createMany({
            data: uniqueEmailTypes.map((emailType) => ({ userId, emailType })),
          }),
        ]
      : []),
  ]);
}

export async function listReadNotificationIds(userId: string) {
  const rows = await prisma.userReadNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { notificationId: true },
  });

  return rows.map((row) => row.notificationId);
}

export async function replaceReadNotificationIds(userId: string, notificationIds: string[]) {
  const uniqueNotificationIds = Array.from(new Set(notificationIds.map((value) => value.trim()).filter(Boolean)));

  await prisma.$transaction([
    prisma.userReadNotification.deleteMany({ where: { userId } }),
    ...(uniqueNotificationIds.length > 0
      ? [
          prisma.userReadNotification.createMany({
            data: uniqueNotificationIds.map((notificationId) => ({ userId, notificationId })),
          }),
        ]
      : []),
  ]);
}

export async function listHiddenNotificationIds(userId: string) {
  const rows = await prisma.userHiddenNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { notificationId: true },
  });

  return rows.map((row) => row.notificationId);
}

export async function replaceHiddenNotificationIds(userId: string, notificationIds: string[]) {
  const uniqueNotificationIds = Array.from(new Set(notificationIds.map((value) => value.trim()).filter(Boolean)));

  await prisma.$transaction([
    prisma.userHiddenNotification.deleteMany({ where: { userId } }),
    ...(uniqueNotificationIds.length > 0
      ? [
          prisma.userHiddenNotification.createMany({
            data: uniqueNotificationIds.map((notificationId) => ({ userId, notificationId })),
          }),
        ]
      : []),
  ]);
}

export async function listCompanyFavoriteCandidateIds(companyUserId: string) {
  const rows = await prisma.companyFavoriteCandidate.findMany({
    where: { companyUserId },
    orderBy: { createdAt: "desc" },
    select: { candidateId: true },
  });

  return rows.map((row) => row.candidateId);
}

export async function replaceCompanyFavoriteCandidateIds(companyUserId: string, candidateIds: string[]) {
  const uniqueCandidateIds = Array.from(new Set(candidateIds.map((value) => value.trim()).filter(Boolean)));

  await prisma.$transaction([
    prisma.companyFavoriteCandidate.deleteMany({ where: { companyUserId } }),
    ...(uniqueCandidateIds.length > 0
      ? [
          prisma.companyFavoriteCandidate.createMany({
            data: uniqueCandidateIds.map((candidateId) => ({ companyUserId, candidateId })),
          }),
        ]
      : []),
  ]);
}

export async function listCompanyApplicantNotes(companyUserId: string) {
  const rows = await prisma.companyApplicantNote.findMany({
    where: { companyUserId },
    orderBy: { updatedAt: "desc" },
    select: { applicantId: true, note: true },
  });

  return Object.fromEntries(rows.map((row) => [row.applicantId, row.note]));
}

export async function replaceCompanyApplicantNotes(companyUserId: string, notesByApplicantId: Record<string, string>) {
  const entries = Object.entries(notesByApplicantId).filter(([applicantId]) => applicantId.trim());

  await prisma.$transaction([
    prisma.companyApplicantNote.deleteMany({ where: { companyUserId } }),
    ...(entries.length > 0
      ? [
          prisma.companyApplicantNote.createMany({
            data: entries.map(([applicantId, note]) => ({
              companyUserId,
              applicantId,
              note,
            })),
          }),
        ]
      : []),
  ]);
}

export async function listCompanyDashboardConfig(companyUserId: string) {
  const rows = await prisma.companyDashboardPreference.findMany({
    where: { companyUserId },
    orderBy: { key: "asc" },
    select: { key: true, valueJson: true },
  });

  return Object.fromEntries(
    rows.map((row) => {
      try {
        return [row.key, JSON.parse(row.valueJson)];
      } catch {
        return [row.key, null];
      }
    }),
  );
}

export async function replaceCompanyDashboardConfig(companyUserId: string, dashboardConfig: Record<string, unknown>) {
  const entries = Object.entries(dashboardConfig).filter(([key]) => key.trim());

  await prisma.$transaction([
    prisma.companyDashboardPreference.deleteMany({ where: { companyUserId } }),
    ...(entries.length > 0
      ? [
          prisma.companyDashboardPreference.createMany({
            data: entries.map(([key, value]) => ({
              companyUserId,
              key,
              valueJson: JSON.stringify(value ?? null),
            })),
          }),
        ]
      : []),
  ]);
}

export async function listBillingHistory(userId: string): Promise<CompanyBillingHistoryEntry[]> {
  const rows = await prisma.billingHistoryEntry.findMany({
    where: { userId },
    orderBy: { paidAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    plan:
      row.plan === "premium" || row.plan === "business" || row.plan === "pro" || row.plan === "basic"
        ? row.plan
        : "basic",
    amountCop: row.amountCop,
    status:
      row.status === "pending" || row.status === "failed" || row.status === "paid"
        ? row.status
        : "pending",
    paidAt: row.paidAt.toISOString(),
    renewalAt: row.renewalAt?.toISOString(),
    description: row.description,
  }));
}

export async function createBillingHistoryEntry(input: {
  userId: string;
  plan: "basic" | "pro" | "business" | "premium";
  amountCop: number;
  status: "paid" | "pending" | "failed";
  paidAt?: Date;
  renewalAt?: Date | null;
  description: string;
  provider?: string;
  providerReference?: string;
}) {
  return prisma.billingHistoryEntry.create({
    data: {
      userId: input.userId,
      plan: input.plan,
      amountCop: input.amountCop,
      status: input.status,
      paidAt: input.paidAt ?? new Date(),
      renewalAt: input.renewalAt ?? null,
      description: input.description,
      provider: input.provider ?? null,
      providerReference: input.providerReference ?? null,
    },
  });
}

export async function getUserPreferenceSnapshot(userId: string) {
  const [preference, emailTypes, readIds, hiddenIds] = await Promise.all([
    prisma.preference.findUnique({
      where: { userId },
      select: {
        notificationAnuncio: true,
        notificationApplication: true,
        notificationEmailEnabled: true,
        notificationPushEnabled: true,
        notificationEmailFrequency: true,
        theme: true,
        language: true,
      },
    }),
    listNotificationEmailTypes(userId),
    listReadNotificationIds(userId),
    listHiddenNotificationIds(userId),
  ]);

  return {
    notificationAnuncio: preference?.notificationAnuncio ?? true,
    notificationApplication: preference?.notificationApplication ?? true,
    notificationEmailEnabled: preference?.notificationEmailEnabled ?? true,
    notificationPushEnabled: preference?.notificationPushEnabled ?? false,
    notificationEmailFrequency: normalizeEmailFrequency(preference?.notificationEmailFrequency),
    theme: preference?.theme ?? undefined,
    language: preference?.language ?? undefined,
    emailTypes,
    readIds,
    hiddenIds,
  };
}
