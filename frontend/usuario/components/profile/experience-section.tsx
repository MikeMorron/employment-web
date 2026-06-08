import { useState } from "react";
import {
  EMPTY_EXPERIENCE_ITEM,
  ExperienceEditorCard,
  type ExperienceItem,
} from "@/components/profile/experience-editor";
import { EditCardToggleButton } from "@/components/profile/edit-card-toggle-button";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreGainBadge } from "@/components/ui/score-gain-badge";
import {
  composeExperienceTime,
  isCompleteMonthValue,
} from "@/lib/profile-form";
import { getProfileUi } from "@/lib/ui/profile-classes";

type ExperienceSectionProps = {
  experience: ExperienceItem[];
  isDark: boolean;
  isEditing: boolean;
  isCollapsed?: boolean;
  rewardPoints?: number;
  hasError?: boolean;
  errorMessage?: string;
  errorSignal?: number;
  fieldErrors?: Record<number, Partial<Record<"rol" | "empresa" | "fechaInicio" | "fechaFin", string>>>;
  onToggleCollapse?: () => void;
  onChange: (index: number, field: keyof ExperienceItem, value: string | boolean | number | string[]) => void;
  onAdd: (value: ExperienceItem) => void;
  onRemove: (index: number) => void;
};

export function ExperienceSection({
  experience,
  isDark,
  isEditing,
  isCollapsed = false,
  rewardPoints = 0,
  hasError = false,
  errorMessage,
  errorSignal = 0,
  fieldErrors = {},
  onToggleCollapse,
  onChange,
  onAdd,
  onRemove,
}: ExperienceSectionProps) {
  const profileUi = getProfileUi(isDark);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [newExperienceErrors, setNewExperienceErrors] = useState<
    Partial<Record<"rol" | "empresa" | "fechaInicio" | "fechaFin", string>>
  >({});
  const [newExperienceErrorSignal, setNewExperienceErrorSignal] = useState(0);
  const [newExperience, setNewExperience] = useState<ExperienceItem>({
    ...EMPTY_EXPERIENCE_ITEM,
  });

  const updateNewExperienceField = (field: keyof ExperienceItem, value: string | boolean | number | string[]) => {
    if (field === "rol" || field === "empresa" || field === "fechaInicio" || field === "fechaFin") {
      setNewExperienceErrors((current) => ({ ...current, [field]: undefined }));
    }

    setNewExperience((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validateExperienceItem = (item: ExperienceItem) => {
    const errors: Partial<Record<"rol" | "empresa" | "fechaInicio" | "fechaFin", string>> = {};
    const hasAnyValue =
      Boolean(item.rol.trim()) ||
      Boolean(item.empresa.trim()) ||
      Boolean(item.empresaNit?.trim()) ||
      Boolean(item.opinion?.trim()) ||
      Boolean(item.actualidad) ||
      Boolean(item.fechaInicio?.trim()) ||
      Boolean(item.fechaFin?.trim());

    if (!hasAnyValue) {
      return errors;
    }

    if (!item.rol.trim()) {
      errors.rol = "Este campo es requerido.";
    }

    if (!item.empresa.trim()) {
      errors.empresa = "Este campo es requerido.";
    }

    if (!isCompleteMonthValue(item.fechaInicio)) {
      errors.fechaInicio = "Este campo es requerido.";
    }

    if (!item.actualidad && !isCompleteMonthValue(item.fechaFin)) {
      errors.fechaFin = "Este campo es requerido.";
    }

    return errors;
  };

  return (
    <GlassCard
      isDark={isDark}
      className={`${isEditing ? (isDark ? "border-cyan-300/28" : "border-sky-300") : ""} ${hasError ? "border-red-400/80" : ""} relative p-6`}
      data-profile-focus="experience-section"
      style={hasError ? { animation: `profile-shake 340ms ease-in-out ${errorSignal}ms 1` } : undefined}
    >
      <ScoreGainBadge isDark={isDark} points={rewardPoints} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={isDark ? "text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200" : "text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700"}>
            Experiencia
          </p>
          <h2 className={`mt-1 text-lg font-semibold ${isDark ? "text-white" : "text-slate-950"}`}>Experiencia profesional</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEditing ? (
            <button
              type="button"
              onClick={() => setIsAddingExperience(true)}
              className={`${profileUi.buttonPrimary} px-4 py-2`}
              data-profile-focus="experience-add-button"
            >
              Agregar experiencia
            </button>
          ) : null}
          {isEditing && onToggleCollapse ? (
            <EditCardToggleButton isCollapsed={isCollapsed} isDark={isDark} onClick={onToggleCollapse} />
          ) : null}
        </div>
      </div>
      {hasError && errorMessage ? (
        <p className="mt-3 text-sm font-medium text-red-500">{errorMessage}</p>
      ) : null}
      {isEditing && isCollapsed ? null : (
        <div className="mt-4 space-y-3">
          {isEditing && isAddingExperience ? (
            <article className={`${profileUi.sectionCard} px-4 py-4`}>
              <ExperienceEditorCard
                item={newExperience}
                isDark={isDark}
                showRemove={false}
                errorSignal={newExperienceErrorSignal}
                fieldErrors={newExperienceErrors}
                onFieldChange={updateNewExperienceField}
              />
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingExperience(false);
                    setNewExperienceErrors({});
                    setNewExperience({ ...EMPTY_EXPERIENCE_ITEM });
                  }}
                  className={`${profileUi.buttonSecondary} px-4 py-2`}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const errors = validateExperienceItem(newExperience);

                    if (Object.keys(errors).length > 0) {
                      setNewExperienceErrors(errors);
                      setNewExperienceErrorSignal((current) => current + 1);
                      return;
                    }

                    onAdd({
                      ...newExperience,
                      tiempo: composeExperienceTime(
                        newExperience.fechaInicio,
                        newExperience.fechaFin,
                        newExperience.actualidad,
                      ),
                    });
                    setIsAddingExperience(false);
                    setNewExperienceErrors({});
                    setNewExperience({ ...EMPTY_EXPERIENCE_ITEM });
                  }}
                  className={`${profileUi.buttonPrimary} px-4 py-2`}
                >
                  Agregar
                </button>
              </div>
            </article>
          ) : null}
          {experience.map((item, index) => (
            <article key={index} className={`${profileUi.sectionCard} px-4 py-4`}>
              {isEditing ? (
                <ExperienceEditorCard
                  item={item}
                  isDark={isDark}
                  errorSignal={errorSignal}
                  fieldErrors={fieldErrors[index]}
                  onRemove={() => onRemove(index)}
                  onFieldChange={(field, value) => onChange(index, field, value)}
                />
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{item.rol}</h3>
                    <p className={`mt-1 text-sm ${isDark ? "text-cyan-200" : "text-sky-700"}`}>{item.empresa}</p>
                    {item.empresaNit ? (
                      <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>NIT {item.empresaNit}</p>
                    ) : null}
                    {item.opinion ? (
                      <p className={`mt-3 text-sm leading-7 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item.opinion}</p>
                    ) : null}
                    {item.description ? (
                      <p className={`mt-2 text-sm leading-7 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item.description}</p>
                    ) : null}
                  </div>
                  <span className={isDark ? "rounded-full border border-cyan-300/16 bg-white/6 px-3 py-1 text-xs font-medium text-slate-300" : "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"}>
                    {item.tiempo}
                  </span>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
