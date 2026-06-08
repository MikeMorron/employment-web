import { requireCandidateUser } from "@/lib/server/api-auth";
import { prisma } from "@/lib/server/db";
import {
  decodeCandidateJobId,
  encodeCandidateJobId,
  encodeVacancyForCandidate,
} from "@/lib/server/opaque-refs";
import {
  listSavedVacanciesForCandidate,
  resolveSavedVacancies,
} from "@/lib/server/saved-vacancies";
import { vacancyExistsById } from "@/lib/server/marketplace-vacancies";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireCandidateUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const { savedJobIds, savedVacancies } = await listSavedVacanciesForCandidate(auth.id);

  return jsonWithSecurity({
    ok: true,
    savedIds: savedJobIds.map((jobId) => encodeCandidateJobId(jobId)),
    savedVacancies: savedVacancies.map(encodeVacancyForCandidate),
  });
}

export async function PUT(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "saved-vacancies-write",
    maxRequests: 40,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const auth = await requireCandidateUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const body = (await request.json()) as { savedIds?: string[] };
    const savedIds = Array.isArray(body.savedIds)
      ? Array.from(new Set(body.savedIds.map((id) => decodeCandidateJobId(String(id).trim())).filter(Boolean))).slice(0, 300)
      : [];

    const allowedSavedIds = (
      await Promise.all(
        savedIds.map(async (id) => ((await vacancyExistsById(id)) ? id : null)),
      )
    ).filter((id): id is string => Boolean(id));

    await prisma.$transaction([
      prisma.savedVacancy.deleteMany({
        where: { userId: auth.id },
      }),
      ...(allowedSavedIds.length
        ? [
            prisma.savedVacancy.createMany({
              data: allowedSavedIds.map((jobId) => ({
                userId: auth.id,
                jobId,
              })),
            }),
          ]
        : []),
    ]);

    const savedVacancies = await resolveSavedVacancies(allowedSavedIds);

    return jsonWithSecurity({
      ok: true,
      savedIds: allowedSavedIds.map((id) => encodeCandidateJobId(id)),
      savedVacancies: savedVacancies.map(encodeVacancyForCandidate),
    });
  } catch {
    return jsonWithSecurity({ ok: false, message: "No se pudieron guardar las vacantes" }, { status: 500 });
  }
}
