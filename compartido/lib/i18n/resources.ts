import en from "@/messages/en.json";
import es from "@/messages/es.json";

export const i18nResources = {
  en,
  es,
} as const;

export type I18nLanguage = keyof typeof i18nResources;
