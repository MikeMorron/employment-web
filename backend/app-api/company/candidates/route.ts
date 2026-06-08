import { requireCompanyUser } from "@/lib/server/api-auth";
import { encodeCandidateForCompany } from "@/lib/server/opaque-refs";
import { listDiscoverableCandidates } from "@/lib/server/query-candidates";
import { enforceRateLimit, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "company-candidates",
    maxRequests: 60,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  return jsonWithSecurity({
    ok: true,
    candidates: (await listDiscoverableCandidates()).map(encodeCandidateForCompany),
  });
}
