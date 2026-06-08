"use client";

import { BriefcaseBusiness } from "lucide-react";

export type ChartPoint = {
  label: string;
  clicks: number;
  uniques: number;
};

export function buildFallbackSeries() {
  return [
    { label: "Mon", clicks: 120, uniques: 140 },
    { label: "Tue", clicks: 960, uniques: 540 },
    { label: "Wed", clicks: 520, uniques: 520 },
    { label: "Thu", clicks: 760, uniques: 580 },
    { label: "Fri", clicks: 360, uniques: 470 },
    { label: "Sat", clicks: 590, uniques: 600 },
    { label: "Sun", clicks: 220, uniques: 660 },
  ];
}

export function buildChartSeries(input: Array<{ label: string; value: number }>, clicksTotal: number, viewsTotal: number): ChartPoint[] {
  if (!input.length) {
    return buildFallbackSeries();
  }

  const base = input.slice(-7);
  const scale = Math.max(1, clicksTotal, viewsTotal);

  return base.map((item, index) => {
    const clicks = Math.max(80, Math.round((item.value / Math.max(1, clicksTotal || scale)) * scale));
    const uniques = Math.max(70, Math.round((item.value / Math.max(1, viewsTotal || scale)) * (scale * 0.72 + index * 18)));
    return {
      label: item.label.slice(0, 3),
      clicks,
      uniques,
    };
  });
}

function buildAreaPath(values: number[], width: number, height: number) {
  if (!values.length) {
    return "";
  }

  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => ({
    x: index * step,
    y: height - (value / max) * (height - 12),
  }));

  let path = `M ${points[0]?.x ?? 0} ${points[0]?.y ?? height}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const controlX = (previous.x + current.x) / 2;
    path += ` C ${controlX} ${previous.y}, ${controlX} ${current.y}, ${current.x} ${current.y}`;
  }

  return path;
}

function buildAreaFillPath(values: number[], width: number, height: number) {
  const line = buildAreaPath(values, width, height);
  if (!line) {
    return "";
  }

  return `${line} L ${width} ${height} L 0 ${height} Z`;
}

function offsetSvgPath(path: string, offsetX: number) {
  let isXCoordinate = true;
  return path.replace(/-?\d+(?:\.\d+)?/g, (token) => {
    const numeric = Number(token);
    const next = isXCoordinate ? numeric + offsetX : numeric;
    isXCoordinate = !isXCoordinate;
    return String(next);
  });
}

function buildChartTicks(max: number) {
  const rawTicks = [0, 250, 500, 750, 1000].map((tick) => Math.min(tick, Math.ceil(max / 50) * 50 || tick));
  return Array.from(new Set(rawTicks)).sort((left, right) => left - right);
}

export function formatDuration(hours: number) {
  if (!hours || hours <= 0) {
    return "N/D";
  }

  const totalMinutes = Math.max(1, Math.round(hours * 60));
  const mins = totalMinutes % 60;
  const hrs = Math.floor(totalMinutes / 60);

  if (hrs <= 0) {
    return `${mins}m`;
  }

  return `${hrs}h ${mins}m`;
}

export function MetricCard({
  isDark,
  icon: Icon,
  label,
  value,
  helper,
}: {
  isDark: boolean;
  icon: typeof BriefcaseBusiness;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className={isDark ? "rounded-[1.5rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(7,16,31,0.94),rgba(8,17,32,0.90))] p-5 shadow-[inset_0_1px_0_rgba(125,211,252,0.04)]" : "rounded-[1.5rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5 shadow-[0_14px_32px_rgba(148,163,184,0.08)]"}>
      <div className="flex items-center justify-between gap-3">
        <p className={isDark ? "text-sm font-medium text-white" : "text-sm font-medium text-slate-900"}>{label}</p>
        <Icon className={isDark ? "h-4 w-4 text-cyan-200" : "h-4 w-4 text-sky-700"} />
      </div>
      <p className={isDark ? "mt-5 text-[2rem] font-semibold leading-none text-white" : "mt-5 text-[2rem] font-semibold leading-none text-slate-950"}>{value}</p>
      <p className={isDark ? "mt-2 text-xs text-slate-400" : "mt-2 text-xs text-slate-500"}>{helper}</p>
    </article>
  );
}

export function SimpleBars({
  isDark,
  items,
  suffix = "",
}: {
  isDark: boolean;
  items: Array<{ label: string; value: number }>;
  suffix?: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className={isDark ? "text-slate-400" : "text-slate-600"}>{item.label}</span>
            <span className={isDark ? "text-slate-200" : "text-slate-900"}>
              {item.value}
              {suffix}
            </span>
          </div>
          <div className={isDark ? "h-2 rounded-full bg-[#132038]" : "h-2 rounded-full bg-slate-200"}>
            <div
              className={isDark ? "h-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400" : "h-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500"}
              style={{ width: `${Math.max(4, Math.round((item.value / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrafficChart({ isDark, data }: { isDark: boolean; data: ChartPoint[] }) {
  const chartWidth = 820;
  const chartHeight = 248;
  const gutterLeft = 44;
  const gutterRight = 12;
  const innerWidth = chartWidth - gutterLeft - gutterRight;
  const clicksPath = offsetSvgPath(buildAreaPath(data.map((point) => point.clicks), innerWidth, chartHeight), gutterLeft);
  const clicksFill = offsetSvgPath(buildAreaFillPath(data.map((point) => point.clicks), innerWidth, chartHeight), gutterLeft);
  const uniquesPath = offsetSvgPath(buildAreaPath(data.map((point) => point.uniques), innerWidth, chartHeight), gutterLeft);
  const uniquesFill = offsetSvgPath(buildAreaFillPath(data.map((point) => point.uniques), innerWidth, chartHeight), gutterLeft);
  const max = Math.max(...data.flatMap((point) => [point.clicks, point.uniques]), 1);
  const yTicks = buildChartTicks(max);

  return (
    <div className="mt-6">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 28}`} className="h-[292px] w-full" aria-hidden="true">
        {yTicks.map((tick) => {
          const y = chartHeight - (tick / Math.max(...yTicks, 1)) * (chartHeight - 12);
          return (
            <g key={`tick-${tick}-${y}`}>
              <text x="10" y={y + 4} className={isDark ? "fill-slate-500 text-[12px]" : "fill-slate-400 text-[12px]"}>
                {tick}
              </text>
            </g>
          );
        })}

        <path d={clicksFill} fill={isDark ? "rgba(56,189,248,0.16)" : "rgba(14,165,233,0.14)"} />
        <path d={uniquesFill} fill={isDark ? "rgba(244,114,182,0.10)" : "rgba(168,85,247,0.10)"} />
        <path d={clicksPath} fill="none" stroke={isDark ? "#67e8f9" : "#0284c7"} strokeWidth="1.8" />
        <path d={uniquesPath} fill="none" stroke={isDark ? "#c084fc" : "#7c3aed"} strokeWidth="1.5" />

        {data.map((point, index) => {
          const x = data.length > 1 ? gutterLeft + (innerWidth / (data.length - 1)) * index : gutterLeft + innerWidth / 2;
          return (
            <text
              key={`${point.label}-${index}`}
              x={x}
              y={chartHeight + 16}
              textAnchor="middle"
              className={isDark ? "fill-slate-500 text-[12px]" : "fill-slate-500 text-[12px]"}
            >
              {point.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
