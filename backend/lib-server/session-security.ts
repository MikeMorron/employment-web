import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { prisma } from "@/lib/server/db";
import { rowToUser } from "@/lib/server/app-state-mappers";
import type { AppUser } from "@/types/profile";
import { SESSION_COOKIE_NAME } from "@/lib/app-runtime";
import { getEnvWithLocalFallback } from "@/backend/lib-server/dev-env";

const ACCESS_TOKEN_MIN_TTL_MS = 20 * 60 * 1000;
const ACCESS_TOKEN_MAX_TTL_MS = 30 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 25 * 24 * 60 * 60 * 1000;
const REQUEST_SIGNING_KEY_TTL_MS = 2 * 60 * 60 * 1000;
const REQUEST_TIMESTAMP_MAX_SKEW_MS = 2 * 60 * 1000;
const REQUEST_NONCE_TTL_MS = 10 * 60 * 1000;
const SESSION_REVALIDATION_TTL_MS = 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_ISSUER = "talent-syncro";
const ACCESS_TOKEN_AUDIENCE = "talent-syncro-web";

function shouldUseSecureCookies(request?: Request) {
  const configuredOrigins = [
    process.env.APP_URL?.trim(),
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
  ].filter(Boolean);

  if (request) {
    const forwardedProto = request.headers.get("x-forwarded-proto")?.trim().toLowerCase();
    if (forwardedProto === "https") {
      return true;
    }

    if (forwardedProto === "http") {
      return false;
    }
  }

  return configuredOrigins.some((origin) => origin?.startsWith("https://")) ?? false;
}

type AccessTokenClaims = {
  iss: string;
  aud: string;
  sub: string;
  sid: string;
  role: "candidate" | "company" | "admin";
  iat: number;
  exp: number;
  jti: string;
};

type ActiveSessionRow = {
  token: string;
  sessionId: string;
  userId: string;
  expiresAt: Date;
  csrfSalt: string;
  signingSalt: string;
  signingKeyExpiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type AuthBundle = {
  accessToken: string;
  accessTokenExpiresAt: string;
  csrfToken: string;
  requestSigningKey: string;
  requestSigningKeyExpiresAt: string;
  sessionCheckExpiresAt: string;
};

function getServerSecret(suffix: string) {
  const base =
    getEnvWithLocalFallback("AUTH_SECRET") ||
    getEnvWithLocalFallback("OPAQUE_ID_SECRET");

  if (!base) {
    throw new Error("Missing AUTH_SECRET");
  }

  return createHash("sha256").update(`${base}:${suffix}`).digest();
}

function base64urlEncode(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64urlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(`${normalized}${"=".repeat(padLength)}`, "base64");
}

function signData(secret: Buffer, data: string) {
  return createHmac("sha512", secret).update(data).digest();
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function buildAccessTokenPayload(claims: AccessTokenClaims) {
  const header = base64urlEncode(
    JSON.stringify({ alg: "HS512", typ: "JWT" }),
  );
  const payload = base64urlEncode(JSON.stringify(claims));
  const signature = base64urlEncode(
    signData(getServerSecret("access-token"), `${header}.${payload}`),
  );

  return `${header}.${payload}.${signature}`;
}

function verifyAccessToken(token: string) {
  const [headerPart, payloadPart, signaturePart] = token.split(".");
  if (!headerPart || !payloadPart || !signaturePart) {
    return null;
  }

  try {
    const expectedSignature = signData(
      getServerSecret("access-token"),
      `${headerPart}.${payloadPart}`,
    );
    const providedSignature = base64urlDecode(signaturePart);

    if (
      expectedSignature.length !== providedSignature.length ||
      !timingSafeEqual(expectedSignature, providedSignature)
    ) {
      return null;
    }

    const claims = JSON.parse(
      base64urlDecode(payloadPart).toString("utf8"),
    ) as Partial<AccessTokenClaims>;
    const now = Math.floor(Date.now() / 1000);

    if (
      claims.iss !== ACCESS_TOKEN_ISSUER ||
      claims.aud !== ACCESS_TOKEN_AUDIENCE ||
      typeof claims.sub !== "string" ||
      typeof claims.sid !== "string" ||
      (claims.role !== "candidate" && claims.role !== "company" && claims.role !== "admin") ||
      typeof claims.exp !== "number" ||
      typeof claims.iat !== "number" ||
      typeof claims.jti !== "string" ||
      claims.exp <= now
    ) {
      return null;
    }

    return claims as AccessTokenClaims;
  } catch {
    return null;
  }
}

function getRandomAccessTokenTtlMs() {
  return (
    ACCESS_TOKEN_MIN_TTL_MS +
    Math.floor(
      Math.random() * (ACCESS_TOKEN_MAX_TTL_MS - ACCESS_TOKEN_MIN_TTL_MS + 1),
    )
  );
}

function deriveSessionMaterial(
  sessionId: string,
  salt: string,
  purpose: "csrf" | "signing",
) {
  return base64urlEncode(
    signData(
      getServerSecret(`session-${purpose}`),
      `${sessionId}:${salt}:${purpose}`,
    ),
  );
}

function mapSessionRow(
  row: {
    token: string;
    sessionId: string | null;
    userId: string;
    expiresAt: Date;
    csrfSalt: string | null;
    signingSalt: string | null;
    signingKeyExpiresAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
) {
  return {
    token: row.token,
    sessionId: row.sessionId ?? "",
    userId: row.userId,
    expiresAt: row.expiresAt,
    csrfSalt: row.csrfSalt ?? "",
    signingSalt: row.signingSalt ?? "",
    signingKeyExpiresAt:
      row.signingKeyExpiresAt ?? new Date(Date.now() + REQUEST_SIGNING_KEY_TTL_MS),
    revokedAt: row.revokedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  } satisfies ActiveSessionRow;
}

async function hydrateSessionRow(session: Partial<ActiveSessionRow> & { token: string; userId: string; expiresAt: Date }) {
  const updates: Record<string, unknown> = {};

  if (!session.sessionId) {
    updates.sessionId = randomBytes(16).toString("hex");
  }

  if (!session.csrfSalt) {
    updates.csrfSalt = randomBytes(16).toString("hex");
  }

  if (!session.signingSalt) {
    updates.signingSalt = randomBytes(16).toString("hex");
  }

  if (!session.signingKeyExpiresAt) {
    updates.signingKeyExpiresAt = new Date(Date.now() + REQUEST_SIGNING_KEY_TTL_MS);
  }

  if (Object.keys(updates).length === 0) {
    return session as ActiveSessionRow;
  }

  const nextSessionId = String(updates.sessionId ?? session.sessionId);
  const nextCsrfSalt = String(updates.csrfSalt ?? session.csrfSalt);
  const nextSigningSalt = String(updates.signingSalt ?? session.signingSalt);
  const nextSigningKeyExpiresAt = updates.signingKeyExpiresAt instanceof Date
    ? updates.signingKeyExpiresAt
    : session.signingKeyExpiresAt ?? new Date(Date.now() + REQUEST_SIGNING_KEY_TTL_MS);

  await prisma.$executeRaw`
    UPDATE "Session"
    SET "sessionId" = ${nextSessionId},
        "csrfSalt" = ${nextCsrfSalt},
        "signingSalt" = ${nextSigningSalt},
        "signingKeyExpiresAt" = ${nextSigningKeyExpiresAt},
        "updatedAt" = NOW()
    WHERE "token" = ${session.token}
  `;

  return {
    token: session.token,
    userId: session.userId,
    expiresAt: session.expiresAt,
    sessionId: nextSessionId,
    csrfSalt: nextCsrfSalt,
    signingSalt: nextSigningSalt,
    signingKeyExpiresAt: nextSigningKeyExpiresAt,
    revokedAt: session.revokedAt ?? null,
    createdAt: session.createdAt ?? new Date(),
    updatedAt: new Date(),
  };
}

async function buildUserFromSession(session: ActiveSessionRow) {
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { profile: true },
  });

  if (!user?.profile) {
    return null;
  }

  return rowToUser(
    user as Parameters<typeof rowToUser>[0],
    user.profile as Parameters<typeof rowToUser>[1],
  );
}

function issueAuthBundle(session: ActiveSessionRow, user: AppUser): AuthBundle {
  const now = Math.floor(Date.now() / 1000);
  const ttlMs = getRandomAccessTokenTtlMs();
  const exp = Math.floor((Date.now() + ttlMs) / 1000);
  const accessToken = buildAccessTokenPayload({
    iss: ACCESS_TOKEN_ISSUER,
    aud: ACCESS_TOKEN_AUDIENCE,
    sub: user.id,
    sid: session.sessionId,
    role: user.role,
    iat: now,
    exp,
    jti: randomBytes(12).toString("hex"),
  });

  return {
    accessToken,
    accessTokenExpiresAt: new Date(exp * 1000).toISOString(),
    csrfToken: deriveSessionMaterial(session.sessionId, session.csrfSalt, "csrf"),
    requestSigningKey: deriveSessionMaterial(
      session.sessionId,
      session.signingSalt,
      "signing",
    ),
    requestSigningKeyExpiresAt: session.signingKeyExpiresAt.toISOString(),
    sessionCheckExpiresAt: new Date(Date.now() + SESSION_REVALIDATION_TTL_MS).toISOString(),
  };
}

export function parseCookieValue(cookieHeader: string | null, key: string) {
  if (!cookieHeader) {
    return null;
  }

  const found = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${key}=`));

  return found ? decodeURIComponent(found.slice(key.length + 1)) : null;
}

function getRefreshTokenFromRequest(request: Request) {
  return parseCookieValue(request.headers.get("cookie"), SESSION_COOKIE_NAME);
}

async function findSessionByRefreshToken(refreshToken: string | null | undefined) {
  if (!refreshToken) {
    return null;
  }

  const tokenHash = hashValue(refreshToken);
  const session = await prisma.session.findFirst({
    where: {
      token: tokenHash,
      expiresAt: {
        gt: new Date(),
      },
      revokedAt: null,
    },
  });

  return session ? hydrateSessionRow(mapSessionRow(session)) : null;
}

async function findSessionById(sessionId: string) {
  const session = await prisma.session.findFirst({
    where: {
      sessionId,
      expiresAt: {
        gt: new Date(),
      },
      revokedAt: null,
    },
  });

  return session ? hydrateSessionRow(mapSessionRow(session)) : null;
}

export async function createSession(userId: string) {
  const refreshToken = randomBytes(32).toString("hex");
  const activeSession: ActiveSessionRow = {
    token: hashValue(refreshToken),
    sessionId: randomBytes(16).toString("hex"),
    userId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    csrfSalt: randomBytes(16).toString("hex"),
    signingSalt: randomBytes(16).toString("hex"),
    signingKeyExpiresAt: new Date(Date.now() + REQUEST_SIGNING_KEY_TTL_MS),
    revokedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await prisma.$executeRaw`
    INSERT INTO "Session" (
      "token","sessionId","userId","expiresAt","csrfSalt","signingSalt","signingKeyExpiresAt","revokedAt","createdAt","updatedAt"
    )
    VALUES (
      ${activeSession.token},
      ${activeSession.sessionId},
      ${activeSession.userId},
      ${activeSession.expiresAt},
      ${activeSession.csrfSalt},
      ${activeSession.signingSalt},
      ${activeSession.signingKeyExpiresAt},
      ${null},
      NOW(),
      NOW()
    )
  `;

  const user = await buildUserFromSession(activeSession);

  if (!user) {
    throw new Error("Session user is unavailable");
  }

  return {
    token: refreshToken,
    session: activeSession,
    auth: issueAuthBundle(activeSession, user),
    user,
  };
}

export function buildSessionCookie(token: string, request?: Request) {
  const secure = shouldUseSecureCookies(request) ? "; Secure" : "";
  const maxAge = Math.floor(REFRESH_TOKEN_TTL_MS / 1000);
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function buildClearedSessionCookie(request?: Request) {
  const secure = shouldUseSecureCookies(request) ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;
}

export async function clearSession(refreshToken: string | null | undefined) {
  if (!refreshToken) {
    return;
  }

  await prisma.$executeRaw`
    UPDATE "Session"
    SET "revokedAt" = NOW(), "updatedAt" = NOW()
    WHERE "token" = ${hashValue(refreshToken)} AND "revokedAt" IS NULL
  `;
}

export async function issueSessionBundleFromRequest(request: Request) {
  const session = await findSessionByRefreshToken(getRefreshTokenFromRequest(request));
  if (!session) {
    return null;
  }

  const user = await buildUserFromSession(session);
  if (!user) {
    return null;
  }

  if (session.signingKeyExpiresAt.getTime() <= Date.now()) {
    const rotated = await rotateSigningKey(session.sessionId);
    if (!rotated) {
      return null;
    }
    return {
      user,
      session: rotated,
      auth: issueAuthBundle(rotated, user),
    };
  }

  return {
    user,
    session,
    auth: issueAuthBundle(session, user),
  };
}

export async function validateRefreshSessionCsrf(request: Request) {
  const session = await findSessionByRefreshToken(getRefreshTokenFromRequest(request));
  if (!session) {
    return null;
  }

  const csrfToken = request.headers.get("x-csrf-token")?.trim() ?? "";
  if (!csrfToken) {
    return null;
  }

  const expectedCsrf = deriveSessionMaterial(session.sessionId, session.csrfSalt, "csrf");
  if (csrfToken !== expectedCsrf) {
    return null;
  }

  const user = await buildUserFromSession(session);
  if (!user) {
    return null;
  }

  return {
    session,
    user,
  };
}

export async function refreshSessionBundle(request: Request) {
  const session = await findSessionByRefreshToken(getRefreshTokenFromRequest(request));
  if (!session) {
    return null;
  }

  const nextRefreshToken = randomBytes(32).toString("hex");
  const nextSigningSalt = session.signingKeyExpiresAt.getTime() <= Date.now()
    ? randomBytes(16).toString("hex")
    : session.signingSalt;
  const nextSigningKeyExpiresAt = session.signingKeyExpiresAt.getTime() <= Date.now()
    ? new Date(Date.now() + REQUEST_SIGNING_KEY_TTL_MS)
    : session.signingKeyExpiresAt;
  const updatedSession: ActiveSessionRow = {
    ...session,
    token: hashValue(nextRefreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    signingSalt: nextSigningSalt,
    signingKeyExpiresAt: nextSigningKeyExpiresAt,
    revokedAt: null,
    updatedAt: new Date(),
  };

  await prisma.$executeRaw`
    UPDATE "Session"
    SET "token" = ${updatedSession.token},
        "expiresAt" = ${updatedSession.expiresAt},
        "signingSalt" = ${updatedSession.signingSalt},
        "signingKeyExpiresAt" = ${updatedSession.signingKeyExpiresAt},
        "revokedAt" = NULL,
        "updatedAt" = NOW()
    WHERE "token" = ${session.token}
  `;
  const user = await buildUserFromSession(updatedSession);

  if (!user) {
    return null;
  }

  return {
    token: nextRefreshToken,
    session: updatedSession,
    auth: issueAuthBundle(updatedSession, user),
    user,
  };
}

export async function rotateSigningKey(sessionId: string) {
  const session = await findSessionById(sessionId);
  if (!session) {
    return null;
  }

  const rotated: ActiveSessionRow = {
    ...session,
    signingSalt: randomBytes(16).toString("hex"),
    signingKeyExpiresAt: new Date(Date.now() + REQUEST_SIGNING_KEY_TTL_MS),
    updatedAt: new Date(),
  };

  await prisma.$executeRaw`
    UPDATE "Session"
    SET "signingSalt" = ${rotated.signingSalt},
        "signingKeyExpiresAt" = ${rotated.signingKeyExpiresAt},
        "updatedAt" = NOW()
    WHERE "token" = ${session.token}
  `;

  return rotated;
}

async function resolveSessionContextFromAccessToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  const claims = verifyAccessToken(token);
  if (!claims) {
    return null;
  }

  const session = await findSessionById(claims.sid);
  if (!session) {
    return null;
  }

  if (session.userId !== claims.sub) {
    return null;
  }

  const user = await buildUserFromSession(session);
  if (!user) {
    return null;
  }

  return {
    session,
    user,
    claims,
  };
}

export async function getSessionUser(request: Request) {
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;

  const bearerContext = await resolveSessionContextFromAccessToken(bearerToken);
  if (bearerContext) {
    return bearerContext.user;
  }

  const refreshContext = await issueSessionBundleFromRequest(request);
  return refreshContext?.user ?? null;
}

function buildRequestSignaturePayload(input: {
  method: string;
  pathnameWithSearch: string;
  timestamp: string;
  nonce: string;
  csrfToken: string;
  bodyText: string;
}) {
  const bodyHash = createHash("sha256").update(input.bodyText).digest("hex");
  return [
    input.method.toUpperCase(),
    input.pathnameWithSearch,
    input.timestamp,
    input.nonce,
    input.csrfToken,
    bodyHash,
  ].join("\n");
}

async function consumeRequestNonce(sessionId: string, nonce: string) {
  await prisma.$executeRaw`DELETE FROM "SessionNonce" WHERE "expiresAt" <= NOW()`;

  const inserted = await prisma.$executeRaw`
    INSERT INTO "SessionNonce" ("id","sessionId","nonceHash","expiresAt","createdAt")
    VALUES (
      ${randomBytes(12).toString("hex")},
      ${sessionId},
      ${hashValue(nonce)},
      ${new Date(Date.now() + REQUEST_NONCE_TTL_MS)},
      NOW()
    )
    ON CONFLICT ("sessionId","nonceHash") DO NOTHING
  `;

  return Number(inserted) > 0;
}

function unauthorized(message: string, status = 401) {
  return new Response(JSON.stringify({ ok: false, message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    },
  });
}

export async function requireSignedSession(
  request: Request,
  options?: { role?: "candidate" | "company" | "admin" },
) {
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
  const context = await resolveSessionContextFromAccessToken(bearerToken);

  if (!context) {
    return unauthorized("Token de acceso inválido o expirado");
  }

  if (options?.role && context.user.role !== options.role) {
    return unauthorized("No autorizado", 403);
  }

  const csrfToken = request.headers.get("x-csrf-token")?.trim() ?? "";
  const nonce = request.headers.get("x-request-nonce")?.trim() ?? "";
  const timestamp = request.headers.get("x-request-timestamp")?.trim() ?? "";
  const signature = request.headers.get("x-request-signature")?.trim() ?? "";

  if (!csrfToken || !nonce || !timestamp || !signature) {
    return unauthorized("Faltan cabeceras de seguridad", 400);
  }

  const timestampMs = Number(timestamp);
  if (
    !Number.isFinite(timestampMs) ||
    Math.abs(Date.now() - timestampMs) > REQUEST_TIMESTAMP_MAX_SKEW_MS
  ) {
    return unauthorized("Timestamp inválido o vencido", 400);
  }

  if (csrfToken !== deriveSessionMaterial(context.session.sessionId, context.session.csrfSalt, "csrf")) {
    return unauthorized("CSRF inválido", 403);
  }

  if (context.session.signingKeyExpiresAt.getTime() <= Date.now()) {
    return unauthorized("Clave temporal de firma vencida", 419);
  }

  const bodyText = await request.clone().text();
  const url = new URL(request.url);
  const payload = buildRequestSignaturePayload({
    method: request.method,
    pathnameWithSearch: `${url.pathname}${url.search}`,
    timestamp,
    nonce,
    csrfToken,
    bodyText,
  });
  const expectedSignature = base64urlEncode(
    createHmac(
      "sha256",
      deriveSessionMaterial(context.session.sessionId, context.session.signingSalt, "signing"),
    )
      .update(payload)
      .digest(),
  );

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(signature, "utf8");

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return unauthorized("Firma temporal inválida o vencida", 419);
  }

  const nonceAccepted = await consumeRequestNonce(context.session.sessionId, nonce);
  if (!nonceAccepted) {
    return unauthorized("Nonce reutilizado", 409);
  }

  return context;
}
