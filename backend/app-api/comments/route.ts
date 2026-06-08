import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/server/db";
import { requireAuthUser } from "@/lib/server/api-auth";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";
import { getPublicCompanyProfileBySlug } from "@/lib/server/company-public";
import { slugifyCompanyName } from "@/lib/company-public-slug";
import { sanitizeCommentInput } from "@/lib/comments/sanitize";
import { censorProfanityInPayload } from "@/lib/server/profanity-guard";

export const runtime = "nodejs";

const PAGE_SIZE = 6;
const ALLOWED_ENTITY_TYPES = new Set(["company"]);

function toNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function buildDistribution(totalCount: number, starCounts: Map<number, number>) {
  return [5, 4, 3, 2, 1].map((stars) => {
    const count = starCounts.get(stars) ?? 0;
    return {
      stars,
      count,
      percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
    };
  });
}

function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

async function resolveValidCommentEntity(entityType: string, entityId: string) {
  if (!ALLOWED_ENTITY_TYPES.has(entityType)) {
    return null;
  }

  if (entityType === "company") {
    const normalizedSlug = slugifyCompanyName(entityId);
    if (!normalizedSlug) {
      return null;
    }

    const company = await getPublicCompanyProfileBySlug(entityId);
    if (!company) {
      return {
        entityType: "company",
        entityId: normalizedSlug,
        ownerUserId: null,
      };
    }

    return {
      entityType: "company",
      entityId: company.slug,
      ownerUserId: company.id,
    };
  }

  return null;
}

export async function GET(request: Request) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "comments-read",
    maxRequests: 120,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType")?.trim() ?? "";
  const entityId = url.searchParams.get("entityId")?.trim() ?? "";
  const offset = toNumber(url.searchParams.get("offset"), 0);
  const starsParam = url.searchParams.get("stars");
  const stars = starsParam === null ? null : Number(starsParam);
  const hasStarsFilter = Number.isInteger(stars) && stars !== null && stars >= 1 && stars <= 5;

  if (!entityType || !entityId) {
    return jsonWithSecurity({ ok: false, message: "Comentarios no encontrados" }, { status: 400 });
  }

  const resolvedEntity = await resolveValidCommentEntity(entityType, entityId);
  if (!resolvedEntity) {
    return jsonWithSecurity({ ok: false, message: "Comentarios no encontrados" }, { status: 404 });
  }

  const where = {
    entityType: resolvedEntity.entityType,
    entityId: resolvedEntity.entityId,
    ...(hasStarsFilter ? { stars } : {}),
  };

  const [comments, filteredCount, allComments] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: PAGE_SIZE,
    }),
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where: {
        entityType: resolvedEntity.entityType,
        entityId: resolvedEntity.entityId,
      },
      select: { stars: true },
    }),
  ]);

  const totalCount = allComments.length;
  const ratedComments = allComments.filter((item) => typeof item.stars === "number") as Array<{ stars: number }>;
  const averageRating = ratedComments.length
    ? Math.round((ratedComments.reduce((sum, item) => sum + item.stars, 0) / ratedComments.length) * 10) / 10
    : 0;
  const starCounts = ratedComments.reduce((accumulator, item) => {
    accumulator.set(item.stars, (accumulator.get(item.stars) ?? 0) + 1);
    return accumulator;
  }, new Map<number, number>());

  return jsonWithSecurity({
    ok: true,
    comments: comments.map((item) => ({
      id: item.id,
      entityType: item.entityType,
      entityId: item.entityId,
      authorName: item.authorName,
      body: item.body,
      stars: item.stars,
      createdAt: item.createdAt.toISOString(),
    })),
    nextOffset: offset + comments.length,
    hasMore: offset + comments.length < filteredCount,
    summary: {
      totalCount,
      averageRating,
      distribution: buildDistribution(totalCount, starCounts),
    },
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
    scope: "comments-write",
    maxRequests: 12,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const body = (await request.json()) as {
      entityType?: string;
      entityId?: string;
      body?: string;
      stars?: number;
    };

    const entityType = body.entityType?.trim() ?? "";
    const entityId = body.entityId?.trim() ?? "";
    const content = sanitizeCommentInput(body.body ?? "").trim();
    const stars = typeof body.stars === "number" ? Math.max(1, Math.min(5, Math.round(body.stars))) : null;

    if (!entityType || !entityId || !content) {
      return jsonWithSecurity({ ok: false, message: "Comentario inválido" }, { status: 400 });
    }

    const resolvedEntity = await resolveValidCommentEntity(entityType, entityId);
    if (!resolvedEntity) {
      return jsonWithSecurity({ ok: false, message: "Comentario inválido" }, { status: 400 });
    }

    if (auth.role === "company") {
      const authCompanySlug = slugifyCompanyName(auth.companyName || auth.displayName);
      if (resolvedEntity.entityType === "company" && (resolvedEntity.ownerUserId === auth.id || resolvedEntity.entityId === authCompanySlug)) {
        return jsonWithSecurity({ ok: false, message: "No autorizado" }, { status: 403 });
      }
    }

    if (countWords(content) > 1000) {
      return jsonWithSecurity({ ok: false, message: "El comentario supera el máximo de 1000 palabras" }, { status: 400 });
    }

    const censoredContent = await censorProfanityInPayload(content);

    const comment = await prisma.comment.create({
      data: {
        id: randomUUID(),
        userId: auth.id,
        entityType: resolvedEntity.entityType,
        entityId: resolvedEntity.entityId ?? entityId,
        authorName: auth.nombre || auth.displayName,
        body: censoredContent,
        stars,
      },
    });

    return jsonWithSecurity({
      ok: true,
      comment: {
        id: comment.id,
        entityType: comment.entityType,
        entityId: comment.entityId,
        authorName: comment.authorName,
        body: comment.body,
        stars: comment.stars,
        createdAt: comment.createdAt.toISOString(),
      },
    });
  } catch {
    return jsonWithSecurity({ ok: false, message: "No pudimos publicar tu comentario" }, { status: 500 });
  }
}
