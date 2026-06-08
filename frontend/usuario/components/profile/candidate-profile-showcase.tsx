"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  AtSign,
  BriefcaseBusiness,
  Camera,
  Code2,
  Download,
  Globe,
  Mail,
  MessageCircle,
  Pencil,
  Send,
  X,
} from "lucide-react";
import { normalizeWebsiteInput } from "@/lib/profile-form";
import { sanitizeSummaryText } from "@/lib/summary-text";
import type { ExperienceItem } from "@/types/profile";
import type { User } from "@/types/user";
import {
  ActionButton,
  AvatarGlow,
  CertificationCard,
  ContactItem,
  EducationCard,
  LanguagesSection,
  SkillChip,
  SocialIconButton,
  TimelineExperience,
} from "@/components/profile/candidate-profile-showcase-parts";
import {
  cleanLocation,
  formatCopAmount,
  formatCopTextValue,
  formatDisplayDate,
  formatSeniority,
  pickLatestEducation,
} from "@/components/profile/candidate-profile-showcase-helpers";

type CandidateProfileShowcaseProps = {
  user: User;
  isDark: boolean;
  isEnglish: boolean;
  canEdit?: boolean;
  completionScore?: number;
  lastUpdatedAt?: string;
  optimizationActions?: Array<{
    key: string;
    title: string;
    impact: string;
  }>;
  onEdit?: () => void;
};

export function CandidateProfileShowcase({
  user,
  isDark,
  isEnglish,
  canEdit = false,
  completionScore = 0,
  lastUpdatedAt,
  optimizationActions = [],
  onEdit,
}: CandidateProfileShowcaseProps) {
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [activeOptimizationIndex, setActiveOptimizationIndex] = useState(0);
  const [showOptimizationBanner, setShowOptimizationBanner] = useState(true);
  const websiteHref = normalizeWebsiteInput(user.website ?? "");
  const cvHref = user.cvDownloadUrl?.trim() || undefined;
  const summary =
    sanitizeSummaryText(user.resumenPerfil ?? "") ||
    sanitizeSummaryText(user.professionalProfile?.professionalSummary ?? "") ||
    sanitizeSummaryText(user.bio ?? "") ||
    (isEnglish
      ? "Profile focused on product thinking, interaction systems, research clarity, and high-signal design execution."
      : "Perfil enfocado en pensamiento de producto, sistemas de interacción, claridad de investigación y ejecución de diseño de alta señal.");
  const role =
    user.professionalProfile?.headline?.trim() ||
    user.professionalProfile?.currentJobTitle?.trim() ||
    user.rol.trim() ||
    "Senior Product Designer";
  const experiences = user.experiencia.filter((item) => item.rol.trim() || item.empresa.trim()).slice(0, 4);
  const languages = user.idiomas?.filter((item) => item.name.trim()) ?? [];
  const latestEducation = pickLatestEducation(user.educationProfile?.records);
  const contactLocation = [cleanLocation(user.locationProfile?.city), cleanLocation(user.locationProfile?.region)].filter(Boolean).join(", ");
  const selectedLocation = user.workPreferences?.preferredLocations?.find(Boolean)?.trim() || "";
  const modalityLabel =
    user.modalidadTrabajo?.trim() ||
    user.workPreferences?.preferredWorkModes?.find(Boolean) ||
    "";
  const expectedSalaryMin = user.workPreferences?.expectedSalaryMin;
  const expectedSalaryMax = user.workPreferences?.expectedSalaryMax;
  const salaryLabel =
    expectedSalaryMin || expectedSalaryMax
      ? [formatCopAmount(expectedSalaryMin), formatCopAmount(expectedSalaryMax)].filter(Boolean).join(" – ")
      : user.expectativaSalarial?.trim()
        ? formatCopTextValue(user.expectativaSalarial)
        : [user.expectativaSalarialMin?.trim(), user.expectativaSalarialMax?.trim()]
            .filter(Boolean)
            .map((value) => formatCopTextValue(value))
            .join(" – ");
  const availabilityStatusRaw = user.professionalProfile?.availabilityStatus;
  const availabilityLabel = availabilityStatusRaw
    ? availabilityStatusRaw === "available_now"
      ? "Activa"
      : availabilityStatusRaw === "open_30_days"
        ? "30 días"
        : availabilityStatusRaw === "open_60_days"
          ? "60 días"
          : availabilityStatusRaw === "interviewing"
            ? "En entrevistas"
            : "No disponible"
    : "";
  const levelLabel = formatSeniority(user.professionalProfile?.seniorityLevel);
  const experienceYears = user.professionalProfile?.yearsExperienceTotal;
  const focusLabel =
    user.categoriasEnfoque?.find(Boolean)?.trim() ||
    user.professionalProfile?.primarySpecialization?.trim() ||
    user.professionalProfile?.preferredRoleTitles?.find(Boolean)?.trim() ||
    "";
  const quickSignalItems = [
    availabilityLabel ? { label: "Disponibilidad", value: availabilityLabel } : null,
    modalityLabel ? { label: "Modalidad", value: modalityLabel } : null,
    selectedLocation ? { label: "Ubicación seleccionada", value: selectedLocation } : null,
    user.ubicacion?.trim() ? { label: "Ubicación", value: user.ubicacion.trim() } : null,
    focusLabel ? { label: "Enfoque", value: focusLabel } : null,
    salaryLabel ? { label: "Salario", value: salaryLabel } : null,
    experienceYears ? { label: "Experiencia", value: `${experienceYears} años` } : null,
    levelLabel ? { label: "Nivel", value: levelLabel } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const skills = (
    user.structuredSkills?.length
      ? user.structuredSkills
          .sort((left, right) => Number(Boolean(right.isCoreSkill)) - Number(Boolean(left.isCoreSkill)))
          .slice(0, 12)
          .map((skill) => {
            const level = skill.skillLevel ? ` (${skill.skillLevel})` : "";
            return `${skill.skillName}${level}`;
          })
      : user.skills.slice(0, 12)
  ) as string[];
  const certifications = (user.certificationProfile?.records ?? []).slice(0, 3).map((item, index) => ({
    title: item.certificationName.trim() || `Certificación ${index + 1}`,
    subtitle:
      item.issuer?.trim() ||
      [item.startedAt ? formatDisplayDate(item.startedAt) : "", item.completedAt ? formatDisplayDate(item.completedAt) : ""]
        .filter(Boolean)
        .join(" · ") ||
      "Certificación validada dentro del perfil.",
    thumbHref: item.proofImageThumbnailUrl?.trim() || undefined,
    fullHref: item.proofImageUrl?.trim() || undefined,
  }));
  const socialLinks = user.professionalProfile?.socialLinks ?? {};
  const professionalLinks = [
    websiteHref ? { icon: Globe, label: isEnglish ? "Website" : "Web", href: websiteHref } : null,
    user.email?.trim() ? { icon: Mail, label: isEnglish ? "Email" : "Correo", href: `mailto:${user.email.trim()}` } : null,
    socialLinks.x?.trim() ? { icon: AtSign, label: "X", href: socialLinks.x.trim() } : null,
    socialLinks.facebook?.trim() ? { icon: Globe, label: "Facebook", href: socialLinks.facebook.trim() } : null,
    socialLinks.instagram?.trim() ? { icon: Camera, label: "Instagram", href: socialLinks.instagram.trim() } : null,
    socialLinks.telegram?.trim() ? { icon: Send, label: "Telegram", href: socialLinks.telegram.trim() } : null,
    socialLinks.linkedin?.trim() ? { icon: BriefcaseBusiness, label: "LinkedIn", href: socialLinks.linkedin.trim() } : null,
    socialLinks.github?.trim() ? { icon: Code2, label: "GitHub", href: socialLinks.github.trim() } : null,
  ].filter(Boolean) as Array<{ icon: ComponentType<{ className?: string }>; label: string; href: string }>;
  const contactItems = [
    user.email?.trim() ? { label: isEnglish ? "Email" : "Correo", value: user.email.trim(), href: `mailto:${user.email.trim()}` } : null,
    user.telefono?.trim() ? { label: isEnglish ? "Phones" : "Teléfonos", value: user.telefono.trim() } : null,
    contactLocation ? { label: isEnglish ? "Location" : "Ubicación", value: contactLocation } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; href?: string }>;

  useEffect(() => {
    if (!previewImage) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewImage(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewImage]);

  useEffect(() => {
    if (optimizationActions.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveOptimizationIndex((current) =>
        current === optimizationActions.length - 1 ? 0 : current + 1,
      );
    }, 10_000);

    return () => window.clearInterval(intervalId);
  }, [optimizationActions.length]);

  const currentOptimizationIndex =
    optimizationActions.length > 0
      ? activeOptimizationIndex % optimizationActions.length
      : 0;

  return (
    <>
    <div className="relative isolate overflow-hidden rounded-[2.4rem] border border-white/40 p-4 sm:p-6">
      <div
        aria-hidden="true"
        className={isDark
          ? "absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(71,214,255,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(13,99,255,0.14),transparent_24%),linear-gradient(180deg,#071224_0%,#081726_42%,#060d19_100%)]"
          : "absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_26%),radial-gradient(circle_at_82%_12%,rgba(13,99,255,0.12),transparent_18%),linear-gradient(180deg,#f6fbff_0%,#eef5fb_44%,#e7f0f8_100%)]"}
      />
      <div
        aria-hidden="true"
        className={isDark
          ? "absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:26px_26px] opacity-[0.18]"
          : "absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.72)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.62)_1px,transparent_1px)] bg-[size:26px_26px] opacity-[0.34]"}
      />

      {showOptimizationBanner && optimizationActions.length > 0 ? (
        <div className="mb-6">
        <section
          className={`w-full rounded-[1.1rem] border px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.08)] ${
            isDark
              ? "border-emerald-300/22 bg-[linear-gradient(180deg,rgba(22,101,52,0.24),rgba(6,78,59,0.16))]"
              : "border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.98),rgba(220,252,231,0.92))]"
          }`}
        >
          {optimizationActions.slice(currentOptimizationIndex, currentOptimizationIndex + 1).map((action, index) => (
            <div key={action.key} className={`flex w-full max-w-full flex-wrap items-center gap-3 text-sm animate-[optimization-card-swap_340ms_ease] ${isDark ? "text-emerald-50" : "text-emerald-900"}`}>
              <span className={isDark ? "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-300/18 text-[11px] font-semibold text-emerald-50" : "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-700"}>
                {currentOptimizationIndex + index + 1}
              </span>
              <span className="font-semibold">{action.title}</span>
              <span className={isDark ? "text-emerald-100/80" : "text-emerald-800"}>{action.impact}</span>
              <button
                type="button"
                onClick={() => setShowOptimizationBanner(false)}
                className={isDark ? "ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200/20 bg-white/10 text-emerald-50 transition hover:bg-white/16" : "ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-white/90 text-emerald-700 transition hover:bg-white"}
                aria-label="Cerrar optimizacion"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </section>
        </div>
      ) : null}

      <div className={`rounded-[2.1rem] border p-4 sm:p-6 ${isDark ? "border-cyan-300/18 bg-white/[0.05] shadow-[0_30px_80px_rgba(0,0,0,0.28)]" : "border-white/80 bg-white/42 shadow-[0_30px_80px_rgba(148,163,184,0.18)] backdrop-blur-2xl"}`}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
          <section
            className={`relative rounded-[2rem] border p-6 xl:col-span-2 ${
              isDark
                ? "border-cyan-300/16 bg-[linear-gradient(180deg,rgba(8,20,40,0.95),rgba(7,16,31,0.9))]"
                : "border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(244,250,255,0.82))]"
            }`}
          >
            {canEdit && onEdit ? (
              <div className="group absolute right-2 top-2">
                <button
                  type="button"
                  onClick={onEdit}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition ${
                    isDark
                      ? "border border-cyan-300/18 bg-white/[0.06] text-slate-100 hover:border-cyan-300/34 hover:bg-white/[0.1]"
                      : "border border-sky-200 bg-white/90 text-slate-800 hover:border-sky-300 hover:bg-white"
                  }`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <span
                  className={`pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium opacity-0 transition-opacity duration-200 delay-0 group-hover:opacity-100 group-hover:delay-[2000ms] ${
                    isDark ? "bg-slate-950 text-cyan-100" : "bg-slate-900 text-white"
                  }`}
                >
                  {isEnglish ? "Edit profile" : "Editar perfil"}
                </span>
              </div>
            ) : null}

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {completionScore > 0 ? (
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "border border-white/10 bg-white/[0.04] text-slate-300" : "border border-slate-200 bg-white/70 text-slate-600"}`}>
                      {completionScore}% {isEnglish ? "complete" : "completo"}
                    </span>
                  ) : null}
                  {lastUpdatedAt ? (
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "border border-white/10 bg-white/[0.04] text-slate-300" : "border border-slate-200 bg-white/70 text-slate-600"}`}>
                      {isEnglish ? "Updated" : "Actualizado"} {lastUpdatedAt}
                    </span>
                  ) : null}
                </div>

                <h1 className={`mt-4 font-display text-4xl font-bold tracking-[-0.03em] sm:text-5xl ${isDark ? "text-white" : "text-slate-950"}`}>
                  {user.nombre || user.displayName}
                </h1>
                <p className={`mt-3 max-w-3xl text-lg font-medium ${isDark ? "text-cyan-100" : "text-sky-800"}`}>{role}</p>
                <p className={`mt-4 whitespace-pre-line text-sm leading-7 break-words sm:text-base ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {summary}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <ActionButton
                    icon={Download}
                    label={isEnglish ? "Download CV" : "Descargar CV"}
                    href={cvHref}
                    target="_blank"
                    disabled={!cvHref}
                    isDark={isDark}
                  />
                  <ActionButton
                    icon={MessageCircle}
                    label={isEnglish ? "Messages" : "Mensajes"}
                    isDark={isDark}
                    onClick={() => undefined}
                  />
                </div>
              </div>

              <AvatarGlow user={user} isDark={isDark} />
            </div>
          </section>

          <div className="space-y-6">
            <section
              className={`rounded-[2rem] border p-6 ${
                isDark
                  ? "border-cyan-300/16 bg-[linear-gradient(180deg,rgba(8,20,40,0.94),rgba(7,16,31,0.9))]"
                  : "border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,250,255,0.82))]"
              }`}
            >
              <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.28em] ${isDark ? "text-cyan-200/80" : "text-sky-700"}`}>
                {isEnglish ? "Skills" : "Habilidades"}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {(skills.length ? skills : [isEnglish ? "Product thinking" : "Pensamiento de producto"]).map((skill) => (
                  <SkillChip key={skill} label={skill} isDark={isDark} />
                ))}
              </div>
            </section>

            <EducationCard record={latestEducation} isDark={isDark} isEnglish={isEnglish} />

            <section
              className={`rounded-[2rem] border p-6 ${
                isDark
                  ? "border-cyan-300/16 bg-[linear-gradient(180deg,rgba(8,20,40,0.94),rgba(7,16,31,0.9))]"
                  : "border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,250,255,0.82))]"
              }`}
            >
              <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.28em] ${isDark ? "text-cyan-200/80" : "text-sky-700"}`}>
                {isEnglish ? "Certifications" : "Certificaciones"}
              </p>
              <div className="mt-5 space-y-5">
                {certifications.length
                  ? certifications.map((certification) => (
                      <CertificationCard
                        key={certification.title}
                        title={certification.title}
                        subtitle={certification.subtitle}
                        thumbHref={certification.thumbHref}
                        isDark={isDark}
                        onPreview={
                          certification.fullHref
                            ? () => setPreviewImage({ src: certification.fullHref!, alt: certification.title })
                            : undefined
                        }
                      />
                    ))
                  : (
                    <CertificationCard
                      title={isEnglish ? "No certifications yet" : "Aún no hay certificaciones"}
                      subtitle={isEnglish ? "Upload certification evidence in edit mode to display it here." : "Sube evidencias de certificación en modo edición para mostrarlas aquí."}
                      isDark={isDark}
                    />
                  )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section
              id="profile-contact-panel"
              className={`rounded-[2rem] border p-6 ${
                isDark
                  ? "border-cyan-300/16 bg-[linear-gradient(180deg,rgba(8,20,40,0.94),rgba(7,16,31,0.9))]"
                  : "border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,250,255,0.82))]"
              }`}
            >
              <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.28em] ${isDark ? "text-cyan-200/80" : "text-sky-700"}`}>
                {isEnglish ? "Contact info" : "Información de contacto"}
              </p>
              <div className="mt-5 space-y-3">
                {contactItems.map((item) => (
                  <ContactItem key={`${item.label}-${item.value}`} label={item.label} value={item.value} href={item.href} isDark={isDark} />
                ))}
              </div>

              {professionalLinks.length > 0 ? (
                <div className="mt-6">
                  <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.28em] ${isDark ? "text-cyan-200/80" : "text-sky-700"}`}>
                    {isEnglish ? "Professional links" : "Enlaces profesionales"}
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {professionalLinks.map((item) => (
                      <SocialIconButton key={item.label} icon={item.icon} label={item.label} href={item.href} isDark={isDark} />
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <section
              className={`rounded-[2rem] border p-6 ${
                isDark
                  ? "border-cyan-300/16 bg-[linear-gradient(180deg,rgba(8,20,40,0.94),rgba(7,16,31,0.9))]"
                  : "border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,250,255,0.82))]"
              }`}
            >
              <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.28em] ${isDark ? "text-cyan-200/80" : "text-sky-700"}`}>
                {isEnglish ? "Quick signals" : "Señales rápidas"}
              </p>
              {quickSignalItems.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {quickSignalItems.map((item) => (
                    <div key={item.label} className={`flex items-center justify-between gap-4 text-sm ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                      <span className={isDark ? "text-slate-400" : "text-slate-500"}>{item.label}</span>
                      <span className="text-right font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <TimelineExperience
              experiences={experiences.length ? experiences : [{ rol: "Perfil en construcción", empresa: "TalentSyncro", tiempo: "Ahora" } as ExperienceItem]}
              isDark={isDark}
              isEnglish={isEnglish}
            />

            <LanguagesSection languages={languages} isDark={isDark} isEnglish={isEnglish} />
          </div>
        </div>
      </div>
    </div>
    {previewImage ? (
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-6 backdrop-blur-md"
        onClick={() => setPreviewImage(null)}
      >
        <div
          className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white"
          >
            Cerrar
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewImage.src} alt={previewImage.alt} className="max-h-[82vh] max-w-[82vw] object-contain" />
        </div>
      </div>
    ) : null}
    </>
  );
}
