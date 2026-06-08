"use client";

import { useAppLanguage } from "@/hooks/use-app-language";
import type { SpecializedCardProps } from "@/components/sections/market-panorama/cards-specialized-shared";

export function OccupationListCard({
  isDark,
  series,
}: SpecializedCardProps) {
  return (
    <div
      className={
        isDark
          ? "mt-4 rounded-[1rem] border border-white/8 bg-white/[0.03] p-3"
          : "mt-4 rounded-[1rem] border border-slate-200 bg-slate-50/90 p-3"
      }
    >
      <div className="grid gap-2 xl:grid-cols-4 lg:grid-cols-2">
        {series.map((item, index) => (
          <div
            key={`occupation-${index}`}
            className={
              isDark
                ? "flex items-start gap-3 rounded-xl border border-white/6 bg-black/10 px-3 py-2.5"
                : "flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5"
            }
          >
            <span
              className={
                isDark
                  ? "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/12 text-[11px] font-semibold text-cyan-200"
                  : "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-semibold text-sky-700"
              }
            >
              {index + 1}
            </span>
            <span
              className={
                isDark
                  ? "text-[11px] leading-5 text-slate-200"
                  : "text-[11px] leading-5 text-slate-700"
              }
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkillsInsightCard({
  isDark,
  series,
}: SpecializedCardProps) {
  const { isEnglish } = useAppLanguage();
  const groups = [
    {
      title: isEnglish ? "Soft skills" : "Habilidades blandas",
      items: series.slice(0, 5),
    },
    {
      title: isEnglish ? "Technical skills" : "Habilidades técnicas",
      items: series.slice(5, 10),
    },
    {
      title: isEnglish ? "Operational skills" : "Habilidades operativas",
      items: series.slice(10, 15),
    },
  ];

  return (
    <div
      className={
        isDark
          ? "mt-4 rounded-[1rem] border border-white/8 bg-white/[0.03] p-3"
          : "mt-4 rounded-[1rem] border border-slate-200 bg-slate-50/90 p-3"
      }
    >
      <div className="grid gap-3 lg:grid-cols-3">
        {groups.map((group, groupIndex) => (
          <div
            key={group.title}
            className={
              isDark
                ? "rounded-xl border border-white/6 bg-black/10 px-3 py-3"
                : "rounded-xl border border-slate-200 bg-white/85 px-3 py-3"
            }
          >
            <p
              className={
                isDark
                  ? "text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-200"
                  : "text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-700"
              }
            >
              {group.title}
            </p>
            <div className="mt-3 space-y-2">
              {group.items.map((item, index) => (
                <div key={`${group.title}-${item.label}`} className="flex items-start gap-2.5">
                  <span
                    className={
                      isDark
                        ? "mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300"
                        : "mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-600"
                    }
                    style={{ opacity: 1 - (groupIndex * 0.12 + index * 0.06) }}
                  />
                  <span
                    className={
                      isDark
                        ? "text-[11px] leading-5 text-slate-200"
                        : "text-[11px] leading-5 text-slate-700"
                    }
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
