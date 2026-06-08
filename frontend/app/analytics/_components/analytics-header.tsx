"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronDown, Eye, EyeOff, LayoutDashboard, Settings2 } from "lucide-react";
import { useAppLanguage } from "@/hooks/use-app-language";
import {
  DASHBOARD_PRESETS,
  WIDGET_ORDER,
  type DashboardConfig,
  type WidgetId,
} from "@/app/analytics/_lib/dashboard-config";

interface AnalyticsHeaderProps {
  isDark: boolean;
  headerStatus: string;
  advancedAnalyticsEnabled: boolean;
  widgetsMenuOpen: boolean;
  onToggleWidgetsMenu: () => void;
  config: DashboardConfig;
  setConfig: React.Dispatch<React.SetStateAction<DashboardConfig>>;
}

export function AnalyticsHeader({
  isDark,
  headerStatus,
  advancedAnalyticsEnabled,
  widgetsMenuOpen,
  onToggleWidgetsMenu,
  config,
  setConfig,
}: AnalyticsHeaderProps) {
  const { isEnglish } = useAppLanguage();
  const toggleWidgetHidden = (widgetId: WidgetId) => {
    setConfig((current) => ({
      ...current,
      widgets: {
        ...current.widgets,
        [widgetId]: { ...current.widgets[widgetId], hidden: !current.widgets[widgetId].hidden },
      },
    }));
  };

  return (
    <section
      className={
        isDark
          ? "rounded-[1.8rem] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(7,16,31,0.94),rgba(8,17,32,0.90))] p-6"
          : "rounded-[1.8rem] border border-slate-300 bg-white p-6"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className={
              isDark ? "text-3xl font-semibold text-white" : "text-3xl font-semibold text-slate-950"
            }
          >
            {isEnglish ? "Hiring performance" : "Rendimiento de contratación"}
          </h1>
          <p
            className={
              isDark
                ? "mt-3 max-w-3xl text-base font-medium text-cyan-100"
                : "mt-3 max-w-3xl text-base font-medium text-sky-800"
            }
          >
            {headerStatus}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap gap-3">
            <span
              className={
                advancedAnalyticsEnabled
                  ? isDark
                    ? "inline-flex rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100"
                    : "inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700"
                  : isDark
                    ? "inline-flex rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100"
                    : "inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700"
              }
            >
              {advancedAnalyticsEnabled
                ? isEnglish ? "Advanced plan" : "Plan avanzado"
                : isEnglish ? "Basic plan" : "Plan básico"}
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={onToggleWidgetsMenu}
                className={
                  isDark
                    ? "ts-action-secondary inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-semibold text-slate-100"
                    : "ts-action-secondary inline-flex items-center gap-2 rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                }
              >
                <Settings2 className="h-4 w-4" />
                {isEnglish ? "Widgets" : "Widgets"}
                <ChevronDown
                  className={`h-4 w-4 transition duration-200 ${widgetsMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {widgetsMenuOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={
                      isDark
                        ? "absolute right-0 top-[calc(100%+0.5rem)] z-30 w-72 rounded-[1rem] border border-white/10 bg-[#081120] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.32)]"
                        : "absolute right-0 top-[calc(100%+0.5rem)] z-30 w-72 rounded-[1rem] border border-slate-300 bg-white p-3 shadow-[0_18px_40px_rgba(148,163,184,0.18)]"
                    }
                  >
                    <div
                      className={
                        isDark
                          ? "rounded-[1rem] border border-white/8 bg-white/3 p-4"
                          : "rounded-[1rem] border border-slate-200 bg-slate-50 p-4"
                      }
                    >
                      <p
                        className={
                          isDark
                            ? "text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200"
                            : "text-xs font-semibold uppercase tracking-[0.18em] text-sky-700"
                        }
                      >
                        {isEnglish ? "Presets" : "Plantillas"}
                      </p>
                      <div className="mt-3 grid gap-2">
                        {DASHBOARD_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setConfig((current) => preset.apply(current));
                              onToggleWidgetsMenu();
                            }}
                            className={
                              isDark
                                ? "ts-action-secondary rounded-[0.9rem] border border-white/10 bg-white/4 px-3 py-2 text-sm text-slate-100"
                                : "ts-action-secondary rounded-[0.9rem] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                            }
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 space-y-3">
                      {WIDGET_ORDER.map((widgetId) => {
                        const widget = config.widgets[widgetId];
                        const active = !widget.hidden;
                        return (
                          <button
                            key={widgetId}
                            type="button"
                            onClick={() => toggleWidgetHidden(widgetId)}
                            className={
                              active
                                ? isDark
                                  ? "flex w-full items-center justify-between rounded-[1rem] border border-cyan-300/18 bg-cyan-300/12 px-4 py-3 text-sm font-semibold text-cyan-100"
                                  : "flex w-full items-center justify-between rounded-[1rem] border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700"
                                : isDark
                                  ? "ts-action-secondary flex w-full items-center justify-between rounded-[1rem] border border-white/10 bg-white/3 px-4 py-3 text-sm text-slate-300"
                                  : "ts-action-secondary flex w-full items-center justify-between rounded-[1rem] border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                            }
                          >
                            <span>{widget.title}</span>
                            {active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <Link
              href="/publicadas"
              className="ts-action-primary inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              {isEnglish ? "Improve visibility" : "Mejorar visibilidad"}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() =>
                setConfig((current) => ({ ...current, editMode: !current.editMode }))
              }
              className={
                config.editMode
                  ? isDark
                    ? "inline-flex items-center gap-2 rounded-[1rem] border border-cyan-300/18 bg-cyan-300/12 px-4 py-2.5 text-sm font-semibold text-cyan-100"
                    : "inline-flex items-center gap-2 rounded-[1rem] border border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700"
                  : isDark
                    ? "ts-action-secondary inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-semibold text-slate-100"
                    : "ts-action-secondary inline-flex items-center gap-2 rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              {config.editMode
                ? isEnglish ? "Editing dashboard" : "Editando panel"
                : isEnglish ? "Edit dashboard" : "Editar panel"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
