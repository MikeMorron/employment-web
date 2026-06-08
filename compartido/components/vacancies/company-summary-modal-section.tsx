"use client";

import type { Vacancy } from "@/types/vacancy";

export type CompanySummaryView = {
  name: string;
  initials: string;
  summary: string;
  location?: string;
  websiteHref?: string;
  tags: string[];
};

export function buildCompanySummaryView({
  job,
  companyName,
  getCompanyInitials,
}: {
  job: Vacancy;
  companyName?: string | null;
  getCompanyInitials: (value: string) => string;
  isEnglish?: boolean;
}): CompanySummaryView {
  const resolvedName = companyName?.trim() || job.publicadorNombre || job.empresa || "Empresa";
  return {
    name: resolvedName,
    initials: getCompanyInitials(resolvedName),
    summary: job.resumenEmpresa?.trim() || "Perfil público de empresa sin resumen detallado todavía.",
    location: job.ubicacion,
    websiteHref: job.url,
    tags: (job.etiquetas ?? []).slice(0, 6),
  };
}

export function CompanySummaryModalSection({
  company,
  isDark,
}: {
  company: CompanySummaryView;
  lookupName?: string;
  isDark: boolean;
  isEnglish: boolean;
}) {
  return (
    <section className={isDark ? "mt-6 rounded-[1.5rem] border border-white/8 bg-white/4 p-5" : "mt-6 rounded-[1.5rem] border border-slate-300 bg-white/92 p-5"}>
      <div className="flex items-start gap-4">
        <div className={isDark ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-cyan-300/18 bg-cyan-300/10 text-cyan-100" : "flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-sky-300/30 bg-sky-100 text-sky-700"}>
          <span className="text-xs font-semibold tracking-[0.12em]">{company.initials}</span>
        </div>
        <div>
          <p className={isDark ? "text-base font-semibold text-white" : "text-base font-semibold text-slate-900"}>{company.name}</p>
          {company.location ? <p className={isDark ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>{company.location}</p> : null}
          <p className={isDark ? "mt-2 text-sm leading-6 text-slate-300" : "mt-2 text-sm leading-6 text-slate-700"}>{company.summary}</p>
          {company.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {company.tags.map((tag) => (
                <span key={`${company.name}-${tag}`} className={isDark ? "rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-medium text-slate-300" : "rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
