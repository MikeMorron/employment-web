"use client";

import {
  colombiaDepartments,
  colombiaMunicipalities,
} from "@/data/colombia-locations";
import {
  formatCopValue,
  formatExperienceValue,
  getCategoryLabel,
  getLocationOptionLabel,
  getModalityLabel,
  maxExperience,
  maxSalary,
  minExperience,
  minSalary,
  modalityOptions,
  type FilterDraft,
  type FilterDraftUpdater,
} from "@/components/vacancies/job-dashboard-utils";

type JobDashboardFiltersProps = {
  isDark: boolean;
  isEnglish: boolean;
  isCompanyViewer: boolean;
  pageUi: (key: string) => string;
  categoryOptions: readonly string[];
  draftFilters: FilterDraft;
  syncFilters: (updater: FilterDraftUpdater) => void;
  clearFilters: () => void;
};

const ALL_OPTION = "Todas";

export function JobDashboardFilters({
  isDark,
  isEnglish,
  isCompanyViewer,
  pageUi,
  categoryOptions,
  draftFilters,
  syncFilters,
  clearFilters,
}: JobDashboardFiltersProps) {
  const municipalityOptions = draftFilters.departamento === ALL_OPTION
    ? [ALL_OPTION]
    : [ALL_OPTION, ...(colombiaMunicipalities[draftFilters.departamento] ?? [])];

  return (
    <>
      <div className="mt-6 flex justify-start">
        <button
          type="button"
          onClick={clearFilters}
          className={
            isDark
              ? "ts-chip-interactive inline-flex items-center justify-center whitespace-nowrap rounded-full border border-white/10 bg-white/4 px-3.5 py-2 text-sm font-medium leading-none text-slate-100 transition duration-300 hover:border-cyan-200/24 hover:bg-white/8"
              : "ts-chip-interactive inline-flex items-center justify-center whitespace-nowrap rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium leading-none text-slate-800 transition duration-300 hover:border-sky-300 hover:bg-sky-50"
          }
        >
          {pageUi("clearFilters")}
        </button>
      </div>

      <div className="mt-7 space-y-5">
        <label className="block">
          <span className={isDark ? "mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400" : "mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"}>
            {pageUi("workMode")}
          </span>
          <select
            value={draftFilters.modalidad}
            onChange={(event) =>
              syncFilters((current) => ({ ...current, modalidad: event.target.value }))
            }
            className="vacancy-select"
          >
            {modalityOptions.map((option) => (
              <option key={option} value={option}>
                {getModalityLabel(option, isEnglish)}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-x-7 gap-y-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end xl:grid-cols-1">
          <label
            className={
              isDark
                ? "flex items-center gap-3 rounded-[1.1rem] border border-white/8 bg-white/4 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                : "flex items-center gap-3 rounded-[1.1rem] border border-slate-300 bg-white/88 px-4 py-3 shadow-[0_12px_24px_rgba(148,163,184,0.08)]"
            }
          >
            <input
              type="checkbox"
              checked={draftFilters.urgente}
              onChange={(event) =>
                syncFilters((current) => ({ ...current, urgente: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 accent-rose-500"
            />
            <span className={isDark ? "text-sm font-medium text-slate-200" : "text-sm font-medium text-slate-800"}>
              {isCompanyViewer ? (isEnglish ? "Immediate availability" : "Disponibilidad inmediata") : pageUi("urgent")}
            </span>
          </label>
        </div>

        <div className="grid gap-x-7 gap-y-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-1">
          <label className="relative z-20 block">
            <span className={isDark ? "mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400" : "mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"}>
              {pageUi("department")}
            </span>
            <select
              value={draftFilters.departamento}
              onChange={(event) =>
                syncFilters((current) => ({
                  ...current,
                  departamento: event.target.value,
                  municipio: ALL_OPTION,
                }))
              }
              className="vacancy-select"
            >
              {colombiaDepartments.map((option) => (
                <option key={option} value={option}>
                  {getLocationOptionLabel(option, isEnglish)}
                </option>
              ))}
            </select>
          </label>

          <label className="relative z-10 block">
            <span className={isDark ? "mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400" : "mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"}>
              {pageUi("municipality")}
            </span>
            <select
              value={draftFilters.municipio}
              onChange={(event) =>
                syncFilters((current) => ({ ...current, municipio: event.target.value }))
              }
              className="vacancy-select"
            >
              {municipalityOptions.map((option) => (
                <option key={option} value={option}>
                  {getLocationOptionLabel(option, isEnglish)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className={isDark ? "mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400" : "mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"}>
            {isCompanyViewer ? "Area de enfoque" : pageUi("categories")}
          </span>
          <select
            value={draftFilters.categoria}
            onChange={(event) =>
              syncFilters((current) => ({ ...current, categoria: event.target.value }))
            }
            className="vacancy-select"
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {getCategoryLabel(option, isEnglish)}
              </option>
            ))}
          </select>
        </label>

        <div
          className={
            isDark
              ? "rounded-[1.5rem] border border-white/8 bg-white/4 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
              : "rounded-[1.5rem] border border-slate-300 bg-white/88 p-4 shadow-[0_12px_24px_rgba(148,163,184,0.08)]"
          }
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-slate-400" : "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"}>
                {isCompanyViewer ? (isEnglish ? "Salary expectation" : "Espectativa salarial") : pageUi("salary")}
              </p>
            </div>
            <span className={isDark ? "text-sm font-semibold text-slate-100 whitespace-nowrap" : "text-sm font-semibold text-slate-950 whitespace-nowrap"}>
              {formatCopValue(draftFilters.salario)}
            </span>
          </div>
          <div className="mt-4 overflow-hidden px-1">
            <input
              type="range"
              min={minSalary}
              max={maxSalary}
              step={100000}
              value={draftFilters.salario}
              onChange={(event) =>
                syncFilters((current) => ({
                  ...current,
                  salario: Number(event.target.value),
                }))
              }
              className="vacancy-range vacancy-range-blue"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>$500.000</span>
            <span>$50.000.000+</span>
          </div>
        </div>

        <div
          className={
            isDark
              ? "rounded-[1.5rem] border border-white/8 bg-white/4 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
              : "rounded-[1.5rem] border border-slate-300 bg-white/88 p-4 shadow-[0_12px_24px_rgba(148,163,184,0.08)]"
          }
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-slate-400" : "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"}>
                {pageUi("experience")}
              </p>
            </div>
            <span className={isDark ? "text-sm font-semibold text-slate-100 whitespace-nowrap" : "text-sm font-semibold text-slate-950 whitespace-nowrap"}>
              {formatExperienceValue(draftFilters.experiencia, isEnglish)}
            </span>
          </div>
          <div className="mt-4 overflow-hidden px-1">
            <input
              type="range"
              min={minExperience}
              max={maxExperience}
              step={1}
              value={draftFilters.experiencia}
              onChange={(event) =>
                syncFilters((current) => ({
                  ...current,
                  experiencia: Number(event.target.value),
                }))
              }
              className="vacancy-range vacancy-range-blue"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>0</span>
            <span>{pageUi("tenPlusYears")}</span>
          </div>
        </div>
      </div>
    </>
  );
}
