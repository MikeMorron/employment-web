"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  getCachedUserSettings,
  getPendingSettingsRequest,
  setCachedUserSettings,
  setPendingSettingsRequest,
} from "@/lib/client/preferences-cache";
import {
  HOME_CACHE_KEY,
  HOME_CACHE_KEYS,
  STORAGE_CONSENT_COOKIE_KEY,
  STORAGE_CONSENT_COOKIE_KEYS,
  STORAGE_CONSENT_KEY,
  STORAGE_CONSENT_KEYS,
  THEME_COOKIE_KEY,
  THEME_COOKIE_KEYS,
  THEME_STORAGE_KEY,
  THEME_STORAGE_KEYS,
  readCookieValue,
  readFirstStorageValue,
  removeStorageKeys,
} from "@/lib/app-runtime";

function resolveStoredTheme(raw: string | null | undefined) {
  if (raw === "dark" || raw === "true") {
    return "dark";
  }

  if (raw === "light" || raw === "false") {
    return "light";
  }

  return null;
}

function hasExplicitClientThemeSelection() {
  return Boolean(
    resolveStoredTheme(
      safeReadFirstStorageValue(THEME_STORAGE_KEYS) ??
        safeReadCookieValue(THEME_COOKIE_KEYS),
    ),
  );
}

function safeReadFirstStorageValue(keys: readonly string[]) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return readFirstStorageValue(window.localStorage, keys);
  } catch {
    return null;
  }
}

function safeReadCookieValue(keys: readonly string[]) {
  if (typeof document === "undefined") {
    return null;
  }

  try {
    return readCookieValue(document.cookie, keys);
  } catch {
    return null;
  }
}

type StorageConsentMode = "essential" | "full" | null;

function resolveStoredConsent(raw: string | null | undefined): StorageConsentMode {
  if (raw === "full" || raw === "granted") {
    return "full";
  }

  if (raw === "essential" || raw === "denied") {
    return "essential";
  }

  return null;
}

function persistLocalStorageValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
    return window.localStorage.getItem(key) === value;
  } catch {
    return false;
  }
}

function persistCookieValue(key: string, value: string) {
  try {
    document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax`;
    return readCookieValue(document.cookie, [key]) === value;
  } catch {
    return false;
  }
}

export function useHomePageController(featuredJobs: unknown, userId?: string | null) {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [storageConsent, setStorageConsent] = useState<StorageConsentMode>(null);
  const [selectedConsentMode, setSelectedConsentMode] = useState<StorageConsentMode>(null);
  const [cookieBannerDismissed, setCookieBannerDismissed] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const consent =
          safeReadFirstStorageValue(STORAGE_CONSENT_KEYS) ??
          safeReadCookieValue(STORAGE_CONSENT_COOKIE_KEYS) ??
          null;
        const resolvedConsent = resolveStoredConsent(consent);

        if (resolvedConsent !== "full") {
          setIsDark(document.documentElement.dataset.theme === "dark");
        } else {
          const savedTheme = resolveStoredTheme(
            safeReadFirstStorageValue(THEME_STORAGE_KEYS) ??
              safeReadCookieValue(THEME_COOKIE_KEYS) ??
              document.documentElement.dataset.theme,
          );
          setIsDark(savedTheme === "dark");
        }

        setStorageConsent(resolvedConsent);
        setSelectedConsentMode(resolvedConsent);
        setCookieBannerDismissed(false);
      } finally {
        setHasHydrated(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    const theme = isDark ? "dark" : "light";
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage failures
    }
    document.cookie = `${THEME_COOKIE_KEY}=${theme}; path=/; max-age=31536000; SameSite=Lax`;

    if (storageConsent !== "full") {
      return;
    }

    try {
      window.localStorage.setItem(
        HOME_CACHE_KEY,
        JSON.stringify({
          theme,
          featuredJobs,
          savedAt: Date.now(),
        }),
      );
    } catch {
      // ignore storage failures
    }
  }, [featuredJobs, hasHydrated, isDark, storageConsent]);

  useEffect(() => {
    let cancelled = false;

    const syncServerTheme = async () => {
      if (!userId) {
        return;
      }

      if (hasExplicitClientThemeSelection()) {
        return;
      }

      const cached = getCachedUserSettings(userId);
      if (cached?.theme) {
        setIsDark(cached.theme === "dark");
        return;
      }

      const existingRequest = getPendingSettingsRequest(userId);
      const request =
        existingRequest ??
        apiRequest<{ ok: boolean; settings?: { language?: "es" | "en"; theme?: "dark" | "light" } }>(
          "/api/preferences/settings",
        )
          .then((response) => {
            if (!response.ok) {
              return null;
            }

            const settings = response.data?.settings ?? {};
            setCachedUserSettings(userId, settings);
            return settings;
          })
          .finally(() => {
            setPendingSettingsRequest(userId, null);
          });

      if (!existingRequest) {
        setPendingSettingsRequest(userId, request);
      }

      const settings = await request;
      const nextTheme = settings?.theme;
      if (cancelled || !nextTheme) {
        return;
      }

      if (hasExplicitClientThemeSelection()) {
        return;
      }

      setIsDark(nextTheme === "dark");
    };

    void syncServerTheme();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!hasHydrated || !userId) {
      return;
    }

    const theme = isDark ? "dark" : "light";
    setCachedUserSettings(userId, {
      ...getCachedUserSettings(userId),
      theme,
    });
    void apiRequest("/api/preferences/settings", {
      method: "PATCH",
      body: JSON.stringify({ theme }),
    });
  }, [hasHydrated, isDark, userId]);

  const saveConsent = (value: Exclude<StorageConsentMode, null>) => {
    const storedInStorage = persistLocalStorageValue(STORAGE_CONSENT_KEY, value);
    const storedInCookie = persistCookieValue(STORAGE_CONSENT_COOKIE_KEY, value);
    const resolvedValue = storedInStorage || storedInCookie ? value : null;

    setStorageConsent(resolvedValue);
    setSelectedConsentMode(resolvedValue);
    setCookieBannerDismissed(false);

    if (value === "full") {
      const theme = isDark ? "dark" : "light";
      persistLocalStorageValue(THEME_STORAGE_KEY, theme);
      persistCookieValue(THEME_COOKIE_KEY, theme);
      try {
        window.localStorage.setItem(
          HOME_CACHE_KEY,
          JSON.stringify({
            theme,
            featuredJobs,
            savedAt: Date.now(),
          }),
        );
      } catch {
        // ignore storage failures
      }
      return;
    }

    try {
      removeStorageKeys(window.localStorage, HOME_CACHE_KEYS);
    } catch {
      // ignore storage failures
    }
  };

  return {
    hasHydrated,
    isDark,
    setIsDark,
    storageConsent,
    selectedConsentMode,
    setSelectedConsentMode,
    cookieBannerDismissed,
    dismissConsentBanner: () => setCookieBannerDismissed(true),
    saveConsent,
  };
}
