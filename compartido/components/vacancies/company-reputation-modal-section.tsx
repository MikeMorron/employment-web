"use client";

import type { Vacancy } from "@/types/vacancy";

export function CompanyReputationModalSection({
  job,
  companyName,
  isDark,
  isEnglish,
}: {
  job: Vacancy;
  companyName?: string | null;
  isDark: boolean;
  isEnglish: boolean;
}) {
  const views = job.vistasDosSemanas ?? 0;
  const clicks = job.clicksSemana ?? job.clicksDia ?? 0;
  const applicants = job.aplicantes ?? 0;
  const verification = job.companyVerificationStatus === "verified"
    ? isEnglish ? "Verified company" : "Empresa verificada"
    : isEnglish ? "Company pending verification" : "Empresa pendiente de verificación";

  return (
    <section className={isDark ? "mt-6 rounded-[1.5rem] border border-white/8 bg-white/4 p-5" : "mt-6 rounded-[1.5rem] border border-slate-300 bg-white/92 p-5"}>
      <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.18em] text-sky-700"}>
        {isEnglish ? "Company signals" : "Señales de empresa"}
      </p>
      <p className={isDark ? "mt-3 text-sm text-slate-300" : "mt-3 text-sm text-slate-700"}>
        {companyName ?? job.empresa ?? job.publicadorNombre ?? "Empresa"} · {verification}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: isEnglish ? "Views" : "Vistas", value: String(views) },
          { label: isEnglish ? "Clicks" : "Clicks", value: String(clicks) },
          { label: isEnglish ? "Applicants" : "Postulantes", value: String(applicants) },
        ].map((item) => (
          <div key={item.label} className={isDark ? "rounded-[1rem] border border-white/8 bg-white/3 p-3" : "rounded-[1rem] border border-slate-200 bg-slate-50 p-3"}>
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
            <p className={isDark ? "mt-1 text-sm font-semibold text-white" : "mt-1 text-sm font-semibold text-slate-950"}>{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
