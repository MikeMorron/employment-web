"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { apiRequest } from "@/lib/api";
import {
  getCachedUserSettings,
  getPendingSettingsRequest,
  setCachedUserSettings,
  setPendingSettingsRequest,
} from "@/lib/client/preferences-cache";
import {
  THEME_COOKIE_KEY,
  THEME_COOKIE_KEYS,
  THEME_STORAGE_KEY,
  THEME_STORAGE_KEYS,
  readCookieValue,
  readFirstStorageValue,
} from "@/lib/app-runtime";

function resolveTheme(value: string | null | undefined): "dark" | "light" | null {
  return value === "dark" || value === "light" ? value : null;
}

function getPreferredTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  return (
    resolveTheme(readFirstStorageValue(window.localStorage, THEME_STORAGE_KEYS)) ??
    resolveTheme(readCookieValue(document.cookie, THEME_COOKIE_KEYS)) ??
    resolveTheme(document.documentElement.getAttribute("data-theme")) ??
    "light"
  );
}

function hasExplicitClientTheme() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(
    resolveTheme(readFirstStorageValue(window.localStorage, THEME_STORAGE_KEYS)) ??
      resolveTheme(readCookieValue(document.cookie, THEME_COOKIE_KEYS)),
  );
}

function persistTheme(theme: "dark" | "light") {
  document.documentElement.setAttribute("data-theme", theme);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures; cookie/html attrs still preserve theme.
  }

  document.cookie = `${THEME_COOKIE_KEY}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
}

export function useVacancyTheme() {
  const { authUser } = useAuthUser();
  const userId = authUser?.id ?? null;
  const isDark = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof document === "undefined") {
        return () => {};
      }

      const html = document.documentElement;
      const observer = new MutationObserver(() => {
        onStoreChange();
      });

      observer.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
      window.addEventListener("storage", onStoreChange);

      return () => {
        observer.disconnect();
        window.removeEventListener("storage", onStoreChange);
      };
    },
    () => getPreferredTheme() === "dark",
    () => false,
  );
  const themeReady = true;

  useEffect(() => {
    let cancelled = false;

    const syncServerTheme = async () => {
      if (!userId) {
        return;
      }

      if (hasExplicitClientTheme()) {
        return;
      }

      const cached = getCachedUserSettings(userId);
      if (cached?.theme) {
        persistTheme(cached.theme);
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

      if (hasExplicitClientTheme()) {
        return;
      }

      persistTheme(nextTheme);
    };

    void syncServerTheme();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    persistTheme(next);

    if (userId) {
      setCachedUserSettings(userId, {
        ...getCachedUserSettings(userId),
        theme: next,
      });
      void apiRequest("/api/preferences/settings", {
        method: "PATCH",
        body: JSON.stringify({ theme: next }),
      });
    }
  };

  return { isDark, themeReady, toggleTheme };
}
