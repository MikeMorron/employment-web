import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getEnvWithLocalFallback } from "@/backend/lib-server/dev-env";

export const PRIVATE_MEDIA_TOKEN_TTL_MS = 30 * 60 * 1000;

export type PrivateMediaType = "avatar" | "cv";

type PrivateMediaTokenPayload = {
  publicId: string;
  mediaType: PrivateMediaType;
  exp: number;
};

function getPrivateMediaSecret() {
  const secret =
    getEnvWithLocalFallback("PRIVATE_MEDIA_TOKEN_SECRET") ||
    getEnvWithLocalFallback("AUTH_SECRET") ||
    getEnvWithLocalFallback("NEXTAUTH_SECRET");

  if (!secret) {
    throw new Error("Missing PRIVATE_MEDIA_TOKEN_SECRET");
  }

  return secret;
}

function encodePayload(payload: PrivateMediaTokenPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function signEncodedPayload(encodedPayload: string) {
  return createHmac("sha256", getPrivateMediaSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createPrivateMediaPublicId() {
  return randomBytes(18).toString("base64url");
}

export function createPrivateMediaToken(
  publicId: string,
  mediaType: PrivateMediaType,
  ttlMs = PRIVATE_MEDIA_TOKEN_TTL_MS,
) {
  const payload: PrivateMediaTokenPayload = {
    publicId,
    mediaType,
    exp: Date.now() + ttlMs,
  };
  const encodedPayload = encodePayload(payload);
  const signature = signEncodedPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyPrivateMediaToken(
  token: string | null | undefined,
  expected: { publicId: string; mediaType: PrivateMediaType },
) {
  if (!token) {
    return false;
  }

  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) {
    return false;
  }

  const expectedSignature = signEncodedPayload(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as PrivateMediaTokenPayload;
    return (
      payload.publicId === expected.publicId &&
      payload.mediaType === expected.mediaType &&
      Number.isFinite(payload.exp) &&
      payload.exp > Date.now()
    );
  } catch {
    return false;
  }
}

export function buildAvatarAccessUrl(publicId: string, ttlMs = PRIVATE_MEDIA_TOKEN_TTL_MS) {
  const params = new URLSearchParams({
    token: createPrivateMediaToken(publicId, "avatar", ttlMs),
  });
  return `/api/avatar-file/${encodeURIComponent(publicId)}?${params.toString()}`;
}

export function buildCvAccessUrl(publicId: string, ttlMs = PRIVATE_MEDIA_TOKEN_TTL_MS) {
  const params = new URLSearchParams({
    token: createPrivateMediaToken(publicId, "cv", ttlMs),
  });
  return `/api/cv-download/${encodeURIComponent(publicId)}?${params.toString()}`;
}

export function hashOpaqueToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
