import { Camera, ImageUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreGainBadge } from "@/components/ui/score-gain-badge";
import { getProfileUi } from "@/lib/ui/profile-classes";
import type { User } from "@/types/user";

type ProfileHeaderProps = {
  user: User;
  isDark: boolean;
  canEdit?: boolean;
  completionScore: number;
  lastUpdatedAt: string;
  visibleForCompanies: boolean;
  companyViews: number;
  topPercentLabel: string;
  liveMatchDelta: number;
  missingCoreFields: string[];
  rewardPoints?: number;
  isEditing: boolean;
  avatarError?: string | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onFieldChange: (field: keyof User, value: string) => void;
  onAvatarUploaded: (avatarUrl: string) => void;
  onAvatarRemoved: () => void;
};

function textFieldClassName(isDark: boolean, value?: string) {
  const stateClass = value?.trim()
    ? isDark
      ? "border-emerald-300/24"
      : "border-emerald-300"
    : isDark
      ? "border-amber-300/28"
      : "border-amber-300";

  return `mt-1 ${getProfileUi(isDark).input} ${stateClass}`;
}

function sanitizeNameInput(value: string) {
  return value
    .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 25);
}

export function ProfileHeader({
  user,
  isDark,
  canEdit = true,
  completionScore,
  lastUpdatedAt,
  visibleForCompanies,
  companyViews,
  topPercentLabel,
  rewardPoints = 0,
  isEditing,
  avatarError,
  onEdit,
  onSave,
  onCancel,
  onFieldChange,
  onAvatarUploaded,
  onAvatarRemoved,
}: ProfileHeaderProps) {
  const profileUi = getProfileUi(isDark);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const avatarToastTimeoutRef = useRef<number | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [avatarToast, setAvatarToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const avatarUrl = user.avatar?.trim() || null;

  useEffect(() => {
    return () => {
      if (avatarToastTimeoutRef.current) {
        window.clearTimeout(avatarToastTimeoutRef.current);
      }
    };
  }, []);

  const showAvatarToast = (type: "success" | "error", message: string) => {
    if (avatarToastTimeoutRef.current) {
      window.clearTimeout(avatarToastTimeoutRef.current);
    }

    setAvatarToast({ type, message });
    avatarToastTimeoutRef.current = window.setTimeout(() => {
      setAvatarToast(null);
    }, 2600);
  };

  const uploadAvatar = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    const isPng = file.type === "image/png" && lowerName.endsWith(".png");
    const isJpg =
      file.type === "image/jpeg" &&
      (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg"));
    const originalBaseName = file.name.replace(/\.(png|jpe?g)$/i, "");

    if (!isPng && !isJpg) {
      throw new Error("Solo se aceptan archivos PNG o JPG");
    }

    if (originalBaseName.length > 20) {
      throw new Error("El nombre de la foto debe tener maximo 20 caracteres");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", user.id);

    const response = await fetch("/api/avatar-upload", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as {
      ok: boolean;
      message: string;
      avatarUrl?: string;
    };

    if (!response.ok || !payload.ok || !payload.avatarUrl) {
      throw new Error(payload.message || "No se pudo actualizar la foto");
    }

    onAvatarUploaded(payload.avatarUrl);
  };

  const removeAvatar = async () => {
    if (!user.avatar?.trim()) {
      onAvatarRemoved();
      return;
    }

    const response = await fetch(
      "/api/avatar-file",
      {
        method: "DELETE",
      },
    );

    const payload = (await response.json().catch(() => ({ ok: false }))) as {
      ok?: boolean;
    };

    if (!response.ok || !payload.ok) {
      throw new Error("No se pudo borrar la foto");
    }

    onAvatarRemoved();
  };

  return (
    <GlassCard isDark={isDark} className={`${isEditing ? (isDark ? "border-cyan-300/28" : "border-sky-300") : ""} relative p-6 sm:p-8`} data-profile-focus="header-section">
      <ScoreGainBadge isDark={isDark} points={rewardPoints} />
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-cyan-300/24 bg-[linear-gradient(145deg,#0b2b63,#0d63ff)] text-2xl font-semibold text-white shadow-[0_16px_36px_rgba(37,99,235,0.24)]">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={user.nombre}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Camera className="h-7 w-7" />
              )}
            </div>
            {isEditing && isUploadingAvatar ? (
              <>
                <span
                  className={`pointer-events-none absolute -inset-2 rounded-full border-[3px] animate-spin ${
                    isDark
                      ? "border-emerald-300/30 border-t-emerald-400 border-r-emerald-500 shadow-[0_0_26px_rgba(16,185,129,0.7)]"
                      : "border-sky-300/35 border-t-[#0d63ff] border-r-[#1d4ed8] shadow-[0_0_24px_rgba(13,99,255,0.65)]"
                  }`}
                />
                <span
                  className={`pointer-events-none absolute -inset-3 rounded-full ${
                    isDark
                      ? "bg-[radial-gradient(circle,rgba(16,185,129,0.3)_0%,rgba(16,185,129,0.12)_42%,transparent_72%)]"
                      : "bg-[radial-gradient(circle,rgba(13,99,255,0.28)_0%,rgba(13,99,255,0.1)_42%,transparent_72%)]"
                  }`}
                />
              </>
            ) : null}
            {isEditing ? (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = "";

                    if (!file) {
                      return;
                    }

                    setAvatarUploadError(null);
                    setIsUploadingAvatar(true);

                    try {
                      await uploadAvatar(file);
                      showAvatarToast("success", "Foto actualizada correctamente");
                    } catch (error) {
                      const message =
                        error instanceof Error ? error.message : "No se pudo actualizar la foto";
                      setAvatarUploadError(message);
                      showAvatarToast("error", message);
                    } finally {
                      setIsUploadingAvatar(false);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/38 text-white transition hover:bg-slate-950/46"
                  aria-label="Cambiar foto de perfil"
                >
                  <ImageUp className="h-6 w-6" />
                </button>
              </>
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="w-full max-w-2xl space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Nombres
                  </label>
                  <input
                    type="text"
                    value={user.nombre}
                    onChange={(event) => onFieldChange("nombre", sanitizeNameInput(event.target.value))}
                    maxLength={25}
                    className={textFieldClassName(isDark, user.nombre)}
                    data-profile-focus="nombre-input"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    value={user.rol}
                    onChange={(event) => onFieldChange("rol", sanitizeNameInput(event.target.value))}
                    maxLength={25}
                    className={textFieldClassName(isDark, user.rol)}
                    data-profile-focus="rol-input"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="min-w-0">
                  <h1 className={`break-words text-3xl font-semibold tracking-tight ${isDark ? "text-white" : "text-slate-950"}`}>
                    {user.nombre}
                  </h1>
                  <p className={`mt-1 text-base font-medium ${isDark ? "text-cyan-200" : "text-sky-700"}`}>{user.rol}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {canEdit && isEditing ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onSave}
              className={`${profileUi.buttonPrimary} px-5 py-3`}
            >
              Guardar cambios
            </button>
            <button
              type="button"
              onClick={onCancel}
              className={`${profileUi.buttonSecondary} px-5 py-3`}
            >
              Cancelar
            </button>
          </div>
        ) : canEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className={`${profileUi.buttonPrimary} px-5 py-3`}
          >
            Editar perfil
          </button>
        ) : null}
      </div>
      {canEdit && isEditing && (avatarUploadError || avatarError) ? (
        <p className="mt-4 text-sm font-medium text-red-500">
          {avatarUploadError || avatarError}
        </p>
      ) : null}

      {canEdit && isEditing ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={async () => {
              setAvatarUploadError(null);
              setIsUploadingAvatar(true);

              try {
                await removeAvatar();
                showAvatarToast("success", "Foto eliminada correctamente");
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : "No se pudo borrar la foto";
                setAvatarUploadError(message);
                showAvatarToast("error", message);
              } finally {
                setIsUploadingAvatar(false);
              }
            }}
            disabled={isUploadingAvatar || !user.avatar?.trim()}
            className={
              isDark
                ? "rounded-full border border-red-300/24 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-400/16 disabled:cursor-not-allowed disabled:opacity-45"
                : "rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45"
            }
          >
            Borrar foto
          </button>
        </div>
      ) : null}

      {!isEditing ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Última actualización", value: lastUpdatedAt },
            { label: "Nivel de completitud", value: `${completionScore}% completo` },
            {
              label: visibleForCompanies ? "Perfil visible para empresas" : "Perfil privado",
              value: visibleForCompanies ? `${companyViews} empresas lo han visto` : "Todavía no está visible",
            },
            { label: "Ranking", value: topPercentLabel },
          ].map((item) => (
            <div key={item.label} className={`${profileUi.sectionCard} px-4 py-3`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {item.label}
              </p>
              <p className={`mt-2 text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {avatarToast ? (
        <div className="pointer-events-none fixed right-5 top-5 z-[120]">
          <div
            className={`pointer-events-auto rounded-[1.2rem] border bg-white px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.18)] ${
              avatarToast.type === "success"
                ? "border-emerald-500 text-emerald-700"
                : "border-red-500 text-red-700"
            }`}
          >
            <p className="text-sm font-semibold">{avatarToast.message}</p>
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}
