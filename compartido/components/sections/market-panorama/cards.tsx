"use client";

import { Activity, BarChart3, BriefcaseBusiness, Sparkles } from "lucide-react";
import { useAppLanguage } from "@/hooks/use-app-language";
import type { MetricCard } from "@/lib/market/types";
import { truncateLabel } from "@/lib/market/utils";
import {
  formatMetricValue,
  getAnnualUnemploymentDeltaSummary,
} from "@/components/sections/market-panorama/helpers";
import {
  MiniBarChart,
  MiniDonutChart,
  MiniHorizontalBarChart,
  MiniLineChart,
  MiniRangeChart,
} from "@/components/sections/market-panorama/charts";
import { SPECIALIZED_CARD_COMPONENTS } from "@/components/sections/market-panorama/cards-specialized";

export type CardVariant = "hero" | "wide" | "medium" | "compact";

export function MetricCardView({
  isDark,
  card,
  iconIndex,
  variant = "medium",
  showEyebrow = false,
}: {
  isDark: boolean;
  card: MetricCard;
  iconIndex: number;
  variant?: CardVariant;
  showEyebrow?: boolean;
}) {
  const { isEnglish } = useAppLanguage();
  const icons = [Activity, BriefcaseBusiness, BarChart3, Sparkles];
  const Icon = icons[iconIndex % icons.length];
  const isHero = variant === "hero";
  const isWide = variant === "wide";

  const cardClass = isHero
    ? isDark
      ? "rounded-[2rem] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(17,32,58,0.92),rgba(7,14,28,0.96))] p-6 shadow-[0_26px_60px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-200/28 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.05),0_22px_48px_rgba(8,145,178,0.14)]"
      : "rounded-[2rem] border border-sky-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,249,255,0.94))] p-6 shadow-[0_22px_54px_rgba(14,165,233,0.10)] transition duration-300 hover:-translate-y-1 hover:border-sky-300 hover:bg-white hover:shadow-[0_18px_40px_rgba(148,163,184,0.18)]"
    : isWide
      ? isDark
        ? "rounded-[1.85rem] border border-white/8 bg-white/4 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-300 hover:-translate-y-1 hover:border-cyan-200/24 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.04),0_20px_42px_rgba(8,145,178,0.12)]"
        : "rounded-[1.85rem] border border-slate-300 bg-white/94 p-5 shadow-[0_18px_36px_rgba(148,163,184,0.12)] transition duration-300 hover:-translate-y-1 hover:border-sky-300 hover:bg-white hover:shadow-[0_18px_40px_rgba(148,163,184,0.18)]"
      : isDark
        ? "rounded-[1.6rem] border border-white/8 bg-white/4 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-300 hover:-translate-y-1 hover:border-cyan-200/24 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.04),0_20px_42px_rgba(8,145,178,0.12)]"
        : "rounded-[1.6rem] border border-slate-300 bg-white/92 p-4 shadow-[0_18px_36px_rgba(148,163,184,0.12)] transition duration-300 hover:-translate-y-1 hover:border-sky-300 hover:bg-white hover:shadow-[0_18px_40px_rgba(148,163,184,0.18)]";

  return (
    <article className={`${cardClass} h-full`}>
      {showEyebrow ? (
        <p
          className={
            isDark
              ? "text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200"
              : "text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700"
          }
        >
          {card.eyebrow}
        </p>
      ) : null}

      <div className={`${showEyebrow ? "mt-2" : "mt-0"} flex items-start justify-between gap-3`}>
        <p
          className={
            isDark
              ? `${isHero ? "text-base" : "text-sm"} font-semibold leading-6 text-slate-100`
              : `${isHero ? "text-base" : "text-sm"} font-semibold leading-6 text-slate-900`
          }
        >
          {card.title}
        </p>
        <Icon
          className={
            isDark
              ? `${isHero ? "h-5 w-5" : "h-4.5 w-4.5"} mt-0.5 text-cyan-200`
              : `${isHero ? "h-5 w-5" : "h-4.5 w-4.5"} mt-0.5 text-sky-700`
          }
        />
      </div>

      {card.value !== null && card.value !== "" ? (
        <p
          className={
            isDark
              ? `${isHero ? "mt-4 text-4xl" : "mt-3 text-2xl"} font-semibold text-white`
              : `${isHero ? "mt-4 text-4xl" : "mt-3 text-2xl"} font-semibold text-slate-900`
          }
        >
          {formatMetricValue(card, isEnglish)}
        </p>
      ) : null}
      <p
        className={
          isDark
            ? `${isHero ? "mt-3 text-sm" : "mt-2 text-sm"} leading-6 text-slate-400`
            : `${isHero ? "mt-3 text-sm" : "mt-2 text-sm"} leading-6 text-slate-600`
        }
      >
        {card.description}
      </p>
      {card.meta ? (
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
          {card.meta}
        </p>
      ) : null}

      {card.chartType === "none" || card.chartPoints?.length ? (
        <ChartRenderer isDark={isDark} card={card} />
      ) : null}

      {card.id === "avg-experience" ? (
        <div
          className={
            isDark
              ? "mt-3 rounded-[1rem] border border-white/8 bg-black/10 px-3 py-3"
              : "mt-3 rounded-[1rem] border border-slate-200 bg-white/80 px-3 py-3"
          }
        >
          <div className="mb-3">
            <p
              className={
                isDark
                  ? "text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                  : "text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
              }
            >
              {isEnglish
                ? "Evolution of required experience (2020-2026)"
                : "Evolución de la experiencia requerida (2020–2026)"}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { year: "2020", text: isEnglish ? "0-6 months" : "0–6 meses" },
              { year: "2021", text: isEnglish ? "6 months - 1 year" : "6 meses – 1 año" },
              { year: "2022", text: isEnglish ? "~1 year" : "~1 año" },
              { year: "2023", text: isEnglish ? "1 - 1.5 years" : "1 – 1.5 años" },
              { year: "2024", text: isEnglish ? "1 - 2 years" : "1 – 2 años" },
              { year: "2025", text: isEnglish ? "0 - 1 year" : "0 – 1 año" },
              { year: "2026", text: isEnglish ? "1 - 2 years" : "1 – 2 años" },
            ].map((item, index) => (
              <div
                key={item.year}
                className={
                  isDark
                    ? "rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2"
                    : "rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2"
                }
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      index < 2
                        ? isDark
                          ? "bg-amber-300"
                          : "bg-amber-600"
                        : index < 5
                          ? isDark
                            ? "bg-sky-300"
                            : "bg-sky-600"
                          : isDark
                            ? "bg-emerald-300"
                            : "bg-emerald-600"
                    }`}
                  />
                  <span
                    className={
                      isDark
                        ? "text-[10px] font-semibold text-slate-200"
                        : "text-[10px] font-semibold text-slate-800"
                    }
                  >
                    {item.year}
                  </span>
                </div>
                <p
                  className={
                    isDark
                      ? "mt-1 text-[10px] leading-4 text-slate-400"
                      : "mt-1 text-[10px] leading-4 text-slate-600"
                  }
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <div
            className={
              isDark
                ? "mt-3 rounded-[0.95rem] border border-white/8 bg-white/[0.03] px-3 py-3"
                : "mt-3 rounded-[0.95rem] border border-slate-200 bg-slate-50/90 px-3 py-3"
            }
          >
            <p
              className={
                isDark
                  ? "text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                  : "text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
              }
            >
              {isEnglish ? "Market reading" : "Lectura del mercado"}
            </p>
            <p
              className={
                isDark
                  ? "mt-2 text-[11px] leading-5 text-slate-300"
                  : "mt-2 text-[11px] leading-5 text-slate-700"
              }
            >
              {isEnglish
                ? "Required experience remains generally low (0-2 years), with a bias toward junior profiles. In 2025 the market opened more to lower-experience candidates, followed by a return to the 1-2 year range in 2026."
                : "La experiencia exigida se mantiene baja en general (0–2 años), con una tendencia hacia perfiles junior. En 2025 se observa una apertura a perfiles con menor experiencia, seguida de un retorno a niveles de 1–2 años en 2026."}
            </p>
          </div>
        </div>
      ) : null}

      {card.id === "work-mode" ? (
        <div
          className={
            isDark
              ? "mt-3 rounded-[1rem] border border-white/8 bg-black/10 px-3 py-3"
              : "mt-3 rounded-[1rem] border border-slate-200 bg-white/80 px-3 py-3"
          }
        >
          <div className="mb-3 grid gap-2 sm:grid-cols-3">
            {[
              { label: isEnglish ? "On-site" : "Presencial", value: "80–85%" },
              { label: isEnglish ? "Hybrid" : "Híbrido", value: "10–15%" },
              { label: isEnglish ? "Remote" : "Remoto", value: "~5%" },
            ].map((item, index) => (
              <div
                key={item.label}
                className={
                  isDark
                    ? "rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2.5"
                    : "rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2.5"
                }
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      index === 0
                        ? isDark
                          ? "bg-cyan-300"
                          : "bg-cyan-600"
                        : index === 1
                          ? isDark
                            ? "bg-sky-300"
                            : "bg-sky-600"
                          : isDark
                            ? "bg-emerald-300"
                            : "bg-emerald-600"
                    }`}
                  />
                  <span
                    className={
                      isDark
                        ? "text-[10px] font-semibold text-slate-200"
                        : "text-[10px] font-semibold text-slate-800"
                    }
                  >
                    {item.label}
                  </span>
                </div>
                <p className={isDark ? "mt-1 text-[11px] text-slate-300" : "mt-1 text-[11px] text-slate-700"}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { year: "2020", text: isEnglish ? "Remote (pandemic)" : "Remoto (pandemia)" },
              { year: "2021", text: isEnglish ? "Mixed" : "Mixto" },
              { year: "2022", text: isEnglish ? "On-site (~70%)" : "Presencial (~70%)" },
              { year: "2023", text: isEnglish ? "On-site (~75%)" : "Presencial (~75%)" },
              { year: "2024", text: isEnglish ? "On-site + hybrid" : "Presencial + híbrido" },
              { year: "2025", text: isEnglish ? "On-site (~80%)" : "Presencial (~80%)" },
              { year: "2026", text: isEnglish ? "On-site (80–85%)" : "Presencial (80–85%)" },
            ].map((item, index) => (
              <div
                key={item.year}
                className={
                  isDark
                    ? "rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2"
                    : "rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2"
                }
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      index < 2
                        ? isDark
                          ? "bg-cyan-300"
                          : "bg-cyan-600"
                        : index < 5
                          ? isDark
                            ? "bg-sky-300"
                            : "bg-sky-600"
                          : isDark
                            ? "bg-emerald-300"
                            : "bg-emerald-600"
                    }`}
                  />
                  <span
                    className={
                      isDark
                        ? "text-[10px] font-semibold text-slate-200"
                        : "text-[10px] font-semibold text-slate-800"
                    }
                  >
                    {item.year}
                  </span>
                </div>
                <p
                  className={
                    isDark
                      ? "mt-1 text-[10px] leading-4 text-slate-400"
                      : "mt-1 text-[10px] leading-4 text-slate-600"
                  }
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>
          <div
            className={
              isDark
                ? "mt-3 rounded-[0.95rem] border border-white/8 bg-white/[0.03] px-3 py-3"
                : "mt-3 rounded-[0.95rem] border border-slate-200 bg-slate-50/90 px-3 py-3"
            }
          >
            <p
              className={
                isDark
                  ? "text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                  : "text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
              }
            >
              {isEnglish ? "Market reading" : "Lectura del mercado"}
            </p>
            <div className="mt-2 space-y-2">
              {[
                isEnglish ? "Colombia remains a highly on-site labor market." : "Colombia es un mercado altamente presencial.",
                isEnglish ? "Remote work is concentrated in technology and is not dominant." : "El trabajo remoto se concentra en tecnología y no es dominante.",
                isEnglish ? "Hybrid work is growing, but mostly in formal companies." : "El híbrido crece, pero solo en empresas formales.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className={isDark ? "mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400" : "mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-500"} />
                  <span className={isDark ? "text-[11px] leading-5 text-slate-300" : "text-[11px] leading-5 text-slate-700"}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {card.id === "annual-unemployment-delta" ? (
        <div
          className={
            isDark
              ? "mt-4 rounded-[0.95rem] border border-white/8 bg-black/10 px-3 py-3"
              : "mt-4 rounded-[0.95rem] border border-slate-200 bg-white/70 px-3 py-3"
          }
        >
          <div className="space-y-2">
            {getAnnualUnemploymentDeltaSummary(isEnglish).map((item) => (
              <div
                key={item.title}
                className={
                  isDark
                    ? "rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2.5"
                    : "rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5"
                }
              >
                <p
                  className={
                    isDark
                      ? "text-[11px] font-semibold text-slate-100"
                      : "text-[11px] font-semibold text-slate-900"
                  }
                >
                  {item.title}
                </p>
                <p
                  className={
                    isDark
                      ? "mt-1 text-[11px] leading-5 text-slate-400"
                      : "mt-1 text-[11px] leading-5 text-slate-600"
                  }
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {card.chartPoints?.length ? (
        <div className={`${isHero ? "mt-5" : "mt-4"} flex justify-end`}>
          <span className={isDark ? "text-[11px] text-slate-400" : "text-[11px] text-slate-500"}>
            {card.chartPoints.length > 1
              ? `${card.chartPoints.length} ${isEnglish ? "data points" : "datos"}`
              : ""}
          </span>
        </div>
      ) : null}
    </article>
  );
}

function ChartRenderer({
  isDark,
  card,
}: {
  isDark: boolean;
  card: MetricCard;
}) {
  const points = (card.chartPoints ?? []).map((point) => ({
    ...point,
    label:
      card.chartType === "none"
        ? point.label
        : truncateLabel(point.label, card.chartType === "horizontal-bar" ? 26 : 14),
  }));

  if (card.chartType === "horizontal-bar") {
    return <MiniHorizontalBarChart isDark={isDark} card={card} series={points} />;
  }

  if (card.chartType === "line" || card.chartType === "sparkline") {
    return <MiniLineChart isDark={isDark} card={card} series={points} />;
  }

  if (card.chartType === "donut") {
    return <MiniDonutChart isDark={isDark} card={card} series={points} />;
  }

  if (card.chartType === "range") {
    return <MiniRangeChart isDark={isDark} card={card} series={points} />;
  }

  if (card.chartType === "none") {
    const SpecializedCard = SPECIALIZED_CARD_COMPONENTS[card.id as keyof typeof SPECIALIZED_CARD_COMPONENTS];
    if (SpecializedCard) {
      return <SpecializedCard isDark={isDark} series={points} />;
    }
  }

  return <MiniBarChart isDark={isDark} card={card} series={points} />;
}
