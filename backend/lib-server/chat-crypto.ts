import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

type KeyRecord = {
  version: number;
  key: Buffer;
};

export type EncryptedMessagePayload = {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
};

let cachedKeyConfig:
  | {
      activeVersion: number;
      keys: Map<number, Buffer>;
      fingerprint: string;
    }
  | null = null;

function decodeKey(rawKey: string, version: number) {
  const normalized = rawKey.trim();
  const key = Buffer.from(normalized, "base64");

  if (key.byteLength !== KEY_BYTES) {
    throw new Error(
      `CHAT_MESSAGE_KEYS_JSON version ${version} must decode to ${KEY_BYTES} bytes`,
    );
  }

  return key;
}

function loadKeyConfig() {
  const source = process.env.CHAT_MESSAGE_KEYS_JSON?.trim();
  const activeVersionRaw = process.env.CHAT_MESSAGE_ACTIVE_KEY_VERSION?.trim();

  if (!source) {
    throw new Error("CHAT_MESSAGE_KEYS_JSON is required for chat message encryption");
  }

  if (!activeVersionRaw) {
    throw new Error("CHAT_MESSAGE_ACTIVE_KEY_VERSION is required for chat message encryption");
  }

  const fingerprint = createHash("sha256")
    .update(`${activeVersionRaw}:${source}`)
    .digest("hex");

  if (cachedKeyConfig?.fingerprint === fingerprint) {
    return cachedKeyConfig;
  }

  const parsed = JSON.parse(source) as Record<string, string>;
  const keys = new Map<number, Buffer>();

  for (const [rawVersion, rawKey] of Object.entries(parsed)) {
    const version = Number.parseInt(rawVersion, 10);
    if (!Number.isInteger(version) || version <= 0 || typeof rawKey !== "string") {
      throw new Error("CHAT_MESSAGE_KEYS_JSON must be a JSON object of numeric versions to base64 keys");
    }

    keys.set(version, decodeKey(rawKey, version));
  }

  const activeVersion = Number.parseInt(activeVersionRaw, 10);
  if (!Number.isInteger(activeVersion) || activeVersion <= 0) {
    throw new Error("CHAT_MESSAGE_ACTIVE_KEY_VERSION must be a positive integer");
  }

  if (!keys.has(activeVersion)) {
    throw new Error("CHAT_MESSAGE_ACTIVE_KEY_VERSION must exist inside CHAT_MESSAGE_KEYS_JSON");
  }

  cachedKeyConfig = {
    activeVersion,
    keys,
    fingerprint,
  };

  return cachedKeyConfig;
}

function getKeyRecord(version?: number): KeyRecord {
  const config = loadKeyConfig();
  const resolvedVersion = version ?? config.activeVersion;
  const key = config.keys.get(resolvedVersion);

  if (!key) {
    throw new Error(`Missing chat encryption key for version ${resolvedVersion}`);
  }

  return {
    version: resolvedVersion,
    key,
  };
}

function getAad(aad?: string) {
  return Buffer.from(aad ?? "", "utf8");
}

export function encryptMessage(plaintext: string, aad?: string): EncryptedMessagePayload {
  const { version, key } = getKeyRecord();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv, {
    authTagLength: AUTH_TAG_BYTES,
  });

  const additionalData = getAad(aad);
  if (additionalData.byteLength > 0) {
    cipher.setAAD(additionalData);
  }

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    keyVersion: version,
  };
}

export function decryptMessage(
  payload: {
    ciphertext: string;
    iv: string;
    authTag: string;
    keyVersion: number;
  },
  aad?: string,
) {
  const { key } = getKeyRecord(payload.keyVersion);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(payload.iv, "base64"),
    { authTagLength: AUTH_TAG_BYTES },
  );

  const additionalData = getAad(aad);
  if (additionalData.byteLength > 0) {
    decipher.setAAD(additionalData);
  }

  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

export function describeChatKeySetup() {
  return {
    algorithm: "AES-256-GCM",
    ivBytes: IV_BYTES,
    keyBytes: KEY_BYTES,
    env: {
      activeVersion: "CHAT_MESSAGE_ACTIVE_KEY_VERSION",
      keysJson: "CHAT_MESSAGE_KEYS_JSON",
    },
  };
}
