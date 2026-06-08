"use client";

import Link from "next/link";
import { useUiCopy } from "@/lib/i18n/ui-copy";
import { useVacancyTheme } from "@/hooks/use-vacancy-theme";

interface FooterSectionProps {
  isDark?: boolean;
}

export function FooterSection({ isDark = false }: FooterSectionProps) {
  const t = useUiCopy("footer");
  const theme = useVacancyTheme();
  const resolvedIsDark = theme.isDark ?? isDark;

  return (
    <section
      className={`py-16 ${resolvedIsDark ? "bg-slate-950 text-slate-400" : "bg-slate-50 text-slate-500"}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className={`mb-3 text-xs font-semibold uppercase tracking-widest ${resolvedIsDark ? "text-slate-500" : "text-slate-400"}`}>
              {t("platform")}
            </p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/vacantes" className={resolvedIsDark ? "transition hover:text-white" : "transition hover:text-slate-800"}>{t("jobBoard")}</Link></li>
              <li><Link href="/registro" className={resolvedIsDark ? "transition hover:text-white" : "transition hover:text-slate-800"}>{t("startFree")}</Link></li>
            </ul>
          </div>

          <div>
            <p className={`mb-3 text-xs font-semibold uppercase tracking-widest ${resolvedIsDark ? "text-slate-500" : "text-slate-400"}`}>
              {t("legal")}
            </p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terminos" className={resolvedIsDark ? "transition hover:text-white" : "transition hover:text-slate-800"}>{t("terms")}</Link></li>
              <li><Link href="/privacidad" className={resolvedIsDark ? "transition hover:text-white" : "transition hover:text-slate-800"}>{t("privacy")}</Link></li>
              <li><Link href="/cookies" className={resolvedIsDark ? "transition hover:text-white" : "transition hover:text-slate-800"}>{t("cookies")}</Link></li>
            </ul>
          </div>
        </div>

        <div className={`mt-12 border-t pt-8 text-center text-sm ${resolvedIsDark ? "border-slate-800 text-slate-600" : "border-slate-200 text-slate-400"}`}>
          {t("rights")}
        </div>
      </div>
    </section>
  );
}
