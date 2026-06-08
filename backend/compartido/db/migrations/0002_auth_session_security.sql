ALTER TABLE "Session"
  ADD COLUMN IF NOT EXISTS "sessionId" TEXT,
  ADD COLUMN IF NOT EXISTS "csrfSalt" TEXT,
  ADD COLUMN IF NOT EXISTS "signingSalt" TEXT,
  ADD COLUMN IF NOT EXISTS "signingKeyExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionId_key" ON "Session"("sessionId");
CREATE INDEX IF NOT EXISTS "Session_sessionId_expiresAt_idx" ON "Session"("sessionId", "expiresAt");
CREATE INDEX IF NOT EXISTS "Session_userId_revokedAt_idx" ON "Session"("userId", "revokedAt");

CREATE TABLE IF NOT EXISTS "SessionNonce" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "nonceHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SessionNonce_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SessionNonce_sessionId_nonceHash_key"
  ON "SessionNonce"("sessionId", "nonceHash");
CREATE INDEX IF NOT EXISTS "SessionNonce_sessionId_expiresAt_idx"
  ON "SessionNonce"("sessionId", "expiresAt");
CREATE INDEX IF NOT EXISTS "SessionNonce_expiresAt_idx"
  ON "SessionNonce"("expiresAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'SessionNonce_sessionId_fkey'
  ) THEN
    ALTER TABLE "SessionNonce"
      ADD CONSTRAINT "SessionNonce_sessionId_fkey"
      FOREIGN KEY ("sessionId")
      REFERENCES "Session"("sessionId")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
