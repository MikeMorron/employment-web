"use client";

import { RefreshCw } from "lucide-react";
import type { DashboardConfig, DateRangePreset } from "@/app/analytics/_lib/dashboard-config";

interface DashboardFiltersProps {
  isDark: boolean;
  config: DashboardConfig;
  setConfig: React.Dispatch<React.SetStateAction<DashboardConfig>>;
  jobs: { id: string; title: string }[];
}

export function DashboardFilters({ isDark, config, setConfig, jobs }: DashboardFiltersProps) {
  return (
    <section
      className={
        isDark
          ? "rounded-[1.4rem] border border-white/8 bg-white/4 p-4"
          : "rounded-[1.4rem] border border-slate-300 bg-white p-4"
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={config.rangePreset}
          onChange={(event) =>
            setConfig((current) => ({
              ...current,
              rangePreset: event.target.value as DateRangePreset,
            }))
          }
          className="rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none"
        >
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
          <option value="custom">Personalizado</option>
        </select>

        {config.rangePreset === "custom" ? (
          <>
            <input
              type="date"
              value={config.customFrom}
              onChange={(event) =>
                setConfig((current) => ({ ...current, customFrom: event.target.value }))
              }
              className="rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none"
            />
            <input
              type="date"
              value={config.customTo}
              onChange={(event) =>
                setConfig((current) => ({ ...current, customTo: event.target.value }))
              }
              className="rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none"
            />
          </>
        ) : null}

        <select
          value={config.vacancyId}
          onChange={(event) =>
            setConfig((current) => ({ ...current, vacancyId: event.target.value }))
          }
          className="rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none"
        >
          <option value="">Todas las vacantes</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className={
            isDark
              ? "ts-action-secondary inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-semibold text-slate-100"
              : "ts-action-secondary inline-flex items-center gap-2 rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          }
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar datos
        </button>
      </div>
    </section>
  );
}
