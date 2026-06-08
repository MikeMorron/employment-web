export type AppLanguage = "es" | "en";

import {
  LANGUAGE_COOKIE_KEY,
  LANGUAGE_COOKIE_KEYS,
  LANGUAGE_EVENT,
  LANGUAGE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEYS,
  readCookieValue,
  readFirstStorageValue,
} from "@/lib/app-runtime";
export { LANGUAGE_STORAGE_KEY, LANGUAGE_COOKIE_KEY, LANGUAGE_EVENT };

export const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function resolveLanguage(value: string | null | undefined): AppLanguage | null {
  if (value === "es" || value === "en") {
    return value;
  }

  return null;
}

export function readLanguageCookie() {
  if (typeof document === "undefined") {
    return null;
  }

  return readCookieValue(document.cookie, LANGUAGE_COOKIE_KEYS);
}

export function getPreferredLanguage(serverLanguage?: AppLanguage): AppLanguage {
  if (typeof window === "undefined") {
    return serverLanguage ?? "es";
  }

  return (
    resolveLanguage(readFirstStorageValue(window.localStorage, LANGUAGE_STORAGE_KEYS)) ??
    resolveLanguage(readLanguageCookie()) ??
    serverLanguage ??
    "es"
  );
}

export function persistLanguage(language: AppLanguage) {
  document.documentElement.lang = language;
  document.documentElement.dataset.language = language;

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Ignore storage failures; cookie/html attrs still preserve language.
  }

  document.cookie = `${LANGUAGE_COOKIE_KEY}=${language}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}
