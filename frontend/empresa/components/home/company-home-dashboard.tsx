"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Clock3, Target, Users } from "lucide-react";
import { useCompanyAnalytics } from "@/frontend/empresa/hooks/use-company-analytics";
import { useCompanyJobs } from "@/frontend/empresa/hooks/use-company-jobs";
import type { CompanyProfile } from "@/compartido/types/profile";

export function CompanyHomeDashboard({
  company,
  isDark,
}: {
  company: CompanyProfile;
  isDark: boolean;
}) {
  const { companyJobs } = useCompanyJobs(company);
  const { analytics } = useCompanyAnalytics(company);
  const reviewCandidates = companyJobs.flatMap((job) => job.applicants).filter((item) => item.stage === "review").length;

  return (
    <section className="mt-8 space-y-6">
      <section className={isDark ? "rounded-[1.9rem] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(7,16,31,0.94),rgba(8,17,32,0.90))] p-6" : "rounded-[1.9rem] border border-slate-300 bg-white/92 p-6"}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.22em] text-sky-700"}>
              Empresa
            </p>
            <h2 className={isDark ? "mt-3 text-3xl font-semibold text-white" : "mt-3 text-3xl font-semibold text-slate-950"}>
              {company.companyName}
            </h2>
          </div>
          <Link href="/analytics" className="inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            Abrir dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: BriefcaseBusiness, label: "Vacantes activas", value: String(analytics.kpis.activeJobs) },
          { icon: Users, label: "Postulaciones", value: String(analytics.kpis.applicationsTotal) },
          { icon: Target, label: "En revisión", value: String(reviewCandidates) },
          { icon: Clock3, label: "Respuesta promedio", value: analytics.kpis.averageResponseHours > 0 ? `${analytics.kpis.averageResponseHours}h` : "N/D" },
        ].map((item) => (
          <article key={item.label} className={isDark ? "rounded-[1.5rem] border border-white/8 bg-white/4 p-5" : "rounded-[1.5rem] border border-slate-300 bg-white/92 p-5"}>
            <div className="flex items-center justify-between gap-3">
              <p className={isDark ? "text-xs uppercase tracking-[0.18em] text-slate-400" : "text-xs uppercase tracking-[0.18em] text-slate-500"}>{item.label}</p>
              <item.icon className={isDark ? "h-4 w-4 text-cyan-200" : "h-4 w-4 text-sky-700"} />
            </div>
            <p className={isDark ? "mt-3 text-3xl font-semibold text-white" : "mt-3 text-3xl font-semibold text-slate-950"}>{item.value}</p>
          </article>
        ))}
      </section>
    </section>
  );
}
