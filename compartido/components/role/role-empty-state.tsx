"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function RoleEmptyState({
  isDark,
  eyebrow,
  title,
  copy,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  isDark: boolean;
  eyebrow: string;
  title: string;
  copy: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section
      className={
        isDark
          ? "rounded-[1.9rem] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(7,16,31,0.94),rgba(8,17,32,0.90))] p-6"
          : "rounded-[1.9rem] border border-slate-300 bg-white/92 p-6"
      }
    >
      <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.22em] text-sky-700"}>
        {eyebrow}
      </p>
      <h1 className={isDark ? "ts-break-anywhere mt-3 text-3xl font-semibold text-white" : "ts-break-anywhere mt-3 text-3xl font-semibold text-slate-950"}>
        {title}
      </h1>
      <p className={isDark ? "ts-break-anywhere mt-4 max-w-2xl text-sm leading-7 text-slate-300" : "ts-break-anywhere mt-4 max-w-2xl text-sm leading-7 text-slate-700"}>
        {copy}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={primaryHref}
          className="ts-action-primary ts-break-anywhere inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
        >
          {primaryLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className={isDark ? "ts-action-secondary ts-break-anywhere inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/4 px-5 py-3 text-sm font-semibold text-slate-100" : "ts-action-secondary ts-break-anywhere inline-flex items-center gap-2 rounded-[1rem] border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"}
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
