"use client";

import type { ReactNode } from "react";
import { MiniPageNav } from "@/components/ui/mini-page-nav";
import { useVacancyTheme } from "@/hooks/use-vacancy-theme";

export function LegalPageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  const { isDark, themeReady, toggleTheme } = useVacancyTheme();

  return (
    <main
      className={`min-h-screen px-5 py-10 ${
        isDark ? "vacancies-shell text-[#eef6ff]" : "vacancies-shell-light text-slate-900"
      } ${themeReady ? "" : "invisible"}`}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <MiniPageNav isDark={isDark} onToggleTheme={toggleTheme} />

        <section
          className={
            isDark
              ? "rounded-[2rem] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(7,16,31,0.96),rgba(8,17,32,0.92))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.28)]"
              : "rounded-[2rem] border border-slate-300 bg-white/92 p-6 shadow-[0_24px_70px_rgba(148,163,184,0.16)]"
          }
        >
          <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.22em] text-sky-700"}>
            {eyebrow}
          </p>
          <h1 className={isDark ? "mt-3 text-3xl font-semibold text-white" : "mt-3 text-3xl font-semibold text-slate-950"}>
            {title}
          </h1>
          <p className={isDark ? "mt-4 max-w-3xl text-sm leading-7 text-slate-300" : "mt-4 max-w-3xl text-sm leading-7 text-slate-700"}>
            {intro}
          </p>
        </section>

        <section
          className={
            isDark
              ? "rounded-[2rem] border border-white/8 bg-white/4 p-6"
              : "rounded-[2rem] border border-slate-300 bg-white/92 p-6"
          }
        >
          <div className={isDark ? "space-y-6 text-sm leading-7 text-slate-300" : "space-y-6 text-sm leading-7 text-slate-700"}>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
