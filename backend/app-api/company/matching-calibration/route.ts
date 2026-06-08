import { prisma } from "@/lib/server/db";
import { requireCompanyUser } from "@/lib/server/api-auth";
import {
  getCompanyCalibrationRecords,
  recalibrateCompanyMatching,
  resetCompanyMatchingCalibration,
} from "@/lib/server/matching-calibration";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const calibrations = await getCompanyCalibrationRecords(prisma, auth.id);

  return jsonWithSecurity({
    ok: true,
    calibrations,
  });
}

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "company-matching-calibration-write",
    maxRequests: 12,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: "recalculate" | "reset";
  };

  const calibrations =
    body.action === "reset"
      ? await resetCompanyMatchingCalibration(prisma, auth.id)
      : await recalibrateCompanyMatching(prisma, auth.id);

  return jsonWithSecurity({
    ok: true,
    calibrations,
  });
}
