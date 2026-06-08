import { NextRequest } from "next/server";
import { searchRegisteredCompanies } from "@/lib/server/company-registry";
import { enforceRateLimit, jsonWithSecurity } from "@/lib/server/security";

export async function GET(request: NextRequest) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "company-search",
    maxRequests: 45,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 80) ?? "";

  if (query.length < 2) {
    return jsonWithSecurity({ ok: true, companies: [] });
  }

  try {
    const companies = await searchRegisteredCompanies(query);
    return jsonWithSecurity({ ok: true, companies });
  } catch (error) {
    console.error("Company search failed", error);
    return jsonWithSecurity(
      { ok: false, companies: [], message: "No se pudo consultar la base de empresas." },
      { status: 500 },
    );
  }
}
