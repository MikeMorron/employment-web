import { getPublicCompanyProfileByName } from "@/lib/server/company-public";
import { enforceRateLimit, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "company-public-lookup",
    maxRequests: 60,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const url = new URL(request.url);
  const name = url.searchParams.get("name")?.trim() ?? "";

  if (!name) {
    return jsonWithSecurity({ ok: false, message: "Empresa no encontrada" }, { status: 400 });
  }

  const company = await getPublicCompanyProfileByName(name);

  if (!company) {
    return jsonWithSecurity({ ok: false, message: "Empresa no encontrada" });
  }

  return jsonWithSecurity({ ok: true, company });
}
