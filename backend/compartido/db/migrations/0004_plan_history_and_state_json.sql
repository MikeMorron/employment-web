ALTER TABLE "Profile"
  ADD COLUMN IF NOT EXISTS "candidatePlanStateJson" TEXT,
  ADD COLUMN IF NOT EXISTS "companyPlanStateJson" TEXT;

CREATE TABLE IF NOT EXISTS "PurchaseHistory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "amountCop" INTEGER NOT NULL,
  "applicationCredits" INTEGER,
  "boostUnitsJson" TEXT,
  "metadataJson" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PurchaseHistory_userId_kind_createdAt_idx"
  ON "PurchaseHistory"("userId", "kind", "createdAt");

CREATE INDEX IF NOT EXISTS "PurchaseHistory_userId_planId_createdAt_idx"
  ON "PurchaseHistory"("userId", "planId", "createdAt");

CREATE INDEX IF NOT EXISTS "PurchaseHistory_role_kind_createdAt_idx"
  ON "PurchaseHistory"("role", "kind", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'PurchaseHistory_userId_fkey'
      AND table_name = 'PurchaseHistory'
  ) THEN
    ALTER TABLE "PurchaseHistory"
      ADD CONSTRAINT "PurchaseHistory_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
