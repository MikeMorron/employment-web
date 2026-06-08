import { getVacancyFeedForRequest } from "@/lib/server/marketplace-vacancies";
import { getSessionUser, isCompanyUser } from "@/lib/server/app-state";
import { encodeVacancyForCandidate, encodeVacancyForCompany } from "@/lib/server/opaque-refs";
import { enforceRateLimit, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "vacancies-feed",
    maxRequests: 120,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const [authUser, rawVacancies] = await Promise.all([
    getSessionUser(request),
    getVacancyFeedForRequest(request),
  ]);
  const vacancies = isCompanyUser(authUser)
    ? rawVacancies.map(encodeVacancyForCompany)
    : rawVacancies.map(encodeVacancyForCandidate);

  return jsonWithSecurity({
    ok: true,
    vacancies,
  });
}
