export const APP_RUNTIME_PREFIX = "jobwebpage";
export const LEGACY_APP_RUNTIME_PREFIX = "talentoco";

export const APP_TMP_ROOT = "/tmp/jobwebpage";
export const LEGACY_APP_TMP_ROOT = "/tmp/talento-co";
export const APP_STATE_FILE_PATH = `${APP_TMP_ROOT}/app-state.json`;
export const LEGACY_APP_STATE_FILE_PATH = `${LEGACY_APP_TMP_ROOT}/app-state.json`;
export const DEFAULT_DATABASE_URL =
  "postgresql://postgres@localhost/talentoco?host=/tmp/talentoco-pg-run";

function buildPrefixedKey(prefix: string, suffix: string, separator: "-" | "_") {
  return `${prefix}${separator}${suffix}`;
}

export const THEME_STORAGE_KEY = buildPrefixedKey(APP_RUNTIME_PREFIX, "theme", "-");
export const LEGACY_THEME_STORAGE_KEY = buildPrefixedKey(LEGACY_APP_RUNTIME_PREFIX, "theme", "-");
export const THEME_STORAGE_KEYS = [THEME_STORAGE_KEY, LEGACY_THEME_STORAGE_KEY] as const;
export const THEME_COOKIE_KEY = buildPrefixedKey(APP_RUNTIME_PREFIX, "theme", "_");
export const LEGACY_THEME_COOKIE_KEY = buildPrefixedKey(LEGACY_APP_RUNTIME_PREFIX, "theme", "_");
export const THEME_COOKIE_KEYS = [THEME_COOKIE_KEY, LEGACY_THEME_COOKIE_KEY] as const;

export const LANGUAGE_STORAGE_KEY = buildPrefixedKey(APP_RUNTIME_PREFIX, "language", "-");
export const LEGACY_LANGUAGE_STORAGE_KEY = buildPrefixedKey(LEGACY_APP_RUNTIME_PREFIX, "language", "-");
export const LANGUAGE_STORAGE_KEYS = [LANGUAGE_STORAGE_KEY, LEGACY_LANGUAGE_STORAGE_KEY] as const;
export const LANGUAGE_COOKIE_KEY = buildPrefixedKey(APP_RUNTIME_PREFIX, "language", "_");
export const LEGACY_LANGUAGE_COOKIE_KEY = buildPrefixedKey(LEGACY_APP_RUNTIME_PREFIX, "language", "_");
export const LANGUAGE_COOKIE_KEYS = [LANGUAGE_COOKIE_KEY, LEGACY_LANGUAGE_COOKIE_KEY] as const;
export const LANGUAGE_EVENT = buildPrefixedKey(APP_RUNTIME_PREFIX, "language-changed", "-");

export const AUTH_USER_KEY = buildPrefixedKey(APP_RUNTIME_PREFIX, "auth-user", "-");
export const LEGACY_AUTH_USER_KEY = buildPrefixedKey(LEGACY_APP_RUNTIME_PREFIX, "auth-user", "-");
export const AUTH_USER_KEYS = [AUTH_USER_KEY, LEGACY_AUTH_USER_KEY] as const;
export const AUTH_EVENT = buildPrefixedKey(APP_RUNTIME_PREFIX, "auth-changed", "-");

export const ROUTE_HISTORY_KEY = buildPrefixedKey(APP_RUNTIME_PREFIX, "route-history", "-");
export const LEGACY_ROUTE_HISTORY_KEY = buildPrefixedKey(LEGACY_APP_RUNTIME_PREFIX, "route-history", "-");
export const ROUTE_HISTORY_KEYS = [ROUTE_HISTORY_KEY, LEGACY_ROUTE_HISTORY_KEY] as const;

export const STORAGE_CONSENT_KEY = buildPrefixedKey(APP_RUNTIME_PREFIX, "storage-consent", "-");
export const LEGACY_STORAGE_CONSENT_KEY = buildPrefixedKey(LEGACY_APP_RUNTIME_PREFIX, "storage-consent", "-");
export const STORAGE_CONSENT_KEYS = [STORAGE_CONSENT_KEY, LEGACY_STORAGE_CONSENT_KEY] as const;
export const STORAGE_CONSENT_COOKIE_KEY = buildPrefixedKey(APP_RUNTIME_PREFIX, "storage_consent", "_");
export const LEGACY_STORAGE_CONSENT_COOKIE_KEY = buildPrefixedKey(LEGACY_APP_RUNTIME_PREFIX, "storage_consent", "_");
export const STORAGE_CONSENT_COOKIE_KEYS = [STORAGE_CONSENT_COOKIE_KEY, LEGACY_STORAGE_CONSENT_COOKIE_KEY] as const;

export const HOME_CACHE_KEY = buildPrefixedKey(APP_RUNTIME_PREFIX, "home-cache", "-");
export const LEGACY_HOME_CACHE_KEY = buildPrefixedKey(LEGACY_APP_RUNTIME_PREFIX, "home-cache", "-");
export const HOME_CACHE_KEYS = [HOME_CACHE_KEY, LEGACY_HOME_CACHE_KEY] as const;

export const MATCHES_MIN_SCORE_KEY = buildPrefixedKey(APP_RUNTIME_PREFIX, "matches-min-score", "-");
export const LEGACY_MATCHES_MIN_SCORE_KEY = buildPrefixedKey(
  LEGACY_APP_RUNTIME_PREFIX,
  "matches-min-score",
  "-",
);
export const MATCHES_MIN_SCORE_KEYS = [
  MATCHES_MIN_SCORE_KEY,
  LEGACY_MATCHES_MIN_SCORE_KEY,
] as const;

export const VERIFIED_COMPANIES_ONLY_KEY = buildPrefixedKey(APP_RUNTIME_PREFIX, "verified-companies-only", "-");
export const LEGACY_VERIFIED_COMPANIES_ONLY_KEY = buildPrefixedKey(
  LEGACY_APP_RUNTIME_PREFIX,
  "verified-companies-only",
  "-",
);
export const VERIFIED_COMPANIES_ONLY_KEYS = [
  VERIFIED_COMPANIES_ONLY_KEY,
  LEGACY_VERIFIED_COMPANIES_ONLY_KEY,
] as const;

export const APPLICATION_STATUS_AUTO_CLOSE_KEY = buildPrefixedKey(APP_RUNTIME_PREFIX, "application-status-auto-close", "-");
export const LEGACY_APPLICATION_STATUS_AUTO_CLOSE_KEY = buildPrefixedKey(
  LEGACY_APP_RUNTIME_PREFIX,
  "application-status-auto-close",
  "-",
);
export const APPLICATION_STATUS_AUTO_CLOSE_KEYS = [
  APPLICATION_STATUS_AUTO_CLOSE_KEY,
  LEGACY_APPLICATION_STATUS_AUTO_CLOSE_KEY,
] as const;
export const APPLICATION_STATUS_AUTO_CLOSE_EVENT = buildPrefixedKey(
  APP_RUNTIME_PREFIX,
  "application-status-auto-close-changed",
  "-",
);

export const PANORAMA_OPENED_KEY = buildPrefixedKey(APP_RUNTIME_PREFIX, "panorama-opened", "-");
export const LEGACY_PANORAMA_OPENED_KEY = buildPrefixedKey(LEGACY_APP_RUNTIME_PREFIX, "panorama-opened", "-");
export const OPEN_PANORAMA_EVENT = buildPrefixedKey(APP_RUNTIME_PREFIX, "open-panorama", "-");
export const LEGACY_OPEN_PANORAMA_EVENT = buildPrefixedKey(LEGACY_APP_RUNTIME_PREFIX, "open-panorama", "-");

export const ANALYTICS_EVENT_PREFIX = buildPrefixedKey(APP_RUNTIME_PREFIX, "analytics-event", "-");
export const ANALYTICS_SESSION_ID_KEY = buildPrefixedKey(APP_RUNTIME_PREFIX, "analytics-session-id", "-");
export const ANALYTICS_PAGE_ENTRY_PREFIX = buildPrefixedKey(APP_RUNTIME_PREFIX, "page-entry", "-");

export const SESSION_COOKIE_NAME = buildPrefixedKey(APP_RUNTIME_PREFIX, "session", "_");
export const LEGACY_SESSION_COOKIE_NAME = buildPrefixedKey(LEGACY_APP_RUNTIME_PREFIX, "session", "_");
export const SESSION_COOKIE_NAMES = [SESSION_COOKIE_NAME, LEGACY_SESSION_COOKIE_NAME] as const;

export const MODAL_HISTORY_STATE_KEY = `${APP_RUNTIME_PREFIX}Modal`;

type StorageReader = {
  getItem(key: string): string | null;
};

type StorageRemover = {
  removeItem(key: string): void;
};

export function readCookieValue(
  cookieSource: string | null | undefined,
  cookieKeys: readonly string[],
) {
  if (!cookieSource) {
    return null;
  }

  const cookieParts = cookieSource.split(";").map((item) => item.trim());

  for (const key of cookieKeys) {
    const match = cookieParts.find((item) => item.startsWith(`${key}=`));
    if (match) {
      return decodeURIComponent(match.slice(key.length + 1));
    }
  }

  return null;
}

export function readFirstStorageValue(storage: StorageReader, keys: readonly string[]) {
  for (const key of keys) {
    const value = storage.getItem(key);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

export function removeStorageKeys(storage: StorageRemover, keys: readonly string[]) {
  for (const key of keys) {
    storage.removeItem(key);
  }
}

export function resolveDatabaseUrl(databaseUrl?: string | null) {
  const normalized = databaseUrl?.trim();
  return normalized ? normalized : DEFAULT_DATABASE_URL;
}

export function toDatabaseFilePath(databaseUrl: string) {
  return databaseUrl.startsWith("file:") ? databaseUrl.slice(5) : databaseUrl;
}

export function resolveAppBaseUrl() {
  const raw =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim();

  if (raw) {
    return raw.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

export function getAppVersion(): string {
  return process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";
}

export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  return resolveAppBaseUrl();
}

export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getFeatureFlag(flag: string): boolean {
  const key = `NEXT_PUBLIC_FF_${flag.toUpperCase()}`;
  return process.env[key] === "true";
}
