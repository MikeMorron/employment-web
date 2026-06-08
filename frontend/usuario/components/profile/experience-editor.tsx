"use client";

import { useEffect, useState } from "react";
import { colombiaMunicipalities } from "@/data/colombia-locations";
import { jobCategoriesEs } from "@/data/job-categories";
import {
  calculateExperienceDurationMonths,
  composeExperienceTime,
} from "@/lib/profile-form";
import { getProfileUi } from "@/lib/ui/profile-classes";
import type { User } from "@/types/user";

export type ExperienceItem = User["experiencia"][number];

type CompanySearchResult = {
  name: string;
  nit: string;
  city: string;
};

export const EMPTY_EXPERIENCE_ITEM: ExperienceItem = {
  rol: "",
  empresa: "",
  empresaNit: "",
  fechaInicio: "",
  fechaFin: "",
  actualidad: false,
  tiempo: "",
  opinion: "",
  canonicalRole: "",
  roleFamily: "",
  companyIndustry: "",
  employmentType: "",
  location: "",
  workMode: "",
  achievements: "",
  description: "",
  skillsUsed: [],
  domainTags: [],
  functionalTags: [],
  teamScope: "",
  peopleLedCount: 0,
  productsWorkedOn: [],
};

const MONTH_OPTIONS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
] as const;

const YEAR_OPTIONS = Array.from({ length: 46 }, (_, index) =>
  String(new Date().getFullYear() + 1 - index),
);
const EMPLOYMENT_TYPE_OPTIONS = [
  "Jornada Completa",
  "Jornada Parcial",
  "Jornada Nocturna",
  "Jornada Rotativa",
] as const;
const WORK_MODE_OPTIONS = ["Presencial", "Remoto", "Hibrido"] as const;
const EXPERIENCE_INDUSTRY_OPTIONS = [...jobCategoriesEs].sort((left, right) => left.localeCompare(right, "es-CO"));
const EXPERIENCE_LOCATION_OPTIONS = Object.entries(colombiaMunicipalities)
  .flatMap(([department, cities]) =>
    cities
      .filter((city) => city !== "Todos")
      .map((city) => `${city}, ${department}`),
  )
  .sort((left, right) => left.localeCompare(right, "es-CO"));
const MAX_SKILLS_USED_CHARS = 500;
const MALICIOUS_SKILLS_PATTERNS = [
  /<\/?script\b/i,
  /\bjavascript\s*:/i,
  /\bon\w+\s*=/i,
  /\b(?:document|window|localStorage|sessionStorage)\b/i,
  /\b(?:eval|fetch|XMLHttpRequest|Function|setTimeout|setInterval)\s*\(/i,
] as const;

function textFieldClassName(isDark: boolean) {
  return `mt-2 ${getProfileUi(isDark).input}`;
}

function parseDelimitedValues(value?: string) {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return [];
  }

  return normalized
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildDelimitedValue(values: string[], maxSelections = values.length) {
  return values.slice(0, maxSelections).join(" | ");
}

function sanitizeSkillsUsedInput(rawValue: string) {
  const limitedValue = rawValue.slice(0, MAX_SKILLS_USED_CHARS);
  let removedSuspiciousLine = false;
  const items = limitedValue
    .split("\n")
    .map((line) => line.replace(/\r/g, "").trim())
    .filter((line) => {
      if (!line) {
        return false;
      }

      const isSuspicious = MALICIOUS_SKILLS_PATTERNS.some((pattern) => pattern.test(line));
      if (isSuspicious) {
        removedSuspiciousLine = true;
      }

      return !isSuspicious;
    })
    .map((line) => line.replace(/[<>]/g, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return {
    items,
    removedSuspiciousLine,
    wasTrimmed: rawValue.length > MAX_SKILLS_USED_CHARS,
  };
}

function parseMonthValue(value?: string) {
  const [rawYear = "", rawMonth = ""] = (value ?? "").split("-");
  return {
    year: rawYear === "0000" ? "" : rawYear,
    month: rawMonth === "00" ? "" : rawMonth,
  };
}

function buildMonthValue(
  currentValue: string | undefined,
  nextPart: { year?: string; month?: string },
) {
  const parsed = parseMonthValue(currentValue);
  const year = nextPart.year ?? parsed.year;
  const month = nextPart.month ?? parsed.month;

  if (!year || !month) {
    if (!year && !month) {
      return "";
    }

    return `${year || "0000"}-${month || "00"}`;
  }

  return `${year}-${month}`;
}

function MonthYearField({
  label,
  value,
  isDark,
  disabled = false,
  error,
  onChange,
}: {
  label: string;
  value?: string;
  isDark: boolean;
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  const { year, month } = parseMonthValue(value);

  return (
    <div className="block">
      <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </span>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <select
          value={month}
          disabled={disabled}
          onChange={(event) => onChange(buildMonthValue(value, { month: event.target.value }))}
          className={textFieldClassName(isDark)}
        >
          <option value="">Mes</option>
          {MONTH_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={year}
          disabled={disabled}
          onChange={(event) => onChange(buildMonthValue(value, { year: event.target.value }))}
          className={textFieldClassName(isDark)}
        >
          <option value="">Año</option>
          {YEAR_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-red-500">{error}</p> : null}
    </div>
  );
}

export function ExperienceEditorCard({
  item,
  isDark,
  errorSignal = 0,
  fieldErrors,
  onFieldChange,
  onRemove,
  showRemove = true,
}: {
  item: ExperienceItem;
  isDark: boolean;
  errorSignal?: number;
  fieldErrors?: Partial<Record<"rol" | "empresa" | "fechaInicio" | "fechaFin", string>>;
  onFieldChange: (field: keyof ExperienceItem, value: string | boolean | number | string[]) => void;
  onRemove?: () => void;
  showRemove?: boolean;
}) {
  const profileUi = getProfileUi(isDark);
  const [companyQuery, setCompanyQuery] = useState(item.empresa);
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [skillsUsedNotice, setSkillsUsedNotice] = useState<string | null>(null);
  const visibleSearchResults = companyQuery.trim().length >= 2 ? searchResults : [];
  const selectedIndustryValues = parseDelimitedValues(item.companyIndustry);
  const industryOptions = Array.from(new Set([...EXPERIENCE_INDUSTRY_OPTIONS, ...selectedIndustryValues]));
  const selectedLocation = item.location?.trim() ?? "";
  const locationOptions =
    selectedLocation && !EXPERIENCE_LOCATION_OPTIONS.includes(selectedLocation)
      ? [selectedLocation, ...EXPERIENCE_LOCATION_OPTIONS]
      : EXPERIENCE_LOCATION_OPTIONS;

  useEffect(() => {
    if (companyQuery.trim().length < 2) {
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/companies/search?q=${encodeURIComponent(companyQuery.trim())}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          ok: boolean;
          companies: CompanySearchResult[];
        };

        if (!cancelled) {
          setSearchResults(payload.companies ?? []);
        }
      } catch {
        if (!cancelled) {
          setSearchResults([]);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [companyQuery]);

  return (
    <div className="space-y-3">
      {showRemove && onRemove ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Eliminar
          </button>
        </div>
      ) : null}
      <label className="block">
        <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Cargo
        </span>
        <input
          type="text"
          value={item.rol}
          onChange={(event) => onFieldChange("rol", event.target.value)}
          className={`${textFieldClassName(isDark)} ${
            fieldErrors?.rol ? "border-red-400 focus:border-red-500 focus:ring-red-500/30" : ""
          }`}
          placeholder="Ej: Cloud Platform Lead"
          data-profile-focus="experience-input"
          style={
            fieldErrors?.rol
              ? { animation: `profile-shake 320ms ease-in-out ${errorSignal}ms 1` }
              : undefined
          }
        />
        {fieldErrors?.rol ? <p className="mt-2 text-xs font-medium text-red-500">{fieldErrors.rol}</p> : null}
      </label>
      <div className={`${profileUi.sectionCard} px-4 py-4`}>
        <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Empresa
        </span>
        <input
          type="text"
          value={companyQuery}
          onChange={(event) => {
            setCompanyQuery(event.target.value);
            onFieldChange("empresa", event.target.value);
          }}
          className={`${textFieldClassName(isDark)} ${
            fieldErrors?.empresa ? "border-red-400 focus:border-red-500 focus:ring-red-500/30" : ""
          }`}
          placeholder="Busca por NIT o nombre"
          style={
            fieldErrors?.empresa
              ? { animation: `profile-shake 320ms ease-in-out ${errorSignal}ms 1` }
              : undefined
          }
        />
        {fieldErrors?.empresa ? (
          <p className="mt-2 text-xs font-medium text-red-500">{fieldErrors.empresa}</p>
        ) : null}
        {visibleSearchResults.length > 0 ? (
          <div className="mt-3 grid gap-2">
            {visibleSearchResults.map((company) => (
              <button
                key={`${company.nit}-${company.name}`}
                type="button"
                onClick={() => {
                  setCompanyQuery(company.name);
                  setSearchResults([]);
                  onFieldChange("empresa", company.name);
                  onFieldChange("empresaNit", company.nit);
                }}
                className={isDark ? "rounded-[1rem] border border-cyan-300/16 bg-white/6 px-3 py-2 text-left text-sm text-slate-100 transition hover:border-cyan-300/28 hover:bg-white/10" : "rounded-[1rem] border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"}
              >
                <span className="block font-semibold">{company.name}</span>
                <span className={`mt-1 block text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {company.city ? `NIT ${company.nit} · ${company.city}` : `NIT ${company.nit}`}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <MonthYearField
          label="Fecha inicio"
          value={item.fechaInicio ?? ""}
          isDark={isDark}
          error={fieldErrors?.fechaInicio}
          onChange={(nextValue) => {
            onFieldChange("fechaInicio", nextValue);
            onFieldChange(
              "tiempo",
              composeExperienceTime(nextValue, item.fechaFin, Boolean(item.actualidad)),
            );
            onFieldChange(
              "durationMonths",
              calculateExperienceDurationMonths(nextValue, item.fechaFin, Boolean(item.actualidad)) ?? 0,
            );
          }}
        />
        <button
          type="button"
          onClick={() => {
            const nextActualidad = !item.actualidad;
            onFieldChange("actualidad", nextActualidad);
            onFieldChange("fechaFin", nextActualidad ? "" : item.fechaFin ?? "");
            onFieldChange(
              "tiempo",
              composeExperienceTime(item.fechaInicio, nextActualidad ? "" : item.fechaFin, nextActualidad),
            );
            onFieldChange(
              "durationMonths",
              calculateExperienceDurationMonths(item.fechaInicio, nextActualidad ? "" : item.fechaFin, nextActualidad) ?? 0,
            );
          }}
          className={`${item.actualidad ? profileUi.buttonPrimary : profileUi.buttonSecondary} mt-7 px-4 py-3`}
        >
          Actualidad
        </button>
        <MonthYearField
          label="Fecha fin"
          value={item.fechaFin ?? ""}
          isDark={isDark}
          disabled={Boolean(item.actualidad)}
          error={fieldErrors?.fechaFin}
          onChange={(nextValue) => {
            onFieldChange("fechaFin", nextValue);
            onFieldChange(
              "tiempo",
              composeExperienceTime(item.fechaInicio, nextValue, Boolean(item.actualidad)),
            );
            onFieldChange(
              "durationMonths",
              calculateExperienceDurationMonths(item.fechaInicio, nextValue, Boolean(item.actualidad)) ?? 0,
            );
          }}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Industria
          </span>
          <select
            multiple
            value={selectedIndustryValues}
            onChange={(event) =>
              onFieldChange(
                "companyIndustry",
                buildDelimitedValue(
                  Array.from(event.target.selectedOptions, (option) => option.value),
                  3,
                ),
              )
            }
            className={textFieldClassName(isDark)}
          >
            {industryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <p className={`mt-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Opcional. Puedes elegir hasta 3 industrias.
          </p>
        </label>
        <label className="block">
          <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Tipo de empleo
          </span>
          <select
            value={item.employmentType ?? ""}
            onChange={(event) => onFieldChange("employmentType", event.target.value)}
            className={textFieldClassName(isDark)}
          >
            <option value="">Selecciona una opción</option>
            {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Ubicación
          </span>
          <select
            value={selectedLocation}
            onChange={(event) => onFieldChange("location", event.target.value)}
            className={textFieldClassName(isDark)}
          >
            <option value="">Selecciona ciudad y departamento</option>
            {locationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Modalidad de trabajo
          </span>
          <select
            value={item.workMode ?? ""}
            onChange={(event) => onFieldChange("workMode", event.target.value)}
            className={textFieldClassName(isDark)}
          >
            <option value="">Selecciona una opción</option>
            {WORK_MODE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Habilidades usadas
        </span>
        <textarea
          rows={3}
          value={(item.skillsUsed ?? []).join("\n")}
          onChange={(event) => {
            const sanitized = sanitizeSkillsUsedInput(event.target.value);
            onFieldChange("skillsUsed", sanitized.items);

            if (sanitized.removedSuspiciousLine) {
              setSkillsUsedNotice("Se eliminaron líneas sospechosas por seguridad.");
            } else if (sanitized.wasTrimmed) {
              setSkillsUsedNotice("El texto se limitó a 500 caracteres.");
            } else {
              setSkillsUsedNotice(null);
            }
          }}
          className={`${textFieldClassName(isDark)} resize-y`}
          placeholder={"Ej:\nNode.js, Express y APIs REST\nC#, .NET / SQL Server\nFigma + design systems"}
        />
        <p className={`mt-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {((item.skillsUsed ?? []).join("\n")).length}/{MAX_SKILLS_USED_CHARS} caracteres. Escribe una habilidad por línea.
        </p>
        {skillsUsedNotice ? (
          <p className="mt-2 text-xs font-medium text-amber-600">{skillsUsedNotice}</p>
        ) : null}
      </label>
    </div>
  );
}
