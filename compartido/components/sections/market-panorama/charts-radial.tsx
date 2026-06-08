"use client";

import {
  formatSeriesValue,
  getSeriesScaleBounds,
} from "@/components/sections/market-panorama/helpers";
import type { MiniChartProps } from "@/components/sections/market-panorama/charts-shared";

export function MiniDonutChart({
  isDark,
  card,
  series,
}: MiniChartProps) {
  const total = series.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const palette = isDark
    ? ["#22d3ee", "#38bdf8", "#a78bfa", "#34d399"]
    : ["#0284c7", "#0ea5e9", "#7c3aed", "#059669"];
  const segments = series.map((item, index) => {
    const dash = (item.value / total) * circumference;
    const previous = series
      .slice(0, index)
      .reduce((sum, entry) => sum + (entry.value / total) * circumference, 0);

    return {
      ...item,
      dash,
      offset: previous,
      color: palette[index % palette.length],
    };
  });

  return (
    <div
      className={
        isDark
          ? "mt-4 rounded-[1rem] border border-white/8 bg-white/[0.03] px-3 py-3"
          : "mt-4 rounded-[1rem] border border-slate-200 bg-slate-50/90 px-3 py-3"
      }
    >
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(148,163,184,0.24)"}
              strokeWidth="10"
            />
            {segments.map((segment) => (
              <circle
                key={`donut-${segment.label}`}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
                strokeDashoffset={-segment.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={isDark ? "text-lg font-semibold text-white" : "text-lg font-semibold text-slate-900"}>
              {Math.round(((series[0]?.value ?? 0) / total) * 100)}%
            </span>
            <span className={isDark ? "text-[10px] text-slate-400" : "text-[10px] text-slate-500"}>
              {card.unit === "%" ? "share" : "mix"}
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-2.5">
          {segments.map((item) => (
            <div
              key={`donut-legend-${item.label}`}
              className="flex items-center justify-between gap-3"
            >
              <span
                className={
                  isDark
                    ? "inline-flex items-center gap-2 text-[11px] text-slate-300"
                    : "inline-flex items-center gap-2 text-[11px] text-slate-700"
                }
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
              <span className={isDark ? "text-[11px] font-semibold text-slate-100" : "text-[11px] font-semibold text-slate-900"}>
                {Math.round((item.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MiniRangeChart({
  isDark,
  card,
  series,
}: MiniChartProps) {
  const { min, max } = getSeriesScaleBounds(card, series);

  return (
    <div
      className={
        isDark
          ? "mt-4 rounded-[1rem] border border-white/8 bg-white/[0.03] px-3 py-3"
          : "mt-4 rounded-[1rem] border border-slate-200 bg-slate-50/90 px-3 py-3"
      }
    >
      <div className="space-y-2.5">
        {series.map((item, index) => (
          <div
            key={`range-${index}`}
            className="grid grid-cols-[minmax(0,1fr)_56px] items-center gap-3"
          >
            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className={isDark ? "text-[11px] text-slate-300" : "text-[11px] text-slate-700"}>
                  {item.label}
                </span>
              </div>
              <div className={isDark ? "h-2.5 rounded-full bg-white/10" : "h-2.5 rounded-full bg-slate-200"}>
                <div
                  className={
                    isDark
                      ? "h-2.5 rounded-full bg-[linear-gradient(90deg,#34d399,#22d3ee,#38bdf8)] transition-[width] duration-700 ease-out"
                      : "h-2.5 rounded-full bg-[linear-gradient(90deg,#10b981,#0ea5e9,#6366f1)] transition-[width] duration-700 ease-out"
                  }
                  style={{
                    width: `${Math.max(8, ((item.value - min) / Math.max(max - min, 1)) * 100)}%`,
                    transitionDelay: `${index * 70}ms`,
                  }}
                />
              </div>
            </div>
            <span
              className={
                isDark
                  ? "text-right text-[11px] font-semibold text-slate-100"
                  : "text-right text-[11px] font-semibold text-slate-900"
              }
            >
              {formatSeriesValue(card, item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
