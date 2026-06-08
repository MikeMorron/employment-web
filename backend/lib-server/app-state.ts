import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/server/db";
import type { ProductNotification } from "@/types/notifications";
import type { CompanyBillingHistoryEntry } from "@/types/company";
import type { AppUser, CandidateProfile, CompanyProfile } from "@/types/profile";
import type {
  CandidateApplication,
  CandidateApplicationStatus,
  CompanyJobPost,
} from "@/types/workflows";
import {
  rowToUser,
  userToProfileCreateInput,
  userToUserCreateInput,
} from "@/lib/server/app-state-mappers";
import { verifyStoredPassword } from "@/lib/server/password-security";
import {
  applicantToCandidateStatus,
  buildApplicationNotification,
  candidateToApplicantStage,
} from "@/lib/server/app-state-notifications";
import { sanitizeUserForClient as sanitizeUserForClientDto } from "@/lib/server/user-client";
import { ensurePrivateMediaAssetsForProfile } from "@/lib/server/private-media-assets";
export {
  buildClearedSessionCookie,
  buildSessionCookie,
  clearSession,
  createSession,
  getSessionUser,
  parseCookieValue,
} from "@/lib/server/session-security";
import { SESSION_COOKIE_NAME } from "@/lib/app-runtime";

export type StoredCredential = {
  userId: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
};

type SessionRecord = {
  token: string;
  userId: string;
  expiresAt: number;
};

export type StoredPreferences = {
  savedVacanciesByUserId: Record<string, string[]>;
  categoryInterestByUserId: Record<string, Record<string, number>>;
  readNotificationsByUserId: Record<string, string[]>;
  hiddenNotificationsByUserId: Record<string, string[]>;
  notificationPrefsByUserId: Record<string, {
    anuncio: boolean;
    application: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
    emailFrequency?: "instant" | "daily" | "digest_3d";
    emailTypes?: string[];
  }>;
  appSettingsByUserId: Record<string, {
    theme?: string;
    language?: string;
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    emailFrequency?: "instant" | "daily" | "digest_3d";
    emailTypes?: string[];
  }>;
  companyFavoriteCandidateIdsByUserId: Record<string, string[]>;
  companyApplicantNotesByUserId: Record<string, Record<string, string>>;
  companyDashboardConfigByUserId: Record<string, Record<string, unknown>>;
  billingHistoryByUserId: Record<string, CompanyBillingHistoryEntry[]>;
};

export type AppState = {
  users: AppUser[];
  credentials: StoredCredential[];
  sessions: SessionRecord[];
  companyJobs: CompanyJobPost[];
  applications: CandidateApplication[];
  applicationNotifications: ProductNotification[];
  preferences: StoredPreferences;
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

function loadPreferencesFromRows(
  preferences: Array<{
    userId: string;
    notificationAnuncio: boolean;
    notificationApplication: boolean;
    notificationEmailEnabled: boolean;
    notificationPushEnabled: boolean;
    notificationEmailFrequency: string | null;
    notificationEmailTypesJson: string | null;
    theme: string | null;
    language: string | null;
    readNotificationIdsJson: string | null;
    hiddenNotificationIdsJson: string | null;
    companyFavoriteCandidateIdsJson: string | null;
    companyApplicantNotesJson: string | null;
    companyDashboardConfigJson: string | null;
    billingHistoryJson: string | null;
  }>,
  savedVacancies: Array<{ userId: string; jobId: string }>,
  categoryInterests: Array<{ userId: string; category: string; clicks: number }>,
): StoredPreferences {
  const next: StoredPreferences = {
    savedVacanciesByUserId: {},
    categoryInterestByUserId: {},
    readNotificationsByUserId: {},
    hiddenNotificationsByUserId: {},
    notificationPrefsByUserId: {},
    appSettingsByUserId: {},
    companyFavoriteCandidateIdsByUserId: {},
    companyApplicantNotesByUserId: {},
    companyDashboardConfigByUserId: {},
    billingHistoryByUserId: {},
  };

  for (const entry of savedVacancies) {
    next.savedVacanciesByUserId[entry.userId] ??= [];
    next.savedVacanciesByUserId[entry.userId].push(entry.jobId);
  }

  for (const entry of categoryInterests) {
    next.categoryInterestByUserId[entry.userId] ??= {};
    next.categoryInterestByUserId[entry.userId][entry.category] = entry.clicks;
  }

  for (const preference of preferences) {
    next.readNotificationsByUserId[preference.userId] = parseJson<string[]>(
      preference.readNotificationIdsJson,
      [],
    );
    next.hiddenNotificationsByUserId[preference.userId] = parseJson<string[]>(
      preference.hiddenNotificationIdsJson,
      [],
    );
    next.notificationPrefsByUserId[preference.userId] = {
      anuncio: preference.notificationAnuncio,
      application: preference.notificationApplication,
      emailEnabled: preference.notificationEmailEnabled,
      pushEnabled: preference.notificationPushEnabled,
      emailFrequency:
        preference.notificationEmailFrequency === "instant" ||
        preference.notificationEmailFrequency === "daily" ||
        preference.notificationEmailFrequency === "digest_3d"
          ? preference.notificationEmailFrequency
          : undefined,
      emailTypes: parseJson<string[]>(preference.notificationEmailTypesJson, []),
    };
    next.appSettingsByUserId[preference.userId] = {
      theme: preference.theme ?? undefined,
      language: preference.language ?? undefined,
      emailEnabled: preference.notificationEmailEnabled,
      pushEnabled: preference.notificationPushEnabled,
      emailFrequency:
        preference.notificationEmailFrequency === "instant" ||
        preference.notificationEmailFrequency === "daily" ||
        preference.notificationEmailFrequency === "digest_3d"
          ? preference.notificationEmailFrequency
          : undefined,
      emailTypes: parseJson<string[]>(preference.notificationEmailTypesJson, []),
    };
    next.companyFavoriteCandidateIdsByUserId[preference.userId] = parseJson<string[]>(
      preference.companyFavoriteCandidateIdsJson,
      [],
    );
    next.companyApplicantNotesByUserId[preference.userId] = parseJson<Record<string, string>>(
      preference.companyApplicantNotesJson,
      {},
    );
    next.companyDashboardConfigByUserId[preference.userId] = parseJson<Record<string, unknown>>(
      preference.companyDashboardConfigJson,
      {},
    );
    next.billingHistoryByUserId[preference.userId] = parseJson<CompanyBillingHistoryEntry[]>(
      preference.billingHistoryJson,
      [],
    );
  }

  return next;
}

async function loadDatabaseState(): Promise<AppState> {
  const [users, profiles, credentials, sessions, jobs, applications, notifications, preferences, savedVacancies, categoryInterests] =
    await prisma.$transaction([
      prisma.user.findMany(),
      prisma.profile.findMany(),
      prisma.credential.findMany(),
      prisma.session.findMany(),
      prisma.job.findMany(),
      prisma.application.findMany(),
      prisma.notification.findMany(),
      prisma.preference.findMany(),
      prisma.savedVacancy.findMany(),
      prisma.categoryInterest.findMany(),
    ]);

  for (const profile of profiles) {
    if (
      !profile.avatarStoredFileName &&
      !profile.cvStoredFileName
    ) {
      continue;
    }

    const user = users.find((entry) => entry.id === profile.userId);
    if (user?.role !== "candidate") {
      continue;
    }

    const ensured = await ensurePrivateMediaAssetsForProfile(prisma, {
      ownerUserId: profile.userId,
      profileVisibility: profile.profileVisibility,
      avatarStoredFileName: profile.avatarStoredFileName,
      avatarAssetPublicId: profile.avatarAssetPublicId,
      cvStoredFileName: profile.cvStoredFileName,
      cvAssetPublicId: profile.cvAssetPublicId,
    });

    profile.avatarAssetPublicId = ensured.avatarAssetPublicId ?? null;
    profile.cvAssetPublicId = ensured.cvAssetPublicId ?? null;
  }

  const profileByUserId = new Map(profiles.map((profile) => [profile.userId, profile]));
  const loadedPreferences = loadPreferencesFromRows(preferences, savedVacancies, categoryInterests);
  return {
    users: users.map((user) => {
      const mappedUser = rowToUser(user, profileByUserId.get(user.id) ?? null);
      if (mappedUser.role === "company") {
        return {
          ...mappedUser,
          billingHistory: loadedPreferences.billingHistoryByUserId[mappedUser.id] ?? [],
        };
      }

      return mappedUser;
    }),
    credentials: credentials.map((credential) => ({
      userId: credential.userId,
      email: credential.email,
      passwordHash: credential.passwordHash,
      passwordSalt: credential.passwordSalt,
    })),
    sessions: sessions.map((session) => ({
      token: session.token,
      userId: session.userId,
      expiresAt: session.expiresAt.getTime(),
    })),
    companyJobs: jobs.map((job) => ({
      id: job.id,
      ownerCompanyId: job.ownerCompanyId,
      companyName: job.companyName,
      title: job.title,
      location: job.location,
      modality: job.modality,
      salary: job.salary ?? undefined,
      description: job.description,
      tags: parseJson<string[]>(job.tagsJson, []),
      status: job.status as CompanyJobPost["status"],
      featured: job.featured,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      applicants: [],
    })),
    applications: applications.map((application) => ({
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
    })),
    applicationNotifications: notifications.map((notification) => ({
      id: notification.id,
      userId: notification.userId,
      type: notification.type as ProductNotification["type"],
      category: notification.type.startsWith("application_") ? "workflow" : "insight",
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt.toISOString(),
      read: notification.read,
      applicationId: notification.applicationId ?? undefined,
      jobId: notification.jobId ?? undefined,
      status: notification.status,
    })),
    preferences: loadedPreferences,
  };
}

export async function getAppState() {
  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });
  return loadDatabaseState();
}

export function sanitizeUserForClient<T extends AppUser>(user: T): T {
  return sanitizeUserForClientDto(user);
}

export async function verifyPassword(password: string, credential: StoredCredential) {
  const result = await verifyStoredPassword(password, credential);
  return result.verified;
}

export {
  applicantToCandidateStatus,
  buildApplicationNotification,
  candidateToApplicantStage,
  rowToUser,
  userToProfileCreateInput,
  userToUserCreateInput,
};

export function isCandidateUser(user: AppUser | null | undefined): user is CandidateProfile {
  return Boolean(user && user.role === "candidate");
}

export function isCompanyUser(user: AppUser | null | undefined): user is CompanyProfile {
  return Boolean(user && user.role === "company");
}

export function createCompanyJobId() {
  return `company-job-${randomBytes(6).toString("hex")}`;
}

export function createApplicationId(candidateId: string, jobId: string) {
  return `${candidateId}:${jobId}:${Date.now()}`;
}

export const sessionCookieName = SESSION_COOKIE_NAME;
