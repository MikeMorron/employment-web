import { prisma } from "@/lib/server/db";
import { requireCompanyUser } from "@/lib/server/api-auth";
import { buildCompanyJobViews } from "@/lib/server/company-job-views";
import { jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const jobs = await buildCompanyJobViews(prisma, auth.id);

  return jsonWithSecurity({ ok: true, jobs });
}
