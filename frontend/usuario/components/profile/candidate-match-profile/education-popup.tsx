"use client";

import { CAREERS_CATALOG } from "@/data/careers-catalog";
import { SKILLS_CATALOG } from "@/data/skills-catalog";
import { PopupShell } from "@/components/profile/candidate-match-profile/shared";
import { EDUCATION_LEVEL_OPTIONS } from "@/components/profile/candidate-match-profile/constants";
import { popupFieldClassName } from "@/components/profile/candidate-match-profile/utils";
import type { EducationPopupProps } from "@/components/profile/candidate-match-profile/popup-types";

export function EducationPopup({
  isDark,
  profileUi,
  showEducationPopup,
  educationDraft,
  educationErrors,
  educationCareerQuery,
  educationFocusAreaQuery,
  showCareerOptions,
  showFocusAreaOptions,
  locationDepartments,
  educationCityOptions,
  careerDropdownRef,
  focusAreaDropdownRef,
  onCancel,
  onConfirm,
  onEducationDraftChange,
  onEducationErrorsChange,
  onEducationCareerQueryChange,
  onEducationFocusAreaQueryChange,
  onShowCareerOptionsChange,
  onShowFocusAreaOptionsChange,
}: EducationPopupProps) {
  if (!showEducationPopup) {
    return null;
  }

  const normalizedEducationCareerQuery = educationCareerQuery
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const filteredCareerOptions = CAREERS_CATALOG
    .filter((career) =>
      normalizedEducationCareerQuery
        ? career
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .includes(normalizedEducationCareerQuery)
        : true,
    )
    .slice(0, normalizedEducationCareerQuery ? 8 : 6);
  const normalizedEducationFocusAreaQuery = educationFocusAreaQuery
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const filteredFocusAreaOptions = SKILLS_CATALOG
    .filter((skill) => !educationDraft.focusAreas.includes(skill))
    .filter((skill) =>
      normalizedEducationFocusAreaQuery
        ? skill
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .includes(normalizedEducationFocusAreaQuery)
        : true,
    )
    .slice(0, normalizedEducationFocusAreaQuery ? 8 : 6);

  return (
    <PopupShell title="Agregar estudio" isDark={isDark} onCancel={onCancel} onConfirm={onConfirm} confirmLabel="Guardar">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nivel educativo</span>
          <select
            value={educationDraft.educationType}
            onChange={(event) => {
              onEducationErrorsChange((current) => ({ ...current, educationType: false }));
              onEducationDraftChange((current) => ({
                ...current,
                educationType: event.target.value as typeof educationDraft.educationType,
              }));
            }}
            className={popupFieldClassName(`mt-2 ${profileUi.input}`, Boolean(educationErrors.educationType))}
          >
            {EDUCATION_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nombre de la institución</span>
          <input
            type="text"
            value={educationDraft.institutionName}
            onChange={(event) => {
              onEducationErrorsChange((current) => ({ ...current, institutionName: false }));
              onEducationDraftChange((current) => ({ ...current, institutionName: event.target.value }));
            }}
            className={popupFieldClassName(`mt-2 ${profileUi.input}`, Boolean(educationErrors.institutionName))}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fecha de entrada</span>
          <input
            type="date"
            value={educationDraft.startDate}
            onChange={(event) => {
              onEducationErrorsChange((current) => ({ ...current, startDate: false }));
              onEducationDraftChange((current) => ({ ...current, startDate: event.target.value }));
            }}
            className={popupFieldClassName(`mt-2 ${profileUi.input}`, Boolean(educationErrors.startDate))}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fecha de grado</span>
          <input
            type="date"
            value={educationDraft.endDate}
            onChange={(event) => {
              onEducationErrorsChange((current) => ({ ...current, endDate: false }));
              onEducationDraftChange((current) => ({ ...current, endDate: event.target.value }));
            }}
            className={popupFieldClassName(`mt-2 ${profileUi.input}`, Boolean(educationErrors.endDate))}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Departamento</span>
          <select
            value={educationDraft.region}
            onChange={(event) => {
              onEducationErrorsChange((current) => ({ ...current, region: false, city: false }));
              onEducationDraftChange((current) => ({ ...current, region: event.target.value, city: "" }));
            }}
            className={popupFieldClassName(`mt-2 ${profileUi.input}`, Boolean(educationErrors.region))}
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
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ciudad</span>
          <select
            value={educationDraft.city}
            onChange={(event) => {
              onEducationErrorsChange((current) => ({ ...current, city: false }));
              onEducationDraftChange((current) => ({ ...current, city: event.target.value }));
            }}
            className={popupFieldClassName(`mt-2 ${profileUi.input}`, Boolean(educationErrors.city))}
            disabled={!educationDraft.region}
          >
            <option value="">Selecciona una opción</option>
            {educationCityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>
        <label ref={careerDropdownRef} className="block md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Programa o área</span>
          <div className="relative mt-2">
            <input
              type="text"
              value={educationCareerQuery}
              onFocus={() => onShowCareerOptionsChange(true)}
              onChange={(event) => {
                const nextValue = event.target.value;
                onEducationCareerQueryChange(nextValue);
                onEducationDraftChange((current) => ({ ...current, degreeField: nextValue }));
                onShowCareerOptionsChange(true);
              }}
              className={profileUi.input}
              placeholder="Ej: Ingeniería de Sistemas, Medicina, Arquitectura"
            />
            {showCareerOptions ? (
              <div className={isDark ? "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-56 overflow-y-auto rounded-[1rem] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(7,16,31,0.98),rgba(8,17,32,0.94))] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.30)]" : "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-56 overflow-y-auto rounded-[1rem] border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(148,163,184,0.18)]"}>
                <div className="grid gap-1.5">
                  {filteredCareerOptions.map((career) => (
                    <button
                      key={career}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        onEducationCareerQueryChange(career);
                        onEducationDraftChange((current) => ({ ...current, degreeField: career }));
                        onShowCareerOptionsChange(false);
                      }}
                      className={isDark ? "rounded-[0.9rem] border border-transparent bg-white/4 px-3 py-2 text-left text-sm text-slate-100 transition hover:border-cyan-300/24 hover:bg-white/10" : "rounded-[0.9rem] border border-transparent bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"}
                    >
                      {career}
                    </button>
                  ))}
                  {filteredCareerOptions.length === 0 ? (
                    <div className={isDark ? "rounded-[0.9rem] bg-white/4 px-3 py-2 text-sm text-slate-300" : "rounded-[0.9rem] bg-slate-50 px-3 py-2 text-sm text-slate-500"}>
                      No hay coincidencias.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </label>
        <label ref={focusAreaDropdownRef} className="block md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Subárea</span>
          <div className="relative mt-2">
            <input
              type="text"
              value={educationFocusAreaQuery}
              onFocus={() => onShowFocusAreaOptionsChange(true)}
              onChange={(event) => {
                onEducationFocusAreaQueryChange(event.target.value);
                onShowFocusAreaOptionsChange(true);
              }}
              className={profileUi.input}
              placeholder="Ej: Backend, Auditoría legal, Anatomía clínica"
            />
            {showFocusAreaOptions ? (
              <div className={isDark ? "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-56 overflow-y-auto rounded-[1rem] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(7,16,31,0.98),rgba(8,17,32,0.94))] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.30)]" : "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-56 overflow-y-auto rounded-[1rem] border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(148,163,184,0.18)]"}>
                <div className="grid gap-1.5">
                  {filteredFocusAreaOptions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        onEducationDraftChange((current) => ({
                          ...current,
                          focusAreas: [skill],
                        }));
                        onEducationFocusAreaQueryChange("");
                        onShowFocusAreaOptionsChange(false);
                      }}
                      className={isDark ? "rounded-[0.9rem] border border-transparent bg-white/4 px-3 py-2 text-left text-sm text-slate-100 transition hover:border-cyan-300/24 hover:bg-white/10" : "rounded-[0.9rem] border border-transparent bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"}
                    >
                      {skill}
                    </button>
                  ))}
                  {filteredFocusAreaOptions.length === 0 ? (
                    <div className={isDark ? "rounded-[0.9rem] bg-white/4 px-3 py-2 text-sm text-slate-300" : "rounded-[0.9rem] bg-slate-50 px-3 py-2 text-sm text-slate-500"}>
                      No hay coincidencias.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
          <p className={`mt-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Selecciona una sola subárea.
          </p>
          {educationDraft.focusAreas.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {educationDraft.focusAreas.map((focusArea) => (
                <button
                  key={focusArea}
                  type="button"
                  onClick={() =>
                    onEducationDraftChange((current) => ({
                      ...current,
                      focusAreas: current.focusAreas.filter((item) => item !== focusArea),
                    }))
                  }
                  className={isDark ? "inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-white/8 px-3 py-2 text-sm font-medium text-cyan-100" : "inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-2 text-sm font-medium text-sky-700"}
                >
                  {focusArea}
                  <span className="text-xs font-semibold">x</span>
                </button>
              ))}
            </div>
          ) : null}
        </label>
      </div>
    </PopupShell>
  );
}
