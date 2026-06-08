import { prisma } from "@/lib/server/db";

export type PurchaseHistoryRowInput = {
  userId: string;
  role: "candidate" | "company";
  kind: "candidate_boost" | "company_subscription";
  planId: string;
  amountCop: number;
  applicationCredits?: number;
  boostUnits?: number[];
  metadata?: Record<string, unknown>;
  startedAt: Date;
  endsAt?: Date | null;
};

export async function createPurchaseHistoryEntry(input: PurchaseHistoryRowInput) {
  return prisma.purchaseHistory.create({
    data: {
      userId: input.userId,
      role: input.role,
      kind: input.kind,
      planId: input.planId,
      amountCop: input.amountCop,
      applicationCredits: input.applicationCredits ?? null,
      boostUnitsJson: input.boostUnits ? JSON.stringify(input.boostUnits) : null,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
      startedAt: input.startedAt,
      endsAt: input.endsAt ?? null,
    },
  });
}

export async function countRecentPurchases(userId: string, planId: string, since: Date) {
  return prisma.purchaseHistory.count({
    where: {
      userId,
      planId,
      createdAt: {
        gte: since,
      },
    },
  });
}

export async function listRecentPurchases(userId: string, kind: "candidate_boost" | "company_subscription", since: Date) {
  return prisma.purchaseHistory.findMany({
    where: {
      userId,
      kind,
      createdAt: {
        gte: since,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
