import assert from "node:assert/strict";
import { renderRetentionEmail } from "@/lib/server/retention-templates";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("profile interest digest email lists the companies that viewed the profile", () => {
  const email = renderRetentionEmail("profile_interest_digest", {
    count: 6,
    companies: ["Acme", "Globant", "Rappi", "Mercado Libre", "Sura"],
    ctaHref: "/perfil/me",
  });

  assert.equal(email.subject, "Más de 6 empresas vieron tu perfil");
  assert.match(email.text, /Acme/);
  assert.match(email.html, /Mercado Libre/);
  assert.match(email.html, /Abrir TalentSyncro/);
});
