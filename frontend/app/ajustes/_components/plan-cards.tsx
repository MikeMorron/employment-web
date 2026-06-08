"use client";

import type { CandidatePlanUiCard } from "@/lib/candidate-plan-ui";

interface PlanCard {
  id: string;
  accent?: "emerald" | "sky" | "violet" | "amber";
  price: string;
  badge?: string;
  monthly?: string;
  usd?: string;
  features: string[];
  selectable?: boolean;
  name?: string;
  period?: string;
  highlighted?: boolean;
}

interface PlanCardsProps {
  isDark: boolean;
  isEnglish: boolean;
  plans: Array<PlanCard | CandidatePlanUiCard>;
  onSelectPlan: (planId: string) => void;
}

function accentClass(accent: PlanCard["accent"], isDark: boolean) {
  if (accent === "emerald") {
    return isDark ? "border-emerald-300/20 bg-emerald-400/10" : "border-emerald-300 bg-emerald-50";
  }
  if (accent === "sky") {
    return isDark ? "border-cyan-300/20 bg-cyan-300/10" : "border-sky-300 bg-sky-50";
  }
  if (accent === "violet") {
    return isDark ? "border-violet-300/20 bg-violet-400/10" : "border-violet-300 bg-violet-50";
  }
  return isDark ? "border-amber-300/20 bg-amber-400/10" : "border-amber-300 bg-amber-50";
}

export function PlanCards({ isDark, isEnglish, plans, onSelectPlan }: PlanCardsProps) {
  const normalizedPlans: Array<Required<Pick<PlanCard, "id" | "price" | "features">> & PlanCard> = plans.map((plan) => {
    if (!("planKey" in plan)) {
      return {
        accent: "amber",
        badge: plan.name ?? plan.id,
        monthly: plan.period ?? "",
        usd: "",
        ...plan,
      };
    }

    return {
      id: plan.id,
      accent: plan.highlighted ? "emerald" : "amber",
      price: plan.price,
      badge: plan.name,
      monthly: plan.period,
      usd: "",
      features: [...plan.features],
      selectable: plan.selectable,
      name: plan.name,
      period: plan.period,
      highlighted: plan.highlighted,
    };
  });

  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-2">
      {normalizedPlans.map((plan) => (
        <article
          key={plan.id}
          className={`relative overflow-hidden rounded-[1.45rem] border p-5 ${accentClass(plan.accent ?? "amber", isDark)}`}
        >
          {plan.id === "boost-pack-8" || plan.id === "company-business" ? (
            <span className="pointer-events-none absolute right-3 top-3 inline-flex rounded-full border border-yellow-200 bg-[linear-gradient(180deg,#fde68a,#f59e0b)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-950 shadow-[0_12px_24px_rgba(245,158,11,0.28)]">
              {isEnglish ? "Most popular" : "Más popular"}
            </span>
          ) : null}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={isDark ? "text-xs uppercase tracking-[0.18em] text-slate-300" : "text-xs uppercase tracking-[0.18em] text-slate-600"}>
                {plan.badge ?? plan.name ?? plan.id}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className={isDark ? "text-2xl font-semibold text-white" : "text-2xl font-semibold text-slate-950"}>
                  {plan.price}
                </p>
                {plan.usd ? (
                  <span className={isDark ? "rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold text-slate-100" : "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700"}>
                    {plan.usd}
                  </span>
                ) : null}
              </div>
              {plan.monthly ? (
                <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"}>
                  {plan.monthly}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {plan.features.map((feature) => (
              <p key={feature} className={isDark ? "text-sm text-slate-200" : "text-sm text-slate-700"}>
                {`• ${feature}`}
              </p>
            ))}
          </div>
          {(plan.selectable ?? true) ? (
            <button
              type="button"
              onClick={() => onSelectPlan(plan.id)}
              className={isDark ? "mt-4 inline-flex w-full items-center justify-center rounded-[1rem] border border-cyan-300/18 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/14" : "mt-4 inline-flex w-full items-center justify-center rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"}
            >
              {isEnglish ? "Select" : "Seleccionar"}
            </button>
          ) : (
            <div className={isDark ? "mt-4 inline-flex w-full items-center justify-center rounded-[1rem] border border-white/10 bg-white/4 px-4 py-3 text-sm font-semibold text-slate-200" : "mt-4 inline-flex w-full items-center justify-center rounded-[1rem] border border-slate-300 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700"}>
              {isEnglish ? "Already included" : "Ya obtenido"}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
