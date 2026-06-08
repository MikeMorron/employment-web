CREATE TABLE IF NOT EXISTS "NotificationInboxItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkHref" TEXT,
    "actionLabel" TEXT,
    "applicationId" TEXT,
    "jobId" TEXT,
    "entityId" TEXT,
    "status" TEXT,
    "metadataJson" TEXT,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "hiddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationInboxItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NotificationInboxItem_userId_hidden_deliveredAt_idx"
ON "NotificationInboxItem"("userId", "hidden", "deliveredAt");

CREATE INDEX IF NOT EXISTS "NotificationInboxItem_userId_read_deliveredAt_idx"
ON "NotificationInboxItem"("userId", "read", "deliveredAt");

ALTER TABLE "NotificationInboxItem"
ADD CONSTRAINT "NotificationInboxItem_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
