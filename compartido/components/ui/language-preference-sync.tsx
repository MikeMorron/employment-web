"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_COOKIE_KEY, ONE_YEAR_SECONDS } from "@/lib/client/language-preference";

export function LanguagePreferenceSync() {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === "en" ? "en" : "es";

  useEffect(() => {
    document.cookie = `${LANGUAGE_COOKIE_KEY}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
    document.documentElement.lang = locale;
    document.documentElement.dataset.language = locale;
  }, [locale]);

  return null;
}
