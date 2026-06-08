import { requireCompanyUser } from "@/lib/server/api-auth";
import { listRegisteredUsersForCompany } from "@/lib/server/registered-users";
import { enforceRateLimit, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "company-users",
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
    users: await listRegisteredUsersForCompany(),
  });
}
