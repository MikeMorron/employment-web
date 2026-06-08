"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import {
  CheckCircle2,
  TriangleAlert,
  Sparkles,
} from "lucide-react";
import type {
  InsightTone,
  WidgetStat,
} from "@/app/analytics/_lib/dashboard-config";

export function AnalyticsEmptyBlock({
  isDark,
  title,
  copy,
  ctaHref,
  ctaLabel,
}: {
  isDark: boolean;
  title: string;
  copy: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div
      className={
        isDark
          ? "rounded-[1rem] border border-dashed border-white/10 bg-white/3 px-4 py-4 text-sm text-slate-300"
          : "rounded-[1rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600"
      }
    >
      <p className={isDark ? "font-semibold text-white" : "font-semibold text-slate-900"}>
        {title}
      </p>
      <p className="mt-2 leading-6">{copy}</p>
      {ctaHref && ctaLabel ? (
        <Link
          href={ctaHref}
          className="ts-action-primary mt-4 inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function InsightCard({
  isDark,
  tone,
  title,
  copy,
}: {
  isDark: boolean;
  tone: InsightTone;
  title: string;
  copy: string;
}) {
  const toneClasses =
    tone === "good"
      ? isDark
        ? "border-emerald-300/18 bg-emerald-400/10 text-emerald-100"
        : "border-emerald-300 bg-emerald-50 text-emerald-800"
      : tone === "warning"
        ? isDark
          ? "border-rose-300/18 bg-rose-400/10 text-rose-100"
          : "border-rose-300 bg-rose-50 text-rose-800"
        : isDark
          ? "border-cyan-300/18 bg-cyan-300/10 text-cyan-100"
          : "border-sky-300 bg-sky-50 text-sky-800";

  const Icon =
    tone === "good" ? CheckCircle2 : tone === "warning" ? TriangleAlert : Sparkles;

  return (
    <article className={`rounded-[1.35rem] border p-5 ${toneClasses}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
            Hallazgo clave
          </p>
          <h2 className="mt-2 text-lg font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-6 opacity-90">{copy}</p>
        </div>
      </div>
    </article>
  );
}

export function KpiCard({
  isDark,
  icon: Icon,
  label,
  value,
  context,
  isZero,
}: {
  isDark: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  context: string;
  isZero: boolean;
}) {
  const accent = isZero
    ? isDark
      ? "border-white/8 bg-white/3"
      : "border-slate-300 bg-slate-50"
    : isDark
      ? "border-cyan-300/16 bg-cyan-300/10"
      : "border-sky-300 bg-sky-50/80";
  const iconTone = isZero
    ? isDark
      ? "text-slate-300"
      : "text-slate-500"
    : isDark
      ? "text-cyan-200"
      : "text-sky-700";

  return (
    <article className={`rounded-[1.3rem] border p-4 ${accent}`}>
      <Icon className={`h-6 w-6 ${iconTone}`} />
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p
        className={
          isDark
            ? "mt-2 text-3xl font-semibold text-white"
            : "mt-2 text-3xl font-semibold text-slate-950"
        }
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {isZero ? "Sin actividad aún" : "Últimos 7 días"}
      </p>
      <p
        className={
          isDark
            ? "mt-2 text-sm leading-6 text-slate-300"
            : "mt-2 text-sm leading-6 text-slate-600"
        }
      >
        {context}
      </p>
    </article>
  );
}

export function SimpleBars({
  isDark,
  rows,
  showBest = false,
}: {
  isDark: boolean;
  rows: Array<WidgetStat & { isBest?: boolean }>;
  showBest?: boolean;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-3">
            <span
              className={
                isDark
                  ? "inline-flex items-center gap-2 text-xs text-slate-300"
                  : "inline-flex items-center gap-2 text-xs text-slate-700"
              }
            >
              {row.label}
              {showBest && row.isBest ? (
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
            </span>
            <span
              className={
                isDark
                  ? "text-xs font-semibold text-white"
                  : "text-xs font-semibold text-slate-900"
              }
            >
              {row.value}
            </span>
          </div>
          <div className={isDark ? "h-2.5 rounded-full bg-white/8" : "h-2.5 rounded-full bg-slate-100"}>
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

export function SimpleVertical({
  isDark,
  rows,
}: {
  isDark: boolean;
  rows: WidgetStat[];
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}
    >
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col items-center gap-2">
          <div
            className={
              isDark
                ? "flex h-40 w-full items-end rounded-[1rem] bg-white/6 p-2"
                : "flex h-40 w-full items-end rounded-[1rem] bg-slate-100 p-2"
            }
          >
            <div
              className="w-full rounded-[0.8rem] bg-gradient-to-t from-sky-500 via-cyan-400 to-emerald-400"
              style={{ height: `${Math.max(10, Math.round((row.value / max) * 100))}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">{row.label}</span>
          <span className={isDark ? "text-xs text-white" : "text-xs text-slate-900"}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SimpleLine({
  isDark,
  rows,
  area = false,
}: {
  isDark: boolean;
  rows: WidgetStat[];
  area?: boolean;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  const min = Math.min(...rows.map((row) => row.value), 0);
  const range = Math.max(max - min, 1);
  const coords = rows.map((row, index) => {
    const x =
      rows.length === 1 ? 50 : 6 + (index / Math.max(rows.length - 1, 1)) * 88;
    const y = 90 - ((row.value - min) / range) * 78;
    return { ...row, x, y };
  });
  const path = coords
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const fill = [`6,90`, ...coords.map((point) => `${point.x},${point.y}`), `94,90`].join(
    " ",
  );

  return (
    <div>
      <svg viewBox="0 0 100 100" className="h-40 w-full overflow-visible">
        {[20, 40, 60, 80].map((y) => (
          <line
            key={y}
            x1="6"
            x2="94"
            y1={y}
            y2={y}
            stroke={
              isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(148,163,184,0.24)"
            }
            strokeDasharray="2 4"
          />
        ))}
        {area ? (
          <polygon
            fill={isDark ? "rgba(34,211,238,0.14)" : "rgba(14,165,233,0.12)"}
            points={fill}
          />
        ) : null}
        <path
          d={path}
          fill="none"
          stroke={isDark ? "#67e8f9" : "#0284c7"}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((point) => (
          <circle
            key={point.label}
            cx={point.x}
            cy={point.y}
            r="2.8"
            fill={isDark ? "#fbbf24" : "#0284c7"}
            stroke={isDark ? "#081120" : "#fff"}
            strokeWidth="1.2"
          />
        ))}
      </svg>
    </div>
  );
}

export function SimpleCircular({
  isDark,
  rows,
}: {
  isDark: boolean;
  rows: WidgetStat[];
}) {
  const total = Math.max(1, rows.reduce((sum, row) => sum + row.value, 0));
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const palette = isDark
    ? ["#67e8f9", "#34d399", "#a78bfa", "#f59e0b", "#f472b6", "#fb7185"]
    : ["#0284c7", "#059669", "#7c3aed", "#d97706", "#db2777", "#e11d48"];
  const segments = rows.reduce<
    Array<WidgetStat & { dash: number; offset: number; color: string }>
  >((accumulator, row, index) => {
    const dash = (row.value / total) * circumference;
    const offset =
      accumulator.length > 0
        ? accumulator[accumulator.length - 1].offset +
          accumulator[accumulator.length - 1].dash
        : 0;
    accumulator.push({
      ...row,
      dash,
      offset,
      color: palette[index % palette.length],
    });
    return accumulator;
  }, []);

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={
              isDark ? "rgba(255,255,255,0.08)" : "rgba(148,163,184,0.22)"
            }
            strokeWidth="10"
          />
          {segments.map((segment) => (
            <circle
              key={segment.label}
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
            {total}
          </span>
          <span className="text-[10px] text-slate-500">Total</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between gap-3">
            <span
              className={
                isDark
                  ? "inline-flex items-center gap-2 text-xs text-slate-300"
                  : "inline-flex items-center gap-2 text-xs text-slate-700"
              }
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              {segment.label}
            </span>
            <span
              className={
                isDark
                  ? "text-xs font-semibold text-white"
                  : "text-xs font-semibold text-slate-900"
              }
            >
              {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SimpleScatter({
  isDark,
  rows,
}: {
  isDark: boolean;
  rows: WidgetStat[];
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <svg viewBox="0 0 100 100" className="h-44 w-full overflow-visible">
      {[20, 40, 60, 80].map((y) => (
        <line
          key={y}
          x1="8"
          x2="92"
          y1={y}
          y2={y}
          stroke={
            isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(148,163,184,0.24)"
          }
          strokeDasharray="2 4"
        />
      ))}
      {rows.map((row, index) => {
        const x =
          rows.length === 1 ? 50 : 10 + (index / Math.max(rows.length - 1, 1)) * 80;
        const y = 88 - (row.value / max) * 68;
        return (
          <g key={row.label}>
            <circle cx={x} cy={y} r="4" fill={isDark ? "#67e8f9" : "#0284c7"} />
            <text x={x} y="96" textAnchor="middle" className="fill-slate-500 text-[4px]">
              {row.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
