import assert from "node:assert/strict";
import {
  isStrongEnoughPassword,
  isValidEmail,
  normalizeEmail,
} from "@/lib/server/auth-validation";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("email normalization trims and lowercases", () => {
  assert.equal(normalizeEmail("  TEST@Example.COM "), "test@example.com");
});

runTest("email validation rejects malformed addresses", () => {
  assert.equal(isValidEmail("test@example.com"), true);
  assert.equal(isValidEmail("bad-email"), false);
  assert.equal(isValidEmail("bad@domain"), false);
});

runTest("password validation requires upper, lower, number, symbol and no spaces", () => {
  assert.equal(isStrongEnoughPassword("Abcdef123!"), true);
  assert.equal(isStrongEnoughPassword("abcdefghij"), false);
  assert.equal(isStrongEnoughPassword("ABCDEFGHIJ"), false);
  assert.equal(isStrongEnoughPassword("Abcdefghij"), false);
  assert.equal(isStrongEnoughPassword("Abcdef1234"), false);
  assert.equal(isStrongEnoughPassword("Abc 1234!"), false);
});
