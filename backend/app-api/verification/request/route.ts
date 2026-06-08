import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/server/db";
import { requireAuthUser } from "@/lib/server/api-auth";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const requestRow = await prisma.verificationRequest.findFirst({
    where: { userId: auth.id },
    orderBy: { submittedAt: "desc" },
  });

  const verificationStatus =
    requestRow?.status ??
    ("verificationStatus" in auth && typeof auth.verificationStatus === "string"
      ? auth.verificationStatus
      : "pending");

  return jsonWithSecurity({
    ok: true,
    request: requestRow
      ? {
          id: requestRow.id,
          role: requestRow.role,
          status: requestRow.status,
          submittedAt: requestRow.submittedAt.toISOString(),
          reviewedAt: requestRow.reviewedAt?.toISOString() ?? null,
          notes: requestRow.notes ?? null,
        }
      : null,
    verificationStatus,
  });
}

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "verification-request-write",
    maxRequests: 10,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const body = (await request.json().catch(() => ({}))) as {
    notes?: string;
    evidence?: Record<string, unknown>;
  };

  await prisma.$transaction(async (tx) => {
    const latestPending = await tx.verificationRequest.findFirst({
      where: {
        userId: auth.id,
        status: "pending",
      },
      orderBy: { submittedAt: "desc" },
      select: { id: true },
    });

    if (latestPending) {
      await tx.verificationRequest.update({
        where: { id: latestPending.id },
        data: {
          role: auth.role,
          notes: typeof body.notes === "string" ? body.notes.slice(0, 500) : null,
          evidenceJson: JSON.stringify(body.evidence ?? null),
          submittedAt: new Date(),
          reviewedAt: null,
        },
      });
    } else {
      await tx.verificationRequest.create({
        data: {
          id: randomUUID(),
          userId: auth.id,
          role: auth.role,
          status: "pending",
          notes: typeof body.notes === "string" ? body.notes.slice(0, 500) : null,
          evidenceJson: JSON.stringify(body.evidence ?? null),
        },
      });
    }

    await tx.profile.update({
      where: { userId: auth.id },
      data: {
        verificationStatus: "pending",
      },
    });
  });

  return jsonWithSecurity({
    ok: true,
    verificationStatus: "pending",
  });
}
