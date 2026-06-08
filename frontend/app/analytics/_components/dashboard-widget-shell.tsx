"use client";

import { useState, type ReactNode } from "react";
import {
  BarChart3,
  EyeOff,
  Grip,
  Settings2,
  SquareChartGantt,
  TrendingUp,
  AreaChart,
  PieChart,
  List,
  Sparkles,
} from "lucide-react";
import type {
  ChartType,
  WidgetConfig,
  WidgetId,
} from "@/app/analytics/_lib/dashboard-config";

const WIDGET_CHART_OPTIONS: Record<
  WidgetId,
  Array<{ value: ChartType; label: string; icon: typeof BarChart3 }>
> = {
  funnel: [
    { value: "bars", label: "Barras", icon: BarChart3 },
    { value: "vertical", label: "Vertical", icon: SquareChartGantt },
    { value: "step", label: "Embudo por etapas", icon: TrendingUp },
  ],
  trend: [
    { value: "line", label: "Línea", icon: TrendingUp },
    { value: "bars", label: "Barras", icon: BarChart3 },
    { value: "area", label: "Área", icon: AreaChart },
  ],
  performance: [
    { value: "bars", label: "Barras", icon: BarChart3 },
    { value: "scatter", label: "Dispersión", icon: Sparkles },
    { value: "histogram", label: "Histograma", icon: SquareChartGantt },
  ],
  pipeline: [
    { value: "circular", label: "Circular", icon: PieChart },
    { value: "bars", label: "Barras", icon: BarChart3 },
    { value: "list", label: "Lista", icon: List },
  ],
  stage_time: [
    { value: "bars", label: "Barras", icon: BarChart3 },
    { value: "line", label: "Línea", icon: TrendingUp },
    { value: "histogram", label: "Histograma", icon: SquareChartGantt },
  ],
  matching: [
    { value: "circular", label: "Circular", icon: PieChart },
    { value: "bars", label: "Barras", icon: BarChart3 },
    { value: "histogram", label: "Histograma", icon: SquareChartGantt },
  ],
};

function WidgetMenu({
  isDark,
  widget,
  editMode,
  onToggleHidden,
  onChartTypeChange,
}: {
  isDark: boolean;
  widget: WidgetConfig;
  editMode: boolean;
  onToggleHidden: () => void;
  onChartTypeChange: (value: ChartType) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = WIDGET_CHART_OPTIONS[widget.id];

  if (!editMode) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={
          isDark
            ? "ts-icon-button inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/4 text-slate-200"
            : "ts-icon-button inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700"
        }
      >
        <Settings2 className="h-4 w-4" />
      </button>
      {open ? (
        <div
          className={
            isDark
              ? "absolute right-0 top-[calc(100%+0.5rem)] z-20 w-56 rounded-[1rem] border border-white/10 bg-[#081120] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.32)]"
              : "absolute right-0 top-[calc(100%+0.5rem)] z-20 w-56 rounded-[1rem] border border-slate-300 bg-white p-2 shadow-[0_18px_40px_rgba(148,163,184,0.18)]"
          }
        >
          <button
            type="button"
            onClick={() => {
              onToggleHidden();
              setOpen(false);
            }}
            className={
              isDark
                ? "ts-action-secondary flex w-full items-center gap-2 rounded-[0.8rem] px-3 py-2 text-sm text-slate-200 hover:bg-white/8"
                : "ts-action-secondary flex w-full items-center gap-2 rounded-[0.8rem] px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            }
          >
            <EyeOff className="h-4 w-4" />
            Ocultar gráfico
          </button>
          <div className="mt-2 border-t border-white/8 pt-2">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Cambiar tipo
            </p>
            {options.map((option) => {
              const Icon = option.icon;
              const active = widget.chartType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChartTypeChange(option.value);
                    setOpen(false);
                  }}
                  className={
                    active
                      ? isDark
                        ? "flex w-full items-center gap-2 rounded-[0.8rem] bg-cyan-300/12 px-3 py-2 text-sm font-semibold text-cyan-100"
                        : "flex w-full items-center gap-2 rounded-[0.8rem] bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700"
                      : isDark
                        ? "ts-action-secondary flex w-full items-center gap-2 rounded-[0.8rem] px-3 py-2 text-sm text-slate-200 hover:bg-white/8"
                        : "ts-action-secondary flex w-full items-center gap-2 rounded-[0.8rem] px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  }
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function BlockShell({
  isDark,
  widget,
  editMode,
  icon: Icon,
  onToggleHidden,
  onChartTypeChange,
  children,
}: {
  isDark: boolean;
  widget: WidgetConfig;
  editMode: boolean;
  icon: typeof BarChart3;
  onToggleHidden: () => void;
  onChartTypeChange: (value: ChartType) => void;
  children: ReactNode;
}) {
  return (
    <article
      className={
        isDark
          ? "flex h-full min-h-0 flex-col overflow-hidden rounded-[1.7rem] border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(7,16,31,0.92),rgba(8,17,32,0.84))] p-5"
          : "flex h-full min-h-0 flex-col overflow-hidden rounded-[1.7rem] border border-slate-300 bg-white p-5"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex items-center gap-3 ${
            editMode ? "analytics-widget-handle cursor-grab active:cursor-grabbing" : ""
          }`}
        >
          {editMode ? (
            <span
              className={
                isDark
                  ? "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/4 text-slate-300"
                  : "inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-slate-500"
              }
            >
              <Grip className="h-4 w-4" />
            </span>
          ) : null}
          <Icon className={isDark ? "h-5 w-5 text-cyan-200" : "h-5 w-5 text-sky-700"} />
          <h2 className={isDark ? "text-lg font-semibold text-white" : "text-lg font-semibold text-slate-950"}>
            {widget.title}
          </h2>
        </div>
        <WidgetMenu
          isDark={isDark}
          widget={widget}
          editMode={editMode}
          onToggleHidden={onToggleHidden}
          onChartTypeChange={onChartTypeChange}
        />
      </div>
      <div className="analytics-widget-body mt-5 min-h-0 flex-1 overflow-hidden">
        {children}
      </div>
    </article>
  );
}
