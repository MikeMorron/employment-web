import { requireCompanyUser } from "@/lib/server/api-auth";
import { listCompanyChatCandidateDirectory } from "@/backend/lib-server/chat-service";
import {
  encodeCompanyApplicationId,
  encodeCompanyCandidateId,
} from "@/lib/server/opaque-refs";
import { isMissingTableError } from "@/lib/server/db-errors";
import { enforceRateLimit, jsonWithSecurity } from "@/lib/server/security";

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

  try {
    const candidates = await listCompanyChatCandidateDirectory(auth.id);

    return jsonWithSecurity({
      ok: true,
      candidates: candidates.map((candidate) => ({
        ...candidate,
        applicationId: encodeCompanyApplicationId(candidate.applicationId),
        candidateId: encodeCompanyCandidateId(candidate.candidateId),
      })),
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return jsonWithSecurity({
        ok: true,
        candidates: [],
        degraded: true,
        message: "El sistema de invitaciones aún no está migrado en la base de datos.",
      });
    }

    throw error;
  }
}
