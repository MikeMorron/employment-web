"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { AutoUiTranslator } from "@/components/ui/auto-ui-translator";
import { PanoramaPreviewBoard, SectionLayout } from "@/components/sections/market-panorama/layout";
import { useAppLanguage } from "@/hooks/use-app-language";
import { lockPageScroll } from "@/lib/client/scroll-lock";
import type { DashboardResponse } from "@/lib/market/types";
import {
  LEGACY_OPEN_PANORAMA_EVENT,
  OPEN_PANORAMA_EVENT,
  PANORAMA_OPENED_KEY,
} from "@/lib/app-runtime";
import {
  getConclusionCopy,
  getFeaturedMarketCards,
  groupCards,
  localizeCard,
  sanitizeDashboard,
  sectionMeta,
} from "@/components/sections/market-panorama/helpers";

type MarketPanoramaSectionProps = {
  isDark: boolean;
  initialData: DashboardResponse;
};

export function MarketPanoramaSection({
  isDark,
  initialData,
}: MarketPanoramaSectionProps) {
  const { isEnglish } = useAppLanguage();
  const marketData = useMemo(() => sanitizeDashboard(initialData), [initialData]);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const conclusionCopy = getConclusionCopy(isEnglish);
  const localizedCards = useMemo(
    () => marketData.cards.map((card) => localizeCard(card, isEnglish)),
    [isEnglish, marketData.cards],
  );
  const dashboardBlocks = useMemo(
    () =>
      groupCards(localizedCards).map((group) => ({
        ...group,
        title: sectionMeta[group.section].title[isEnglish ? "en" : "es"],
        description: sectionMeta[group.section].description[isEnglish ? "en" : "es"],
      })),
    [isEnglish, localizedCards],
  );
  const featuredMarketCards = useMemo(
    () => getFeaturedMarketCards(localizedCards),
    [localizedCards],
  );

  const closeInsights = useCallback(() => {
    setShowAllInsights(false);
  }, []);

  const openInsights = useCallback(() => {
    setShowAllInsights(true);
    window.localStorage.setItem(PANORAMA_OPENED_KEY, "true");
  }, []);

  useEffect(() => {
    const triggerRefresh = () => {
      openInsights();
    };

    window.addEventListener(OPEN_PANORAMA_EVENT, triggerRefresh as EventListener);
    window.addEventListener(LEGACY_OPEN_PANORAMA_EVENT, triggerRefresh as EventListener);

    return () =>
      {
        window.removeEventListener(OPEN_PANORAMA_EVENT, triggerRefresh as EventListener);
        window.removeEventListener(LEGACY_OPEN_PANORAMA_EVENT, triggerRefresh as EventListener);
      };
  }, [openInsights]);

  useEffect(() => {
    if (!showAllInsights) {
      return;
    }

    const releaseScrollLock = lockPageScroll();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeInsights();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      releaseScrollLock();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeInsights, showAllInsights]);

  return (
    <div className="mt-10 lg:mt-12">
      <AutoUiTranslator />
      <div
        className={
          isDark
            ? "rounded-[2rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(9,18,33,0.96),rgba(8,16,30,0.92))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_24px_70px_rgba(0,0,0,0.28)] sm:p-6"
            : "rounded-[2rem] border border-slate-300/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,252,0.94))] p-5 shadow-[0_24px_70px_rgba(148,163,184,0.14)] sm:p-6"
        }
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p
              className={
                isDark
                  ? "text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200"
                  : "text-xs font-semibold uppercase tracking-[0.24em] text-sky-700"
              }
            >
              {isEnglish ? "Market signals" : "Señales del mercado"}
            </p>
            <h3
              className={
                isDark
                  ? "mt-3 text-2xl font-semibold text-white sm:text-3xl"
                  : "mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl"
              }
            >
              {isEnglish
                ? "Official employment statistics in Colombia"
                : "Estadísticas oficiales del empleo en Colombia"}
            </h3>
            <p
              className={
                isDark
                  ? "mt-3 text-sm leading-7 text-slate-400"
                  : "mt-3 text-sm leading-7 text-slate-600"
              }
            >
              {isEnglish
                ? "This view uses an internal API with normalized official and secondary data to render the dashboard without processing sources on the frontend."
                : "Esta vista usa una API interna con datos oficiales y secundarios normalizados para renderizar el dashboard sin procesar fuentes en el frontend."}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <button
                type="button"
                onClick={openInsights}
                className={
                  isDark
                    ? "inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/35"
                    : "inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-900 transition duration-300 hover:-translate-y-0.5 hover:border-sky-300"
                }
              >
                <ArrowUpRight className="h-4 w-4" />
                {isEnglish ? "View all" : "Ver todo"}
              </button>
            </div>
          </div>
        </div>

        <PanoramaPreviewBoard isDark={isDark} cards={localizedCards} />
      </div>

      {showAllInsights ? (
        <div className="touch-scroll-y fixed inset-0 z-[220] flex items-end justify-center overflow-y-auto bg-slate-950/52 p-0 backdrop-blur-md sm:items-center sm:p-6">
          <div
            className={`relative flex h-[94vh] w-full max-w-[81.2rem] flex-col overflow-hidden sm:h-[92vh] ${
              isDark
                ? "rounded-t-[2.6rem] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(8,16,30,0.98),rgba(6,12,24,0.96))] shadow-[0_36px_90px_rgba(0,0,0,0.42)] sm:rounded-[2.6rem]"
                : "rounded-t-[2.6rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,251,0.98))] shadow-[0_36px_90px_rgba(15,23,42,0.18)] sm:rounded-[2.6rem]"
            }`}
          >
            <div
              className={
                isDark
                  ? "sticky top-0 z-10 border-b border-white/8 bg-slate-950/70 px-5 py-5 backdrop-blur sm:px-6"
                  : "sticky top-0 z-10 border-b border-slate-200 bg-white/82 px-5 py-5 backdrop-blur sm:px-6"
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={
                      isDark
                        ? "text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200"
                        : "text-xs font-semibold uppercase tracking-[0.22em] text-sky-700"
                    }
                  >
                    {isEnglish ? "Complete panorama" : "Panorama completo"}
                  </p>
                  <h4
                    className={
                      isDark
                        ? "mt-2 text-2xl font-semibold text-white"
                        : "mt-2 text-2xl font-semibold text-slate-900"
                    }
                  >
                    {isEnglish ? "All market signals" : "Todas las señales del mercado"}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={closeInsights}
                  aria-label={isEnglish ? "Close panorama" : "Cerrar panorama"}
                  className={
                    isDark
                      ? "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#081120] text-slate-200 shadow-[0_16px_40px_rgba(0,0,0,0.32)] transition hover:border-cyan-200/24 hover:bg-[#0b1729]"
                      : "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-[0_16px_40px_rgba(148,163,184,0.20)] transition hover:border-sky-300 hover:bg-slate-50"
                  }
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            <div className="touch-scroll-y overflow-y-auto px-5 py-5 sm:px-6">
              <div className="space-y-8">
                {dashboardBlocks.map((group) => (
                  <section key={group.section}>
                    <div className="mb-4 flex flex-col gap-1">
                      <p
                        className={
                          isDark
                            ? "text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200 sm:text-base"
                            : "text-sm font-semibold uppercase tracking-[0.22em] text-sky-700 sm:text-base"
                        }
                      >
                        {group.title}
                      </p>
                      <p className={isDark ? "text-sm text-slate-400" : "text-sm text-slate-600"}>
                        {group.description}
                      </p>
                    </div>

                    <SectionLayout
                      isDark={isDark}
                      section={group.section}
                      cards={group.cards}
                      featuredMarketCards={featuredMarketCards}
                    />
                  </section>
                ))}

                <section>
                  <div className="mb-4 flex flex-col gap-1">
                    <p
                      className={
                        isDark
                          ? "text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200 sm:text-base"
                          : "text-sm font-semibold uppercase tracking-[0.22em] text-sky-700 sm:text-base"
                      }
                    >
                      {conclusionCopy.label}
                    </p>
                  </div>

                  <div
                    className={
                      isDark
                        ? "rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                        : "rounded-[1.8rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5 shadow-[0_18px_36px_rgba(148,163,184,0.10)]"
                    }
                  >
                    <p
                      className={
                        isDark
                          ? "text-sm leading-7 text-slate-300 sm:text-[15px]"
                          : "text-sm leading-7 text-slate-700 sm:text-[15px]"
                      }
                    >
                      {conclusionCopy.text}
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
