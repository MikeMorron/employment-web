"use client";

import type { WidgetStat, ChartType } from "@/app/analytics/_lib/dashboard-config";
import {
  TriangleAlert,
} from "lucide-react";
import { AnalyticsEmptyBlock, InsightCard, KpiCard, SimpleBars, SimpleCircular, SimpleLine, SimpleScatter, SimpleVertical } from "@/app/analytics/_components/dashboard-primitives";
import { BlockShell } from "@/app/analytics/_components/dashboard-widget-shell";

export {
  AnalyticsEmptyBlock,
  BlockShell,
  InsightCard,
  KpiCard,
  SimpleBars,
  SimpleCircular,
  SimpleLine,
  SimpleScatter,
  SimpleVertical,
};

export function FunnelBars({
  isDark,
  stages,
}: {
  isDark: boolean;
  stages: Array<{ label: string; value: number }>;
}) {
  if (stages.length === 0 || stages.every((stage) => stage.value === 0)) {
    return null;
  }

  return (
    <div className="space-y-2">
      {stages.map((stage, index) => {
        const nextStage = stages[index + 1];
        const conversion = nextStage
          ? stage.value > 0
            ? Math.round((nextStage.value / stage.value) * 100)
            : 0
          : null;
        return (
          <div key={stage.label}>
            <div
              className={
                isDark
                  ? "rounded-[1rem] border border-cyan-300/16 bg-cyan-300/10 px-4 py-3 text-white"
                  : "rounded-[1rem] border border-sky-300 bg-sky-50 px-4 py-3 text-slate-950"
              }
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{stage.label}</span>
                <span className="text-lg font-semibold">({stage.value})</span>
              </div>
            </div>
            {nextStage ? (
              <div className="flex flex-col items-center py-2 text-center">
                <span
                  className={
                    isDark
                      ? "text-xs font-semibold text-slate-400"
                      : "text-xs font-semibold text-slate-500"
                  }
                >
                  ↓ {conversion}%
                </span>
                {nextStage.value === 0 ? (
                  <span
                    className={
                      isDark
                        ? "mt-1 text-[11px] text-rose-300"
                        : "mt-1 text-[11px] text-rose-600"
                    }
                  >
                    Sin conversión
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function FunnelStep({
  isDark,
  stages,
}: {
  isDark: boolean;
  stages: Array<{ label: string; value: number }>;
}) {
  if (stages.length === 0 || stages.every((stage) => stage.value === 0)) {
    return null;
  }

  const max = Math.max(...stages.map((stage) => stage.value), 1);
  return (
    <div className="space-y-3">
      {stages.map((stage, index) => (
        <div key={stage.label} className="flex items-center gap-3">
          <div
            className={
              isDark
                ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan-300/16 bg-cyan-300/10 text-white"
                : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sky-300 bg-sky-50 text-slate-900"
            }
          >
            {index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-3">
              <span
                className={
                  isDark
                    ? "text-sm font-semibold text-white"
                    : "text-sm font-semibold text-slate-900"
                }
              >
                {stage.label}
              </span>
              <span className={isDark ? "text-sm text-slate-300" : "text-sm text-slate-600"}>
                {stage.value}
              </span>
            </div>
            <div className={isDark ? "h-3 rounded-full bg-white/8" : "h-3 rounded-full bg-slate-100"}>
              <div
                className="h-3 rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400"
                style={{ width: `${Math.max(10, Math.round((stage.value / max) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({
  isDark,
  points,
  type,
}: {
  isDark: boolean;
  points: WidgetStat[];
  type: ChartType;
}) {
  if (type === "bars") {
    return <SimpleVertical isDark={isDark} rows={points} />;
  }

  return <SimpleLine isDark={isDark} rows={points} area={type === "area"} />;
}

export function PerformanceChart({
  isDark,
  rows,
  insightsByLabel,
}: {
  isDark: boolean;
  rows: Array<WidgetStat & { isBest?: boolean }>;
  insightsByLabel?: Record<string, { title: string; copy: string }>;
}) {
  if (rows.length === 0 || rows.every((row) => row.value === 0)) {
    return (
      <AnalyticsEmptyBlock
        isDark={isDark}
        title="No hay actividad en tus vacantes"
        copy="Aún no tienes señales suficientes para comparar rendimiento entre publicaciones."
      />
    );
  }

  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div
          key={row.label}
          className={
            isDark
              ? "rounded-[1rem] border border-white/8 bg-white/3 p-4"
              : "rounded-[1rem] border border-slate-200 bg-slate-50 p-4"
          }
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={
                    isDark
                      ? "text-sm font-semibold text-white"
                      : "text-sm font-semibold text-slate-900"
                  }
                >
                  {row.label}
                </p>
                {row.isBest ? (
                  <span
                    className={
                      isDark
                        ? "rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-100"
                        : "rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                    }
                  >
                    Mejor rendimiento
                  </span>
                ) : null}
              </div>
              {insightsByLabel?.[row.label] ? (
                <div
                  className={
                    isDark
                      ? "mt-3 flex items-start gap-2 rounded-[0.95rem] border border-amber-300/16 bg-amber-400/8 px-3 py-2 text-xs text-amber-100"
                      : "mt-3 flex items-start gap-2 rounded-[0.95rem] border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                  }
                >
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold leading-5">
                      {insightsByLabel[row.label].title}
                    </p>
                    <p className="line-clamp-2 leading-5 opacity-90">
                      {insightsByLabel[row.label].copy}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            <span
              className={
                isDark
                  ? "text-sm font-semibold text-white"
                  : "text-sm font-semibold text-slate-900"
              }
            >
              {row.value}
            </span>
          </div>
          <div className={isDark ? "mt-3 h-2.5 rounded-full bg-white/8" : "mt-3 h-2.5 rounded-full bg-slate-100"}>
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-violet-500 via-sky-500 to-cyan-400"
              style={{ width: `${Math.max(8, Math.round((row.value / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PipelineChart({
  isDark,
  rows,
  type,
}: {
  isDark: boolean;
  rows: WidgetStat[];
  type: ChartType;
}) {
  if (type === "bars") {
    return <SimpleBars isDark={isDark} rows={rows} />;
  }

  if (type === "list") {
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    return (
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className={
              isDark
                ? "rounded-[1rem] border border-white/8 bg-white/3 px-4 py-3"
                : "rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3"
            }
          >
            <div className="flex items-center justify-between gap-3">
              <span className={isDark ? "text-sm text-slate-200" : "text-sm text-slate-700"}>
                {row.label}
              </span>
              <span
                className={
                  isDark
                    ? "text-sm font-semibold text-white"
                    : "text-sm font-semibold text-slate-900"
                }
              >
                {row.value} · {total > 0 ? Math.round((row.value / total) * 100) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <SimpleCircular isDark={isDark} rows={rows} />;
}

export function StageDurationChart({
  isDark,
  rows,
}: {
  isDark: boolean;
  rows: WidgetStat[];
}) {
  return <SimpleBars isDark={isDark} rows={rows} />;
}
