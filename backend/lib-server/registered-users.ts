import { prisma } from "@/lib/server/db";
import { buildAvatarFileHref } from "@/lib/file-links";
import { getAdminTrashedUserIds, purgeExpiredAdminUserTrash } from "@/lib/server/admin-user-trash";
import { parseCandidatePlanState } from "@/lib/server/candidate-plan-state";
import { parseCompanyPlanState } from "@/lib/server/company-plan-state";
import { encodeCompanyCandidateId } from "@/lib/server/opaque-refs";
import type { AdminManagedJobPreview, AdminOverviewPayload, AdminUserPreview, RegisteredUserPreview } from "@/types/admin";

function buildAvatar(assetPublicId?: string | null, avatar?: string | null) {
  return assetPublicId ? buildAvatarFileHref(assetPublicId) : avatar ?? undefined;
}

function normalizeVerificationStatus(value: string | null | undefined) {
  return value === "verified" || value === "unverified" || value === "pending" ? value : undefined;
}

function maskPhone(value: string | null | undefined) {
  const digits = String(value ?? "").replace(/\D+/g, "");
  if (!digits) {
    return undefined;
  }

  const visible = digits.slice(0, Math.min(6, digits.length));
  return `${visible}${"*".repeat(Math.max(4, digits.length - visible.length))}`;
}

function maskEmail(value: string) {
  const [localPart, domainPart = "mail.com"] = value.split("@");
  if (!localPart) {
    return value;
  }

  const visibleLocal = localPart.slice(0, Math.min(6, localPart.length));
  const [domainName, ...domainSuffixParts] = domainPart.split(".");
  const suffix = domainSuffixParts.length > 0 ? `.${domainSuffixParts.join(".")}` : ".com";
  const visibleDomain = domainName ? `*${domainName.slice(Math.max(0, domainName.length - 4))}` : "*mail";

  return `${visibleLocal}***@${visibleDomain}${suffix}`;
}

export async function listRegisteredUsersForCompany(): Promise<RegisteredUserPreview[]> {
  await purgeExpiredAdminUserTrash();
  const trashedUserIds = await getAdminTrashedUserIds();
  const users = await prisma.user.findMany({
    where: {
      role: "candidate",
      id: { notIn: trashedUserIds },
    },
    include: {
      profile: true,
      jobs: {
        where: { status: "published" },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const previews: RegisteredUserPreview[] = [];

  for (const user of users) {
    if (!user.profile) {
      continue;
    }

    previews.push({
      id: encodeCompanyCandidateId(user.id),
      role: "candidate" as const,
      displayName: user.displayName,
      nombre: user.profile.nombre,
      headline: user.profile.rol,
      location: user.profile.ubicacion ?? undefined,
      avatar: buildAvatar(user.profile.avatarAssetPublicId, user.profile.avatar),
      plan: user.plan,
      availabilityStatus:
        JSON.parse(user.profile.professionalProfileJson ?? "{}")?.availabilityStatus ?? undefined,
      profileVisibility:
        user.profile.profileVisibility === "public" ||
        user.profile.profileVisibility === "recruiters_only" ||
        user.profile.profileVisibility === "private"
          ? user.profile.profileVisibility
          : undefined,
      skills: JSON.parse(user.profile.skillsJson ?? "[]").slice(0, 6),
      previewProfileId: user.profile.profileVisibility === "private" ? undefined : encodeCompanyCandidateId(user.id),
      createdAt: user.createdAt.toISOString(),
    });
  }

  return previews;
}

export async function listUsersForAdmin(): Promise<AdminUserPreview[]> {
  await purgeExpiredAdminUserTrash();
  const trashedUserIds = await getAdminTrashedUserIds();
  const [users, credentials] = await Promise.all([
    prisma.user.findMany({
      where: {
        id: { notIn: trashedUserIds },
      },
      include: {
        profile: true,
        jobs: {
          where: { status: "published" },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.credential.findMany({
      select: { userId: true },
    }),
  ]);
  const usersWithPassword = new Set(credentials.map((item) => item.userId));

  return users.flatMap((user) => {
    if (!user.profile) {
      return [];
    }

    const availabilityStatus =
      user.role === "candidate"
        ? JSON.parse(user.profile.professionalProfileJson ?? "{}")?.availabilityStatus ?? undefined
        : undefined;
    const skills =
      user.role === "candidate"
        ? (JSON.parse(user.profile.skillsJson ?? "[]") as string[]).slice(0, 6)
        : [];
    const credits =
      user.role === "candidate"
        ? parseCandidatePlanState(user.profile.candidatePlanStateJson, new Date()).applicationQuotaLimit
        : user.role === "company"
          ? parseCompanyPlanState(user.profile.companyPlanStateJson, new Date()).collaboratorLimit
          : 0;
    const currentPlanId =
      user.role === "candidate"
        ? parseCandidatePlanState(user.profile.candidatePlanStateJson, new Date()).currentPlanId
        : user.role === "company"
          ? parseCompanyPlanState(user.profile.companyPlanStateJson, new Date()).currentPlanId
          : undefined;

    return [{
      id: user.id,
      email: user.email,
      emailMasked: maskEmail(user.email),
      phone: user.profile.telefono ?? undefined,
      phoneMasked: maskPhone(user.profile.telefono),
      passwordMasked: usersWithPassword.has(user.id) ? "******" : "Sin contraseña",
      role: user.role,
      displayName: user.displayName,
      nombre:
        user.role === "company"
          ? user.profile.companyName ?? user.profile.nombre
          : user.profile.nombre,
      headline: user.profile.rol,
      location: user.profile.companyLocation ?? user.profile.ubicacion ?? undefined,
      avatar: buildAvatar(user.profile.avatarAssetPublicId, user.profile.avatar),
      plan: user.plan,
      companyName: user.profile.companyName ?? undefined,
      companyDescription: user.profile.companyDescription ?? undefined,
      verificationStatus: normalizeVerificationStatus(user.profile.verificationStatus),
      availabilityStatus,
      profileVisibility:
        user.profile.profileVisibility === "public" ||
        user.profile.profileVisibility === "recruiters_only" ||
        user.profile.profileVisibility === "private"
          ? user.profile.profileVisibility
          : undefined,
      skills,
      credits,
      currentPlanId,
      publishedJobs: user.jobs.length,
      activeJobs: user.profile.activeJobs ?? user.jobs.length,
      createdAt: user.createdAt.toISOString(),
    }];
  });
}

export async function listJobsForAdmin(): Promise<AdminManagedJobPreview[]> {
  const [jobs, applications] = await Promise.all([
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.application.findMany({
      select: { id: true, jobId: true },
    }),
  ]);

  const applicationsByJobId = applications.reduce((accumulator, item) => {
    accumulator.set(item.jobId, (accumulator.get(item.jobId) ?? 0) + 1);
    return accumulator;
  }, new Map<string, number>());

  return jobs.map((job) => ({
    id: job.id,
    companyId: job.ownerCompanyId,
    companyName: job.companyName,
    title: job.title,
    location: job.location,
    modality: job.modality,
    status: job.status as AdminManagedJobPreview["status"],
    featured: job.featured,
    applicantsCount: applicationsByJobId.get(job.id) ?? 0,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  }));
}

export async function getAdminOverview(): Promise<AdminOverviewPayload> {
  const [users, jobs, applicationsTotal, commentsTotal, recentUsers, recentJobs] = await Promise.all([
    prisma.user.findMany({
      select: { role: true },
    }),
    prisma.job.findMany({
      select: { status: true },
    }),
    prisma.application.count(),
    prisma.comment.count(),
    listUsersForAdmin(),
    listJobsForAdmin(),
  ]);

  return {
    ok: true,
    metrics: {
      usersTotal: users.length,
      candidatesTotal: users.filter((item) => item.role === "candidate").length,
      companiesTotal: users.filter((item) => item.role === "company").length,
      adminsTotal: users.filter((item) => item.role === "admin").length,
      jobsTotal: jobs.length,
      publishedJobsTotal: jobs.filter((item) => item.status === "published").length,
      applicationsTotal,
      commentsTotal,
    },
    recentUsers: recentUsers.slice(0, 6),
    recentJobs: recentJobs.slice(0, 6),
  };
}
