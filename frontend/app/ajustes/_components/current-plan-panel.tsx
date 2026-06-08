"use client";

type CurrentPlanPanelProps = {
  isDark: boolean;
  title: string;
  subtitle: string;
  currentPlanLabel: string;
  currentPlanValue: string;
  secondaryLabel?: string;
  secondaryValue?: string;
  tertiaryLabel?: string;
  tertiaryValue?: string;
  openPlansLabel: string;
  onOpenPlans: () => void;
  openBoostsLabel?: string;
  onOpenBoosts?: () => void;
};

export function CurrentPlanPanel({
  isDark,
  title,
  subtitle,
  currentPlanLabel,
  currentPlanValue,
  secondaryLabel,
  secondaryValue,
  tertiaryLabel,
  tertiaryValue,
  openPlansLabel,
  onOpenPlans,
  openBoostsLabel,
  onOpenBoosts,
}: CurrentPlanPanelProps) {
  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
      <article className={isDark ? "rounded-[1.35rem] border border-white/8 bg-[#081120]/72 p-5" : "rounded-[1.35rem] border border-slate-300 bg-slate-50/80 p-5"}>
        <h3 className={isDark ? "text-lg font-semibold text-white" : "text-lg font-semibold text-slate-950"}>
          {title}
        </h3>
        <p className={isDark ? "mt-2 text-sm leading-7 text-slate-300" : "mt-2 text-sm leading-7 text-slate-600"}>
          {subtitle}
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className={isDark ? "rounded-[1rem] border border-white/8 bg-white/4 px-4 py-3" : "rounded-[1rem] border border-slate-300 bg-white px-4 py-3"}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{currentPlanLabel}</p>
            <p className={isDark ? "mt-2 text-lg font-semibold text-white" : "mt-2 text-lg font-semibold text-slate-950"}>
              {currentPlanValue}
            </p>
          </div>
          {secondaryLabel && secondaryValue ? (
            <div className={isDark ? "rounded-[1rem] border border-white/8 bg-white/4 px-4 py-3" : "rounded-[1rem] border border-slate-300 bg-white px-4 py-3"}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{secondaryLabel}</p>
              <p className={isDark ? "mt-2 text-lg font-semibold text-white" : "mt-2 text-lg font-semibold text-slate-950"}>
                {secondaryValue}
              </p>
            </div>
          ) : null}
          {tertiaryLabel && tertiaryValue ? (
            <div className={isDark ? "rounded-[1rem] border border-white/8 bg-white/4 px-4 py-3" : "rounded-[1rem] border border-slate-300 bg-white px-4 py-3"}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{tertiaryLabel}</p>
              <p className={isDark ? "mt-2 text-lg font-semibold text-white" : "mt-2 text-lg font-semibold text-slate-950"}>
                {tertiaryValue}
              </p>
            </div>
          ) : null}
        </div>
      </article>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onOpenPlans}
          className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:scale-105"
        >
          {openPlansLabel}
        </button>
        {openBoostsLabel && onOpenBoosts ? (
          <button
            type="button"
            onClick={onOpenBoosts}
            className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:scale-105"
          >
            {openBoostsLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
