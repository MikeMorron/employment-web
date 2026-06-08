"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Copy, EyeOff, PencilLine, Send, Trash2 } from "lucide-react";
import { RoleRouteGuard } from "@/compartido/components/role/role-route-guard";
import { useAuthUser } from "@/compartido/hooks/use-auth-user";
import { useVacancyTheme } from "@/compartido/theme/use-vacancy-theme";
import { jobCategoriesEs } from "@/compartido/data/job-categories";
import { colombiaDepartments, colombiaMunicipalities } from "@/compartido/data/colombia-locations";
import { CompanyDashboardShell } from "@/frontend/empresa/components/system/company-dashboard-shell";
import { useCompanyJobs } from "@/frontend/empresa/hooks/use-company-jobs";
import type { CompanyJobStatus } from "@/compartido/types/workflows";

type JobFormState = {
  id?: string;
  duplicateSourceId?: string;
  title: string;
  category: string;
  seniority: string;
  department: string;
  city: string;
  modality: string;
  salary: string;
  salaryMax: string;
  description: string;
  urgent: boolean;
};

const RESTORE_STORAGE_KEY = "talentoco:restore-job-draft";
const MIN_SALARY_COP = 500_000;
const MAX_SALARY_COP = 80_000_000;
const MIN_DUPLICATE_DIFFERENCE = 0.3;

const initialForm: JobFormState = {
  title: "",
  category: jobCategoriesEs[0],
  seniority: "Mid",
  department: "",
  city: "",
  modality: "Hibrido",
  salary: "",
  salaryMax: "",
  description: "",
  urgent: false,
};

function getWordsCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function buildLocation(form: JobFormState) {
  return form.department && form.city ? `${form.department}, ${form.city}` : "";
}

function buildSalary(form: JobFormState) {
  if (!form.salary.trim() && !form.salaryMax.trim()) return "";
  const normalizedMin = formatCurrencyInput(form.salary || form.salaryMax);
  const normalizedMax = formatCurrencyInput(form.salaryMax || form.salary);
  return `${normalizedMin} - ${normalizedMax} COP`;
}

function inferSeniorityFromTags(tags: string[]) {
  if (tags.includes("Lead")) return "Lead";
  if (tags.includes("Senior")) return "Senior";
  if (tags.includes("Mid")) return "Mid";
  return "Junior";
}

function buildTags(form: JobFormState) {
  return [form.category, form.seniority, form.urgent ? "Urgente" : null].filter(Boolean) as string[];
}

function parseLocation(location: string) {
  const [department = "", city = ""] = location.split(",").map((item) => item.trim());
  return { department, city };
}

function onlyDigits(value: string) {
  return value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "").slice(0, 11);
}

function parseMoney(value: string) {
  const digits = onlyDigits(value);
  return digits ? Number(digits) : null;
}

function formatCurrencyInput(value: string) {
  const digits = onlyDigits(value);
  if (!digits) return "";
  return `$${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function validateSalaryRange(form: JobFormState) {
  const min = parseMoney(form.salary);
  const max = parseMoney(form.salaryMax);

  if (min === null && max === null) {
    return null;
  }

  const salaryMin = min ?? max;
  const salaryMax = max ?? min;
  if (salaryMin === null || salaryMax === null) {
    return "Completa el salario mínimo y máximo o deja ambos vacíos.";
  }

  if (salaryMin < MIN_SALARY_COP || salaryMax < MIN_SALARY_COP) {
    return "El salario debe ser de al menos $500.000.";
  }

  if (salaryMin > MAX_SALARY_COP || salaryMax > MAX_SALARY_COP) {
    return "El salario no puede superar $80.000.000.";
  }

  if (salaryMax < salaryMin) {
    return "El salario máximo debe ser igual o mayor al salario mínimo.";
  }

  return null;
}

function tokenizeForDifference(value: string) {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .split(/[^a-z0-9]+/g)
        .filter((token) => token.length >= 3),
    ),
  );
}

function calculateDifferenceRatio(source: JobFormState, next: JobFormState) {
  const sourceTokens = tokenizeForDifference([
    source.title,
    source.category,
    source.seniority,
    source.department,
    source.city,
    source.modality,
    source.salary,
    source.salaryMax,
    source.description,
    source.urgent ? "urgente" : "",
  ].join(" "));
  const nextTokens = tokenizeForDifference([
    next.title,
    next.category,
    next.seniority,
    next.department,
    next.city,
    next.modality,
    next.salary,
    next.salaryMax,
    next.description,
    next.urgent ? "urgente" : "",
  ].join(" "));

  const universe = new Set([...sourceTokens, ...nextTokens]);
  if (universe.size === 0) return 0;
  const overlap = sourceTokens.filter((token) => nextTokens.includes(token)).length;
  return 1 - overlap / universe.size;
}

function jobToForm(job: {
  id?: string;
  title: string;
  location: string;
  modality: string;
  salary?: string;
  description: string;
  tags: string[];
}) {
  const [salary = "", salaryMax = ""] = job.salary?.split("-").map((item) => onlyDigits(item)) ?? [];

  return {
    id: job.id,
    title: job.title,
    category: job.tags[0] ?? jobCategoriesEs[0],
    seniority: inferSeniorityFromTags(job.tags),
    ...parseLocation(job.location),
    modality: job.modality,
    salary,
    salaryMax,
    description: job.description,
    urgent: job.tags.includes("Urgente"),
  } satisfies JobFormState;
}

export default function PublicadasPage() {
  const { isDark, toggleTheme } = useVacancyTheme();
  const { authUser } = useAuthUser();
  const company = authUser?.role === "company" ? authUser : null;
  const { companyJobs, jobHistory, upsertJob, updateJobStatus, deleteJob } = useCompanyJobs(company);
  const [form, setForm] = useState<JobFormState>(initialForm);
  const [isSavingJob, setIsSavingJob] = useState(false);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [jobPendingDeletion, setJobPendingDeletion] = useState<(typeof companyJobs)[number] | null>(null);
  const duplicateSource = useMemo(
    () => companyJobs.find((job) => job.id === form.duplicateSourceId) ?? null,
    [companyJobs, form.duplicateSourceId],
  );
  const availableCities = form.department ? (colombiaMunicipalities[form.department] ?? []).filter((city) => city !== "Todos") : [];
  const descriptionWords = getWordsCount(form.description);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(RESTORE_STORAGE_KEY);
    if (!raw) return;

    window.sessionStorage.removeItem(RESTORE_STORAGE_KEY);
    try {
      const restored = JSON.parse(raw) as JobFormState;
      setForm({ ...initialForm, ...restored, id: undefined, duplicateSourceId: undefined });
      setFormNotice("Vacante recuperada. Revisa los campos y publícala cuando esté lista.");
    } catch {
      setFormNotice("No se pudo recuperar la vacante del historial.");
    }
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setFormNotice(null);
  };

  const submitForm = async (targetStatus: CompanyJobStatus) => {
    if (!form.title.trim()) {
      setFormNotice("El título es obligatorio.");
      return;
    }
    if (!form.department || !form.city) {
      setFormNotice("Selecciona departamento y ciudad.");
      return;
    }
    if (!form.description.trim()) {
      setFormNotice("La descripción es obligatoria.");
      return;
    }
    if (descriptionWords > 5000) {
      setFormNotice("La descripción no puede superar 5000 palabras.");
      return;
    }
    const salaryError = validateSalaryRange(form);
    if (salaryError) {
      setFormNotice(salaryError);
      return;
    }
    if (duplicateSource) {
      const difference = calculateDifferenceRatio(jobToForm(duplicateSource), form);
      if (difference < MIN_DUPLICATE_DIFFERENCE) {
        setFormNotice("Para duplicar, cambia al menos el 30% del contenido antes de guardar.");
        return;
      }
    }

    try {
      setIsSavingJob(true);
      setFormNotice(null);
      const saved = await upsertJob({
        id: form.duplicateSourceId ? undefined : form.id,
        title: form.title.trim(),
        location: buildLocation(form),
        modality: form.modality,
        salary: buildSalary(form),
        description: form.description.trim(),
        tags: buildTags(form),
        status: targetStatus,
        featured: false,
      });
      if (!saved) {
        throw new Error("No se pudo guardar la vacante.");
      }
      resetForm();
    } catch (error) {
      setFormNotice(error instanceof Error ? error.message : "No se pudo guardar la vacante.");
    } finally {
      setIsSavingJob(false);
    }
  };

  const duplicateJob = (job: (typeof companyJobs)[number]) => {
    setForm({
      ...jobToForm(job),
      id: undefined,
      duplicateSourceId: job.id,
      title: `${job.title} copia`,
    });
    setFormNotice("Edita la copia: debe quedar mínimo 30% diferente para poder guardarla.");
  };

  const handleDelete = async (jobId: string) => {
    try {
      await deleteJob(jobId);
      if (form.id === jobId) {
        resetForm();
      }
      setJobPendingDeletion(null);
    } catch (error) {
      setFormNotice(error instanceof Error ? error.message : "No se pudo eliminar la vacante.");
    }
  };

  const handleStatusToggle = async (jobId: string, status: CompanyJobStatus) => {
    try {
      setFormNotice(null);
      await updateJobStatus(jobId, status);
    } catch (error) {
      setFormNotice(error instanceof Error ? error.message : "No se pudo actualizar el estado de la vacante.");
    }
  };

  const publishedCount = useMemo(() => companyJobs.filter((job) => job.status === "published").length, [companyJobs]);

  return (
    <RoleRouteGuard allowedRole="company">
      <CompanyDashboardShell
        isDark={isDark}
        onToggleTheme={toggleTheme}
        title="Administrar vacantes"
        description={`${publishedCount} publicaciones activas en este momento.`}
      >
        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <article className={isDark ? "rounded-[1.8rem] border border-white/8 bg-white/4 p-6" : "rounded-[1.8rem] border border-slate-200 bg-white p-6"}>
            <div className="flex items-center gap-3">
              <BriefcaseBusiness className={isDark ? "h-5 w-5 text-cyan-200" : "h-5 w-5 text-sky-700"} />
              <h2 className={isDark ? "text-xl font-semibold text-white" : "text-xl font-semibold text-slate-950"}>
                {form.id ? "Editar vacante" : "Crear vacante"}
              </h2>
            </div>

            <div className="mt-5 space-y-5">
              {formNotice ? (
                <div className={isDark ? "rounded-[1rem] border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100" : "rounded-[1rem] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700"}>
                  {formNotice}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <input value={form.title} maxLength={50} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Título" className="w-full rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none sm:col-span-2" />
                <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
                  {jobCategoriesEs.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <select value={form.seniority} onChange={(event) => setForm((current) => ({ ...current, seniority: event.target.value }))} className="w-full rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
                  <option>Junior</option><option>Mid</option><option>Senior</option><option>Lead</option>
                </select>
                <select value={form.modality} onChange={(event) => setForm((current) => ({ ...current, modality: event.target.value }))} className="w-full rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
                  <option value="Hibrido">Híbrido</option><option value="Remoto">Remoto</option><option value="Presencial">Presencial</option>
                </select>
                <select value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value, city: "" }))} className="w-full rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
                  <option value="">Departamento</option>
                  {colombiaDepartments.filter((department) => department !== "Todos").map((department) => <option key={department} value={department}>{department}</option>)}
                </select>
                <select value={form.city} disabled={!form.department} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className="w-full rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none disabled:bg-slate-100">
                  <option value="">{form.department ? "Ciudad" : "Elige departamento"}</option>
                  {availableCities.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
                <input value={formatCurrencyInput(form.salary)} inputMode="numeric" onChange={(event) => setForm((current) => ({ ...current, salary: onlyDigits(event.target.value) }))} placeholder="$2.000.000" className="w-full rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none" />
                <input value={formatCurrencyInput(form.salaryMax)} inputMode="numeric" onChange={(event) => setForm((current) => ({ ...current, salaryMax: onlyDigits(event.target.value) }))} placeholder="$4.500.000" className="w-full rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none" />
              </div>

              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={8} placeholder="Descripción" className="w-full rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none" />
              <p className="text-xs text-slate-500">{descriptionWords}/5000 palabras</p>

              <label className={isDark ? "flex items-center justify-between gap-3 rounded-[1rem] border border-white/10 bg-white/4 px-4 py-3 text-sm text-slate-100" : "flex items-center justify-between gap-3 rounded-[1rem] border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700"}>
                <span>Vacante urgente</span>
                <button type="button" onClick={() => setForm((current) => ({ ...current, urgent: !current.urgent }))} className={`${form.urgent ? "bg-emerald-500 text-white" : "bg-white text-slate-700"} inline-flex min-w-24 items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition`}>
                  {form.urgent ? "Encendido" : "Apagado"}
                </button>
              </label>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => submitForm("published")} disabled={isSavingJob} className={`inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white ${isSavingJob ? "cursor-not-allowed opacity-70" : ""}`}>
                  <Send className="h-4 w-4" />
                  {isSavingJob ? "Guardando..." : form.duplicateSourceId ? "Crear copia" : form.id ? "Guardar edición" : "Publicar"}
                </button>
                <button type="button" onClick={() => submitForm("draft")} disabled={isSavingJob} className={isDark ? "inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-100" : "inline-flex items-center gap-2 rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"}>
                  Guardar como borrador
                </button>
              </div>
            </div>
          </article>

          <section className="space-y-4">
            <Link
              href="/publicadas/historial"
              className={isDark ? "flex items-center justify-between gap-4 rounded-[1.4rem] border border-cyan-300/16 bg-cyan-300/8 px-5 py-4 text-slate-100 transition hover:bg-cyan-300/12" : "flex items-center justify-between gap-4 rounded-[1.4rem] border border-sky-200 bg-sky-50 px-5 py-4 text-slate-800 transition hover:bg-sky-100"}
            >
              <div>
                <p className="text-sm font-semibold">Historial de vacantes canceladas</p>
                <p className={isDark ? "mt-1 text-xs text-slate-300" : "mt-1 text-xs text-slate-600"}>
                  {jobHistory.length}/20 guardadas para restaurar o eliminar.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0" />
            </Link>

            {companyJobs.map((job) => {
              const { department, city } = parseLocation(job.location);
              return (
                <article key={job.id} className={isDark ? "overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white p-5"}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={isDark ? "text-xl font-semibold text-white" : "text-xl font-semibold text-slate-950"}>{job.title}</p>
                        <span className={isDark ? "rounded-full border border-white/10 bg-white/4 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-200" : "rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700"}>
                          {job.status === "draft" ? "Borrador" : job.status === "paused" ? "Oculta" : job.status === "published" ? "Activa" : "Cerrada"}
                        </span>
                      </div>
                      <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"}>{department && city ? `${department}, ${city}` : job.location} · {job.modality} · {job.salary || "Salario a convenir"}</p>
                    </div>
                    <div className="text-right">
                      <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>{job.applicants.length} postulaciones activas</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.tags.map((tag) => <span key={tag} className={isDark ? "rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-slate-200" : "rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-700"}>{tag}</span>)}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" onClick={() => setForm(jobToForm(job))} className="inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                      <PencilLine className="h-4 w-4" />
                      Editar
                    </button>
                    <button type="button" onClick={() => duplicateJob(job)} className={isDark ? "inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-semibold text-slate-100" : "inline-flex items-center gap-2 rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"}>
                      <Copy className="h-4 w-4" />
                      Duplicar
                    </button>
                    <button type="button" onClick={() => void handleStatusToggle(job.id, job.status === "published" ? "paused" : "published")} className={isDark ? "inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-semibold text-slate-100" : "inline-flex items-center gap-2 rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"}>
                      <EyeOff className="h-4 w-4" />
                      {job.status === "published" ? "Pausar reclutamiento" : "Reanudar ocultamiento"}
                    </button>
                    <button type="button" onClick={() => setJobPendingDeletion(job)} className={isDark ? "inline-flex items-center gap-2 rounded-[1rem] border border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-100" : "inline-flex items-center gap-2 rounded-[1rem] border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700"}>
                      <Trash2 className="h-4 w-4" />
                      Cancelar
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </section>

        {jobPendingDeletion ? (
          <div className="fixed inset-0 z-[180] flex items-center justify-center px-4 py-6">
            <button type="button" className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" onClick={() => setJobPendingDeletion(null)} aria-label="Cerrar confirmación" />
            <div className={isDark ? "relative z-10 w-full max-w-lg rounded-[1.8rem] border border-rose-300/16 bg-[linear-gradient(180deg,rgba(7,16,31,0.98),rgba(8,17,32,0.94))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.42)]" : "relative z-10 w-full max-w-lg rounded-[1.8rem] border border-slate-300 bg-white p-6 shadow-[0_24px_70px_rgba(148,163,184,0.20)]"}>
              <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.22em] text-rose-200" : "text-xs font-semibold uppercase tracking-[0.22em] text-rose-700"}>Confirmación</p>
              <h3 className={isDark ? "mt-3 text-2xl font-semibold text-white" : "mt-3 text-2xl font-semibold text-slate-950"}>Cancelar publicación</h3>
              <p className={isDark ? "mt-3 text-sm leading-7 text-slate-300" : "mt-3 text-sm leading-7 text-slate-700"}>
                La publicación <span className="font-semibold">{jobPendingDeletion.title}</span> se va a eliminar de activas y quedará guardada en el historial.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setJobPendingDeletion(null)} className={isDark ? "inline-flex items-center justify-center rounded-[1rem] border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10" : "inline-flex items-center justify-center rounded-[1rem] border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"}>
                  Volver
                </button>
                <button type="button" onClick={() => void handleDelete(jobPendingDeletion.id)} className="inline-flex items-center justify-center rounded-[1rem] bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500">
                  Confirmar cancelación
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </CompanyDashboardShell>
    </RoleRouteGuard>
  );
}
