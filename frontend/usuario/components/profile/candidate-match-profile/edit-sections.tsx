"use client";

import { CalendarClock, MapPinPlus, Route } from "lucide-react";
import { ClearableSelect } from "@/components/ui/clearable-select";
import {
  SENIORITY_OPTIONS,
} from "@/components/profile/candidate-match-profile/constants";
import { ReadOnlyChipList, ReadOnlyDetail } from "@/components/profile/candidate-match-profile/shared";
import type {
  CandidateProfessionalProfile,
  CandidateWorkPreferences,
} from "@/types/profile";

type ProfileUi = {
  sectionCard: string;
  input: string;
  buttonSecondary: string;
};

type ProfessionalSummaryItem =
  | {
      label: string;
      value: string;
    }
  | {
      label: string;
      values: string[];
    };

type PreferenceSummaryItem =
  | {
      label: string;
      value: string;
    }
  | {
      label: string;
      values: string[];
    };

type ProfessionalProfileSectionProps = {
  isDark: boolean;
  isEditing: boolean;
  profileUi: ProfileUi;
  roleOptions: string[];
  yearsOptions: Array<{ value: string; label: string }>;
  professionalProfile: CandidateProfessionalProfile;
  professionalSummaryItems: Array<ProfessionalSummaryItem | null>;
  showPreferredRolePicker: boolean;
  preferredRoleQuery: string;
  filteredPreferredRoleOptions: string[];
  onTogglePreferredRolePicker: () => void;
  onPreferredRoleQueryChange: (value: string) => void;
  onUpdateProfessionalProfile: (
    field: keyof CandidateProfessionalProfile,
    value: string | boolean | number | string[] | undefined,
  ) => void;
};

export function ProfessionalProfileSection({
  isDark,
  isEditing,
  profileUi,
  roleOptions,
  yearsOptions,
  professionalProfile,
  professionalSummaryItems,
  showPreferredRolePicker,
  preferredRoleQuery,
  filteredPreferredRoleOptions,
  onTogglePreferredRolePicker,
  onPreferredRoleQueryChange,
  onUpdateProfessionalProfile,
}: ProfessionalProfileSectionProps) {
  return (
    <section className={`${profileUi.sectionCard} p-4`}>
      <h3 className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>
        Perfil profesional
      </h3>
      {isEditing ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className={`${profileUi.sectionCard} space-y-3 px-4 py-4`}>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cargo actual</span>
              <ClearableSelect
                value={professionalProfile.currentJobTitle ?? ""}
                options={roleOptions.map((option) => ({ value: option, label: option }))}
                placeholder="Selecciona un rol"
                onChange={(value) => onUpdateProfessionalProfile("currentJobTitle", value)}
                onClear={() => onUpdateProfessionalProfile("currentJobTitle", undefined)}
                className="mt-2"
                selectClassName={profileUi.input}
                buttonClassName={isDark ? "absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-500/16 hover:text-red-200" : "absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-red-100 hover:text-red-600"}
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Años de experiencia</span>
              <ClearableSelect
                value={
                  typeof professionalProfile.yearsExperienceTotal === "number"
                    ? String(Math.min(10, Math.max(1, professionalProfile.yearsExperienceTotal)))
                    : ""
                }
                options={yearsOptions}
                placeholder="Selecciona experiencia"
                onChange={(value) =>
                  onUpdateProfessionalProfile(
                    "yearsExperienceTotal",
                    value ? Number(value) : undefined,
                  )
                }
                onClear={() => onUpdateProfessionalProfile("yearsExperienceTotal", undefined)}
                className="mt-2"
                selectClassName={profileUi.input}
                buttonClassName={isDark ? "absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-500/16 hover:text-red-200" : "absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-red-100 hover:text-red-600"}
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nivel profesional</span>
              <ClearableSelect
                value={professionalProfile.seniorityLevel ?? ""}
                options={SENIORITY_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                placeholder="Selecciona un nivel"
                onChange={(value) => onUpdateProfessionalProfile("seniorityLevel", value)}
                onClear={() => onUpdateProfessionalProfile("seniorityLevel", undefined)}
                className="mt-2"
                selectClassName={profileUi.input}
                buttonClassName={isDark ? "absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-500/16 hover:text-red-200" : "absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-red-100 hover:text-red-600"}
              />
            </label>
          </div>

          <div className={`${profileUi.sectionCard} space-y-3 px-4 py-4`}>
            <label className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-white/60 px-4 py-3">
              <input
                type="checkbox"
                checked={professionalProfile.availabilityStatus === "available_now"}
                onChange={(event) =>
                  onUpdateProfessionalProfile(
                    "availabilityStatus",
                    event.target.checked ? "available_now" : undefined,
                  )
                }
              />
              <span className="text-sm font-medium text-slate-700">¿Tienes disponibilidad?</span>
            </label>

            <div className="block">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">¿A qué roles apuntas?</span>
                {(professionalProfile.preferredRoleTitles?.length ?? 0) < 6 ? (
                  <button
                    type="button"
                    onClick={onTogglePreferredRolePicker}
                    className={isDark ? "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/18 bg-white/6 text-lg font-semibold text-cyan-100 transition hover:bg-white/12" : "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-white text-lg font-semibold text-sky-700 transition hover:bg-sky-50"}
                    aria-label="Agregar rol de interés"
                  >
                    +
                  </button>
                ) : null}
              </div>
              <div
                className={`grid transition-all duration-200 ease-out ${
                  showPreferredRolePicker ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className={`${profileUi.sectionCard} space-y-3 px-4 py-4`}>
                    <input
                      type="text"
                      value={preferredRoleQuery}
                      onChange={(event) => onPreferredRoleQueryChange(event.target.value)}
                      className={profileUi.input}
                      placeholder="Busca un rol"
                    />
                    <div className="grid gap-2">
                      {filteredPreferredRoleOptions.map((option) => (
                        <button
                          key={`preferred-role-${option}`}
                          type="button"
                          onClick={() => {
                            const nextRoles = Array.from(
                              new Set([...(professionalProfile.preferredRoleTitles ?? []), option]),
                            ).slice(0, 6);
                            onUpdateProfessionalProfile("preferredRoleTitles", nextRoles);
                            onPreferredRoleQueryChange("");
                            onTogglePreferredRolePicker();
                          }}
                          className={isDark ? "rounded-[1rem] border border-cyan-300/16 bg-white/6 px-3 py-2 text-left text-sm text-slate-100 transition hover:border-cyan-300/28 hover:bg-white/10" : "rounded-[1rem] border border-sky-100 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"}
                        >
                          {option}
                        </button>
                      ))}
                      {filteredPreferredRoleOptions.length === 0 ? (
                        <p className={isDark ? "text-sm text-slate-400" : "text-sm text-slate-500"}>
                          No hay roles disponibles
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(professionalProfile.preferredRoleTitles ?? []).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() =>
                    onUpdateProfessionalProfile(
                      "preferredRoleTitles",
                      (professionalProfile.preferredRoleTitles ?? []).filter((item) => item !== role),
                    )
                  }
                  className={isDark ? "inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-white/8 px-3 py-2 text-sm font-medium text-cyan-100" : "inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-2 text-sm font-medium text-sky-700"}
                >
                  {role}
                  <span className={isDark ? "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold transition hover:bg-red-500/16 hover:text-red-200" : "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold transition hover:bg-red-100 hover:text-red-600"}>x</span>
                </button>
              ))}
            </div>
            <p className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
              Máximo 6 roles
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {professionalSummaryItems.map((item) =>
            item ? (
              "values" in item ? (
                <ReadOnlyChipList key={item.label} label={item.label} values={item.values ?? []} isDark={isDark} />
              ) : (
                <ReadOnlyDetail key={item.label} label={item.label} value={item.value} isDark={isDark} />
              )
            ) : null,
          )}
        </div>
      )}
    </section>
  );
}

type PreferencesSectionProps = {
  isDark: boolean;
  isEditing: boolean;
  profileUi: ProfileUi;
  locationDepartments: string[];
  preferredCityOptions: string[];
  selectedPreferredDepartment: string;
  selectedPreferredCity: string;
  preferenceSummaryItems: Array<PreferenceSummaryItem | null>;
  workPreferences: CandidateWorkPreferences;
  onSelectedPreferredDepartmentChange: (value: string) => void;
  onSelectedPreferredCityChange: (value: string) => void;
  onAddPreferredLocation: () => void;
  onUpdateWorkPreferences: (
    field: keyof CandidateWorkPreferences,
    value: string | boolean | number | string[],
  ) => void;
};

export function PreferencesSection({
  isDark,
  isEditing,
  profileUi,
  locationDepartments,
  preferredCityOptions,
  selectedPreferredDepartment,
  selectedPreferredCity,
  preferenceSummaryItems,
  workPreferences,
  onSelectedPreferredDepartmentChange,
  onSelectedPreferredCityChange,
  onAddPreferredLocation,
  onUpdateWorkPreferences,
}: PreferencesSectionProps) {
  return (
    <section className={`${profileUi.sectionCard} p-5 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className={isDark ? "text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-200/80" : "text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-sky-700"}>
            Preferencias de movilidad
          </p>
          <h3 className={`mt-2 font-display text-lg font-bold tracking-[0.01em] ${isDark ? "text-white" : "text-slate-950"}`}>
            Ubicaciones preferidas y disponibilidad
          </h3>
          <p className={isDark ? "mt-2 text-sm text-slate-300" : "mt-2 text-sm text-slate-600"}>
            Define dónde quieres trabajar y desde cuándo, con el mismo lenguaje visual del resto de la plataforma.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
            isDark
              ? "border border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
              : "border border-sky-200 bg-white/90 text-sky-700"
          }`}
        >
          <Route className="h-3.5 w-3.5" />
          Máximo 8
        </div>
      </div>
      {isEditing ? (
        <div className="mt-5 grid gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_auto] lg:items-end">
            <label className="block">
              <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Departamento</span>
              <select
                value={selectedPreferredDepartment}
                onChange={(event) => onSelectedPreferredDepartmentChange(event.target.value)}
                className={`mt-2 ${profileUi.input} py-2.5`}
              >
                <option value="">Selecciona una opción</option>
                {locationDepartments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Ciudad</span>
              <select
                value={selectedPreferredCity}
                onChange={(event) => onSelectedPreferredCityChange(event.target.value)}
                className={`mt-2 ${profileUi.input} py-2.5`}
                disabled={!selectedPreferredDepartment}
              >
                <option value="">Selecciona una opción</option>
                {preferredCityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end lg:justify-end">
              <button
                type="button"
                onClick={onAddPreferredLocation}
                className={`${profileUi.buttonSecondary} h-[46px] w-full gap-2 px-4 py-2 lg:min-w-[172px] lg:w-auto`}
                disabled={!selectedPreferredDepartment || !selectedPreferredCity || (workPreferences.preferredLocations?.length ?? 0) >= 8}
              >
                <MapPinPlus className="h-4 w-4" />
                Agregar ubicación
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(workPreferences.preferredLocations ?? []).map((location) => (
              <button
                key={location}
                type="button"
                onClick={() =>
                  onUpdateWorkPreferences(
                    "preferredLocations",
                    (workPreferences.preferredLocations ?? []).filter((item) => item !== location),
                  )
                }
                className={isDark ? "inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(71,214,255,0.12),rgba(255,255,255,0.04))] px-3 py-2 text-sm font-medium text-cyan-50 shadow-[0_12px_24px_rgba(0,0,0,0.16)]" : "inline-flex items-center gap-2 rounded-full border border-sky-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,249,255,0.94))] px-3 py-2 text-sm font-medium text-sky-700 shadow-[0_10px_22px_rgba(59,130,246,0.08)]"}
              >
                {location}
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${isDark ? "bg-white/10 text-cyan-100" : "bg-sky-100 text-sky-700"}`}>x</span>
              </button>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className={`${profileUi.sectionCard} block px-4 py-4`}>
              <span className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <CalendarClock className="h-3.5 w-3.5" />
                Fecha de disponibilidad
              </span>
              <input
                type="date"
                value={workPreferences.availabilityDate ?? ""}
                onChange={(event) => onUpdateWorkPreferences("availabilityDate", event.target.value)}
                className={`mt-3 ${profileUi.input}`}
              />
            </label>
            <label className={`${profileUi.sectionCard} flex items-center gap-3 px-4 py-4`}>
              <input
                type="checkbox"
                checked={Boolean(workPreferences.willingToRelocate)}
                onChange={(event) => onUpdateWorkPreferences("willingToRelocate", event.target.checked)}
              />
              <span className={isDark ? "text-sm font-medium text-slate-100" : "text-sm font-medium text-slate-700"}>
                Estoy dispuesto(a) a reubicarme
              </span>
            </label>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {preferenceSummaryItems.map((item) =>
            item ? (
              "values" in item ? (
                <div key={item.label} className="md:col-span-2">
                  <ReadOnlyChipList label={item.label} values={item.values ?? []} isDark={isDark} />
                </div>
              ) : (
                <ReadOnlyDetail key={item.label} label={item.label} value={item.value} isDark={isDark} />
              )
            ) : null,
          )}
        </div>
      )}
    </section>
  );
}
