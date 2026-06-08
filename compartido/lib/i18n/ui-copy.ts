"use client";

import { useTranslation } from "react-i18next";
import { sanitizeVisibleText } from "@/lib/ui-visible-text";

function humanizeCopyKey(key: string) {
  const lastSegment = key.split(".").at(-1) ?? key;

  return lastSegment
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
}

export function useUiCopy(namespace: string) {
  const { t } = useTranslation(namespace);

  return (key: string, values?: Record<string, unknown>) => {
    const translated = String(t(key, values));
    const sanitized = sanitizeVisibleText(translated, values);

    if (!sanitized || sanitized === key || sanitized === `${namespace}.${key}`) {
      return humanizeCopyKey(key);
    }

    return sanitized;
  };
}
