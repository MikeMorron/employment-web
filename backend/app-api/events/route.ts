import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/server/db";
import { requireAuthUser } from "@/lib/server/api-auth";
import {
  decodeCandidateApplicationId,
  decodeCandidateJobId,
  decodeCandidateProfileId,
  encodeCandidateApplicationId,
  encodeCandidateJobId,
  encodeCandidateProfileId,
} from "@/lib/server/opaque-refs";
import { vacancyExistsById } from "@/lib/server/marketplace-vacancies";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";
import type { AnalyticsEventContext, AnalyticsEventType } from "@/types/events";
import { recordProfileViewedNotification } from "@/lib/server/profile-view-notifications";

export const runtime = "nodejs";

const ALLOWED_EVENT_TYPES: AnalyticsEventType[] = [
  "api_request",
  "search_jobs",
  "view_job",
  "click_job",
  "apply_job",
  "view_profile",
  "save_candidate",
  "invite_candidate",
  "create_job",
  "edit_job",
  "publish_job",
  "move_stage",
  "shortlist_candidate",
  "reject_candidate",
  "view_plan",
  "click_upgrade",
  "purchase_plan",
  "view_candidates",
  "view_analytics",
  "complete_profile",
];

const PUBLIC_EVENT_TYPES = new Set<AnalyticsEventType>([
  "view_job",
  "click_job",
]);
const PLAN_EVENT_IDS = new Set([
  "free",
  "starter-boost",
  "basic-boost",
  "mid-boost",
  "high-boost",
  "pro-boost",
  "company-basic",
  "company-pro",
  "company-business",
  "company-premium",
]);

function sanitizeContext(value: unknown): AnalyticsEventContext | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const raw = value as Partial<AnalyticsEventContext>;

  return {
    sessionId: typeof raw.sessionId === "string" ? raw.sessionId.slice(0, 120) : undefined,
    source: typeof raw.source === "string" ? raw.source.slice(0, 80) as AnalyticsEventContext["source"] : undefined,
    surface: typeof raw.surface === "string" ? raw.surface.slice(0, 80) as AnalyticsEventContext["surface"] : undefined,
    pathname: typeof raw.pathname === "string" ? raw.pathname.slice(0, 200) : undefined,
    referrer: typeof raw.referrer === "string" ? raw.referrer.slice(0, 300) : undefined,
    deviceType: typeof raw.deviceType === "string" ? raw.deviceType as AnalyticsEventContext["deviceType"] : undefined,
    actorRole: typeof raw.actorRole === "string" ? raw.actorRole as AnalyticsEventContext["actorRole"] : undefined,
    timeOnPageMs: typeof raw.timeOnPageMs === "number" ? Math.max(0, Math.round(raw.timeOnPageMs)) : undefined,
    dedupeKey: typeof raw.dedupeKey === "string" ? raw.dedupeKey.slice(0, 200) : undefined,
  };
}

function buildEventDedupeKey(type: AnalyticsEventType, entityId: string, context: AnalyticsEventContext | null) {
  if (context?.dedupeKey) {
    return context.dedupeKey;
  }

  return [
    type,
    entityId,
    context?.sessionId ?? "anon-session",
    context?.source ?? "unknown-source",
    context?.surface ?? "unknown-surface",
  ].join(":");
}

function sanitizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(value).slice(0, 30).map(([key, item]) => [String(key), item]),
  );
}

async function validateCandidateProfileEntity(entityId: string) {
  const candidate = await prisma.user.findUnique({
    where: { id: entityId },
    select: {
      id: true,
      role: true,
      profile: {
        select: {
          userId: true,
        },
      },
    },
  });

  return Boolean(candidate && candidate.role === "candidate" && candidate.profile);
}

async function validateJobEntity(entityId: string) {
  return vacancyExistsById(entityId);
}

async function validateApplicationEntity(entityId: string) {
  const application = await prisma.application.findUnique({
    where: { id: entityId },
    select: { id: true },
  });

  return Boolean(application);
}

async function validateEventEntity(
  type: AnalyticsEventType,
  entityId: string,
  authUser: Exclude<Awaited<ReturnType<typeof requireAuthUser>>, Response> | null,
) {
  const decodedEntityId =
    type === "view_profile" || type === "save_candidate" || type === "invite_candidate"
      ? decodeCandidateProfileId(entityId)
      : type === "move_stage" || type === "shortlist_candidate" || type === "reject_candidate"
        ? decodeCandidateApplicationId(entityId)
        : type === "view_job" || type === "click_job" || type === "apply_job" || type === "create_job" || type === "edit_job" || type === "publish_job"
          ? decodeCandidateJobId(entityId)
          : entityId;

  switch (type) {
    case "api_request":
      return entityId.startsWith("/api/") && entityId.length <= 200;
    case "view_job":
    case "click_job":
    case "apply_job":
    case "create_job":
    case "edit_job":
    case "publish_job":
      return validateJobEntity(decodedEntityId);
    case "view_profile":
    case "save_candidate":
    case "invite_candidate":
      return validateCandidateProfileEntity(decodedEntityId);
    case "move_stage":
    case "shortlist_candidate":
    case "reject_candidate":
      return validateApplicationEntity(decodedEntityId);
    case "view_plan":
    case "click_upgrade":
    case "purchase_plan":
      return PLAN_EVENT_IDS.has(entityId);
    case "view_candidates":
    case "view_analytics":
    case "complete_profile":
      return Boolean(authUser && authUser.id === decodedEntityId);
    case "search_jobs":
      return Boolean(authUser && authUser.id === decodedEntityId);
    default:
      return false;
  }
}

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const auth = await requireAuthUser(request);
  const authUser = auth instanceof Response ? null : auth;

  const rateLimitError = enforceRateLimit(request, {
    scope: "analytics-events-write",
    maxRequests: 300,
    windowMs: 60_000,
    userId: authUser?.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const body = (await request.json()) as {
      type?: AnalyticsEventType;
      entityId?: string;
      metadata?: Record<string, unknown>;
      context?: AnalyticsEventContext;
    };

    const type = body.type;
    const entityId = body.entityId?.trim() ?? "";
    const context = sanitizeContext(body.context);

    if (!type || !ALLOWED_EVENT_TYPES.includes(type) || !entityId) {
      return jsonWithSecurity({ ok: false, message: "Evento inválido" }, { status: 400 });
    }

    const resolvedEntityId =
      type === "view_profile" || type === "save_candidate" || type === "invite_candidate"
        ? decodeCandidateProfileId(entityId)
        : type === "move_stage" || type === "shortlist_candidate" || type === "reject_candidate"
          ? decodeCandidateApplicationId(entityId)
          : type === "view_job" || type === "click_job" || type === "apply_job" || type === "create_job" || type === "edit_job" || type === "publish_job"
            ? decodeCandidateJobId(entityId)
            : entityId;
    const responseEntityId =
      type === "view_profile" || type === "save_candidate" || type === "invite_candidate"
        ? encodeCandidateProfileId(resolvedEntityId)
        : type === "move_stage" || type === "shortlist_candidate" || type === "reject_candidate"
          ? encodeCandidateApplicationId(resolvedEntityId)
          : type === "view_job" || type === "click_job" || type === "apply_job" || type === "create_job" || type === "edit_job" || type === "publish_job"
            ? encodeCandidateJobId(resolvedEntityId)
            : resolvedEntityId;

    if (!PUBLIC_EVENT_TYPES.has(type) && !authUser) {
      return jsonWithSecurity({ ok: false, message: "No autenticado" }, { status: 401 });
    }

    if (type === "view_profile" && authUser?.role !== "company") {
      return jsonWithSecurity({ ok: false, message: "No autorizado" }, { status: 403 });
    }

    if ((type === "view_candidates" || type === "view_analytics") && authUser?.role !== "company") {
      return jsonWithSecurity({ ok: false, message: "No autorizado" }, { status: 403 });
    }

    if (type === "api_request" && !authUser) {
      return jsonWithSecurity({ ok: false, message: "No autenticado" }, { status: 401 });
    }

    if (type === "complete_profile" && authUser?.role !== "candidate") {
      return jsonWithSecurity({ ok: false, message: "No autorizado" }, { status: 403 });
    }

    if (type === "search_jobs" && authUser?.role !== "candidate") {
      return jsonWithSecurity({ ok: false, message: "No autorizado" }, { status: 403 });
    }

    const isValidEntity = await validateEventEntity(type, resolvedEntityId, authUser);
    if (!isValidEntity) {
      return jsonWithSecurity({ ok: false, message: "entityId inválido" }, { status: 400 });
    }

    const dedupeKey = buildEventDedupeKey(type, resolvedEntityId, context);
    const recentDuplicate = await prisma.event.findFirst({
      where: {
        dedupeKey,
        createdAt: {
          gte: new Date(Date.now() - 15_000),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (recentDuplicate) {
      return jsonWithSecurity({
        ok: true,
        deduped: true,
        event: {
          id: recentDuplicate.id,
          userId: recentDuplicate.userId,
          type: recentDuplicate.type,
          entityId: responseEntityId,
          createdAt: recentDuplicate.createdAt.toISOString(),
        },
      });
    }

    const created = await prisma.event.create({
      data: {
        id: randomUUID(),
        userId: authUser?.id ?? null,
        type,
        entityId: resolvedEntityId,
        metadataJson: JSON.stringify(sanitizeMetadata(body.metadata)),
        sessionId: context?.sessionId ?? null,
        source: context?.source ?? null,
        surface: context?.surface ?? null,
        pathname: context?.pathname ?? null,
        referrer: context?.referrer ?? null,
        deviceType: context?.deviceType ?? null,
        actorRole: authUser?.role ?? "anonymous",
        dedupeKey,
        contextJson: context ? JSON.stringify(context) : null,
        timeOnPageMs: context?.timeOnPageMs ?? null,
        happenedAt: new Date(),
      },
    });

    if (type === "search_jobs" && authUser) {
      const overflowRows = await prisma.event.findMany({
        where: {
          userId: authUser.id,
          type: "search_jobs",
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: 100,
        select: {
          id: true,
        },
      });

      if (overflowRows.length > 0) {
        await prisma.event.deleteMany({
          where: {
            id: {
              in: overflowRows.map((row) => row.id),
            },
          },
        });
      }
    }

    if (
      type === "view_profile" &&
      authUser?.role === "company" &&
      authUser.id !== resolvedEntityId
    ) {
      await recordProfileViewedNotification({
        ownerUserId: resolvedEntityId,
        viewerUserId: authUser.id,
        viewerRole: authUser.role,
      });
    }

    return jsonWithSecurity({
      ok: true,
      event: {
        id: created.id,
        userId: created.userId,
        type: created.type,
        entityId: responseEntityId,
        createdAt: created.createdAt.toISOString(),
        happenedAt: created.happenedAt.toISOString(),
      },
    });
  } catch {
    return jsonWithSecurity({ ok: false, message: "No se pudo registrar el evento" }, { status: 500 });
  }
}
