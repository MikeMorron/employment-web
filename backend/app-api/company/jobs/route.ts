import type { CompanyJobPost, CompanyJobStatus } from "@/types/workflows";
import { normalizeCompanyPlan } from "@/lib/company-plan-model";
import { getPlanLimits } from "@/lib/plans";
import { prisma } from "@/lib/server/db";
import {
  createCompanyJobId,
  sanitizeUserForClient,
} from "@/lib/server/app-state";
import { requireCompanyUser } from "@/lib/server/api-auth";
import { buildCompanyJobViews } from "@/lib/server/company-job-views";
import { encodeCompanyJobForCompany } from "@/lib/server/opaque-refs";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity, sanitizePlainTextInput } from "@/lib/server/security";
import { censorProfanityInPayload } from "@/lib/server/profanity-guard";

export const runtime = "nodejs";

type JobInput = {
  id?: string;
  title?: string;
  location?: string;
  modality?: string;
  salary?: string;
  description?: string;
  tags?: string[];
  status?: CompanyJobStatus;
  featured?: boolean;
};

function sanitizeJobPayload(input: JobInput) {
  return {
    id: typeof input.id === "string" ? input.id.trim() : undefined,
    title: sanitizePlainTextInput(input.title, 50),
    location: sanitizePlainTextInput(input.location, 120),
    modality: sanitizePlainTextInput(input.modality, 60),
    salary: sanitizePlainTextInput(input.salary, 80),
    description: sanitizePlainTextInput(input.description, 30_000),
    tags: Array.isArray(input.tags)
      ? input.tags.map((tag) => sanitizePlainTextInput(tag, 48)).filter(Boolean).slice(0, 24)
      : [],
    status: input.status ?? "draft",
    featured: Boolean(input.featured),
  };
}

export async function GET(request: Request) {
  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const jobs = await buildCompanyJobViews(prisma, auth.id);
  return jsonWithSecurity({
    ok: true,
    jobs,
    company: sanitizeUserForClient(auth),
  });
}

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "company-jobs-write",
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

  try {
    const body = (await request.json()) as JobInput;
    const payload = await censorProfanityInPayload(sanitizeJobPayload(body));

    if (!payload.title || !payload.location || !payload.description || !payload.modality) {
      return jsonWithSecurity({ ok: false, message: "Datos de vacante inválidos" }, { status: 400 });
    }

    const companyLimits = getPlanLimits("company", normalizeCompanyPlan(auth.plan));
    const activeJobsLimit = ("activeJobs" in companyLimits ? companyLimits.activeJobs : 1) ?? 1;
    const canFeatureJobs = ("featuredJobs" in companyLimits ? companyLimits.featuredJobs : false) ?? false;
    const currentPublishedJobs = await prisma.job.count({
      where: {
        ownerCompanyId: auth.id,
        status: "published",
      },
    });

    if (payload.status === "published" && currentPublishedJobs >= activeJobsLimit) {
      return jsonWithSecurity(
        { ok: false, message: "Llegaste al límite de vacantes activas de tu plan." },
        { status: 403 },
      );
    }

    if (payload.featured && !canFeatureJobs) {
      return jsonWithSecurity(
        { ok: false, message: "Las vacantes destacadas requieren Business o Premium." },
        { status: 403 },
      );
    }

    const createdJob: CompanyJobPost = {
      id: createCompanyJobId(),
      ownerCompanyId: auth.id,
      companyName: auth.companyName ?? auth.displayName ?? auth.nombre ?? "TalentSyncro",
      title: payload.title,
      location: payload.location,
      modality: payload.modality,
      salary: payload.salary || undefined,
      description: payload.description,
      tags: payload.tags,
      status: payload.status,
      featured: payload.featured,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      applicants: [],
    };
    await prisma.job.create({
      data: {
        id: createdJob.id,
        ownerCompanyId: createdJob.ownerCompanyId,
        companyName: createdJob.companyName,
        title: createdJob.title,
        location: createdJob.location,
        modality: createdJob.modality,
        salary: createdJob.salary ?? null,
        description: createdJob.description,
        tagsJson: JSON.stringify(createdJob.tags),
        status: createdJob.status,
        featured: createdJob.featured,
        createdAt: new Date(createdJob.createdAt),
        updatedAt: new Date(createdJob.updatedAt),
      },
    });
    const jobs = await buildCompanyJobViews(prisma, auth.id);

    return jsonWithSecurity({
      ok: true,
      job: encodeCompanyJobForCompany(createdJob),
      jobs,
    });
  } catch {
    return jsonWithSecurity({ ok: false, message: "No se pudo guardar la vacante" }, { status: 500 });
  }
}
