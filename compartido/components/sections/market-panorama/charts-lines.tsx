"use client";

import {
  formatSeriesValue,
  getSeriesScaleBounds,
} from "@/components/sections/market-panorama/helpers";
import type { MiniChartProps } from "@/components/sections/market-panorama/charts-shared";

export function MiniAreaLineChart({
  isDark,
  card,
  series,
}: MiniChartProps) {
  const { min, max } = getSeriesScaleBounds(card, series);
  const minBound = Math.min(min, 0);
  const maxBound = Math.max(max, 0);
  const range = Math.max(maxBound - minBound, 1);
  const zeroRatio = (0 - minBound) / range;
  const zeroLineBottom = `${Math.max(0, Math.min(100, zeroRatio * 100))}%`;
  const barPalette = isDark
    ? [
        "linear-gradient(180deg,#67e8f9,#22d3ee)",
        "linear-gradient(180deg,#a78bfa,#818cf8)",
        "linear-gradient(180deg,#34d399,#10b981)",
        "linear-gradient(180deg,#f59e0b,#f97316)",
        "linear-gradient(180deg,#f472b6,#ec4899)",
      ]
    : [
        "linear-gradient(180deg,#38bdf8,#0ea5e9)",
        "linear-gradient(180deg,#a78bfa,#7c3aed)",
        "linear-gradient(180deg,#34d399,#059669)",
        "linear-gradient(180deg,#fbbf24,#f97316)",
        "linear-gradient(180deg,#f472b6,#db2777)",
      ];
  const negativePalette = isDark
    ? "linear-gradient(180deg,#fca5a5,#ef4444)"
    : "linear-gradient(180deg,#fb7185,#e11d48)";
  const maxBarHeight = 74;

  return (
    <div
      className={
        isDark
          ? "mt-4 rounded-[1rem] border border-white/8 bg-white/[0.03] px-3 py-3"
          : "mt-4 rounded-[1rem] border border-slate-200 bg-slate-50/90 px-3 py-3"
      }
    >
      <div
        className={
          isDark
            ? "rounded-[1rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] px-2.5 py-2.5"
            : "rounded-[1rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] px-2.5 py-2.5"
        }
      >
        <div
          className="relative grid h-40 items-stretch gap-2 pt-5"
          style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}
        >
          {[20, 40, 60, 80].map((offset) => (
            <span
              key={`bar-guide-${offset}`}
              className="pointer-events-none absolute left-0 right-0 border-t border-dashed"
              style={{
                bottom: `${offset}%`,
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(148,163,184,0.22)",
              }}
            />
          ))}
          <span
            className="pointer-events-none absolute left-0 right-0 border-t"
            style={{
              bottom: zeroLineBottom,
              borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(148,163,184,0.42)",
            }}
          />
          {series.map((item, index) => {
            const height = Math.max(8, Math.round((Math.abs(item.value) / range) * maxBarHeight));
            const isNegative = item.value < 0;
            const labelBottom = isNegative
              ? `calc(${zeroLineBottom} + 8px)`
              : `calc(${zeroLineBottom} + ${height}% + 8px)`;

            return (
              <div key={`simple-bar-${index}`} className="relative h-full">
                <span
                  className={
                    isDark
                      ? "absolute left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-300"
                      : "absolute left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-700"
                  }
                  style={{ bottom: labelBottom }}
                >
                  {formatSeriesValue(card, item.value)}
                </span>
                <div
                  className="absolute left-1/2 w-[68%] -translate-x-1/2 rounded-[0.8rem] shadow-[0_10px_24px_rgba(14,165,233,0.18)] transition-[height,transform] duration-700 ease-out hover:-translate-y-0.5"
                  style={{
                    height: `${height}%`,
                    bottom: isNegative ? `calc(${zeroLineBottom} - ${height}%)` : zeroLineBottom,
                    backgroundImage: isNegative ? negativePalette : barPalette[index % barPalette.length],
                    borderTopLeftRadius: isNegative ? "0.2rem" : "0.8rem",
                    borderTopRightRadius: isNegative ? "0.2rem" : "0.8rem",
                    borderBottomLeftRadius: isNegative ? "0.8rem" : "0.2rem",
                    borderBottomRightRadius: isNegative ? "0.8rem" : "0.2rem",
                    transitionDelay: `${index * 70}ms`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="mt-2 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}
      >
        {series.map((item, index) => (
          <div key={`line-label-${index}`} className="text-center">
            <span className="block text-[10px] text-slate-500">{item.label}</span>
            <span
              className={
                isDark ? "text-[10px] text-slate-400" : "text-[10px] text-slate-600"
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

