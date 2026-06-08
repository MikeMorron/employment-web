import { requireCompanyUser } from "@/lib/server/api-auth";
import { prisma } from "@/lib/server/db";
import {
  decodeCompanyCandidateId,
  encodeCompanyCandidateId,
} from "@/lib/server/opaque-refs";
import {
  listBillingHistory,
  listCompanyApplicantNotes,
  listCompanyDashboardConfig,
  listCompanyFavoriteCandidateIds,
  replaceCompanyApplicantNotes,
  replaceCompanyDashboardConfig,
  replaceCompanyFavoriteCandidateIds,
} from "@/lib/server/preferences-store";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

function sanitizeFavoriteCandidateIds(value: unknown) {
  return Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .map((item) => decodeCompanyCandidateId(String(item).trim()))
            .filter(Boolean),
        ),
      ).slice(0, 500)
    : null;
}

function sanitizeNotes(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, note]) => [String(key).trim(), String(note ?? "").slice(0, 1000)])
      .filter(([key]) => Boolean(key)),
  );
}

function sanitizeDashboardConfig(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export async function GET(request: Request) {
  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const [favoriteCandidateIds, notesByApplicantId, dashboardConfig, billingHistory] = await Promise.all([
    listCompanyFavoriteCandidateIds(auth.id),
    listCompanyApplicantNotes(auth.id),
    listCompanyDashboardConfig(auth.id),
    listBillingHistory(auth.id),
  ]);

  return jsonWithSecurity({
    ok: true,
    favoriteCandidateIds: favoriteCandidateIds.map((id) => encodeCompanyCandidateId(id)),
    notesByApplicantId,
    dashboardConfig,
    billingHistory,
  });
}

export async function PATCH(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "company-preferences-write",
    maxRequests: 40,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const body = (await request.json()) as {
      favoriteCandidateIds?: string[];
      notesByApplicantId?: Record<string, string>;
      dashboardConfig?: Record<string, unknown>;
    };

    const nextFavoriteCandidateIds = sanitizeFavoriteCandidateIds(body.favoriteCandidateIds);
    const nextNotesByApplicantId = sanitizeNotes(body.notesByApplicantId);
    const nextDashboardConfig = sanitizeDashboardConfig(body.dashboardConfig);

    const [currentFavoriteCandidateIds, currentNotesByApplicantId, currentDashboardConfig, billingHistory] =
      await Promise.all([
        listCompanyFavoriteCandidateIds(auth.id),
        listCompanyApplicantNotes(auth.id),
        listCompanyDashboardConfig(auth.id),
        listBillingHistory(auth.id),
      ]);

    const payload = {
      favoriteCandidateIds: nextFavoriteCandidateIds ?? currentFavoriteCandidateIds,
      notesByApplicantId: nextNotesByApplicantId ?? currentNotesByApplicantId,
      dashboardConfig: nextDashboardConfig ?? currentDashboardConfig,
      billingHistory,
    };

    await prisma.preference.upsert({
      where: { userId: auth.id },
      update: {},
      create: { userId: auth.id },
    });
    await Promise.all([
      replaceCompanyFavoriteCandidateIds(auth.id, payload.favoriteCandidateIds),
      replaceCompanyApplicantNotes(auth.id, payload.notesByApplicantId),
      replaceCompanyDashboardConfig(auth.id, payload.dashboardConfig),
    ]);

    return jsonWithSecurity({
      ok: true,
      ...payload,
      favoriteCandidateIds: payload.favoriteCandidateIds.map((id) => encodeCompanyCandidateId(id)),
    });
  } catch {
    return jsonWithSecurity({ ok: false, message: "No se pudieron guardar las preferencias de reclutamiento" }, { status: 500 });
  }
}
