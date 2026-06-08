"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAppLanguage } from "@/hooks/use-app-language";

interface UpgradePromptProps {
  isDark: boolean;
  upgradeAction: string;
}

export function UpgradePrompt({ isDark, upgradeAction }: UpgradePromptProps) {
  const { isEnglish } = useAppLanguage();

  return (
    <section
      className={
        isDark
          ? "rounded-[1.7rem] border border-amber-300/20 bg-amber-400/10 p-5 text-amber-100"
          : "rounded-[1.7rem] border border-amber-300 bg-amber-50 p-5 text-amber-700"
      }
    >
      <p className="text-sm font-semibold uppercase tracking-[0.18em]">
        {isEnglish ? "Advanced company plans" : "Planes avanzados de empresa"}
      </p>
      <p className="mt-3 text-sm leading-7">
        {isEnglish
          ? "Your current tier shows the basic layer of analytics. Move up to Pro, Business, or Premium to unlock stronger filters, better candidate prioritization, and deeper insights."
          : "Tu nivel actual muestra la capa básica de analítica. Sube a Pro, Business o Premium para desbloquear mejores filtros, una priorización más fuerte y una lectura más profunda."}
      </p>
      <Link
        href="/ajustes"
        className="ts-action-primary mt-4 inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
      >
        {upgradeAction}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
