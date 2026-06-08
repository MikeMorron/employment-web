"use client";

import { useAppLanguage } from "@/hooks/use-app-language";
import {
  formatBarHeaderValue,
  formatSeriesValue,
  getAnnualUnemploymentChangeRows,
  getSeriesScaleBounds,
} from "@/components/sections/market-panorama/helpers";
import type { MiniChartProps } from "@/components/sections/market-panorama/charts-shared";
import { MiniAreaLineChart } from "@/components/sections/market-panorama/charts-lines";

function AnnualDeltaAlignedChart({
  isDark,
  card,
  series,
}: MiniChartProps) {
  return <MiniAreaLineChart isDark={isDark} card={card} series={series} />;
}

export function MiniBarChart({
  isDark,
  card,
  series,
}: MiniChartProps) {
  const { isEnglish } = useAppLanguage();
  const { max } = getSeriesScaleBounds(card, series);
  const gridColumns = `repeat(${series.length}, minmax(0, 1fr))`;
  const showAnnualComparisonTable = card.id === "annual-unemployment-comparison";
  const barPalette = isDark
    ? [
        "linear-gradient(180deg,#67e8f9,#22d3ee,#0f172a)",
        "linear-gradient(180deg,#a78bfa,#818cf8,#1e1b4b)",
        "linear-gradient(180deg,#34d399,#10b981,#052e2b)",
        "linear-gradient(180deg,#f59e0b,#f97316,#431407)",
        "linear-gradient(180deg,#f472b6,#ec4899,#4a044e)",
      ]
    : [
        "linear-gradient(180deg,#38bdf8,#0ea5e9,#dbeafe)",
        "linear-gradient(180deg,#a78bfa,#7c3aed,#ede9fe)",
        "linear-gradient(180deg,#34d399,#059669,#d1fae5)",
        "linear-gradient(180deg,#fbbf24,#f97316,#ffedd5)",
        "linear-gradient(180deg,#f472b6,#db2777,#fce7f3)",
      ];

  return (
    <div
      className={
        isDark
          ? "mt-4 rounded-[1rem] border border-white/8 bg-white/[0.03] px-2 py-2"
          : "mt-4 rounded-[1rem] border border-slate-200 bg-slate-50/90 px-2 py-2"
      }
    >
      <div
        className="relative grid h-36 items-end gap-2"
        style={{ gridTemplateColumns: gridColumns }}
      >
        {series.map((item, index) => (
          <div
            key={`bar-${index}`}
            className="relative z-[1] flex h-full flex-col items-center gap-2"
          >
            <span
              className={
                isDark
                  ? "text-[10px] font-medium text-slate-300"
                  : "text-[10px] font-medium text-slate-700"
              }
            >
              {formatBarHeaderValue(card, item.value)}
            </span>
            <div
              className={
                isDark
                  ? "flex h-[94px] w-full items-end justify-center rounded-[1rem] bg-white/[0.03]"
                  : "flex h-[94px] w-full items-end justify-center rounded-[1rem] bg-white/75"
              }
            >
              <div
                className="w-[68%] rounded-t-[0.95rem] shadow-[0_10px_24px_rgba(14,165,233,0.18)] transition-[height,transform] duration-700 ease-out hover:-translate-y-1"
                style={{
                  height: `${Math.max(18, Math.round((item.value / max) * 100))}%`,
                  transitionDelay: `${index * 90}ms`,
                  backgroundImage: barPalette[index % barPalette.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
      {showAnnualComparisonTable ? (
        <div
          className={
            isDark
              ? "mt-4 rounded-[0.95rem] border border-white/8 bg-black/10 px-3 py-3"
              : "mt-4 rounded-[0.95rem] border border-slate-200 bg-white/70 px-3 py-3"
          }
        >
          <div className="space-y-2.5">
            {getAnnualUnemploymentChangeRows(isEnglish).map((row) => (
              <div
                key={row.year}
                className={
                  isDark
                    ? "rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2.5"
                    : "rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5"
                }
              >
                <p
                  className={`text-[11px] font-semibold ${
                    row.positive
                      ? isDark
                        ? "text-amber-300"
                        : "text-amber-700"
                      : isDark
                        ? "text-emerald-300"
                        : "text-emerald-700"
                  }`}
                >
                  {row.heading}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className="mt-3 grid gap-2"
          style={{ gridTemplateColumns: gridColumns }}
        >
          {series.map((item, index) => (
            <div key={`bar-label-${index}`} className="flex-1 text-center">
              <span className="block text-[10px] text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MiniHorizontalBarChart({
  isDark,
  card,
  series,
}: MiniChartProps) {
  const { max } = getSeriesScaleBounds(card, series);
  const barPalette = isDark
    ? [
        "linear-gradient(90deg,#22d3ee,#38bdf8)",
        "linear-gradient(90deg,#a78bfa,#818cf8)",
        "linear-gradient(90deg,#34d399,#22c55e)",
        "linear-gradient(90deg,#f59e0b,#f97316)",
        "linear-gradient(90deg,#f472b6,#ec4899)",
      ]
    : [
        "linear-gradient(90deg,#0284c7,#0ea5e9)",
        "linear-gradient(90deg,#7c3aed,#6366f1)",
        "linear-gradient(90deg,#059669,#10b981)",
        "linear-gradient(90deg,#d97706,#f97316)",
        "linear-gradient(90deg,#db2777,#ec4899)",
      ];

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
            key={`hbar-${index}`}
            className={
              isDark
                ? "grid grid-cols-[18px_minmax(0,1fr)_52px] items-center gap-3 rounded-[0.95rem] border border-white/6 bg-black/10 px-2.5 py-2"
                : "grid grid-cols-[18px_minmax(0,1fr)_52px] items-center gap-3 rounded-[0.95rem] border border-slate-200 bg-white/80 px-2.5 py-2"
            }
          >
            <span
              className="h-4.5 w-4.5 rounded-full shadow-[0_0_0_2px_rgba(255,255,255,0.08)]"
              style={{ backgroundImage: barPalette[index % barPalette.length] }}
            />
            <div className="min-w-0">
              <div className="mb-1 flex items-center justify-between gap-3">
                <span
                  className={
                    isDark
                      ? "truncate text-[10px] font-medium text-slate-200"
                      : "truncate text-[10px] font-medium text-slate-700"
                  }
                >
                  {item.label}
                </span>
                <span className="text-[9px] uppercase tracking-[0.1em] text-slate-500">
                  {Math.round((item.value / max) * 100)}%
                </span>
              </div>
              <div className={isDark ? "h-1.5 rounded-full bg-white/10" : "h-1.5 rounded-full bg-slate-200"}>
                <div
                  className="h-1.5 rounded-full transition-[width] duration-700 ease-out"
                  style={{
                    width: `${Math.max(6, Math.min(96, (item.value / max) * 100))}%`,
                    transitionDelay: `${index * 80}ms`,
                    backgroundImage: barPalette[index % barPalette.length],
                  }}
                />
              </div>
            </div>
            <span
              className={
                isDark
                  ? "text-right text-[10px] text-slate-300"
                  : "text-right text-[10px] text-slate-700"
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

export function MiniLineChart({
  isDark,
  card,
  series,
}: MiniChartProps) {
  if (card.id === "annual-unemployment-delta") {
    return <AnnualDeltaAlignedChart isDark={isDark} card={card} series={series} />;
  }

  return <MiniAreaLineChart isDark={isDark} card={card} series={series} />;
}
