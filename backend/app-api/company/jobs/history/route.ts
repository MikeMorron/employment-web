import { requireCompanyUser } from "@/lib/server/api-auth";
import { prisma } from "@/lib/server/db";
import { listCompanyJobHistory, deleteCompanyJobHistoryEntry } from "@/backend/lib-server/company-job-history-store";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  isSafeRouteParam,
  jsonWithSecurity,
} from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "company-jobs-history-read",
    maxRequests: 60,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  return jsonWithSecurity({
    ok: true,
    history: await listCompanyJobHistory(prisma, auth.id),
  });
}

export async function DELETE(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "company-jobs-history-delete",
    maxRequests: 30,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const body = (await request.json().catch(() => ({}))) as { historyId?: string };
  const historyId = body.historyId?.trim() ?? "";
  if (!isSafeRouteParam(historyId, 120)) {
    return jsonWithSecurity({ ok: false, message: "Identificador inválido" }, { status: 400 });
  }

  const deleted = await deleteCompanyJobHistoryEntry(prisma, auth.id, historyId);
  if (!deleted) {
    return jsonWithSecurity({ ok: false, message: "Elemento no encontrado" }, { status: 404 });
  }

  return jsonWithSecurity({
    ok: true,
    history: await listCompanyJobHistory(prisma, auth.id),
  });
}
