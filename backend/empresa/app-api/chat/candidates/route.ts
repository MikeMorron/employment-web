import { requireCompanyUser } from "@/lib/server/api-auth";
import { listDiscoverableCandidates } from "@/lib/server/query-candidates";
import { enforceRateLimit, jsonWithSecurity } from "@/lib/server/security";
import { sanitizeCandidatePublicProfile } from "@/lib/server/candidate/user-client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "chat-candidate-directory",
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

  const candidates = await listDiscoverableCandidates();

  return jsonWithSecurity({
    ok: true,
    candidates: candidates.map((candidate) => sanitizeCandidatePublicProfile(candidate)),
  });
}
