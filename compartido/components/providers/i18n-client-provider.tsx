"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { i18n, setI18nLanguage } from "@/compartido/lib/i18n/client";
import type { I18nLanguage } from "@/compartido/lib/i18n/resources";

export function I18nClientProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: I18nLanguage;
  children: React.ReactNode;
}) {
  if (i18n.resolvedLanguage !== initialLanguage) {
    setI18nLanguage(initialLanguage);
  }

  useEffect(() => {
    setI18nLanguage(initialLanguage);
  }, [initialLanguage]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
