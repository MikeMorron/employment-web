import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { i18nResources, type I18nLanguage } from "@/compartido/lib/i18n/resources";

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: i18nResources,
    lng: "es",
    fallbackLng: "es",
    supportedLngs: ["es", "en"],
    defaultNS: "common",
    ns: Object.keys(i18nResources.es),
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    returnNull: false,
    initImmediate: false,
  });
}

export function setI18nLanguage(language: I18nLanguage) {
  if (i18n.resolvedLanguage !== language) {
    return i18n.changeLanguage(language);
  }

  return Promise.resolve(i18n);
}

export { i18n };
