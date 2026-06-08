"use client";

interface BillingEntry {
  id: string;
  description: string;
  amountCop: number;
  status: string;
  paidAt: string;
}

interface BillingPanelProps {
  isDark: boolean;
  isEnglish: boolean;
  currentActiveJobsCount: number;
  activeJobsLimit: number;
  planName: string;
  billingHistory: BillingEntry[];
}

export function BillingPanel({
  isDark,
  isEnglish,
  currentActiveJobsCount,
  activeJobsLimit,
  planName,
  billingHistory,
}: BillingPanelProps) {
  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-2">
      <article className={isDark ? "rounded-[1.35rem] border border-white/8 bg-[#081120]/72 p-4" : "rounded-[1.35rem] border border-slate-300 bg-slate-50/80 p-4"}>
        <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>
          {isEnglish ? "Current usage" : "Uso actual"}
        </p>
        <div className="mt-4 space-y-3">
          <div className={isDark ? "rounded-[1rem] border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-200" : "rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"}>
            {currentActiveJobsCount}/{activeJobsLimit} {isEnglish ? "active jobs in use" : "vacantes activas en uso"}
          </div>
          <div className={isDark ? "rounded-[1rem] border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-200" : "rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"}>
            {planName}
          </div>
        </div>
      </article>
      <article className={isDark ? "rounded-[1.35rem] border border-white/8 bg-[#081120]/72 p-4" : "rounded-[1.35rem] border border-slate-300 bg-slate-50/80 p-4"}>
        <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>
          {isEnglish ? "Billing history" : "Historial de pagos"}
        </p>
        <div className="mt-4 space-y-3">
          {billingHistory.length > 0 ? (
            billingHistory.map((entry) => (
              <div key={entry.id} className={isDark ? "rounded-[1rem] border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-200" : "rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"}>
                <p className={isDark ? "font-medium text-white" : "font-medium text-slate-900"}>
                  {entry.description}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {entry.amountCop.toLocaleString("es-CO")} COP · {entry.status} · {entry.paidAt.slice(0, 10)}
                </p>
              </div>
            ))
          ) : (
            <div className={isDark ? "rounded-[1rem] border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-300" : "rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-600"}>
              {isEnglish ? "No billing history yet." : "Aún no hay historial de pagos."}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
