"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { RoleRouteGuard } from "@/compartido/components/role/role-route-guard";
import { useAuthUser } from "@/compartido/hooks/use-auth-user";
import { useVacancyTheme } from "@/compartido/theme/use-vacancy-theme";
import { CompanyDashboardShell } from "@/frontend/empresa/components/system/company-dashboard-shell";
import { useCompanyJobs } from "@/frontend/empresa/hooks/use-company-jobs";
import { jobCategoriesEs } from "@/compartido/data/job-categories";

const RESTORE_STORAGE_KEY = "talentoco:restore-job-draft";

function parseLocation(location: string) {
  const [department = "", city = ""] = location.split(",").map((item) => item.trim());
  return { department, city };
}

function inferSeniorityFromTags(tags: string[]) {
  if (tags.includes("Lead")) return "Lead";
  if (tags.includes("Senior")) return "Senior";
  if (tags.includes("Mid")) return "Mid";
  return "Junior";
}

function onlyDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function buildRestoreDraft(entry: ReturnType<typeof useCompanyJobs>["jobHistory"][number]) {
  const [salary = "", salaryMax = ""] = entry.job.salary?.split("-").map((item) => onlyDigits(item)) ?? [];

  return {
    title: entry.job.title,
    category: entry.job.tags[0] ?? jobCategoriesEs[0],
    seniority: inferSeniorityFromTags(entry.job.tags),
    ...parseLocation(entry.job.location),
    modality: entry.job.modality,
    salary,
    salaryMax,
    description: entry.job.description,
    urgent: entry.job.tags.includes("Urgente"),
  };
}

export default function PublicadasHistorialPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useVacancyTheme();
  const { authUser } = useAuthUser();
  const company = authUser?.role === "company" ? authUser : null;
  const { jobHistory, deleteJobHistoryEntry } = useCompanyJobs(company);

  const restoreEntry = (entry: (typeof jobHistory)[number]) => {
    window.sessionStorage.setItem(RESTORE_STORAGE_KEY, JSON.stringify(buildRestoreDraft(entry)));
    router.push("/publicadas");
  };

  return (
    <RoleRouteGuard allowedRole="company">
      <CompanyDashboardShell
        isDark={isDark}
        onToggleTheme={toggleTheme}
        title="Historial de vacantes"
        description={`${jobHistory.length}/20 vacantes canceladas guardadas.`}
      >
        <div className="mb-5">
          <Link
            href="/publicadas"
            className={isDark ? "inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-sm font-semibold text-slate-100" : "inline-flex items-center gap-2 rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a publicadas
          </Link>
        </div>

        <section className="space-y-4">
          {jobHistory.length === 0 ? (
            <div className={isDark ? "rounded-[1.6rem] border border-white/8 bg-white/4 p-6 text-sm text-slate-300" : "rounded-[1.6rem] border border-slate-200 bg-white p-6 text-sm text-slate-600"}>
              No hay vacantes canceladas en el historial.
            </div>
          ) : null}

          {jobHistory.map((entry) => (
            <article key={entry.id} className={isDark ? "rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "rounded-[1.6rem] border border-slate-200 bg-white p-5"}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className={isDark ? "text-xl font-semibold text-white" : "text-xl font-semibold text-slate-950"}>
                    {entry.job.title}
                  </p>
                  <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"}>
                    {entry.job.location} · {entry.job.modality} · {entry.job.salary || "Salario a convenir"}
                  </p>
                  <p className={isDark ? "mt-2 text-xs text-slate-400" : "mt-2 text-xs text-slate-500"}>
                    Cancelada el {new Date(entry.archivedAt).toLocaleDateString("es-CO")}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {entry.job.tags.map((tag) => (
                  <span key={`${entry.id}-${tag}`} className={isDark ? "rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-slate-200" : "rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-700"}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => restoreEntry(entry)}
                  className="inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restaurar
                </button>
                <button
                  type="button"
                  onClick={() => void deleteJobHistoryEntry(entry.id)}
                  className={isDark ? "inline-flex items-center gap-2 rounded-[1rem] border border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-100" : "inline-flex items-center gap-2 rounded-[1rem] border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700"}
                  aria-label={`Eliminar ${entry.job.title} del historial`}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </section>
      </CompanyDashboardShell>
    </RoleRouteGuard>
  );
}
