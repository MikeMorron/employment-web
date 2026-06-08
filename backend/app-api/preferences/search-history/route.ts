import { requireCandidateUser } from "@/lib/server/api-auth";
import { listCandidateSearchHistory } from "@/lib/server/search-history";
import { enforceRateLimit, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "preferences-search-history",
    maxRequests: 60,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const auth = await requireCandidateUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  return jsonWithSecurity({
    ok: true,
    searches: await listCandidateSearchHistory(auth.id),
  });
}
