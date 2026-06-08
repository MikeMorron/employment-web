import assert from "node:assert/strict";
import { createPasswordCredential, verifyStoredPassword } from "@/lib/server/password-security";

async function runTest(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

async function main() {
  await runTest("argon2 credentials verify successfully and do not require rehash", async () => {
    const credential = await createPasswordCredential("TalentSyncroCandDemo@2604");
    const result = await verifyStoredPassword("TalentSyncroCandDemo@2604", credential);

    assert.equal(result.verified, true);
    assert.equal(result.needsRehash, false);
    assert.equal(credential.passwordHash.startsWith("$argon2id$"), true);
  });

  await runTest("argon2 credentials reject wrong passwords", async () => {
    const credential = await createPasswordCredential("TalentSyncroCandDemo@2604");
    const result = await verifyStoredPassword("incorrect-password", credential);

    assert.equal(result.verified, false);
  });
}

void main();
