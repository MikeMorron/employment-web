import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { censorProfanity } from "@/backend/lib-server/chat-bad-words";
import { decryptMessage, encryptMessage } from "@/backend/lib-server/chat-crypto";
import {
  enqueueChatInviteNotificationOutbox,
  flushChatInviteNotificationOutbox,
} from "@/backend/lib-server/chat-notification-outbox";
import { prisma } from "@/lib/server/db";
import { hasCandidateActiveBoost } from "@/lib/candidate-plan";
import { createApplicationId } from "@/lib/server/app-state";
import { rowToUser } from "@/lib/server/app-state-mappers";
import { listCompanyDashboardConfig } from "@/lib/server/preferences-store";
import { sanitizePlainTextInput } from "@/lib/server/security";
import { normalizeCandidateApplicationStatus } from "@/compartido/lib/application-status";
import { candidateToApplicantStage } from "@/lib/server/app-state-notifications";
import type { AppUser, CandidateProfile } from "@/types/profile";
import type {
  ChatConversation,
  ChatMessage,
  ChatModerationWarning,
  ChatParticipant,
  ChatParticipantState,
  ChatPendingInvite,
  CompanyChatCandidateDirectoryItem,
} from "@/types/chat";
import type { CandidateApplicationStatus, CompanyApplicant } from "@/types/workflows";

export const CHAT_AUTO_MESSAGE_CONFIG_KEY = "chat.autoInviteAcceptedMessage";

const INVITE_RETRY_HOURS = 12;
const RAPID_FIRE_WINDOW_MS = 15_000;
const RAPID_FIRE_COOLDOWN_MS = 15_000;
const RAPID_FIRE_MAX_CONSECUTIVE = 5;
const BAD_WORD_WINDOW_MS = 10 * 60_000;
const MONTH_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 1_500;
const MAX_REPORT_REASON_LENGTH = 1_000;
const MESSAGE_PAGE_SIZE = 20;

const ACTIVE_CHAT_APPLICATION_STATUSES = new Set<CandidateApplicationStatus>([
  "application_submitted",
  "application_received",
  "in_review",
  "preselected",
  "in_evaluation",
  "shortlisted",
  "in_decision",
  "offer_sent",
  "offer_accepted",
  "submitted",
  "shortlist",
  "interview",
  "offer",
]);

type ConversationRow = {
  id: string;
  applicationId: string;
  companyUserId: string;
  candidateUserId: string;
  blockedByUserId: string | null;
  status: "active" | "closed" | "pending_review";
  createdAt: Date;
  openedAt: Date | null;
  lastMessageAt: Date | null;
  jobId: string;
  jobTitle: string;
  companyName: string;
  applicationStatus: string;
};

type ParticipantStateRow = {
  conversationId: string;
  userId: string;
  role: "candidate" | "company";
  muted: boolean;
  blocked: boolean;
  blockedAt: Date | null;
  lastReadAt: Date | null;
  reportedAt: Date | null;
  reportReason: string | null;
  cooldownUntil: Date | null;
};

type MessageRow = {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderRole: "candidate" | "company";
  messageKind: "user" | "system" | "auto_intro";
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
  profanityHits: number;
  createdAt: Date;
};

type InviteRow = {
  id: string;
  applicationId: string;
  companyUserId: string;
  candidateUserId: string;
  requestedStage: CompanyApplicant["stage"];
  status: "pending" | "accepted" | "rejected" | "cancelled" | "expired";
  messageTemplateSnapshot: string;
  sentAt: Date;
  respondedAt: Date | null;
  rejectCooldownUntil: Date | null;
  jobId: string;
  jobTitle: string;
  companyName: string;
  candidateName: string;
  applicationStatus: string;
};

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function buildMessageAad(conversationId: string, messageId: string, senderUserId: string) {
  return `chat:${conversationId}:${messageId}:${senderUserId}`;
}

function toChatParticipant(user: AppUser): ChatParticipant {
  const role = user.role === "candidate" ? "candidate" : "company";

  return {
    id: user.id,
    name: user.role === "company" ? user.companyName : user.nombre,
    role,
    headline: user.role === "company" ? user.companyName : user.rol,
    location:
      user.role === "company"
        ? user.companyLocation ?? user.ubicacion
        : user.ubicacion,
  };
}

function toParticipantState(row?: ParticipantStateRow | null): ChatParticipantState {
  return {
    muted: row?.muted ?? false,
    blocked: row?.blocked ?? false,
    blockedAt: toIso(row?.blockedAt) ?? null,
    lastReadAt: toIso(row?.lastReadAt) ?? null,
    reportedAt: toIso(row?.reportedAt) ?? null,
    reportReason: row?.reportReason ?? null,
    cooldownUntil: toIso(row?.cooldownUntil) ?? null,
  };
}

function toChatMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    senderId: row.senderUserId,
    body: decryptMessage(
      {
        ciphertext: row.ciphertext,
        iv: row.iv,
        authTag: row.authTag,
        keyVersion: row.keyVersion,
      },
      buildMessageAad(row.conversationId, row.id, row.senderUserId),
    ),
    sentAt: row.createdAt.toISOString(),
    kind: row.messageKind,
  };
}

function getPenaltyForWarningCount(count: number) {
  if (count <= 1) return 15;
  if (count === 2) return 20;
  if (count === 3) return 25;
  if (count === 4) return 33;
  return 40;
}

async function getUsersByIds(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, AppUser>();
  }

  const rows = await prisma.user.findMany({
    where: { id: { in: userIds } },
    include: { profile: true },
  });

  return new Map(
    rows
      .filter((row) => row.profile)
      .map((row) => [row.id, rowToUser(row, row.profile)]),
  );
}

async function getCompanyChatAutoMessage(companyUserId: string) {
  const config = await listCompanyDashboardConfig(companyUserId);
  const value = config[CHAT_AUTO_MESSAGE_CONFIG_KEY];
  return sanitizePlainTextInput(typeof value === "string" ? value : "", MAX_MESSAGE_LENGTH);
}

async function getConversationRowsForUser(userId: string) {
  return prisma.$queryRaw<ConversationRow[]>(Prisma.sql`
    SELECT
      c.id,
      c.application_id AS "applicationId",
      c.company_user_id AS "companyUserId",
      c.candidate_user_id AS "candidateUserId",
      c.blocked_by_user_id AS "blockedByUserId",
      c.status,
      c.created_at AS "createdAt",
      c.opened_at AS "openedAt",
      c.last_message_at AS "lastMessageAt",
      a."jobId" AS "jobId",
      a.title AS "jobTitle",
      a."companyName" AS "companyName",
      a.status AS "applicationStatus"
    FROM chat_conversations c
    INNER JOIN "Application" a
      ON a.id = c.application_id
    WHERE c.company_user_id = ${userId}
       OR c.candidate_user_id = ${userId}
    ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
  `);
}

async function getParticipantRows(conversationIds: string[]) {
  if (conversationIds.length === 0) {
    return [];
  }

  return prisma.$queryRaw<ParticipantStateRow[]>(Prisma.sql`
    SELECT
      conversation_id AS "conversationId",
      user_id AS "userId",
      role,
      muted,
      blocked,
      blocked_at AS "blockedAt",
      last_read_at AS "lastReadAt",
      reported_at AS "reportedAt",
      report_reason AS "reportReason",
      cooldown_until AS "cooldownUntil"
    FROM chat_conversation_participants
    WHERE conversation_id IN (${Prisma.join(conversationIds)})
  `);
}

async function getMessageRows(conversationIds: string[]) {
  if (conversationIds.length === 0) {
    return [];
  }

  return prisma.$queryRaw<MessageRow[]>(Prisma.sql`
    WITH ranked_messages AS (
      SELECT
        id,
        conversation_id,
        sender_user_id,
        sender_role,
        message_kind,
        ciphertext,
        iv,
        auth_tag,
        key_version,
        profanity_hits,
        created_at,
        ROW_NUMBER() OVER (
          PARTITION BY conversation_id
          ORDER BY created_at DESC
        ) AS rn
      FROM chat_messages
      WHERE conversation_id IN (${Prisma.join(conversationIds)})
    )
    SELECT
      id,
      conversation_id AS "conversationId",
      sender_user_id AS "senderUserId",
      sender_role AS "senderRole",
      message_kind AS "messageKind",
      ciphertext,
      iv,
      auth_tag AS "authTag",
      key_version AS "keyVersion",
      profanity_hits AS "profanityHits",
      created_at AS "createdAt"
    FROM ranked_messages
    WHERE rn <= ${MESSAGE_PAGE_SIZE}
    ORDER BY created_at ASC
  `);
}

async function getConversationMessagePageRows(
  tx: Prisma.TransactionClient | PrismaClient,
  params: {
    conversationId: string;
    before?: Date;
    limit?: number;
  },
) {
  const pageSize = Math.min(50, Math.max(1, params.limit ?? MESSAGE_PAGE_SIZE));

  return tx.$queryRaw<MessageRow[]>(Prisma.sql`
    SELECT
      id,
      conversation_id AS "conversationId",
      sender_user_id AS "senderUserId",
      sender_role AS "senderRole",
      message_kind AS "messageKind",
      ciphertext,
      iv,
      auth_tag AS "authTag",
      key_version AS "keyVersion",
      profanity_hits AS "profanityHits",
      created_at AS "createdAt"
    FROM chat_messages
    WHERE conversation_id = ${params.conversationId}
      ${
        params.before
          ? Prisma.sql`AND created_at < ${params.before}`
          : Prisma.sql``
      }
    ORDER BY created_at DESC
    LIMIT ${pageSize + 1}
  `);
}

async function getPendingInviteRowsForCandidate(candidateUserId: string) {
  return prisma.$queryRaw<InviteRow[]>(Prisma.sql`
    SELECT
      i.id,
      i.application_id AS "applicationId",
      i.company_user_id AS "companyUserId",
      i.candidate_user_id AS "candidateUserId",
      i.requested_stage AS "requestedStage",
      i.status,
      i.message_template_snapshot AS "messageTemplateSnapshot",
      i.sent_at AS "sentAt",
      i.responded_at AS "respondedAt",
      i.reject_cooldown_until AS "rejectCooldownUntil",
      a."jobId" AS "jobId",
      a.title AS "jobTitle",
      a."companyName" AS "companyName",
      a."candidateName" AS "candidateName",
      a.status AS "applicationStatus"
    FROM chat_process_invites i
    INNER JOIN "Application" a
      ON a.id = i.application_id
    WHERE i.candidate_user_id = ${candidateUserId}
      AND i.status = 'pending'
    ORDER BY i.sent_at DESC
  `);
}

async function buildPendingInvitesForCandidate(candidateUserId: string): Promise<ChatPendingInvite[]> {
  const rows = await getPendingInviteRowsForCandidate(candidateUserId);

  return rows.map((row) => ({
    id: row.id,
    applicationId: row.applicationId,
    candidateId: row.candidateUserId,
    companyUserId: row.companyUserId,
    companyName: row.companyName,
    candidateName: row.candidateName,
    jobId: row.jobId,
    jobTitle: row.jobTitle,
    applicationStatus: normalizeCandidateApplicationStatus(
      row.applicationStatus as CandidateApplicationStatus,
    ),
    applicantStage: candidateToApplicantStage(
      normalizeCandidateApplicationStatus(row.applicationStatus as CandidateApplicationStatus),
    ),
    sentAt: row.sentAt.toISOString(),
    messageTemplatePreview: row.messageTemplateSnapshot,
    canRespond: row.status === "pending",
    canInviteAgainAt: toIso(row.rejectCooldownUntil) ?? null,
  }));
}

async function upsertConversationParticipants(
  tx: Prisma.TransactionClient,
  conversationId: string,
  companyUserId: string,
  candidateUserId: string,
  now: Date,
) {
  await tx.$executeRaw`
    INSERT INTO chat_conversation_participants (
      conversation_id, user_id, role, last_read_at, created_at, updated_at
    )
    VALUES
      (${conversationId}, ${companyUserId}, 'company', ${now}, ${now}, ${now}),
      (${conversationId}, ${candidateUserId}, 'candidate', NULL, ${now}, ${now})
    ON CONFLICT (conversation_id, user_id)
    DO UPDATE SET
      role = EXCLUDED.role,
      updated_at = EXCLUDED.updated_at
  `;
}

async function getConversationAccessRow(
  tx: Prisma.TransactionClient | PrismaClient,
  conversationId: string,
  userId: string,
) {
  const rows = await tx.$queryRaw<Array<ConversationRow & {
    participantMuted: boolean;
    participantBlocked: boolean;
    participantBlockedAt: Date | null;
    participantLastReadAt: Date | null;
    participantReportedAt: Date | null;
    participantReportReason: string | null;
    participantCooldownUntil: Date | null;
  }>>(Prisma.sql`
    SELECT
      c.id,
      c.application_id AS "applicationId",
      c.company_user_id AS "companyUserId",
      c.candidate_user_id AS "candidateUserId",
      c.blocked_by_user_id AS "blockedByUserId",
      c.status,
      c.created_at AS "createdAt",
      c.opened_at AS "openedAt",
      c.last_message_at AS "lastMessageAt",
      a."jobId" AS "jobId",
      a.title AS "jobTitle",
      a."companyName" AS "companyName",
      a.status AS "applicationStatus",
      p.muted AS "participantMuted",
      p.blocked AS "participantBlocked",
      p.blocked_at AS "participantBlockedAt",
      p.last_read_at AS "participantLastReadAt",
      p.reported_at AS "participantReportedAt",
      p.report_reason AS "participantReportReason",
      p.cooldown_until AS "participantCooldownUntil"
    FROM chat_conversations c
    INNER JOIN chat_conversation_participants p
      ON p.conversation_id = c.id
     AND p.user_id = ${userId}
    INNER JOIN "Application" a
      ON a.id = c.application_id
    WHERE c.id = ${conversationId}
    LIMIT 1
  `);

  return rows[0] ?? null;
}

async function getRecentMessagesForCooldown(
  tx: Prisma.TransactionClient,
  conversationId: string,
) {
  return tx.$queryRaw<Array<{
    senderUserId: string;
    createdAt: Date;
  }>>(Prisma.sql`
    SELECT
      sender_user_id AS "senderUserId",
      created_at AS "createdAt"
    FROM chat_messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at DESC
    LIMIT ${RAPID_FIRE_MAX_CONSECUTIVE}
  `);
}

async function enforceConversationCooldown(
  tx: Prisma.TransactionClient,
  conversationId: string,
  senderUserId: string,
  now: Date,
) {
  const recentMessages = await getRecentMessagesForCooldown(tx, conversationId);

  if (recentMessages.length < RAPID_FIRE_MAX_CONSECUTIVE) {
    return null;
  }

  const sameSender = recentMessages.every(
    (message) => message.senderUserId === senderUserId,
  );
  const oldest = recentMessages.at(-1);

  if (
    !sameSender ||
    !oldest ||
    now.getTime() - oldest.createdAt.getTime() > RAPID_FIRE_WINDOW_MS
  ) {
    return null;
  }

  const cooldownUntil = new Date(now.getTime() + RAPID_FIRE_COOLDOWN_MS);

  await tx.$executeRaw`
    UPDATE chat_conversation_participants
    SET cooldown_until = ${cooldownUntil}, updated_at = ${now}
    WHERE conversation_id = ${conversationId}
      AND user_id = ${senderUserId}
  `;

  await tx.$executeRaw`
    INSERT INTO chat_moderation_events (
      id, user_id, conversation_id, event_type, severity, visibility_penalty_pct, warning_count_month, details_json, created_at
    )
    VALUES (
      ${randomUUID()},
      ${senderUserId},
      ${conversationId},
      'cooldown',
      1,
      0,
      0,
      ${JSON.stringify({
        trigger: "rapid_fire",
        windowMs: RAPID_FIRE_WINDOW_MS,
        cooldownMs: RAPID_FIRE_COOLDOWN_MS,
      })},
      ${now}
    )
  `;

  return cooldownUntil;
}

async function applyModerationProfileSummary(
  tx: Prisma.TransactionClient,
  userId: string,
  penaltyPct: number,
  warningCountMonth: number,
  suspendedForReview: boolean,
  now: Date,
) {
  const profile = await tx.profile.findUnique({
    where: { userId },
    select: {
      profileQualityJson: true,
      profileVisibility: true,
    },
  });

  if (!profile) {
    return;
  }

  const quality =
    profile.profileQualityJson && profile.profileQualityJson.trim()
      ? (JSON.parse(profile.profileQualityJson) as Record<string, unknown>)
      : {};

  quality.moderationVisibilityPenaltyPct = penaltyPct;
  quality.chatWarningsMonth = warningCountMonth;
  quality.chatSuspendedForReview = suspendedForReview;
  quality.lastModerationWarningAt = now.toISOString();

  await tx.profile.update({
    where: { userId },
    data: {
      profileQualityJson: JSON.stringify(quality),
      ...(suspendedForReview ? { profileVisibility: "private" } : {}),
    },
  });
}

async function maybeCreateProfanityWarning(
  tx: Prisma.TransactionClient,
  params: {
    userId: string;
    conversationId: string;
    messageId: string;
    profanityHits: number;
    now: Date;
  },
): Promise<ChatModerationWarning | null> {
  if (params.profanityHits <= 0) {
    return null;
  }

  const [recentProfanity, monthlyWarnings] = await Promise.all([
    tx.$queryRaw<Array<{ totalHits: number }>>(Prisma.sql`
      SELECT COALESCE(SUM(profanity_hits), 0)::int AS "totalHits"
      FROM chat_messages
      WHERE sender_user_id = ${params.userId}
        AND profanity_hits > 0
        AND created_at >= ${new Date(params.now.getTime() - BAD_WORD_WINDOW_MS)}
    `),
    tx.$queryRaw<Array<{ warningCount: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS "warningCount"
      FROM chat_moderation_events
      WHERE user_id = ${params.userId}
        AND event_type = 'profanity_warning'
        AND created_at >= ${new Date(params.now.getTime() - MONTH_WINDOW_MS)}
    `),
  ]);

  const combinedHits = (recentProfanity[0]?.totalHits ?? 0) + params.profanityHits;
  const shouldWarn = params.profanityHits >= 2 || combinedHits >= 3;

  if (!shouldWarn) {
    return null;
  }

  const warningCountMonth = (monthlyWarnings[0]?.warningCount ?? 0) + 1;
  const penaltyPct = getPenaltyForWarningCount(warningCountMonth);
  const suspendedForReview = warningCountMonth > 5;

  await tx.$executeRaw`
    INSERT INTO chat_moderation_events (
      id,
      user_id,
      conversation_id,
      message_id,
      event_type,
      severity,
      visibility_penalty_pct,
      warning_count_month,
      details_json,
      created_at
    )
    VALUES (
      ${randomUUID()},
      ${params.userId},
      ${params.conversationId},
      ${params.messageId},
      'profanity_warning',
      ${Math.min(5, warningCountMonth)},
      ${penaltyPct},
      ${warningCountMonth},
      ${JSON.stringify({
        profanityHits: params.profanityHits,
        combinedHits,
      })},
      ${params.now}
    )
  `;

  if (suspendedForReview) {
    await tx.$executeRaw`
      INSERT INTO chat_moderation_events (
        id,
        user_id,
        conversation_id,
        message_id,
        event_type,
        severity,
        visibility_penalty_pct,
        warning_count_month,
        details_json,
        created_at
      )
      VALUES (
        ${randomUUID()},
        ${params.userId},
        ${params.conversationId},
        ${params.messageId},
        'manual_review',
        5,
        100,
        ${warningCountMonth},
        ${JSON.stringify({ reason: "monthly_warning_threshold_exceeded" })},
        ${params.now}
      )
    `;
  }

  await applyModerationProfileSummary(
    tx,
    params.userId,
    suspendedForReview ? 100 : penaltyPct,
    warningCountMonth,
    suspendedForReview,
    params.now,
  );

  return {
    message: suspendedForReview
      ? "Tu cuenta quedó suspendida para revisión manual por lenguaje abusivo recurrente."
      : "Advertencia: el sistema detectó lenguaje abusivo y redujo tu visibilidad en el match.",
    penaltyPct: suspendedForReview ? 100 : penaltyPct,
    warningCountMonth,
    suspendedForReview,
  };
}

async function getUserModerationState(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { profileQualityJson: true },
  });

  const quality =
    profile?.profileQualityJson && profile.profileQualityJson.trim()
      ? (JSON.parse(profile.profileQualityJson) as Record<string, unknown>)
      : {};

  return {
    visibilityPenaltyPct:
      typeof quality.moderationVisibilityPenaltyPct === "number"
        ? quality.moderationVisibilityPenaltyPct
        : 0,
    suspendedForReview: quality.chatSuspendedForReview === true,
    warningCountMonth:
      typeof quality.chatWarningsMonth === "number"
        ? quality.chatWarningsMonth
        : 0,
  };
}

export async function listCompanyChatCandidateDirectory(
  companyUserId: string,
): Promise<CompanyChatCandidateDirectoryItem[]> {
  const jobs = await prisma.job.findMany({
    where: { ownerCompanyId: companyUserId },
    select: { id: true, title: true },
  });

  const jobIds = jobs.map((job) => job.id);
  if (jobIds.length === 0) {
    return [];
  }

  const applications = await prisma.application.findMany({
    where: {
      jobId: { in: jobIds },
      status: { in: Array.from(ACTIVE_CHAT_APPLICATION_STATUSES) },
    },
    orderBy: { lastUpdatedAt: "desc" },
  });

  if (applications.length === 0) {
    return [];
  }

  const candidateIds = Array.from(new Set(applications.map((item) => item.candidateId)));
  const candidates = await prisma.user.findMany({
    where: { id: { in: candidateIds } },
    include: { profile: true },
  });
  const candidateMap = new Map(
    candidates
      .filter((row) => row.profile)
      .map((row) => [row.id, rowToUser(row, row.profile) as CandidateProfile]),
  );

  const applicationIds = applications.map((item) => item.id);
  const [latestInvites, activeConversations] = await Promise.all([
    prisma.$queryRaw<Array<{
      applicationId: string;
      inviteId: string;
      status: "pending" | "accepted" | "rejected" | "cancelled" | "expired";
      rejectCooldownUntil: Date | null;
    }>>(Prisma.sql`
      SELECT DISTINCT ON (application_id)
        application_id AS "applicationId",
        id AS "inviteId",
        status,
        reject_cooldown_until AS "rejectCooldownUntil"
      FROM chat_process_invites
      WHERE application_id IN (${Prisma.join(applicationIds)})
      ORDER BY application_id, sent_at DESC
    `),
    prisma.$queryRaw<Array<{ applicationId: string; conversationId: string }>>(Prisma.sql`
      SELECT
        application_id AS "applicationId",
        id AS "conversationId"
      FROM chat_conversations
      WHERE application_id IN (${Prisma.join(applicationIds)})
        AND status = 'active'
    `),
  ]);

  const inviteMap = new Map(latestInvites.map((row) => [row.applicationId, row]));
  const activeConversationMap = new Map(
    activeConversations.map((row) => [row.applicationId, row.conversationId]),
  );
  const jobMap = new Map(jobs.map((job) => [job.id, job.title]));

  return applications.flatMap((application) => {
    const candidate = candidateMap.get(application.candidateId);
    if (!candidate) {
      return [];
    }

    const latestInvite = inviteMap.get(application.id);
    const activeConversationId = activeConversationMap.get(application.id) ?? null;
    const normalizedStatus = normalizeCandidateApplicationStatus(
      application.status as CandidateApplicationStatus,
    );
    const applicantStage = candidateToApplicantStage(normalizedStatus);

    let inviteStatus: CompanyChatCandidateDirectoryItem["inviteStatus"] = "ready";
    if (activeConversationId) {
      inviteStatus = "accepted";
    } else if (latestInvite?.status === "pending") {
      inviteStatus = "pending";
    } else if (
      latestInvite?.status === "rejected" &&
      latestInvite.rejectCooldownUntil &&
      latestInvite.rejectCooldownUntil.getTime() > Date.now()
    ) {
      inviteStatus = "cooldown";
    }

    return [{
      applicationId: application.id,
      candidateId: application.candidateId,
      nombre: candidate.nombre,
      rol: candidate.rol,
      ubicacion: candidate.ubicacion,
      jobId: application.jobId,
      jobTitle: jobMap.get(application.jobId) ?? application.title,
      applicationStatus: normalizedStatus,
      applicantStage,
      inviteStatus,
      latestInviteId: latestInvite?.inviteId ?? null,
      canInviteAt: toIso(latestInvite?.rejectCooldownUntil) ?? null,
      activeConversationId,
    }];
  });
}

export async function listChatSurfaceForUser(
  user: AppUser,
): Promise<{
  conversations: ChatConversation[];
  pendingInvites: ChatPendingInvite[];
}> {
  const rows = await getConversationRowsForUser(user.id);
  const conversationIds = rows.map((row) => row.id);
  const participantRows = await getParticipantRows(conversationIds);
  const messageRows = await getMessageRows(conversationIds);
  const userMap = await getUsersByIds(
    Array.from(
      new Set(
        rows.flatMap((row) => [row.companyUserId, row.candidateUserId]),
      ),
    ),
  );

  const participantStateMap = new Map<string, Record<string, ChatParticipantState>>();
  for (const row of participantRows) {
    const state = participantStateMap.get(row.conversationId) ?? {};
    state[row.userId] = toParticipantState(row);
    participantStateMap.set(row.conversationId, state);
  }

  const messageMap = new Map<string, ChatMessage[]>();
  for (const row of messageRows) {
    const messages = messageMap.get(row.conversationId) ?? [];
    messages.push(toChatMessage(row));
    messageMap.set(row.conversationId, messages);
  }

  const conversations = rows.flatMap((row) => {
    const company = userMap.get(row.companyUserId);
    const candidate = userMap.get(row.candidateUserId);

    if (!company || !candidate) {
      return [];
    }

    return [{
      id: row.id,
      applicationId: row.applicationId,
      createdAt: row.createdAt.toISOString(),
      createdById: row.companyUserId,
      status: row.status,
      jobId: row.jobId,
      jobTitle: row.jobTitle,
      companyName: row.companyName,
      participants: [toChatParticipant(company), toChatParticipant(candidate)],
      participantState: participantStateMap.get(row.id) ?? {},
      messages: messageMap.get(row.id) ?? [],
    }];
  });

  return {
    conversations,
    pendingInvites:
      user.role === "candidate"
        ? await buildPendingInvitesForCandidate(user.id)
        : [],
  };
}

export async function createCompanyChatInvite(params: {
  companyUserId: string;
  applicationId?: string;
  candidateUserId?: string;
}) {
  const autoMessage = await getCompanyChatAutoMessage(params.companyUserId);
  let application = params.applicationId
    ? await prisma.application.findUnique({
        where: { id: params.applicationId },
      })
    : null;

  if (!application && params.candidateUserId) {
    const publishedJobs = await prisma.job.findMany({
      where: {
        ownerCompanyId: params.companyUserId,
        status: "published",
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        companyName: true,
        title: true,
        location: true,
        modality: true,
        salary: true,
      },
    });

    if (publishedJobs.length === 0) {
      throw new Error("NO_PUBLISHED_JOB_AVAILABLE");
    }

    application = await prisma.application.findFirst({
      where: {
        candidateId: params.candidateUserId,
        jobId: { in: publishedJobs.map((job) => job.id) },
        status: { in: Array.from(ACTIVE_CHAT_APPLICATION_STATUSES) },
      },
      orderBy: { lastUpdatedAt: "desc" },
    });

    if (!application) {
      const candidateRow = await prisma.user.findUnique({
        where: { id: params.candidateUserId },
        include: { profile: true },
      });
      const candidate =
        candidateRow?.profile ? (rowToUser(candidateRow, candidateRow.profile) as CandidateProfile) : null;

      if (!candidate || candidate.role !== "candidate") {
        throw new Error("CANDIDATE_NOT_FOUND");
      }

      if (!hasCandidateActiveBoost(candidate)) {
        throw new Error("APPLICATION_REQUIRED");
      }

      const referenceJob = publishedJobs[0];
      const now = new Date();
      const nextApplicationId = createApplicationId(candidate.id, referenceJob.id);
      await prisma.application.create({
        data: {
          id: nextApplicationId,
          candidateId: candidate.id,
          candidateName: candidate.nombre,
          jobId: referenceJob.id,
          title: referenceJob.title,
          companyName: referenceJob.companyName,
          location: referenceJob.location,
          modality: referenceJob.modality,
          salary: referenceJob.salary ?? null,
          status: "application_received",
          appliedAt: now,
          lastUpdatedAt: now,
          fitLabel: "80%",
        },
      });

      application = await prisma.application.findUnique({
        where: { id: nextApplicationId },
      });
    }
  }

  if (!application) {
    throw new Error("APPLICATION_NOT_FOUND");
  }

  if (!ACTIVE_CHAT_APPLICATION_STATUSES.has(
    normalizeCandidateApplicationStatus(application.status as CandidateApplicationStatus),
  )) {
    throw new Error("APPLICATION_NOT_ACTIVE");
  }

  const job = await prisma.job.findUnique({
    where: { id: application.jobId },
    select: { ownerCompanyId: true },
  });

  if (!job || job.ownerCompanyId !== params.companyUserId) {
    throw new Error("APPLICATION_NOT_FOUND");
  }

  if (!autoMessage) {
    throw new Error("AUTO_MESSAGE_REQUIRED");
  }

  const [existingConversation, latestInvite] = await Promise.all([
    prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM chat_conversations
      WHERE application_id = ${application.id}
        AND status = 'active'
      LIMIT 1
    `),
    prisma.$queryRaw<Array<{
      id: string;
      status: string;
      rejectCooldownUntil: Date | null;
    }>>(Prisma.sql`
      SELECT
        id,
        status,
        reject_cooldown_until AS "rejectCooldownUntil"
      FROM chat_process_invites
      WHERE application_id = ${application.id}
      ORDER BY sent_at DESC
      LIMIT 1
    `),
  ]);

  if (existingConversation[0]?.id) {
    throw new Error("CONVERSATION_ALREADY_ACTIVE");
  }

  if (latestInvite[0]?.status === "pending") {
    throw new Error("INVITE_ALREADY_PENDING");
  }

  if (
    latestInvite[0]?.status === "rejected" &&
    latestInvite[0].rejectCooldownUntil &&
    latestInvite[0].rejectCooldownUntil.getTime() > Date.now()
  ) {
    throw new Error("INVITE_COOLDOWN_ACTIVE");
  }

  const now = new Date();
  const stage = candidateToApplicantStage(
    normalizeCandidateApplicationStatus(application.status as CandidateApplicationStatus),
  );
  const inviteId = randomUUID();
  let outboxId = "";

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO chat_process_invites (
          id,
          application_id,
          company_user_id,
          candidate_user_id,
          requested_stage,
          status,
          message_template_snapshot,
          sent_at,
          created_at,
          updated_at
        )
        VALUES (
          ${inviteId},
          ${application.id},
          ${params.companyUserId},
          ${application.candidateId},
          ${stage},
          'pending',
          ${autoMessage},
          ${now},
          ${now},
          ${now}
        )
      `;

      outboxId = await enqueueChatInviteNotificationOutbox(tx, {
        inviteId,
        applicationId: application.id,
        candidateUserId: application.candidateId,
        companyName: application.companyName,
        jobTitle: application.title,
      }, now);
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("chat_process_invites_pending_application_idx") ||
        error.message.toLowerCase().includes("duplicate key"))
    ) {
      throw new Error("INVITE_ALREADY_PENDING");
    }

    throw new Error("INVITE_NOTIFICATION_FAILED");
  }

  const delivered = await flushChatInviteNotificationOutbox(outboxId);
  if (!delivered) {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE chat_process_invites
        SET status = 'cancelled',
            updated_at = ${new Date()}
        WHERE id = ${inviteId}
          AND status = 'pending'
      `;
    });
    throw new Error("INVITE_NOTIFICATION_FAILED");
  }

  return {
    inviteId,
    candidateId: application.candidateId,
    sentAt: now.toISOString(),
    notificationDelivered: delivered,
  };
}

export async function respondToChatInvite(params: {
  candidateUserId: string;
  inviteId: string;
  action: "accept" | "reject";
}) {
  const inviteRows = await prisma.$queryRaw<InviteRow[]>(Prisma.sql`
    SELECT
      i.id,
      i.application_id AS "applicationId",
      i.company_user_id AS "companyUserId",
      i.candidate_user_id AS "candidateUserId",
      i.requested_stage AS "requestedStage",
      i.status,
      i.message_template_snapshot AS "messageTemplateSnapshot",
      i.sent_at AS "sentAt",
      i.responded_at AS "respondedAt",
      i.reject_cooldown_until AS "rejectCooldownUntil",
      a."jobId" AS "jobId",
      a.title AS "jobTitle",
      a."companyName" AS "companyName",
      a."candidateName" AS "candidateName",
      a.status AS "applicationStatus"
    FROM chat_process_invites i
    INNER JOIN "Application" a
      ON a.id = i.application_id
    WHERE i.id = ${params.inviteId}
      AND i.candidate_user_id = ${params.candidateUserId}
    LIMIT 1
  `);

  const invite = inviteRows[0];
  if (!invite) {
    throw new Error("INVITE_NOT_FOUND");
  }

  if (invite.status === "accepted") {
    const existingConversationRows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM chat_conversations
      WHERE application_id = ${invite.applicationId}
        AND candidate_user_id = ${params.candidateUserId}
        AND status = 'active'
      LIMIT 1
    `);

    if (existingConversationRows[0]?.id) {
      return {
        accepted: true,
        conversationId: existingConversationRows[0].id,
      };
    }
  }

  if (invite.status !== "pending") {
    throw new Error("INVITE_NOT_FOUND");
  }

  const now = new Date();

  if (params.action === "reject") {
    const rejectCooldownUntil = new Date(now.getTime() + INVITE_RETRY_HOURS * 60 * 60 * 1000);
    await prisma.$executeRaw`
      UPDATE chat_process_invites
      SET status = 'rejected',
          responded_at = ${now},
          reject_cooldown_until = ${rejectCooldownUntil},
          updated_at = ${now}
      WHERE id = ${params.inviteId}
    `;

    return {
      accepted: false,
      rejectCooldownUntil: rejectCooldownUntil.toISOString(),
    };
  }

  return prisma.$transaction(async (tx) => {
    const existingConversationRows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM chat_conversations
      WHERE application_id = ${invite.applicationId}
      LIMIT 1
    `);

    const conversationId = existingConversationRows[0]?.id ?? randomUUID();

    if (!existingConversationRows[0]?.id) {
      await tx.$executeRaw`
        INSERT INTO chat_conversations (
          id,
          application_id,
          company_user_id,
          candidate_user_id,
          status,
          opened_at,
          created_at,
          updated_at
        )
        VALUES (
          ${conversationId},
          ${invite.applicationId},
          ${invite.companyUserId},
          ${invite.candidateUserId},
          'active',
          ${now},
          ${now},
          ${now}
        )
      `;
    } else {
      await tx.$executeRaw`
        UPDATE chat_conversations
        SET status = 'active',
            opened_at = COALESCE(opened_at, ${now}),
            updated_at = ${now}
        WHERE id = ${conversationId}
      `;
    }

    await upsertConversationParticipants(
      tx,
      conversationId,
      invite.companyUserId,
      invite.candidateUserId,
      now,
    );

    const messageId = randomUUID();
    const encrypted = encryptMessage(
      invite.messageTemplateSnapshot,
      buildMessageAad(conversationId, messageId, invite.companyUserId),
    );

    await tx.$executeRaw`
      INSERT INTO chat_messages (
        id,
        conversation_id,
        sender_user_id,
        sender_role,
        message_kind,
        ciphertext,
        iv,
        auth_tag,
        key_version,
        profanity_hits,
        created_at
      )
      VALUES (
        ${messageId},
        ${conversationId},
        ${invite.companyUserId},
        'company',
        'auto_intro',
        ${encrypted.ciphertext},
        ${encrypted.iv},
        ${encrypted.authTag},
        ${encrypted.keyVersion},
        0,
        ${now}
      )
    `;

    await tx.$executeRaw`
      UPDATE chat_conversations
      SET last_message_at = ${now},
          updated_at = ${now}
      WHERE id = ${conversationId}
    `;

    await tx.$executeRaw`
      UPDATE chat_process_invites
      SET status = 'accepted',
          responded_at = ${now},
          updated_at = ${now}
      WHERE id = ${params.inviteId}
    `;

    await tx.$executeRaw`
      UPDATE "Application"
      SET status = 'in_decision',
          "lastUpdatedAt" = ${now}
      WHERE id = ${invite.applicationId}
        AND status NOT IN (
          'offer_accepted',
          'offer_rejected',
          'rejected',
          'not_selected',
          'process_closed',
          'vacancy_cancelled',
          'withdrawn'
        )
    `;

    return {
      accepted: true,
      conversationId,
    };
  });
}

export async function sendChatMessage(params: {
  user: AppUser;
  conversationId: string;
  body: string;
}) {
  const normalizedBody = sanitizePlainTextInput(params.body, MAX_MESSAGE_LENGTH);
  if (!normalizedBody) {
    throw new Error("EMPTY_MESSAGE");
  }

  const moderationState = await getUserModerationState(params.user.id);
  if (moderationState.suspendedForReview) {
    throw new Error("USER_SUSPENDED_FOR_REVIEW");
  }

  return prisma.$transaction(async (tx) => {
    const access = await getConversationAccessRow(tx, params.conversationId, params.user.id);
    if (!access) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }

    const normalizedStatus = normalizeCandidateApplicationStatus(
      access.applicationStatus as CandidateApplicationStatus,
    );

    if (access.status !== "active" || !ACTIVE_CHAT_APPLICATION_STATUSES.has(normalizedStatus)) {
      throw new Error("CONVERSATION_CLOSED");
    }

    if (access.blockedByUserId) {
      throw new Error(
        access.blockedByUserId === params.user.id
          ? "CONVERSATION_BLOCKED_BY_YOU"
          : "CONVERSATION_BLOCKED_BY_PEER",
      );
    }

    if (
      access.participantCooldownUntil &&
      access.participantCooldownUntil.getTime() > Date.now()
    ) {
      throw new Error("COOLDOWN_ACTIVE");
    }

    const cooldownUntil = await enforceConversationCooldown(
      tx,
      params.conversationId,
      params.user.id,
      new Date(),
    );
    if (cooldownUntil) {
      throw new Error("COOLDOWN_ACTIVE");
    }

    const now = new Date();
    const moderation = await censorProfanity(normalizedBody);
    const messageId = randomUUID();
    const encrypted = encryptMessage(
      moderation.censored,
      buildMessageAad(params.conversationId, messageId, params.user.id),
    );

    await tx.$executeRaw`
      INSERT INTO chat_messages (
        id,
        conversation_id,
        sender_user_id,
        sender_role,
        message_kind,
        ciphertext,
        iv,
        auth_tag,
        key_version,
        profanity_hits,
        created_at
      )
      VALUES (
        ${messageId},
        ${params.conversationId},
        ${params.user.id},
        ${params.user.role},
        'user',
        ${encrypted.ciphertext},
        ${encrypted.iv},
        ${encrypted.authTag},
        ${encrypted.keyVersion},
        ${moderation.profanityHits},
        ${now}
      )
    `;

    await tx.$executeRaw`
      UPDATE chat_conversations
      SET last_message_at = ${now},
          updated_at = ${now}
      WHERE id = ${params.conversationId}
    `;

    await tx.$executeRaw`
      UPDATE chat_conversation_participants
      SET last_read_at = CASE
            WHEN user_id = ${params.user.id} THEN ${now}
            ELSE last_read_at
          END,
          updated_at = ${now}
      WHERE conversation_id = ${params.conversationId}
    `;

    const warning = await maybeCreateProfanityWarning(tx, {
      userId: params.user.id,
      conversationId: params.conversationId,
      messageId,
      profanityHits: moderation.profanityHits,
      now,
    });

    return {
      message: {
        id: messageId,
        senderId: params.user.id,
        body: moderation.censored,
        sentAt: now.toISOString(),
        kind: "user",
      } satisfies ChatMessage,
      warning,
    };
  });
}

export async function updateConversationParticipantState(params: {
  userId: string;
  conversationId: string;
  muted?: boolean;
  blocked?: boolean;
  markRead?: boolean;
}) {
  const access = await getConversationAccessRow(prisma, params.conversationId, params.userId);
  if (!access) {
    throw new Error("CONVERSATION_NOT_FOUND");
  }

  const now = new Date();
  const nextMuted =
    typeof params.muted === "boolean" ? params.muted : access.participantMuted;
  const nextBlocked =
    typeof params.blocked === "boolean" ? params.blocked : access.participantBlocked;
  const nextBlockedAt =
    typeof params.blocked === "boolean"
      ? params.blocked
        ? now
        : null
      : access.participantBlockedAt;
  const nextLastReadAt = params.markRead
    ? access.lastMessageAt ?? now
    : access.participantLastReadAt;

  await prisma.$executeRaw`
    UPDATE chat_conversation_participants
    SET muted = ${nextMuted},
        blocked = ${nextBlocked},
        blocked_at = ${nextBlockedAt},
        last_read_at = ${nextLastReadAt},
        updated_at = ${now}
    WHERE conversation_id = ${params.conversationId}
      AND user_id = ${params.userId}
  `;

  if (typeof params.blocked === "boolean") {
    await prisma.$executeRaw`
      UPDATE chat_conversations
      SET blocked_by_user_id = ${params.blocked ? params.userId : null},
          updated_at = ${now}
      WHERE id = ${params.conversationId}
    `;
  }
}

export async function reportChatConversation(params: {
  userId: string;
  conversationId: string;
  reason: string;
}) {
  const access = await getConversationAccessRow(prisma, params.conversationId, params.userId);
  if (!access) {
    throw new Error("CONVERSATION_NOT_FOUND");
  }

  const reason = sanitizePlainTextInput(params.reason, MAX_REPORT_REASON_LENGTH);
  if (!reason) {
    throw new Error("REPORT_REASON_REQUIRED");
  }

  const now = new Date();
  const reportedUserId =
    access.companyUserId === params.userId
      ? access.candidateUserId
      : access.companyUserId;

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE chat_conversation_participants
      SET reported_at = ${now},
          report_reason = ${reason},
          updated_at = ${now}
      WHERE conversation_id = ${params.conversationId}
        AND user_id = ${params.userId}
    `;

    await tx.$executeRaw`
      INSERT INTO chat_moderation_events (
        id,
        user_id,
        conversation_id,
        event_type,
        severity,
        visibility_penalty_pct,
        warning_count_month,
        details_json,
        created_at
      )
      VALUES (
        ${randomUUID()},
        ${reportedUserId},
        ${params.conversationId},
        'report',
        2,
        0,
        0,
        ${JSON.stringify({
          reporterUserId: params.userId,
          reason,
        })},
        ${now}
      )
    `;
  });
}

export async function listConversationMessagesPage(params: {
  userId: string;
  conversationId: string;
  before?: string | null;
  limit?: number;
}) {
  const before =
    typeof params.before === "string" && params.before.trim()
      ? new Date(params.before)
      : null;

  if (before && Number.isNaN(before.getTime())) {
    throw new Error("INVALID_CURSOR");
  }

  const access = await getConversationAccessRow(prisma, params.conversationId, params.userId);
  if (!access) {
    throw new Error("CONVERSATION_NOT_FOUND");
  }

  const rows = await getConversationMessagePageRows(prisma, {
    conversationId: params.conversationId,
    before: before ?? undefined,
    limit: params.limit,
  });
  const pageSize = Math.min(50, Math.max(1, params.limit ?? MESSAGE_PAGE_SIZE));
  const hasMore = rows.length > pageSize;
  const visibleRows = rows.slice(0, pageSize).reverse();

  return {
    messages: visibleRows.map(toChatMessage),
    hasMore,
  };
}
