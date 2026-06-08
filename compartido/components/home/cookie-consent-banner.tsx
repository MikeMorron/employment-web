"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type CookieConsentMode = "essential" | "full";

type CookieConsentBannerProps = {
  isDark: boolean;
  isEnglish: boolean;
  selectedMode: CookieConsentMode | null;
  onSelectMode: (value: CookieConsentMode) => void;
  onAccept: () => void;
  onClose: () => void;
};

function ChoiceCard({
  active,
  title,
  description,
  isDark,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  isDark: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.35rem] border px-4 py-4 text-left transition ${
        active
          ? isDark
            ? "border-cyan-200/50 bg-cyan-300/10 shadow-[0_16px_40px_rgba(8,145,178,0.18)]"
            : "border-sky-400 bg-sky-50 shadow-[0_16px_40px_rgba(56,189,248,0.16)]"
          : isDark
            ? "border-white/10 bg-white/4 hover:border-cyan-200/30"
            : "border-slate-300 bg-white hover:border-slate-400"
      }`}
      aria-pressed={active}
    >
      <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>
        {title}
      </p>
      <p className={isDark ? "mt-2 text-sm leading-6 text-slate-300" : "mt-2 text-sm leading-6 text-slate-600"}>
        {description}
      </p>
    </button>
  );
}

export function CookieConsentBanner({
  isDark,
  isEnglish,
  selectedMode,
  onSelectMode,
  onAccept,
  onClose,
}: CookieConsentBannerProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-[260] px-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:bottom-6 sm:px-4">
      <div
        className={
          isDark
            ? "pointer-events-auto mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,18,34,0.96),rgba(7,13,25,0.96))] p-5 shadow-[0_32px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-6"
            : "pointer-events-auto mx-auto max-w-3xl rounded-[2rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,251,0.96))] p-5 shadow-[0_28px_72px_rgba(148,163,184,0.26)] backdrop-blur-xl sm:p-6"
        }
      >
        <div className="relative isolate">
          <button
            type="button"
            onClick={onClose}
            aria-label={isEnglish ? "Close cookie banner" : "Cerrar aviso de cookies"}
            className={
              isDark
                ? "absolute left-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                : "absolute left-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100"
            }
          >
            <X className="h-4 w-4" />
          </button>

          <div className="pl-14 pr-2">
            <p className={isDark ? "text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200" : "text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700"}>
              Cookies
            </p>
            <h3 className={isDark ? "mt-3 text-2xl font-semibold text-white" : "mt-3 text-2xl font-semibold text-slate-950"}>
              {isEnglish ? "Choose how much to remember on this device." : "Elige cuánto recordar en este dispositivo."}
            </h3>
            <p className={isDark ? "mt-3 max-w-2xl text-sm leading-7 text-slate-300" : "mt-3 max-w-2xl text-sm leading-7 text-slate-700"}>
              {isEnglish
                ? "Use essential cookies for secure access, or enable the full experience for recommendations and product improvements."
                : "Usa cookies esenciales para el acceso seguro, o activa la experiencia completa para recomendaciones y mejoras del producto."}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ChoiceCard
              active={selectedMode === "essential"}
              title={isEnglish ? "Essential" : "Esenciales"}
              description={
                isEnglish
                  ? "Secure sign-in, basic settings, and safe navigation."
                  : "Inicio de sesión seguro, ajustes básicos y navegación protegida."
              }
              isDark={isDark}
              onClick={() => onSelectMode("essential")}
            />
            <ChoiceCard
              active={selectedMode === "full"}
              title={isEnglish ? "Full" : "Completas"}
              description={
                isEnglish
                  ? "Everything in essential, plus recommendations and analytics."
                  : "Todo lo esencial, más recomendaciones y analítica."
              }
              isDark={isDark}
              onClick={() => onSelectMode("full")}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
              {selectedMode
                ? isEnglish
                  ? "This choice is saved only after you accept."
                  : "Esta elección solo se guarda cuando aceptas."
                : isEnglish
                  ? "You can close this window, but it will appear again until you accept."
                  : "Puedes cerrar esta ventana, pero volverá a aparecer hasta que aceptes."}
            </p>
            <button
              type="button"
              onClick={onAccept}
              disabled={selectedMode === null}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isEnglish ? "Accept" : "Aceptar"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
