import path from "node:path";
import { createRequire } from "node:module";
import Module from "node:module";

const distRoot = "/tmp/jobwebpage-matching-tests";
const require = createRequire(import.meta.url);
const originalResolveFilename = Module._resolveFilename;

process.env.NODE_PATH = [
  process.env.NODE_PATH,
  path.join(process.cwd(), "node_modules"),
].filter(Boolean).join(path.delimiter);
Module._initPaths();

process.env.AUTH_SECRET ??= "test-auth-secret-64-chars-000000000000000000000000000000000000";
process.env.PRIVATE_MEDIA_TOKEN_SECRET ??= "test-private-media-secret-64-chars-000000000000000000000000";
process.env.CERTIFICATION_MEDIA_TOKEN_SECRET ??= "test-certification-media-secret-64-chars-0000000000000000";

Module._resolveFilename = function patchedResolveFilename(request, parent, isMain, options) {
  if (typeof request === "string" && request.startsWith("@/")) {
    const mappedRequest = path.join(distRoot, request.slice(2));
    return originalResolveFilename.call(this, mappedRequest, parent, isMain, options);
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require(path.join(distRoot, "compartido", "test", "matching-engine.test.js"));
require(path.join(distRoot, "compartido", "test", "user-client-sanitization.test.js"));
require(path.join(distRoot, "compartido", "test", "demo-seed-policy.test.js"));
require(path.join(distRoot, "compartido", "test", "profile-patch-sanitization.test.js"));
require(path.join(distRoot, "compartido", "test", "profanity-guard.test.js"));
require(path.join(distRoot, "compartido", "test", "comment-sanitize.test.js"));
require(path.join(distRoot, "compartido", "test", "auth-validation.test.js"));
require(path.join(distRoot, "compartido", "test", "password-security.test.js"));
require(path.join(distRoot, "compartido", "test", "candidate-plan-state.test.js"));
require(path.join(distRoot, "compartido", "test", "db-errors.test.js"));
require(path.join(distRoot, "compartido", "test", "app-runtime.test.js"));
require(path.join(distRoot, "compartido", "test", "catalog-and-translation.test.js"));
require(path.join(distRoot, "compartido", "test", "dashboard-config-utils.test.js"));
require(path.join(distRoot, "compartido", "test", "market-panorama-helpers.test.js"));
require(path.join(distRoot, "compartido", "test", "candidate-match-profile-utils.test.js"));
require(path.join(distRoot, "compartido", "test", "notification-read-state.test.js"));
require(path.join(distRoot, "compartido", "test", "notification-state.test.js"));
require(path.join(distRoot, "compartido", "test", "opaque-id.test.js"));
require(path.join(distRoot, "compartido", "test", "product-notification-policy.test.js"));
require(path.join(distRoot, "compartido", "test", "chat-state.test.js"));
require(path.join(distRoot, "compartido", "test", "vacancy-badges.test.js"));
require(path.join(distRoot, "compartido", "test", "vacancy-category.test.js"));
require(path.join(distRoot, "compartido", "test", "company-candidate-vacancy-feed.test.js"));
require(path.join(distRoot, "compartido", "test", "retention-email-template.test.js"));
require(path.join(distRoot, "compartido", "test", "vacancy-filter.test.js"));
