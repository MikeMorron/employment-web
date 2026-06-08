import { useMemo, useState } from "react";
import Image from "next/image";
import { EditCardToggleButton } from "@/components/profile/edit-card-toggle-button";
import { LanguageChip } from "@/components/profile/language-chip";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreGainBadge } from "@/components/ui/score-gain-badge";
import {
  COLOMBIA_LANGUAGE_OPTIONS,
  createLanguageProficiency,
  getLanguageDefinition,
  isValidColombiaPhone,
  isValidWebsite,
  normalizeWebsiteInput,
  normalizeLanguageProficiencies,
  sanitizePhoneDigits,
} from "@/lib/profile-form";
import { getProfileUi } from "@/lib/ui/profile-classes";
import type { User } from "@/types/user";
import type { CandidateProfessionalProfile, LanguageProficiency } from "@/types/profile";
import { getLanguageFlagIconSrc } from "@/data/derived/language-flags";

type UserInfoProps = {
  user: User;
  isDark: boolean;
  isEditing: boolean;
  isCollapsed?: boolean;
  rewardPoints?: number;
  phoneRequiredError?: string | null;
  phoneErrorSignal?: number;
  onToggleCollapse?: () => void;
  onFieldChange: (field: keyof User, value: string) => void;
  onProfessionalProfileChange: (value: NonNullable<User["professionalProfile"]>) => void;
  onLanguagesChange: (value: LanguageProficiency[]) => void;
};

function InfoRow({
  label,
  value,
  isDark,
  href,
}: {
  label: string;
  value?: string;
  isDark: boolean;
  href?: string;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className={`${getProfileUi(isDark).sectionCard} px-4 py-3`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-2 block break-all text-sm font-medium ${isDark ? "text-cyan-200" : "text-sky-700"}`}
        >
          {value}
        </a>
      ) : (
        <p className={`mt-2 break-words text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}>{value}</p>
      )}
    </div>
  );
}

function fieldCardClassName(isDark: boolean) {
  return `${getProfileUi(isDark).sectionCard} px-4 py-3`;
}

export function UserInfo({
  user,
  isDark,
  isEditing,
  isCollapsed = false,
  rewardPoints = 0,
  phoneRequiredError = null,
  phoneErrorSignal = 0,
  onToggleCollapse,
  onFieldChange,
  onProfessionalProfileChange,
  onLanguagesChange,
}: UserInfoProps) {
  const profileUi = getProfileUi(isDark);
  const [languageQuery, setLanguageQuery] = useState("");
  const [pendingLanguageName, setPendingLanguageName] = useState("");
  const selectedLanguages = useMemo(() => normalizeLanguageProficiencies(user.idiomas), [user.idiomas]);
  const phoneValue = sanitizePhoneDigits(user.telefono ?? "");
  const phoneIsValid = !phoneValue || isValidColombiaPhone(phoneValue);
  const websiteValue = normalizeWebsiteInput(user.website ?? "");
  const websiteIsValid = !websiteValue || isValidWebsite(websiteValue);
  const socialLinks = user.professionalProfile?.socialLinks ?? {};

  const updateSocialLink = (
    key: keyof NonNullable<CandidateProfessionalProfile["socialLinks"]>,
    value: string,
  ) => {
    onProfessionalProfileChange({
      ...(user.professionalProfile ?? {}),
      socialLinks: {
        ...(user.professionalProfile?.socialLinks ?? {}),
        [key]: normalizeWebsiteInput(value),
      },
    });
  };

  const filteredLanguages = useMemo(() => {
    const normalizedQuery = languageQuery
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    const availableLanguages = COLOMBIA_LANGUAGE_OPTIONS.filter((language) => {
      const normalizedLanguage = language
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

      return (
        !selectedLanguages.some((item) => item.name === language) &&
        (!normalizedQuery || normalizedLanguage.includes(normalizedQuery))
      );
    });

    if (!normalizedQuery) {
      return availableLanguages.slice(0, 4);
    }

    return availableLanguages.slice(0, 8);
  }, [languageQuery, selectedLanguages]);
  const pendingLanguageDefinition = pendingLanguageName ? getLanguageDefinition(pendingLanguageName) : null;

  return (
    <GlassCard isDark={isDark} className="relative p-6" data-profile-focus="info-section">
      <ScoreGainBadge isDark={isDark} points={rewardPoints} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-950"}`}>Información</h2>
        {isEditing && onToggleCollapse ? (
          <EditCardToggleButton isCollapsed={isCollapsed} isDark={isDark} onClick={onToggleCollapse} />
        ) : null}
      </div>
      {isEditing && isCollapsed ? null : isEditing ? (
        <div className="mt-4 grid gap-3">
          <label className={fieldCardClassName(isDark)}>
            <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Teléfono
            </span>
            <div className="mt-2 flex items-center gap-2">
              <span className={isDark ? "inline-flex h-12 items-center rounded-[1rem] border border-cyan-300/16 bg-white/6 px-4 text-sm font-semibold text-cyan-100" : "inline-flex h-12 items-center rounded-[1rem] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"}>
                +57
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={phoneValue}
                onChange={(event) => onFieldChange("telefono", sanitizePhoneDigits(event.target.value))}
                className={`flex-1 ${profileUi.input} ${
                  phoneRequiredError ? "border-red-400 focus:border-red-500 focus:ring-red-500/30" : ""
                }`}
                placeholder="3001234567"
                data-profile-focus="telefono-input"
                style={
                  phoneRequiredError
                    ? { animation: `profile-shake 320ms ease-in-out ${phoneErrorSignal}ms 1` }
                    : undefined
                }
              />
            </div>
            {phoneRequiredError ? (
              <p className="mt-2 text-xs font-medium text-red-500">{phoneRequiredError}</p>
            ) : null}
            {!phoneIsValid && phoneValue.length > 0 ? (
              <p className="mt-2 text-xs font-medium text-red-500">
                Número inválido. Debe iniciar en 3 y tener 10 dígitos.
              </p>
            ) : null}
          </label>

          <label className={fieldCardClassName(isDark)}>
            <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Sitio web
            </span>
            <input
              type="text"
              value={websiteValue}
              onChange={(event) => onFieldChange("website", normalizeWebsiteInput(event.target.value))}
              className={`mt-2 ${profileUi.input}`}
              placeholder="https://tu-sitio.com"
              data-profile-focus="website-input"
            />
            {!websiteIsValid && websiteValue ? (
              <p className="mt-2 text-xs font-medium text-red-500">
                Solo se aceptan URLs seguras con https y sin rutas sospechosas.
              </p>
            ) : null}
          </label>

          <div className={fieldCardClassName(isDark)}>
            <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Enlaces profesionales
            </span>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-500" : "text-slate-500"}`}>X</span>
                <input
                  type="text"
                  value={socialLinks.x ?? ""}
                  onChange={(event) => updateSocialLink("x", event.target.value)}
                  className={`mt-2 ${profileUi.input}`}
                  placeholder="https://x.com/tuusuario"
                />
              </label>
              <label className="block">
                <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-500" : "text-slate-500"}`}>Facebook</span>
                <input
                  type="text"
                  value={socialLinks.facebook ?? ""}
                  onChange={(event) => updateSocialLink("facebook", event.target.value)}
                  className={`mt-2 ${profileUi.input}`}
                  placeholder="https://facebook.com/tuusuario"
                />
              </label>
              <label className="block">
                <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-500" : "text-slate-500"}`}>Instagram</span>
                <input
                  type="text"
                  value={socialLinks.instagram ?? ""}
                  onChange={(event) => updateSocialLink("instagram", event.target.value)}
                  className={`mt-2 ${profileUi.input}`}
                  placeholder="https://instagram.com/tuusuario"
                />
              </label>
              <label className="block">
                <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-500" : "text-slate-500"}`}>Telegram</span>
                <input
                  type="text"
                  value={socialLinks.telegram ?? ""}
                  onChange={(event) => updateSocialLink("telegram", event.target.value)}
                  className={`mt-2 ${profileUi.input}`}
                  placeholder="https://t.me/tuusuario"
                />
              </label>
              <label className="block">
                <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-500" : "text-slate-500"}`}>LinkedIn</span>
                <input
                  type="text"
                  value={socialLinks.linkedin ?? ""}
                  onChange={(event) => updateSocialLink("linkedin", event.target.value)}
                  className={`mt-2 ${profileUi.input}`}
                  placeholder="https://linkedin.com/in/tuusuario"
                />
              </label>
              <label className="block">
                <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-500" : "text-slate-500"}`}>GitHub</span>
                <input
                  type="text"
                  value={socialLinks.github ?? ""}
                  onChange={(event) => updateSocialLink("github", event.target.value)}
                  className={`mt-2 ${profileUi.input}`}
                  placeholder="https://github.com/tuusuario"
                />
              </label>
            </div>
          </div>

          <div className={fieldCardClassName(isDark)}>
            <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Idiomas
            </span>
            <input
              type="text"
              value={languageQuery}
              onChange={(event) => setLanguageQuery(event.target.value)}
              className={`mt-2 ${profileUi.input}`}
              placeholder="Busca un idioma"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedLanguages.map((language) => (
                <LanguageChip
                  key={`${language.name}-${language.level}`}
                  name={language.name}
                  level={language.level}
                  isDark={isDark}
                  removable
                  onRemove={() => onLanguagesChange(selectedLanguages.filter((item) => item.name !== language.name))}
                />
              ))}
            </div>
            {selectedLanguages.length > 0 ? (
              <div className="mt-3 grid gap-3">
                {selectedLanguages.map((language) => {
                  const languageDefinition = getLanguageDefinition(language.name);
                  return (
                    <div key={`${language.name}-structured`} className="rounded-[1rem] border border-slate-200 bg-white/60 p-4">
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem] md:items-center">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{language.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{language.languageCode ?? ""}</p>
                        </div>
                        <select
                          value={language.level}
                          onChange={(event) =>
                            onLanguagesChange(
                              selectedLanguages.map((item) =>
                                item.name === language.name
                                  ? {
                                      ...item,
                                      level: event.target.value,
                                      isNative: event.target.value === "Nativo",
                                    }
                                  : item,
                              ),
                            )
                          }
                          className={`mt-0 ${profileUi.input}`}
                        >
                          {languageDefinition.levels.map((level) => (
                            <option key={`${language.name}-${level}`} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <div className="mt-3 grid gap-2">
              {filteredLanguages.map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => {
                    setPendingLanguageName(language);
                    setLanguageQuery("");
                  }}
                  className={isDark ? "flex items-center gap-2 rounded-[1rem] border border-cyan-300/16 bg-white/6 px-3 py-2 text-left text-sm text-slate-100 transition hover:border-red-300/28 hover:bg-red-500/10 hover:text-red-100" : "flex items-center gap-2 rounded-[1rem] border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"}
                >
                  <Image
                    src={getLanguageFlagIconSrc(language)}
                    alt={`Bandera ${language}`}
                    width={20}
                    height={16}
                    unoptimized
                    className="h-4 w-5 rounded-[0.28rem] object-cover shadow-[0_0_0_1px_rgba(148,163,184,0.22)]"
                  />
                  {language}
                </button>
              ))}
            </div>
            {pendingLanguageDefinition ? (
              <div className="mt-3 rounded-[1rem] border border-cyan-300/16 bg-white/6 px-4 py-3">
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Nivel {pendingLanguageDefinition.name} · {pendingLanguageDefinition.levelSystem}
                </p>
                <select
                  value=""
                  onChange={(event) => {
                    const nextLevel = event.target.value;
                    if (!nextLevel) {
                      return;
                    }

                    onLanguagesChange([
                      ...selectedLanguages.filter((item) => item.name !== pendingLanguageDefinition.name),
                      createLanguageProficiency(pendingLanguageDefinition.name, nextLevel),
                    ]);
                    setPendingLanguageName("");
                  }}
                  className={`mt-2 ${profileUi.input}`}
                >
                  <option value="">Selecciona nivel</option>
                  {pendingLanguageDefinition.levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          <InfoRow label="Teléfono" value={phoneValue ? `+57 ${phoneValue}` : undefined} isDark={isDark} />
          <InfoRow
            label="Sitio web"
            value={websiteIsValid ? websiteValue : undefined}
            href={websiteIsValid ? websiteValue : undefined}
            isDark={isDark}
          />
          {selectedLanguages.length > 0 ? (
            <div className={fieldCardClassName(isDark)}>
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Idiomas</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedLanguages.map((language) => (
                  <LanguageChip
                    key={`${language.name}-${language.level}`}
                    name={language.name}
                    level={language.level}
                    isDark={isDark}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </GlassCard>
  );
}
