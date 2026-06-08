"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { setI18nLanguage } from "@/compartido/lib/i18n/client";
import { apiRequest } from "@/lib/api";
import {
  getPreferredLanguage,
  LANGUAGE_EVENT,
  LANGUAGE_STORAGE_KEY,
  persistLanguage,
  type AppLanguage,
} from "@/lib/client/language-preference";
import {
  getCachedUserSettings,
  getPendingSettingsRequest,
  setCachedUserSettings,
  setPendingSettingsRequest,
} from "@/lib/client/preferences-cache";

function subscribeLanguage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === LANGUAGE_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener("pageshow", onStoreChange);
  window.addEventListener(LANGUAGE_EVENT, onStoreChange as EventListener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("pageshow", onStoreChange);
    window.removeEventListener(LANGUAGE_EVENT, onStoreChange as EventListener);
  };
}

export function useAppLanguage() {
  const router = useRouter();
  const { authUser } = useAuthUser();
  const userId = authUser?.id ?? null;
  const serverLanguage: AppLanguage = "es";
  const language = useSyncExternalStore(
    subscribeLanguage,
    () => getPreferredLanguage(serverLanguage),
    () => serverLanguage,
  );

  const setLanguage = async (nextLanguage: AppLanguage) => {
    if (nextLanguage === language) {
      return;
    }

    persistLanguage(nextLanguage);
    await setI18nLanguage(nextLanguage);
    if (userId) {
      setCachedUserSettings(userId, {
        ...getCachedUserSettings(userId),
        language: nextLanguage,
      });
      void apiRequest("/api/preferences/settings", {
        method: "PATCH",
        body: JSON.stringify({ language: nextLanguage }),
      });
    }
    window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: nextLanguage }));
    router.refresh();
    window.location.reload();
  };

  useEffect(() => {
    let cancelled = false;

    const syncServerLanguage = async () => {
      if (!userId) {
        return;
      }

      const cached = getCachedUserSettings(userId);
      if (cached) {
        if (cached.language) {
          persistLanguage(cached.language);
          void setI18nLanguage(cached.language);
        }
        return;
      }

      const existingRequest = getPendingSettingsRequest(userId);
      const request =
        existingRequest ??
        apiRequest<{ ok: boolean; settings?: { language?: AppLanguage; theme?: "dark" | "light" } }>(
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
      const nextLanguage = settings?.language;
      if (cancelled || !nextLanguage) {
        return;
      }

      const currentClientLanguage = getPreferredLanguage(serverLanguage);
      if (currentClientLanguage !== serverLanguage && currentClientLanguage !== nextLanguage) {
        return;
      }

      persistLanguage(nextLanguage);
      void setI18nLanguage(nextLanguage);
    };

    void syncServerLanguage();

    return () => {
      cancelled = true;
    };
  }, [serverLanguage, userId]);

  return {
    language,
    isEnglish: language === "en",
    setLanguage,
  };
}
