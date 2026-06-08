import { useEffect, useRef, useState } from "react";
import { EditCardToggleButton } from "@/components/profile/edit-card-toggle-button";
import {
  JobFitDeleteCvConfirm,
  JobFitUploadToast,
} from "@/components/profile/job-fit-feedback";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreGainBadge } from "@/components/ui/score-gain-badge";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  formatSalaryInputValue,
  sanitizeSalaryNumeric,
  WORK_MODALITY_OPTIONS,
} from "@/lib/profile-form";
import { getProfileUi } from "@/lib/ui/profile-classes";
import type { User } from "@/types/user";
import type { Vacancy } from "@/types/vacancy";

type JobFitSectionProps = {
  user: User;
  isDark: boolean;
  overallMatchScore: number;
  missingSkillsCount: number;
  optimizationGain: number;
  isEditing: boolean;
  isCollapsed?: boolean;
  cvRewardPoints?: number;
  referenceJob?: Vacancy | null;
  onToggleCollapse?: () => void;
  onFieldChange: (field: keyof User, value: string) => void;
  onCvUploaded: (value: { fileName: string; downloadUrl?: string }) => void;
  onCvRemoved: () => void;
};

export function JobFitSection({
  user,
  isDark,
  isEditing,
  isCollapsed = false,
  cvRewardPoints = 0,
  referenceJob,
  onToggleCollapse,
  onFieldChange,
  onCvUploaded,
  onCvRemoved,
}: JobFitSectionProps) {
  const profileUi = getProfileUi(isDark);
  const closeTimeoutRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [cvUploadProgress, setCvUploadProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [uploadToast, setUploadToast] = useState<{
    type: "success" | "error";
    message: string;
    progress: number;
  } | null>(null);
  const job = referenceJob;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);

      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }

      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const selectedWorkModality = user.modalidadTrabajo?.trim() || job?.modalidad || "Remoto";
  const editableMinimumSalary = sanitizeSalaryNumeric(user.expectativaSalarialMin ?? "");
  const editableMaximumSalary = sanitizeSalaryNumeric(user.expectativaSalarialMax ?? "");
  const minimumSalary = editableMinimumSalary || sanitizeSalaryNumeric(job?.salario ?? "");
  const maximumSalary = editableMaximumSalary || sanitizeSalaryNumeric(job?.salario ?? "");
  const selectedWorkday = user.jornada?.trim() || "Tiempo completo";

  const formattedEditableMinimumSalary = formatSalaryInputValue(editableMinimumSalary);
  const formattedEditableMaximumSalary = formatSalaryInputValue(editableMaximumSalary);
  const formattedMinimumSalary = formatSalaryInputValue(minimumSalary) || "Sin definir";
  const formattedMaximumSalary = formatSalaryInputValue(maximumSalary) || "Sin definir";
  const showUploadToast = (type: "success" | "error", message: string) => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
    }

    setUploadToast({ type, message, progress: 100 });

    const startedAt = Date.now();
    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.max(0, 100 - (elapsed / 3000) * 100);
      setUploadToast((current) => (current ? { ...current, progress: nextProgress } : null));
    }, 60);

    closeTimeoutRef.current = window.setTimeout(() => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }

      setUploadToast(null);
    }, 3000);
  };

  const closeUploadToast = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
    }

    setUploadToast(null);
  };

  const deleteCurrentCv = async () => {
    if (!user.cv?.trim()) {
      return;
    }

    try {
      const response = await fetch(
        "/api/cv-download",
        { method: "DELETE" },
      );

      if (!response.ok) {
        showUploadToast("error", "No se pudo eliminar el CV");
        return;
      }

      onCvRemoved();
      setShowDeleteConfirm(false);
      showUploadToast("success", "CV eliminado correctamente");
    } catch {
      showUploadToast("error", "No se pudo eliminar el CV");
    }
  };

  const uploadCvFile = (formData: FormData) =>
    new Promise<{
      ok: boolean;
      message: string;
      downloadFileName?: string;
      downloadUrl?: string;
    }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/cv-upload");

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }

        setCvUploadProgress(Math.round((event.loaded / event.total) * 100));
      };

      xhr.onload = () => {
        try {
          const payload = JSON.parse(xhr.responseText) as {
            ok: boolean;
            message: string;
            downloadFileName?: string;
            downloadUrl?: string;
          };

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(payload);
            return;
          }

          reject(payload);
        } catch {
          reject(new Error("upload_failed"));
        }
      };

      xhr.onerror = () => reject(new Error("upload_failed"));
      xhr.send(formData);
    });

  return (
    <GlassCard isDark={isDark} className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={isDark ? "text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200" : "text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700"}>
            Ajuste del perfil
          </p>
        </div>
        {isEditing && onToggleCollapse ? (
          <EditCardToggleButton isCollapsed={isCollapsed} isDark={isDark} onClick={onToggleCollapse} />
        ) : null}
      </div>
      {isEditing && isCollapsed ? null : (
      <div className="mt-4 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="min-w-0">
            <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${isDark ? "text-cyan-200" : "text-sky-700"}`}>
              Oferta original
            </p>
            <p className={`mt-2 break-words text-sm font-medium ${isDark ? "text-cyan-100" : "text-sky-800"}`}>
              {job?.empresa ?? "Marketplace"}
            </p>
            <h2 className={`mt-2 break-words text-2xl font-semibold tracking-tight ${isDark ? "text-white" : "text-slate-950"}`}>
              {job?.titulo ?? "Vacante de referencia"}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className={isDark ? "rounded-[1.1rem] border border-cyan-300/14 bg-white/4 px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.16)]" : "rounded-[1.1rem] border border-sky-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,250,252,0.90))] px-4 py-3 shadow-[0_12px_28px_rgba(148,163,184,0.08)]"}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Modalidad de trabajo
                </p>
                {isEditing ? (
                  <select
                    value={selectedWorkModality}
                    onChange={(event) => onFieldChange("modalidadTrabajo", event.target.value)}
                    className={`mt-2 ${profileUi.input}`}
                  >
                    {WORK_MODALITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className={`mt-2 text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                    {selectedWorkModality}
                  </p>
                )}
              </div>
              <div className={isDark ? "rounded-[1.1rem] border border-amber-300/30 bg-amber-400/10 px-4 py-3" : "rounded-[1.1rem] border border-amber-300 bg-amber-50 px-4 py-3"}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-amber-200" : "text-amber-700"}`}>
                  Expectativa minima
                </p>
                {isEditing ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formattedEditableMinimumSalary}
                    onChange={(event) =>
                      onFieldChange("expectativaSalarialMin", sanitizeSalaryNumeric(event.target.value))
                    }
                    className={`mt-2 ${profileUi.input}`}
                    placeholder="$4.000.000"
                  />
                ) : (
                  <p className={`mt-2 text-sm font-semibold ${isDark ? "text-amber-100" : "text-amber-900"}`}>
                    {formattedMinimumSalary}
                  </p>
                )}
              </div>
              <div className={isDark ? "rounded-[1.1rem] border border-amber-300/30 bg-amber-400/10 px-4 py-3" : "rounded-[1.1rem] border border-amber-300 bg-amber-50 px-4 py-3"}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-amber-200" : "text-amber-700"}`}>
                  Expectativa maxima
                </p>
                {isEditing ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formattedEditableMaximumSalary}
                    onChange={(event) =>
                      onFieldChange("expectativaSalarialMax", sanitizeSalaryNumeric(event.target.value))
                    }
                    className={`mt-2 ${profileUi.input}`}
                    placeholder="$9.000.000"
                  />
                ) : (
                  <p className={`mt-2 text-sm font-semibold ${isDark ? "text-amber-100" : "text-amber-900"}`}>
                    {formattedMaximumSalary}
                  </p>
                )}
              </div>
              <div className={isDark ? "rounded-[1.1rem] border border-cyan-300/14 bg-white/4 px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.16)]" : "rounded-[1.1rem] border border-sky-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,250,252,0.90))] px-4 py-3 shadow-[0_12px_28px_rgba(148,163,184,0.08)]"}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Jornada
                </p>
                {isEditing ? (
                  <select
                    value={selectedWorkday}
                    onChange={(event) => onFieldChange("jornada", event.target.value)}
                    className={`mt-2 ${profileUi.input}`}
                  >
                    {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className={`mt-2 text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                    {selectedWorkday}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-6">
            <section
              className={`${isDark ? "rounded-[1.5rem] border border-cyan-300/14 bg-white/4 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]" : "rounded-[1.5rem] border border-sky-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.90),rgba(246,250,252,0.88))] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.08)]"} relative`}
              data-profile-focus="cv-section"
            >
              <ScoreGainBadge isDark={isDark} points={cvRewardPoints} />
              <div className="space-y-4">
                <div className="min-w-0">
                  <h3 className={`text-sm font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    CV
                  </h3>
                  <p className={`mt-3 text-sm leading-7 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {user.cv?.trim()
                      ? `Archivo cargado: ${user.cv}`
                      : "Adjunta tu CV para completar el perfil y sumar los 15 puntos de esta sección."}
                  </p>
                  {isUploadingCv ? (
                    <div className="mt-4 w-full">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-cyan-200" : "text-sky-700"}`}>
                          Subiendo CV
                        </span>
                        <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-950"}`}>
                          {cvUploadProgress}%
                        </span>
                      </div>
                      <div className={isDark ? "mt-2 h-2.5 rounded-full bg-white/10" : "mt-2 h-2.5 rounded-full bg-slate-200"}>
                        <div
                          className={isDark ? "h-2.5 rounded-full bg-cyan-300 transition-[width] duration-150" : "h-2.5 rounded-full bg-sky-600 transition-[width] duration-150"}
                          style={{ width: `${cvUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative w-full">
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      disabled={isUploadingCv}
                      className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                      onChange={async (event) => {
                        const input = event.currentTarget;
                        const file = input.files?.[0];
                        if (!file) {
                          return;
                        }

                        const isPdf =
                          file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
                        const maxSizeInBytes = 5 * 1024 * 1024;

                        if (!isPdf || file.size > maxSizeInBytes) {
                          showUploadToast("error", "No se pudo adjuntar el CV");
                          input.value = "";
                          return;
                        }

                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("userId", user.id);
                        formData.append("fullName", user.nombre);
                        formData.append("role", user.rol);

                        setIsUploadingCv(true);
                        setCvUploadProgress(0);

                        try {
                          const payload = await uploadCvFile(formData);
                          onCvUploaded({
                            fileName: payload.downloadFileName ?? file.name,
                            downloadUrl: payload.downloadUrl,
                          });
                          setCvUploadProgress(100);
                          showUploadToast("success", "CV Adjuntada correctamente");
                        } catch {
                          showUploadToast("error", "No se pudo adjuntar el CV");
                        } finally {
                          window.setTimeout(() => {
                            setIsUploadingCv(false);
                            setCvUploadProgress(0);
                          }, 220);
                        }

                        input.value = "";
                      }}
                    />
                    <div
                      className={`${profileUi.buttonPrimary} ${isUploadingCv ? "cursor-not-allowed opacity-70" : ""} inline-flex w-full items-center justify-center px-5 py-3`}
                    >
                      {isUploadingCv ? "Subiendo..." : user.cv?.trim() ? "Actualizar CV" : "Subir CV"}
                    </div>
                  </div>
                  {user.cv?.trim() && user.cvDownloadUrl?.trim() ? (
                    <>
                      <a
                        href={user.cvDownloadUrl}
                        className="inline-flex w-full items-center justify-center rounded-[1rem] border border-emerald-500 bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:border-emerald-600 hover:bg-emerald-600"
                      >
                        Descargar CV
                      </a>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="inline-flex w-full items-center justify-center rounded-[1rem] border border-red-500 bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:border-red-600 hover:bg-red-600"
                      >
                        Borrar CV
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6" />
        </div>
      </div>
      )}
      <JobFitUploadToast uploadToast={uploadToast} onClose={closeUploadToast} />
      <JobFitDeleteCvConfirm
        isDark={isDark}
        isMounted={isMounted}
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={deleteCurrentCv}
      />
    </GlassCard>
  );
}
