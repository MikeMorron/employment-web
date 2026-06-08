import { buildSessionCookie, createSession, rowToUser, sanitizeUserForClient, verifyPassword } from "@/lib/server/app-state";
import { ensureCertificationAssetsForProfile } from "@/lib/server/certification-assets";
import { ensurePrivateMediaAssetsForProfile } from "@/lib/server/private-media-assets";
import { prisma } from "@/lib/server/db";
import { isDatabaseUnavailableError } from "@/lib/server/db-errors";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";
import { isValidEmail, normalizeEmail } from "@/lib/server/auth-validation";
import { createPasswordCredential, verifyStoredPassword } from "@/lib/server/password-security";
import { recordAdminLoginEntry } from "@/backend/lib-server/admin-ops-storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "auth-login",
    maxRequests: 20,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = normalizeEmail(body.email);
    const password = body.password ?? "";

    if (!email || !password || !isValidEmail(email)) {
      void recordAdminLoginEntry({
        email: email || "invalid-email",
        ok: false,
        statusCode: 400,
        createdAt: new Date().toISOString(),
        reason: "invalid_credentials_shape",
      });
      return jsonWithSecurity({ ok: false, message: "Credenciales inválidas" }, { status: 400 });
    }

    const credential = await prisma.credential.findUnique({
      where: { email },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    const passwordCheck = credential
      ? await verifyStoredPassword(password, credential)
      : { verified: false, needsRehash: false };

    if (!credential || !passwordCheck.verified || !(await verifyPassword(password, credential))) {
      void recordAdminLoginEntry({
        email,
        ok: false,
        statusCode: 401,
        createdAt: new Date().toISOString(),
        reason: "invalid_password",
      });
      return jsonWithSecurity({ ok: false, message: "Credenciales inválidas" }, { status: 401 });
    }

    if (!credential.user || !credential.user.profile) {
      void recordAdminLoginEntry({
        email,
        ok: false,
        statusCode: 404,
        createdAt: new Date().toISOString(),
        reason: "missing_user_profile",
      });
      return jsonWithSecurity({ ok: false, message: "Cuenta no disponible" }, { status: 404 });
    }

    if (passwordCheck.needsRehash) {
      const nextCredential = await createPasswordCredential(password);
      await prisma.credential.update({
        where: { userId: credential.userId },
        data: {
          passwordHash: nextCredential.passwordHash,
          passwordSalt: nextCredential.passwordSalt,
        },
      });
    }

    if (credential.user.role === "candidate") {
      const nextCertificationProfile = await ensureCertificationAssetsForProfile(prisma, {
        ownerUserId: credential.user.id,
        profileVisibility: credential.user.profile.profileVisibility,
        certificationProfileJson: credential.user.profile.certificationProfileJson,
      });
      credential.user.profile.certificationProfileJson = JSON.stringify(nextCertificationProfile);

      const nextPrivateMedia = await ensurePrivateMediaAssetsForProfile(prisma, {
        ownerUserId: credential.user.id,
        profileVisibility: credential.user.profile.profileVisibility,
        avatarStoredFileName: credential.user.profile.avatarStoredFileName,
        avatarAssetPublicId: credential.user.profile.avatarAssetPublicId,
        cvStoredFileName: credential.user.profile.cvStoredFileName,
        cvAssetPublicId: credential.user.profile.cvAssetPublicId,
      });
      credential.user.profile.avatarAssetPublicId = nextPrivateMedia.avatarAssetPublicId ?? null;
      credential.user.profile.cvAssetPublicId = nextPrivateMedia.cvAssetPublicId ?? null;
    }

    const user = rowToUser(credential.user, credential.user.profile);
    void recordAdminLoginEntry({
      email,
      ok: true,
      statusCode: 200,
      role: user.role,
      createdAt: new Date().toISOString(),
    });

    const session = await createSession(user.id);
    const response = jsonWithSecurity({
      ok: true,
      user: sanitizeUserForClient(user),
      auth: session.auth,
    });
    response.headers.set("Set-Cookie", buildSessionCookie(session.token, request));
    return response;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      void recordAdminLoginEntry({
        email: "database-unavailable",
        ok: false,
        statusCode: 503,
        createdAt: new Date().toISOString(),
        reason: "database_unavailable",
      });
      return jsonWithSecurity(
        { ok: false, message: "La base de datos no está disponible" },
        { status: 503 },
      );
    }

    void recordAdminLoginEntry({
      email: "unknown",
      ok: false,
      statusCode: 500,
      createdAt: new Date().toISOString(),
      reason: "login_exception",
    });
    return jsonWithSecurity({ ok: false, message: "No se pudo iniciar sesión" }, { status: 500 });
  }
}
