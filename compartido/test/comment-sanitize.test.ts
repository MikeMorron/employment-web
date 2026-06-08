import assert from "node:assert/strict";
import { sanitizeCommentInput } from "@/lib/comments/sanitize";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("comment sanitizer keeps normal Spanish text characters", () => {
  const result = sanitizeCommentInput("Hola, mundo 123.-_ ¿Qué tal? ¡Bien! “ok”\nNueva línea");
  assert.equal(result, "Hola, mundo 123.-_ ¿Qué tal? ¡Bien! “ok”\nNueva línea");
});

runTest("comment sanitizer removes unsupported punctuation in real time", () => {
  const result = sanitizeCommentInput("Hola!!! <script> @#$%^&*()");
  assert.equal(result, "Hola script ");
});
