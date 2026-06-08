import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/server/db";

type DbClient = Prisma.TransactionClient | PrismaClient;

type InviteOutboxPayload = {
  inviteId: string;
  applicationId: string;
  candidateUserId: string;
  companyName: string;
  jobTitle: string;
};

type OutboxRow = {
  id: string;
  payloadJson: string;
};

function buildNotificationId(inviteId: string) {
  return `chat-invite:${inviteId}`;
}

function parsePayload(value: string) {
  return JSON.parse(value) as InviteOutboxPayload;
}

export async function enqueueChatInviteNotificationOutbox(
  tx: Prisma.TransactionClient,
  payload: InviteOutboxPayload,
  now: Date,
) {
  const outboxId = randomUUID();

  await tx.$executeRaw`
    INSERT INTO chat_notification_outbox (
      id,
      topic,
      payload_json,
      status,
      attempts,
      available_at,
      created_at,
      updated_at
    )
    VALUES (
      ${outboxId},
      'chat_invite_notification',
      ${JSON.stringify(payload)},
      'pending',
      0,
      ${now},
      ${now},
      ${now}
    )
  `;

  return outboxId;
}

async function claimInviteOutbox(
  db: DbClient,
  outboxId: string,
  now: Date,
) {
  const rows = await db.$queryRaw<OutboxRow[]>(Prisma.sql`
    WITH claimed AS (
      UPDATE chat_notification_outbox
      SET status = 'processing',
          attempts = attempts + 1,
          locked_at = ${now},
          updated_at = ${now}
      WHERE id = ${outboxId}
        AND topic = 'chat_invite_notification'
        AND status IN ('pending', 'failed')
        AND available_at <= ${now}
      RETURNING id, payload_json
    )
    SELECT
      id,
      payload_json AS "payloadJson"
    FROM claimed
  `);

  return rows[0] ?? null;
}

async function markInviteOutboxDelivered(
  db: DbClient,
  outboxId: string,
  now: Date,
) {
  await db.$executeRaw`
    UPDATE chat_notification_outbox
    SET status = 'delivered',
        locked_at = NULL,
        delivered_at = ${now},
        last_error = NULL,
        updated_at = ${now}
    WHERE id = ${outboxId}
  `;
}

async function markInviteOutboxFailed(
  db: DbClient,
  outboxId: string,
  now: Date,
  errorMessage: string,
) {
  await db.$executeRaw`
    UPDATE chat_notification_outbox
    SET status = 'failed',
        locked_at = NULL,
        available_at = ${new Date(now.getTime() + 30_000)},
        last_error = ${errorMessage.slice(0, 1000)},
        updated_at = ${now}
    WHERE id = ${outboxId}
  `;
}

async function deliverInviteNotification(
  db: DbClient,
  payload: InviteOutboxPayload,
  now: Date,
) {
  await db.notificationInboxItem.upsert({
    where: { id: buildNotificationId(payload.inviteId) },
    update: {
      userId: payload.candidateUserId,
      type: "application_review",
      category: "workflow",
      source: "persisted",
      title: "Nueva invitación a proceso",
      message: `${payload.companyName} te invitó a proceso para ${payload.jobTitle}.`,
      linkHref: "/invitaciones",
      actionLabel: "Responder invitación",
      applicationId: payload.applicationId,
      status: "pending",
      metadataJson: JSON.stringify({
        inviteId: payload.inviteId,
        inboxKind: "chat_process_invite",
      }),
      lastSeenAt: now,
      updatedAt: now,
    },
    create: {
      id: buildNotificationId(payload.inviteId),
      userId: payload.candidateUserId,
      type: "application_review",
      category: "workflow",
      source: "persisted",
      title: "Nueva invitación a proceso",
      message: `${payload.companyName} te invitó a proceso para ${payload.jobTitle}.`,
      linkHref: "/invitaciones",
      actionLabel: "Responder invitación",
      applicationId: payload.applicationId,
      status: "pending",
      metadataJson: JSON.stringify({
        inviteId: payload.inviteId,
        inboxKind: "chat_process_invite",
      }),
      deliveredAt: now,
      lastSeenAt: now,
    },
  });
}

export async function flushChatInviteNotificationOutbox(outboxId: string) {
  const now = new Date();
  const claimed = await claimInviteOutbox(prisma, outboxId, now);

  if (!claimed) {
    return false;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await deliverInviteNotification(tx, parsePayload(claimed.payloadJson), now);
      await markInviteOutboxDelivered(tx, outboxId, now);
    });
    return true;
  } catch (error) {
    await markInviteOutboxFailed(
      prisma,
      outboxId,
      now,
      error instanceof Error ? error.message : "unknown_delivery_error",
    );
    return false;
  }
}

async function listPendingInviteOutboxIds(limit: number) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id
    FROM chat_notification_outbox
    WHERE topic = 'chat_invite_notification'
      AND status IN ('pending', 'failed')
      AND available_at <= ${new Date()}
    ORDER BY available_at ASC, created_at ASC
    LIMIT ${limit}
  `);

  return rows.map((row) => row.id);
}

export async function runChatInviteOutboxDispatch(limit = 50) {
  const candidateIds = await listPendingInviteOutboxIds(
    Math.max(1, Math.min(limit, 200)),
  );

  let delivered = 0;
  let failed = 0;

  for (const outboxId of candidateIds) {
    const ok = await flushChatInviteNotificationOutbox(outboxId);
    if (ok) {
      delivered += 1;
    } else {
      failed += 1;
    }
  }

  return {
    scanned: candidateIds.length,
    delivered,
    failed,
  };
}
