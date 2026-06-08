"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Briefcase,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

import { JobsSectionProfileCard } from "@/components/sections/jobs-section-profile-card";
import { jobsData } from "@/features/jobs/data";
import { cities, categories, modes } from "@/features/jobs/constants";
import type { Job } from "@/types/job";

type SortOption = "featured" | "salary-desc" | "salary-asc" | "company-asc";

function parseSalaryAverage(value: string) {
  const numbers = value.match(/\d[\d.]+/g);
  if (!numbers || numbers.length === 0) return 0;

  const normalized = numbers.map((item) => Number(item.replace(/\./g, "")));
  const sum = normalized.reduce((acc, current) => acc + current, 0);

  return Math.round(sum / normalized.length);
}

export function JobsSection() {
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Todas");
  const [category, setCategory] = useState<string | null>(null);
  const urlCategory = params.get("categoria");
  const initialCategory =
    urlCategory && categories.includes(urlCategory) ? urlCategory : "Todas";
  const activeCategory = category ?? initialCategory;
  const [mode, setMode] = useState("Todas");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [savedProfileIds, setSavedProfileIds] = useState<number[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Job | null>(null);

  const filteredAndSortedProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = jobsData.filter((profile) => {
      const searchable = `${profile.title} ${profile.company} ${profile.category} ${profile.city} ${profile.seniority}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);

      return (
        matchesQuery &&
        (city === "Todas" || profile.city === city) &&
        (activeCategory === "Todas" || profile.category === activeCategory) &&
        (mode === "Todas" || profile.mode === mode)
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === "featured") {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return parseSalaryAverage(b.salary) - parseSalaryAverage(a.salary);
      }

      if (sortBy === "salary-desc") {
        return parseSalaryAverage(b.salary) - parseSalaryAverage(a.salary);
      }

      if (sortBy === "salary-asc") {
        return parseSalaryAverage(a.salary) - parseSalaryAverage(b.salary);
      }

      return a.title.localeCompare(b.title, "es");
    });
  }, [query, city, activeCategory, mode, sortBy]);

  const featuredCount = useMemo(
    () => filteredAndSortedProfiles.filter((profile) => profile.featured).length,
    [filteredAndSortedProfiles]
  );

  const clearFilters = () => {
    setQuery("");
    setCity("Todas");
    setCategory("Todas");
    setMode("Todas");
    setSortBy("featured");
  };

  const removeFilter = (type: "city" | "category" | "mode" | "query") => {
    if (type === "city") setCity("Todas");
    if (type === "category") setCategory("Todas");
    if (type === "mode") setMode("Todas");
    if (type === "query") setQuery("");
  };

  const toggleSave = (id: number) => {
    setSavedProfileIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const hasActiveFilters =
    query.trim().length > 0 ||
    city !== "Todas" ||
    activeCategory !== "Todas" ||
    mode !== "Todas";

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#f4f6fa_38%,#eef2f7_100%)]">
      <div className="pointer-events-none absolute left-0 top-0 h-56 w-56 rounded-br-[220px] bg-[#ffd400]/80 blur-[1px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-52 w-72 rounded-tl-[220px] bg-[#ea0029]/20 blur-2xl" />

      <div className="relative mx-auto max-w-7xl px-5 py-10 md:px-8 lg:px-10 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[30px] border border-slate-200 bg-white/85 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-[#12327a]/8 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#12327a]">
                <Briefcase className="h-3.5 w-3.5" />
                Directorio de talento colombiano
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Perfiles disponibles
              </h1>
              <p className="mt-2 text-slate-600">
                Encuentra candidatos por especialidad, ubicación y modalidad de trabajo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                {filteredAndSortedProfiles.length} perfiles
              </span>
              <span className="rounded-2xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800">
                {featuredCount} destacados
              </span>
            </div>
          </div>
        </motion.div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[320px_1fr] xl:grid-cols-[340px_1fr]">
          <aside className="h-max rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <SlidersHorizontal className="h-5 w-5 text-[#12327a]" />
                Filtros
              </h2>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Buscar perfil</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Rol, especialidad o ciudad"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#1f57c3]"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Ciudad</span>
                <select
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1f57c3]"
                >
                  {cities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Especialidad</span>
                <select
                  value={activeCategory}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1f57c3]"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Modalidad</span>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1f57c3]"
                >
                  {modes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Ordenar</span>
                <div className="relative">
                  <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortOption)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#1f57c3]"
                  >
                    <option value="featured">Relevancia</option>
                    <option value="salary-desc">Expectativa: mayor a menor</option>
                    <option value="salary-asc">Expectativa: menor a mayor</option>
                    <option value="company-asc">Perfil: A-Z</option>
                  </select>
                </div>
              </label>
            </div>
          </aside>

          <div>
            {hasActiveFilters && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {query.trim() && (
                  <button
                    onClick={() => removeFilter("query")}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700"
                  >
                    “{query.trim()}” <X className="h-3.5 w-3.5" />
                  </button>
                )}

                {city !== "Todas" && (
                  <button
                    onClick={() => removeFilter("city")}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700"
                  >
                    {city} <X className="h-3.5 w-3.5" />
                  </button>
                )}

                {activeCategory !== "Todas" && (
                  <button
                    onClick={() => removeFilter("category")}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700"
                  >
                    {activeCategory} <X className="h-3.5 w-3.5" />
                  </button>
                )}

                {mode !== "Todas" && (
                  <button
                    onClick={() => removeFilter("mode")}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700"
                  >
                    {mode} <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

              <div className="space-y-4">
                {filteredAndSortedProfiles.map((profile) => (
                  <JobsSectionProfileCard
                    key={profile.id}
                    profile={profile}
                    saved={savedProfileIds.includes(profile.id)}
                    onToggleSave={toggleSave}
                    onViewProfile={setSelectedProfile}
                  />
                ))}
              </div>

            {filteredAndSortedProfiles.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <h3 className="text-2xl font-semibold text-slate-900">No encontramos perfiles</h3>
                <p className="mt-2 text-slate-600">
                  Ajusta filtros o usa otros términos para descubrir más talento.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-95"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedProfile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)] md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#12327a]">
                  Perfil disponible
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                  {selectedProfile.title}
                </h3>
                <p className="mt-1 text-slate-600">{selectedProfile.company}</p>
              </div>

              <button
                onClick={() => setSelectedProfile(null)}
                aria-label="Cerrar perfil"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Ciudad
                </p>
                <p className="mt-2 text-base font-medium text-slate-900">
                  {selectedProfile.city}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Modalidad
                </p>
                <p className="mt-2 text-base font-medium text-slate-900">
                  {selectedProfile.mode}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Expectativa salarial
                </p>
                <p className="mt-2 text-base font-medium text-emerald-700">
                  {selectedProfile.salary}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Especialidad
                </p>
                <p className="mt-2 text-base font-medium text-slate-900">
                  {selectedProfile.category}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Nivel Profesional y disponibilidad
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Perfil con nivel {selectedProfile.seniority.toLowerCase()}, disponible
                para iniciar proceso y recibir feedback visible durante la evaluación.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => toggleSave(selectedProfile.id)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  savedProfileIds.includes(selectedProfile.id)
                    ? "border-amber-300 bg-amber-50 text-amber-800"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {savedProfileIds.includes(selectedProfile.id) ? "Guardado" : "Guardar perfil"}
              </button>
              <button
                onClick={() => setSelectedProfile(null)}
                className="rounded-xl bg-[#12327a] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b4eb7]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
