import assert from "node:assert/strict";
import {
  DEFAULT_DATABASE_URL,
  HOME_CACHE_KEYS,
  THEME_COOKIE_KEYS,
  readCookieValue,
  readFirstStorageValue,
  resolveDatabaseUrl,
} from "@/lib/app-runtime";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("app runtime prefers new cookie keys and falls back to legacy ones", () => {
  assert.equal(
    readCookieValue("jobwebpage_theme=dark; talentoco_theme=light", THEME_COOKIE_KEYS),
    "dark",
  );
  assert.equal(
    readCookieValue("talentoco_theme=light", THEME_COOKIE_KEYS),
    "light",
  );
});

runTest("app runtime reads current or legacy storage values", () => {
  const storage = {
    getItem(key: string) {
      if (key === HOME_CACHE_KEYS[1]) {
        return "legacy-cache";
      }

      return null;
    },
  };

  assert.equal(readFirstStorageValue(storage, HOME_CACHE_KEYS), "legacy-cache");
});

runTest("app runtime resolves the new default database url", () => {
  assert.equal(resolveDatabaseUrl(undefined), DEFAULT_DATABASE_URL);
  assert.equal(resolveDatabaseUrl("file:/tmp/custom.db"), "file:/tmp/custom.db");
});
