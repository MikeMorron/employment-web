"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, BriefcaseBusiness, Sparkles, Star, UserRound } from "lucide-react";
import { getApplicationVisibleGroup, isActiveCandidateApplicationStatus } from "@/lib/application-status";
import { getCandidatePlanFeatures } from "@/lib/candidate-plan";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useCandidateApplications } from "@/hooks/use-candidate-applications";
import { useProductActivation } from "@/hooks/use-product-activation";
import { useSavedVacancies } from "@/hooks/use-saved-vacancies";
import type { CandidateProfile } from "@/types/profile";

export function CandidateHomeDashboard({
  user,
  isDark,
}: {
  user: CandidateProfile;
  isDark: boolean;
}) {
  const { isEnglish } = useAppLanguage();
  const planFeatures = getCandidatePlanFeatures(user);
  const { applications } = useCandidateApplications(user);
  const { savedIds } = useSavedVacancies();
  const { activationSummary } = useProductActivation();
  const activeApplications = applications.filter((item) => isActiveCandidateApplicationStatus(item.status));
  const recentMatches = applications.filter((item) => ["revision", "decision"].includes(getApplicationVisibleGroup(item.status)));

  return (
    <section className="mt-10 space-y-6">
      <div
        className={
          isDark
            ? "rounded-[2rem] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(7,16,31,0.94),rgba(8,17,32,0.90))] p-6"
            : "rounded-[2rem] border border-slate-300 bg-white/92 p-6"
        }
      >
        <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.22em] text-sky-700"}>
          {isEnglish ? "Candidate dashboard" : "Panel del candidato"}
        </p>
        <h2 className={isDark ? "mt-3 text-4xl font-semibold text-white" : "mt-3 text-4xl font-semibold text-slate-950"}>
          {isEnglish ? `Welcome back, ${user.nombre}` : `Bienvenida de nuevo, ${user.nombre}`}
        </h2>
        <p className={isDark ? "mt-4 max-w-3xl text-sm leading-7 text-slate-300" : "mt-4 max-w-3xl text-sm leading-7 text-slate-700"}>
          {isEnglish
            ? "Track your visibility, review recent matches, and move faster on the jobs that matter."
            : "Sigue tu visibilidad, revisa coincidencias recientes y avanza más rápido en las vacantes que importan."}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/vacantes"
            className="ts-action-primary inline-flex w-full items-center justify-center gap-2 rounded-[1rem] bg-slate-900 px-5 py-3 text-sm font-semibold text-white sm:w-auto"
          >
            {isEnglish ? "Explore jobs" : "Explorar vacantes"}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/perfil/me"
            className={isDark ? "ts-action-secondary inline-flex w-full items-center justify-center gap-2 rounded-[1rem] border border-white/10 bg-white/4 px-5 py-3 text-sm font-semibold text-slate-100 sm:w-auto" : "ts-action-secondary inline-flex w-full items-center justify-center gap-2 rounded-[1rem] border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 sm:w-auto"}
          >
            {isEnglish ? "Complete profile" : "Completar perfil"}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: BriefcaseBusiness,
            label: isEnglish ? "Recommended jobs" : "Vacantes recomendadas",
            value: "12",
          },
          {
            icon: Sparkles,
            label: isEnglish ? "Recent matches" : "Coincidencias recientes",
            value: String(recentMatches.length),
          },
          {
            icon: Star,
            label: isEnglish ? "Profile views" : "Vieron tu perfil",
            value: planFeatures.showInsights ? "18" : "Locked",
          },
          {
            icon: Bookmark,
            label: isEnglish ? "Saved jobs" : "Vacantes guardadas",
            value: String(savedIds.length),
          },
        ].map((item) => (
          <article
            key={item.label}
            className={
              isDark
                ? "rounded-[1.5rem] border border-white/8 bg-white/4 p-5"
                : "rounded-[1.5rem] border border-slate-300 bg-white/92 p-5"
            }
          >
            <item.icon className={isDark ? "h-5 w-5 text-cyan-200" : "h-5 w-5 text-sky-700"} />
            <p className={isDark ? "mt-4 text-xs uppercase tracking-[0.18em] text-slate-400" : "mt-4 text-xs uppercase tracking-[0.18em] text-slate-500"}>
              {item.label}
            </p>
            <p className={isDark ? "mt-2 text-3xl font-semibold text-white" : "mt-2 text-3xl font-semibold text-slate-950"}>
              {item.value}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {activationSummary ? (
          <article className={isDark ? "rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "rounded-[1.6rem] border border-slate-300 bg-white/92 p-5"}>
            <div className="flex items-center justify-between gap-3">
              <h3 className={isDark ? "text-lg font-semibold text-white" : "text-lg font-semibold text-slate-950"}>
                {isEnglish ? "Activation" : "Activación"}
              </h3>
              <span className={isDark ? "text-sm font-semibold text-cyan-200" : "text-sm font-semibold text-sky-700"}>
                {activationSummary.progressPercent}%
              </span>
            </div>
            <p className={isDark ? "mt-3 text-sm text-slate-300" : "mt-3 text-sm text-slate-700"}>
              {activationSummary.firstValueReached
                ? isEnglish
                  ? `First value reached: ${activationSummary.firstValueLabel}`
                  : `Primer valor alcanzado: ${activationSummary.firstValueLabel}`
                : isEnglish
                  ? `Still pending: ${activationSummary.firstValueLabel}`
                  : `Aún pendiente: ${activationSummary.firstValueLabel}`}
            </p>
            <div className="mt-4 space-y-3">
              {activationSummary.milestones.slice(0, 3).map((item) => (
                <Link
                  key={item.key}
                  href={item.ctaHref ?? "/perfil/me"}
                  className={isDark ? "ts-chip-interactive flex items-center justify-between rounded-[1rem] border border-white/8 bg-white/3 px-4 py-3 text-sm text-slate-200" : "ts-chip-interactive flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"}
                >
                  <span>{item.title}</span>
                  <span className={isDark ? "text-cyan-200" : "text-sky-700"}>{item.score}%</span>
                </Link>
              ))}
            </div>
          </article>
        ) : null}

        <article className={isDark ? "rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "rounded-[1.6rem] border border-slate-300 bg-white/92 p-5"}>
          <div className="flex items-center gap-3">
            <UserRound className={isDark ? "h-5 w-5 text-cyan-200" : "h-5 w-5 text-sky-700"} />
            <h3 className={isDark ? "text-lg font-semibold text-white" : "text-lg font-semibold text-slate-950"}>
              {isEnglish ? "Your application pipeline" : "Tu pipeline de postulaciones"}
            </h3>
          </div>
          <p className={isDark ? "mt-4 text-sm leading-7 text-slate-300" : "mt-4 text-sm leading-7 text-slate-700"}>
            {isEnglish
              ? activeApplications.length > 0
                ? `You have ${activeApplications.length} active applications moving through your pipeline.`
                : "You have not applied to any jobs this week. Start with high-signal openings and keep your profile updated."
              : activeApplications.length > 0
                ? `Tienes ${activeApplications.length} postulaciones activas moviéndose en tu pipeline.`
                : "No has aplicado a vacantes esta semana. Empieza por vacantes con mejor señal y mantén tu perfil actualizado."}
          </p>
          <Link href="/postulaciones" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-600">
            {isEnglish ? "Open applications" : "Abrir postulaciones"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>

        <article className={isDark ? "rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "rounded-[1.6rem] border border-slate-300 bg-white/92 p-5"}>
          <div className="flex items-center gap-3">
            <Sparkles className={isDark ? "h-5 w-5 text-cyan-200" : "h-5 w-5 text-sky-700"} />
            <h3 className={isDark ? "text-lg font-semibold text-white" : "text-lg font-semibold text-slate-950"}>
              {isEnglish ? "Upgrade opportunity" : "Oportunidad de mejora"}
            </h3>
          </div>
          <p className={isDark ? "mt-4 text-sm leading-7 text-slate-300" : "mt-4 text-sm leading-7 text-slate-700"}>
            {isEnglish
              ? "Unlock more active applications, stronger ranking, profile insights, and better visibility with a paid candidate plan."
              : "Desbloquea más postulaciones activas, mejor posicionamiento, información del perfil y mayor visibilidad con un plan de pago para candidatos."}
          </p>
          <Link href="/ajustes" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-600">
            {isEnglish ? "Review personal plan" : "Revisar plan personal"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      </div>
    </section>
  );
}
