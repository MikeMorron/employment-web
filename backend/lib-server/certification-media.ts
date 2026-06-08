import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getEnvWithLocalFallback } from "@/backend/lib-server/dev-env";

export const CERTIFICATION_MEDIA_TOKEN_TTL_MS = 5 * 60 * 1000;

type CertificationMediaKind = "image" | "video";

type CertificationMediaTokenPayload = {
  publicId: string;
  mediaKind: CertificationMediaKind;
  exp: number;
};

function getCertificationMediaSecret() {
  const secret =
    getEnvWithLocalFallback("CERTIFICATION_MEDIA_TOKEN_SECRET") ||
    getEnvWithLocalFallback("AUTH_SECRET") ||
    getEnvWithLocalFallback("NEXTAUTH_SECRET");

  if (!secret) {
    throw new Error("Missing CERTIFICATION_MEDIA_TOKEN_SECRET");
  }

  return secret;
}

function encodePayload(payload: CertificationMediaTokenPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function signEncodedPayload(encodedPayload: string) {
  return createHmac("sha256", getCertificationMediaSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createCertificationMediaPublicId() {
  return randomBytes(18).toString("base64url");
}

export function createCertificationMediaToken(
  publicId: string,
  mediaKind: CertificationMediaKind,
  ttlMs = CERTIFICATION_MEDIA_TOKEN_TTL_MS,
) {
  const payload: CertificationMediaTokenPayload = {
    publicId,
    mediaKind,
    exp: Date.now() + ttlMs,
  };
  const encodedPayload = encodePayload(payload);
  const signature = signEncodedPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyCertificationMediaToken(
  token: string | null | undefined,
  expected: { publicId: string; mediaKind: CertificationMediaKind },
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
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as CertificationMediaTokenPayload;

    return (
      payload.publicId === expected.publicId &&
      payload.mediaKind === expected.mediaKind &&
      Number.isFinite(payload.exp) &&
      payload.exp > Date.now()
    );
  } catch {
    return false;
  }
}

export function buildCertificationImageAccessUrl(
  publicId: string,
  variant: "thumb" | "full" = "full",
  ttlMs = CERTIFICATION_MEDIA_TOKEN_TTL_MS,
) {
  const token = createCertificationMediaToken(publicId, "image", ttlMs);
  const params = new URLSearchParams({
    token,
    variant,
  });

  return `/api/certification-image/${encodeURIComponent(publicId)}?${params.toString()}`;
}

export function buildCertificationVideoAccessUrl(
  publicId: string,
  ttlMs = CERTIFICATION_MEDIA_TOKEN_TTL_MS,
) {
  const token = createCertificationMediaToken(publicId, "video", ttlMs);
  const params = new URLSearchParams({
    token,
  });

  return `/api/certification-video/${encodeURIComponent(publicId)}?${params.toString()}`;
}

export function parseCertificationPermissionsJson(value: string | null | undefined) {
  if (!value) {
    return { allowedViewerIds: [] as string[], allowedCompanyIds: [] as string[] };
  }

  try {
    const parsed = JSON.parse(value) as {
      allowedViewerIds?: string[];
      allowedCompanyIds?: string[];
    };
    return {
      allowedViewerIds: Array.isArray(parsed.allowedViewerIds) ? parsed.allowedViewerIds : [],
      allowedCompanyIds: Array.isArray(parsed.allowedCompanyIds) ? parsed.allowedCompanyIds : [],
    };
  } catch {
    return { allowedViewerIds: [] as string[], allowedCompanyIds: [] as string[] };
  }
}
