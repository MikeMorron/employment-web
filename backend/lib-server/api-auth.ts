import type { AdminProfile, AppUser, CandidateProfile, CompanyProfile } from "@/types/profile";
import { getSessionUser } from "./app-state";
import { isDatabaseUnavailableError } from "./db-errors";
import { requireSignedSession } from "./session-security";
import { jsonWithSecurity } from "./security";

function databaseUnavailableResponse() {
  return jsonWithSecurity(
    {
      ok: false,
      degraded: true,
      message: "Servicio temporalmente no disponible",
    },
    { status: 503 },
  );
}

export async function requireAuthUser(request: Request): Promise<AppUser | Response> {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const signed = await requireSignedSession(request);
    if (signed instanceof Response) {
      return signed;
    }

    return signed.user;
  }

  let user: AppUser | null;

  try {
    user = await getSessionUser(request);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return databaseUnavailableResponse();
    }

    throw error;
  }

  if (!user) {
    return jsonWithSecurity({ ok: false, message: "No autenticado" }, { status: 401 });
  }
  return user;
}

export async function requireCandidateUser(request: Request): Promise<CandidateProfile | Response> {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const signed = await requireSignedSession(request, { role: "candidate" });
    if (signed instanceof Response) {
      return signed;
    }

    return signed.user as CandidateProfile;
  }

  let user: AppUser | null;

  try {
    user = await getSessionUser(request);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return databaseUnavailableResponse();
    }

    throw error;
  }

  if (!user) {
    return jsonWithSecurity({ ok: false, message: "No autenticado" }, { status: 401 });
  }
  if (user.role !== "candidate") {
    return jsonWithSecurity({ ok: false, message: "Solo candidatos pueden acceder" }, { status: 403 });
  }
  return user as CandidateProfile;
}

export async function requireCompanyUser(request: Request): Promise<CompanyProfile | Response> {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const signed = await requireSignedSession(request, { role: "company" });
    if (signed instanceof Response) {
      return signed;
    }

    return signed.user as CompanyProfile;
  }

  let user: AppUser | null;

  try {
    user = await getSessionUser(request);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return databaseUnavailableResponse();
    }

    throw error;
  }

  if (!user) {
    return jsonWithSecurity({ ok: false, message: "No autenticado" }, { status: 401 });
  }
  if (user.role !== "company") {
    return jsonWithSecurity({ ok: false, message: "Solo empresas pueden acceder" }, { status: 403 });
  }
  return user as CompanyProfile;
}

export async function requireAdminUser(request: Request): Promise<AdminProfile | Response> {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const signed = await requireSignedSession(request, { role: "admin" });
    if (signed instanceof Response) {
      return signed;
    }

    return signed.user as AdminProfile;
  }

  let user: AppUser | null;

  try {
    user = await getSessionUser(request);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return databaseUnavailableResponse();
    }

    throw error;
  }

  if (!user) {
    return jsonWithSecurity({ ok: false, message: "No autenticado" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return jsonWithSecurity({ ok: false, message: "Solo administradores pueden acceder" }, { status: 403 });
  }
  return user as AdminProfile;
}
