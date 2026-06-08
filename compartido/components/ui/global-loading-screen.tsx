"use client";

import { useVacancyTheme } from "@/hooks/use-vacancy-theme";

export function GlobalLoadingScreen({
  message,
}: {
  message?: string;
}) {
  const { isDark } = useVacancyTheme();

  return (
    <div
      className={
        "fixed inset-0 z-[220] flex items-center justify-center bg-black/55 px-6 backdrop-blur-sm"
      }
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div
          className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.4rem] border border-white/12 bg-black/45 shadow-[0_20px_50px_rgba(0,0,0,0.32)]"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="h-12 w-12 rounded-md object-cover"
          >
            <source src="/bandera.mp4" type="video/mp4" />
          </video>
        </div>

        <p
          className={
            isDark
              ? "mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100"
              : "mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-white"
          }
        >
          TalentSyncro
        </p>
        <p className={isDark ? "mt-3 text-sm text-slate-200" : "mt-3 text-sm text-slate-100"}>
          {message ?? "Cargando..."}
        </p>
      </div>
    </div>
  );
}
