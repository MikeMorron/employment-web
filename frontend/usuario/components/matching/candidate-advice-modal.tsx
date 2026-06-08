"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useMemo } from "react";
import { useUiCopy } from "@/lib/i18n/ui-copy";
import type { CandidateAdviceContext } from "@/lib/candidate-advice";

type CandidateAdviceModalProps = {
  open: boolean;
  isDark: boolean;
  isEnglish: boolean;
  context: CandidateAdviceContext;
  onClose: () => void;
};

type AdviceItem = {
  id: string;
  title: string;
  text: string;
  meta: string;
};

function buildAdviceItems(
  context: CandidateAdviceContext,
  isEnglish: boolean,
): AdviceItem[] {
  const focusLabel =
    context.focusCategories.length > 0
      ? context.focusCategories.join(", ")
      : context.roleFallback;
  const locationsLabel =
    context.preferredLocations.length > 0
      ? context.preferredLocations.join(", ")
      : isEnglish
        ? "all visible locations"
        : "todas las ubicaciones visibles";
  const modalityLabel =
    context.preferredModality ??
    (isEnglish ? "all modalities" : "todas las modalidades");

  return [
    {
      id: "contact",
      title: isEnglish ? "Complete your contact details" : "Completa tus datos de contacto",
      meta: isEnglish ? "Profile" : "Perfil",
      text: context.hasPhone
        ? isEnglish
          ? "Your phone is already available. Keep it updated so recruiters can contact you without friction."
          : "Tu celular ya está disponible. Mantén ese dato actualizado para que una empresa pueda contactarte sin fricción."
        : isEnglish
          ? "Add your phone number so a company can contact you quickly when your profile moves forward."
          : "Agrega tu celular para que una empresa pueda contactarte rápido cuando tu perfil avance dentro de un proceso.",
    },
    {
      id: "cv",
      title: isEnglish ? "Keep your CV ready" : "Mantén tu CV listo",
      meta: isEnglish ? "Applications" : "Postulaciones",
      text: context.hasCv
        ? isEnglish
          ? "You already have a CV loaded. Review that it matches the role you want to prioritize right now."
          : "Ya tienes un CV cargado. Revísalo para que responda al rol que quieres priorizar ahora mismo."
        : isEnglish
          ? "Upload your CV before applying again so you do not lose momentum in active opportunities."
          : "Sube tu CV antes de volver a aplicar para no perder ritmo cuando aparezcan oportunidades activas.",
    },
    {
      id: "focus",
      title: isEnglish ? "Clarify your target role" : "Aclara tu objetivo profesional",
      meta: isEnglish ? "Fit" : "Compatibilidad",
      text: focusLabel
        ? isEnglish
          ? `Your current focus is ${focusLabel}. Keep that signal consistent across your profile and applications.`
          : `Tu foco actual es ${focusLabel}. Mantén esa señal consistente entre tu perfil y tus postulaciones.`
        : isEnglish
          ? "Define a role or focus category so the system can keep stronger matches visible for you."
          : "Define un rol o una categoría de enfoque para que el sistema pueda mantener visibles para ti coincidencias más fuertes.",
    },
    {
      id: "skills",
      title: isEnglish ? "Strengthen your main skills" : "Refuerza tus skills principales",
      meta: isEnglish ? "Skills" : "Skills",
      text:
        context.topSkills.length >= 3
          ? isEnglish
            ? `Your profile already highlights ${context.topSkills.slice(0, 3).join(", ")}. Keep them aligned with the jobs you save and apply to.`
            : `Tu perfil ya resalta ${context.topSkills.slice(0, 3).join(", ")}. Mantén esas skills alineadas con lo que guardas y a lo que aplicas.`
          : isEnglish
            ? "Add or refine more concrete skills so your profile has stronger signals for filtering and ranking."
            : "Agrega o afina más skills concretas para que tu perfil tenga señales más fuertes al filtrar y priorizar vacantes.",
    },
    {
      id: "filters",
      title: isEnglish ? "Adjust your alert threshold" : "Ajusta tu umbral de alertas",
      meta: isEnglish ? "Filters" : "Filtros",
      text:
        context.minimumVisibleScore >= 80
          ? isEnglish
            ? `Your threshold is ${context.minimumVisibleScore}%. If you are seeing little movement, lower it slightly without losing focus.`
            : `Tu umbral está en ${context.minimumVisibleScore}%. Si ves poco movimiento, bájalo un poco sin perder foco.`
          : context.minimumVisibleScore <= 35
            ? isEnglish
              ? `Your threshold is ${context.minimumVisibleScore}%. Raise it if you want fewer alerts and less noise in new jobs.`
              : `Tu umbral está en ${context.minimumVisibleScore}%. Súbelo si quieres menos alertas y menos ruido en vacantes nuevas.`
            : isEnglish
              ? `You are filtering from ${context.minimumVisibleScore}% with ${locationsLabel} and ${modalityLabel}. That balance is healthy if you still see enough fresh options.`
              : `Estás filtrando desde ${context.minimumVisibleScore}% con ${locationsLabel} y ${modalityLabel}. Ese balance es sano si todavía te llegan opciones nuevas con frecuencia.`,
    },
  ];
}

export function CandidateAdviceModal({
  open,
  isDark,
  isEnglish,
  context,
  onClose,
}: CandidateAdviceModalProps) {
  const t = useUiCopy("candidateAdviceModal");
  const items = useMemo(() => buildAdviceItems(context, isEnglish), [context, isEnglish]);

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-950/50 px-4 py-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className={
              isDark
                ? "w-full max-w-2xl rounded-[1.6rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(7,16,31,0.98),rgba(8,17,32,0.94))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-5"
                : "w-full max-w-2xl rounded-[1.6rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-4 shadow-[0_24px_70px_rgba(148,163,184,0.20)] backdrop-blur-xl sm:p-5"
            }
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p
                  className={
                    isDark
                      ? "text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200"
                      : "text-xs font-semibold uppercase tracking-[0.24em] text-sky-700"
                  }
                >
                  {t("eyebrow")}
                </p>
                <p className="mt-1 text-xs text-slate-500">{t("summary")}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={
                  isDark
                    ? "ts-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-slate-200 transition hover:border-cyan-200/24 hover:bg-white/8"
                    : "ts-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-sky-300 hover:bg-slate-50"
                }
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="touch-scroll-y mt-5 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <article
                  key={item.id}
                  className={
                    isDark
                      ? "group rounded-[1.2rem] border border-white/8 bg-white/4 px-3.5 py-3"
                      : "group rounded-[1.2rem] border border-slate-300 bg-white/90 px-3.5 py-3"
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={
                        isDark
                          ? "text-sm font-semibold text-cyan-100"
                          : "text-sm font-semibold text-sky-700"
                      }
                    >
                      {item.title}
                    </p>
                    <span className="shrink-0 text-[11px] text-slate-500">{item.meta}</span>
                  </div>
                  <p
                    className={
                      isDark
                        ? "mt-1.5 text-sm leading-5.5 text-slate-300"
                        : "mt-1.5 text-sm leading-5.5 text-slate-700"
                    }
                  >
                    {item.text}
                  </p>
                </article>
              ))}
            </div>

            <div
              className={
                isDark
                  ? "mt-5 rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
                  : "mt-5 rounded-[1.2rem] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600"
              }
            >
              {t("footer")}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
