import argon2 from "argon2";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

type StoredCredentialLike = {
  passwordHash: string;
  passwordSalt: string;
};

const ARGON2_OPTIONS: Parameters<typeof argon2.hash>[1] = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
};

function hashLegacyPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function isArgon2PasswordHash(value: string) {
  return value.startsWith("$argon2id$");
}

export async function createPasswordCredential(password: string) {
  return {
    passwordHash: await argon2.hash(password, ARGON2_OPTIONS),
    passwordSalt: randomBytes(16).toString("hex"),
  };
}

export async function verifyStoredPassword(
  password: string,
  credential: StoredCredentialLike,
): Promise<{ verified: boolean; needsRehash: boolean }> {
  if (isArgon2PasswordHash(credential.passwordHash)) {
    const verified = await argon2.verify(credential.passwordHash, password);
    return {
      verified,
      needsRehash: verified && argon2.needsRehash(credential.passwordHash, ARGON2_OPTIONS),
    };
  }

  const nextHash = hashLegacyPassword(password, credential.passwordSalt);
  const verified =
    nextHash.length === credential.passwordHash.length &&
    timingSafeEqual(Buffer.from(nextHash, "hex"), Buffer.from(credential.passwordHash, "hex"));

  return {
    verified,
    needsRehash: verified,
  };
}
