import assert from "node:assert/strict";
import { findBlockedWordsInPayload } from "@/backend/compartido/lib-server/profanity-guard";

async function runTest(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

void (async () => {
  await runTest("profanity guard detects blocked words inside nested text payloads", async () => {
    const matches = await findBlockedWordsInPayload({
      companyDescription: "Equipo sin mierda ni filtros.",
      hiringFocus: ["Frontend", "p.u.t.o crack"],
      professionalProfile: {
        headline: "Lider técnico",
      },
    });

    assert.deepEqual(
      matches.map((value: string) => value.toLowerCase()).sort(),
      ["mierda", "p.u.t.o"].sort(),
    );
  });

  await runTest("profanity guard ignores urls and technical asset fields", async () => {
    const matches = await findBlockedWordsInPayload({
      website: "https://puta.example.com",
      companyWebsite: "https://mierda.example.com/jobs",
      proofImageUrl: "https://cdn.example.com/puto-banner.png",
      proofImageStoredFileName: "maricon-banner.png",
      profileVisibility: "public",
    });

    assert.deepEqual(matches, []);
  });
})();
