"use client";

import Image from "next/image";
import type { ComponentType } from "react";
import {
  ArrowUpRight,
  Check,
  GraduationCap,
} from "lucide-react";
import { getLanguageFlagIconSrc } from "@/data/derived/language-flags";
import {
  formatDisplayDate,
  formatExperienceRange,
  getInitials,
} from "@/components/profile/candidate-profile-showcase-helpers";
import type { CandidateEducationRecord, ExperienceItem } from "@/types/profile";
import type { User } from "@/types/user";

type ActionButtonProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  target?: "_blank" | "_self";
  disabled?: boolean;
  isDark: boolean;
  onClick?: () => void;
};

type ContactItemProps = {
  label: string;
  value: string;
  href?: string;
  isDark: boolean;
};

type SocialIconButtonProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  href: string;
  isDark: boolean;
};

export function ActionButton({
  icon: Icon,
  label,
  href,
  target = "_self",
  disabled = false,
  isDark,
  onClick,
}: ActionButtonProps) {
  const className = `inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
    disabled
      ? isDark
        ? "cursor-not-allowed border border-white/8 bg-white/[0.04] text-slate-500"
        : "cursor-not-allowed border border-slate-200 bg-white/70 text-slate-400"
      : isDark
        ? "border border-cyan-300/18 bg-white/[0.06] text-slate-100 shadow-[0_18px_32px_rgba(0,0,0,0.20)] hover:-translate-y-0.5 hover:border-cyan-300/34 hover:bg-white/[0.1]"
        : "border border-sky-200/80 bg-white/85 text-slate-800 shadow-[0_16px_28px_rgba(148,163,184,0.14)] hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white"
  }`;

  if (href && !disabled) {
    return (
      <a href={href} target={target} rel={target === "_blank" ? "noreferrer" : undefined} className={className}>
        <Icon className="h-4 w-4" />
        {label}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export function AvatarGlow({ user, isDark }: { user: User; isDark: boolean }) {
  const avatarUrl = user.avatar?.trim();

  return (
    <div className="relative flex justify-center xl:justify-end">
      <div className={`absolute inset-4 rounded-full blur-3xl ${isDark ? "bg-cyan-400/30" : "bg-sky-300/50"}`} />
      <div
        className={`relative h-[14rem] w-[14rem] rounded-full p-[2px] ${
          isDark
            ? "bg-[linear-gradient(180deg,rgba(71,214,255,0.95),rgba(13,99,255,0.45),rgba(255,255,255,0.08))] shadow-[0_0_50px_rgba(71,214,255,0.24)]"
            : "bg-[linear-gradient(180deg,rgba(56,189,248,0.92),rgba(13,99,255,0.28),rgba(255,255,255,0.9))] shadow-[0_0_46px_rgba(56,189,248,0.22)]"
        }`}
      >
        <div
          className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full ${
            isDark
              ? "bg-[radial-gradient(circle_at_top,rgba(71,214,255,0.18),transparent_42%),linear-gradient(180deg,rgba(7,16,31,0.96),rgba(10,26,52,0.96))]"
              : "bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(231,242,255,0.98))]"
          }`}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={user.nombre} className="h-full w-full object-cover" />
          ) : (
            <span className={`font-display text-5xl font-bold ${isDark ? "text-cyan-100" : "text-sky-700"}`}>
              {getInitials(user.nombre || user.displayName || "TC")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function TimelineExperience({
  experiences,
  isDark,
  isEnglish,
}: {
  experiences: ExperienceItem[];
  isDark: boolean;
  isEnglish: boolean;
}) {
  return (
    <section
      className={`rounded-[2rem] border p-6 ${
        isDark
          ? "border-cyan-300/16 bg-[linear-gradient(180deg,rgba(8,20,40,0.94),rgba(7,16,31,0.9))] shadow-[0_24px_60px_rgba(0,0,0,0.22)]"
          : "border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,250,255,0.82))] shadow-[0_24px_56px_rgba(148,163,184,0.12)]"
      }`}
    >
      <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.28em] ${isDark ? "text-cyan-200/80" : "text-sky-700"}`}>
        {isEnglish ? "Experience" : "Experiencia"}
      </p>
      <div className="relative mt-6 space-y-6">
        <div className={`absolute bottom-2 left-3 top-1 z-0 w-px ${isDark ? "bg-gradient-to-b from-cyan-300/70 via-cyan-300/18 to-transparent" : "bg-gradient-to-b from-sky-400 via-sky-200 to-transparent"}`} />
        {experiences.map((item, index) => (
          <article key={`${item.empresa}-${item.rol}-${index}`} className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-4">
            <span
              className={`z-10 inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                isDark
                  ? "border-cyan-300/28 bg-[#0d63ff]/18 text-cyan-100 shadow-[0_0_0_4px_rgba(71,214,255,0.10)]"
                  : "border-sky-200 bg-white text-sky-700 shadow-[0_0_0_4px_rgba(56,189,248,0.10)]"
              }`}
            >
              <Check className="h-3.5 w-3.5" />
            </span>
            <div className={`rounded-[1.4rem] border p-4 ${isDark ? "border-white/6 bg-white/[0.04]" : "border-white/70 bg-white/72"}`}>
              <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-950"}`}>
                {item.rol.trim() || (isEnglish ? "Professional role" : "Rol profesional")}
              </h3>
              <p className={`mt-1 text-sm font-medium ${isDark ? "text-cyan-100" : "text-sky-800"}`}>
                {item.empresa.trim() || (isEnglish ? "Independent practice" : "Práctica independiente")}
              </p>
              <p className={`mt-2 text-xs uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {formatExperienceRange(item)}
              </p>
              {item.description?.trim() || item.achievements?.trim() ? (
                <p className={`mt-3 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {item.description?.trim() || item.achievements?.trim()}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SkillChip({ label, isDark }: { label: string; isDark: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-4 py-2 text-sm font-medium ${
        isDark
          ? "border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(71,214,255,0.12),rgba(255,255,255,0.04))] text-cyan-50 shadow-[0_12px_24px_rgba(0,0,0,0.14)]"
          : "border border-sky-100 bg-[linear-gradient(180deg,rgba(232,245,255,0.96),rgba(221,242,255,0.92))] text-slate-800 shadow-[0_10px_18px_rgba(56,189,248,0.10)]"
      }`}
    >
      {label}
    </span>
  );
}

export function EducationCard({
  record,
  isDark,
  isEnglish,
}: {
  record: CandidateEducationRecord | null;
  isDark: boolean;
  isEnglish: boolean;
}) {
  const title = record?.degreeTitle?.trim() || (isEnglish ? "Education in progress" : "Formación en progreso");
  const institution =
    record?.institutionName?.trim() ||
    (isEnglish ? "Academic profile available on request" : "Perfil académico disponible a solicitud");
  const yearLabel = record?.endDate
    ? formatDisplayDate(record.endDate)
    : record?.startDate
      ? formatDisplayDate(record.startDate)
      : isEnglish
        ? "Updated recently"
        : "Actualizado recientemente";

  return (
    <section
      className={`rounded-[1.75rem] border p-5 ${
        isDark
          ? "border-cyan-300/16 bg-[linear-gradient(180deg,rgba(8,20,40,0.92),rgba(7,16,31,0.88))]"
          : "border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,250,255,0.82))]"
      }`}
    >
      <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.28em] ${isDark ? "text-cyan-200/80" : "text-sky-700"}`}>
        {isEnglish ? "Education" : "Educación"}
      </p>
      <div className="mt-4 flex items-center gap-4">
        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-[1.25rem] ${isDark ? "bg-cyan-300/12 text-cyan-100" : "bg-sky-50 text-sky-700"}`}>
          <GraduationCap className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-950"}`}>{title}</h3>
          <p className={`mt-1 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>{institution}</p>
          <p className={`mt-1 text-xs uppercase tracking-[0.18em] ${isDark ? "text-cyan-100" : "text-sky-800"}`}>{yearLabel}</p>
        </div>
      </div>
    </section>
  );
}

export function CertificationCard({
  title,
  subtitle,
  thumbHref,
  isDark,
  onPreview,
}: {
  title: string;
  subtitle: string;
  thumbHref?: string;
  isDark: boolean;
  onPreview?: () => void;
}) {
  return (
    <article className="flex items-center gap-4">
      <div className="group relative">
        <div
          className={`relative h-[62px] w-[58px] shrink-0 overflow-hidden rounded-[0.8rem] border transition ${
            isDark
              ? "border-white/8 hover:border-cyan-300/28"
              : "border-sky-100/90 hover:border-sky-300"
          } ${thumbHref ? "cursor-pointer" : ""}`}
          onClick={thumbHref && onPreview ? onPreview : undefined}
          role={thumbHref && onPreview ? "button" : undefined}
          tabIndex={thumbHref && onPreview ? 0 : undefined}
          onKeyDown={
            thumbHref && onPreview
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onPreview();
                  }
                }
              : undefined
          }
        >
          {thumbHref ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbHref} alt={title} className="h-full w-full object-contain" />
              <div className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
                isDark ? "bg-[linear-gradient(180deg,rgba(2,6,23,0.08),rgba(2,6,23,0.36))]" : "bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(14,165,233,0.16))]"
              }`} />
            </>
          ) : (
            <GraduationCap className={`h-8 w-8 ${isDark ? "text-cyan-100" : "text-sky-700"}`} />
          )}
          {thumbHref ? (
            <span className={`pointer-events-none absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 ${
              isDark
                ? "bg-slate-950/70 text-cyan-100 translate-y-1"
                : "bg-white/90 text-sky-700 shadow-[0_8px_18px_rgba(148,163,184,0.18)] translate-y-1"
            }`}>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </div>
      </div>
      <div className="min-w-0 flex-1 self-center">
        <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-950"}`}>{title}</h3>
        <p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{subtitle}</p>
      </div>
    </article>
  );
}

export function ContactItem({ label, value, href, isDark }: ContactItemProps) {
  const content = href ? (
    <a href={href} target="_blank" rel="noreferrer" className="min-w-0 break-all text-sm font-medium">
      {value}
    </a>
  ) : (
    <span className="min-w-0 break-all text-sm font-medium">{value}</span>
  );

  return (
    <div className={`rounded-[1.25rem] border px-4 py-3 ${isDark ? "border-white/6 bg-white/[0.04] text-slate-100" : "border-white/80 bg-white/72 text-slate-800"}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      <div className={`mt-1 ${isDark ? "text-slate-100" : "text-slate-800"}`}>{content}</div>
    </div>
  );
}

export function SocialIconButton({ icon: Icon, label, href, isDark }: SocialIconButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col items-center gap-2 text-center"
      aria-label={label}
      title={label}
    >
      <span
        className={`inline-flex h-14 w-14 items-center justify-center rounded-[1.1rem] border transition ${
          isDark
            ? "border-cyan-300/22 bg-white/[0.06] text-[#67e8f9] hover:-translate-y-0.5 hover:border-cyan-300/34 hover:bg-white"
            : "border-sky-200 bg-white/90 text-[#0d63ff] hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>{label}</span>
    </a>
  );
}

export function LanguagesSection({
  languages,
  isDark,
  isEnglish,
}: {
  languages: Array<{ name: string; level: string }>;
  isDark: boolean;
  isEnglish: boolean;
}) {
  if (languages.length === 0) {
    return null;
  }

  return (
    <section
      className={`rounded-[2rem] border p-6 ${
        isDark
          ? "border-cyan-300/16 bg-[linear-gradient(180deg,rgba(8,20,40,0.94),rgba(7,16,31,0.9))]"
          : "border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,250,255,0.82))]"
      }`}
    >
      <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.28em] ${isDark ? "text-cyan-200/80" : "text-sky-700"}`}>
        {isEnglish ? "Languages" : "Idiomas"}
      </p>
      <div className="relative mt-6 space-y-4">
        <div className={`absolute bottom-2 left-3 top-1 z-0 w-px ${isDark ? "bg-gradient-to-b from-cyan-300/70 via-cyan-300/18 to-transparent" : "bg-gradient-to-b from-sky-400 via-sky-200 to-transparent"}`} />
        {languages.map((language) => (
          <div key={`${language.name}-${language.level}`} className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-4">
            <div />
            <div className="flex items-center gap-3">
              <Image
                src={getLanguageFlagIconSrc(language.name)}
                alt={`Bandera ${language.name}`}
                width={20}
                height={16}
                unoptimized
                className="h-4 w-5 rounded-[0.28rem] object-cover shadow-[0_0_0_1px_rgba(148,163,184,0.22)]"
              />
              <div>
                <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-800"}`}>{language.name}</p>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{language.level}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
