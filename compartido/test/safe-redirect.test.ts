import assert from "node:assert/strict";
import { sanitizeRedirectPath } from "../lib/safe-redirect";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("safe redirect keeps known internal routes", () => {
  assert.equal(sanitizeRedirectPath("/analytics", "/"), "/analytics");
  assert.equal(sanitizeRedirectPath("/admin/usuarios", "/"), "/admin/usuarios");
  assert.equal(sanitizeRedirectPath("/vacantes?q=test", "/"), "/vacantes");
});

runTest("safe redirect rejects external or protocol-based payloads", () => {
  assert.equal(sanitizeRedirectPath("https://evil.test/pwn", "/"), "/");
  assert.equal(sanitizeRedirectPath("javascript:alert(1)", "/"), "/");
  assert.equal(sanitizeRedirectPath("file:///etc/passwd", "/"), "/");
  assert.equal(sanitizeRedirectPath("data:text/html,<script>alert(1)</script>", "/"), "/");
});

runTest("safe redirect rejects traversal and encoded bypass attempts", () => {
  assert.equal(sanitizeRedirectPath("/../../admin", "/"), "/");
  assert.equal(sanitizeRedirectPath("/..\\..\\admin", "/"), "/");
  assert.equal(sanitizeRedirectPath("//evil.test", "/"), "/");
  assert.equal(sanitizeRedirectPath("/admin/%2f%2fevil", "/"), "/");
});

runTest("safe redirect falls back when path is not allowlisted", () => {
  assert.equal(sanitizeRedirectPath("/api/auth/logout", "/"), "/");
  assert.equal(sanitizeRedirectPath("/some-random-path", "/analytics"), "/analytics");
});
