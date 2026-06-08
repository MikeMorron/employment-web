import type { CompanyJobPost, CompanyJobStatus } from "@/types/workflows";
import { requireCompanyUser } from "@/lib/server/api-auth";
import { normalizeCompanyPlan } from "@/lib/company-plan-model";
import { getPlanLimits } from "@/lib/plans";
import { prisma } from "@/lib/server/db";
import { buildCompanyJobViews } from "@/lib/server/company-job-views";
import { archiveCompanyDbJob } from "@/backend/lib-server/company-job-history-store";
import { decodeCompanyJobIdStrict } from "@/lib/server/opaque-refs";
import { enforceRateLimit, enforceTrustedOrigin, isSafeRouteParam, jsonWithSecurity, sanitizePlainTextInput } from "@/lib/server/security";
import { censorProfanityInPayload } from "@/lib/server/profanity-guard";

export const runtime = "nodejs";

type JobPatch = {
  title?: string;
  location?: string;
  modality?: string;
  salary?: string;
  description?: string;
  tags?: string[];
  status?: CompanyJobStatus;
  featured?: boolean;
};

function sanitizeJobPatch(input: JobPatch) {
  const patch: Partial<CompanyJobPost> = {};

  if (typeof input.title === "string") {
    patch.title = sanitizePlainTextInput(input.title, 50);
  }
  if (typeof input.location === "string") {
    patch.location = sanitizePlainTextInput(input.location, 120);
  }
  if (typeof input.modality === "string") {
    patch.modality = sanitizePlainTextInput(input.modality, 60);
  }
  if (typeof input.salary === "string") {
    patch.salary = sanitizePlainTextInput(input.salary, 80) || undefined;
  }
  if (typeof input.description === "string") {
    patch.description = sanitizePlainTextInput(input.description, 30_000);
  }
  if (Array.isArray(input.tags)) {
    patch.tags = input.tags.map((tag) => sanitizePlainTextInput(tag, 48)).filter(Boolean).slice(0, 24);
  }
  if (input.status) {
    patch.status = input.status;
  }
  if (typeof input.featured === "boolean") {
    patch.featured = input.featured;
  }

  return patch;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "company-jobs-patch",
    maxRequests: 30,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const { id } = await context.params;
  if (!isSafeRouteParam(id, 240)) {
    return jsonWithSecurity({ ok: false, message: "Identificador inválido" }, { status: 400 });
  }

  const jobId = decodeCompanyJobIdStrict(id);
  if (!jobId) {
    return jsonWithSecurity({ ok: false, message: "Identificador inválido" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as JobPatch;
    const patch = await censorProfanityInPayload(sanitizeJobPatch(body));

    const existing = await prisma.job.findUnique({
      where: { id: jobId },
    });
    if (!existing || existing.ownerCompanyId !== auth.id) {
      return jsonWithSecurity({ ok: false, message: "Vacante no encontrada" }, { status: 404 });
    }

    const companyLimits = getPlanLimits("company", normalizeCompanyPlan(auth.plan));
    const activeJobsLimit = ("activeJobs" in companyLimits ? companyLimits.activeJobs : 1) ?? 1;
    const canFeatureJobs = ("featuredJobs" in companyLimits ? companyLimits.featuredJobs : false) ?? false;
    if (patch.featured && !canFeatureJobs) {
      return jsonWithSecurity(
        { ok: false, message: "Las vacantes destacadas requieren Business o Premium." },
        { status: 403 },
      );
    }

    const nextStatus = patch.status ?? (existing.status as CompanyJobStatus);
    const isPublishingNow = nextStatus === "published" && existing.status !== "published";
    if (isPublishingNow) {
      const currentPublishedJobs = await prisma.job.count({
        where: {
          ownerCompanyId: auth.id,
          status: "published",
        },
      });
      if (currentPublishedJobs >= activeJobsLimit) {
        return jsonWithSecurity(
          { ok: false, message: "Llegaste al límite de vacantes activas de tu plan." },
          { status: 403 },
        );
      }
    }

    const updated: CompanyJobPost = {
      id: existing.id,
      ownerCompanyId: existing.ownerCompanyId,
      companyName: existing.companyName,
      title: patch.title ?? existing.title,
      location: patch.location ?? existing.location,
      modality: patch.modality ?? existing.modality,
      salary: patch.salary ?? existing.salary ?? undefined,
      description: patch.description ?? existing.description,
      tags: patch.tags ?? (existing.tagsJson ? (JSON.parse(existing.tagsJson) as string[]) : []),
      status: nextStatus,
      featured: patch.featured ?? existing.featured,
      createdAt: existing.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
      applicants: [],
    };

    await prisma.job.update({
      where: { id: jobId },
      data: {
        title: updated.title,
        location: updated.location,
        modality: updated.modality,
        salary: updated.salary ?? null,
        description: updated.description,
        tagsJson: JSON.stringify(updated.tags),
        status: updated.status,
        featured: updated.featured,
      },
    });

    const jobs = await buildCompanyJobViews(prisma, auth.id);
    const hydratedJob = jobs.find((job) => job.id === jobId) ?? updated;

    return jsonWithSecurity({ ok: true, job: hydratedJob });
  } catch {
    return jsonWithSecurity({ ok: false, message: "No se pudo actualizar la vacante" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "company-jobs-delete",
    maxRequests: 20,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const { id } = await context.params;
  if (!isSafeRouteParam(id, 240)) {
    return jsonWithSecurity({ ok: false, message: "Identificador inválido" }, { status: 400 });
  }

  const jobId = decodeCompanyJobIdStrict(id);
  if (!jobId) {
    return jsonWithSecurity({ ok: false, message: "Identificador inválido" }, { status: 400 });
  }

  const existing = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!existing || existing.ownerCompanyId !== auth.id) {
    return jsonWithSecurity({ ok: false, message: "Vacante no encontrada" }, { status: 404 });
  }

  try {
    await archiveCompanyDbJob(prisma, auth.id, existing);
    await prisma.$transaction([
      prisma.application.updateMany({
        where: {
          jobId,
          status: { not: "withdrawn" },
        },
        data: {
          status: "vacancy_cancelled",
          lastUpdatedAt: new Date(),
        },
      }),
      prisma.job.delete({
        where: { id: jobId },
      }),
    ]);

    return jsonWithSecurity({ ok: true, jobs: await buildCompanyJobViews(prisma, auth.id) });
  } catch {
    return jsonWithSecurity({ ok: false, message: "No se pudo eliminar la vacante" }, { status: 500 });
  }
}
