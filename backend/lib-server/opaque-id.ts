import { createCipheriv, createDecipheriv, createHash, createHmac } from "node:crypto";
import { getEnvWithLocalFallback } from "@/backend/lib-server/dev-env";

const OPAQUE_ID_VERSION = "v1";
const OPAQUE_ID_ALGORITHM = "aes-256-gcm";
const OPAQUE_ID_IV_BYTES = 12;

function getOpaqueIdSecret() {
  const secret =
    getEnvWithLocalFallback("OPAQUE_ID_SECRET") ||
    getEnvWithLocalFallback("AUTH_SECRET");

  if (!secret) {
    throw new Error("Missing OPAQUE_ID_SECRET or AUTH_SECRET");
  }

  return secret;
}

function getOpaqueIdKey() {
  return createHash("sha256").update(getOpaqueIdSecret()).digest();
}

function deriveDeterministicIv(payload: string) {
  return createHmac("sha256", getOpaqueIdKey())
    .update(`opaque-id:${payload}`)
    .digest()
    .subarray(0, OPAQUE_ID_IV_BYTES);
}

function encodeBuffer(value: Buffer) {
  return value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBuffer(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(`${normalized}${"=".repeat(padLength)}`, "base64");
}

export function encodeOpaqueId(
  kind: string,
  rawId: string,
  scope = "default",
) {
  const payload = JSON.stringify({
    v: OPAQUE_ID_VERSION,
    k: kind,
    s: scope,
    i: rawId,
  });
  const iv = deriveDeterministicIv(payload);
  const cipher = createCipheriv(OPAQUE_ID_ALGORITHM, getOpaqueIdKey(), iv);
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${OPAQUE_ID_VERSION}.${encodeBuffer(iv)}.${encodeBuffer(authTag)}.${encodeBuffer(encrypted)}`;
}

export function decodeOpaqueId(
  opaqueId: string,
  expected: { kind: string; scope?: string },
) {
  const [version, ivPart, authTagPart, encryptedPart] = opaqueId.split(".");

  if (
    version !== OPAQUE_ID_VERSION ||
    !ivPart ||
    !authTagPart ||
    !encryptedPart
  ) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      OPAQUE_ID_ALGORITHM,
      getOpaqueIdKey(),
      decodeBuffer(ivPart),
    );
    decipher.setAuthTag(decodeBuffer(authTagPart));
    const decrypted = Buffer.concat([
      decipher.update(decodeBuffer(encryptedPart)),
      decipher.final(),
    ]);
    const payload = JSON.parse(decrypted.toString("utf8")) as {
      v?: string;
      k?: string;
      s?: string;
      i?: string;
    };

    if (
      payload.v !== OPAQUE_ID_VERSION ||
      payload.k !== expected.kind ||
      typeof payload.i !== "string"
    ) {
      return null;
    }

    if (expected.scope && payload.s !== expected.scope) {
      return null;
    }

    return payload.i;
  } catch {
    return null;
  }
}
