"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export type PaymentPlan = {
  id: string;
  badge: string;
  accent: "emerald" | "sky" | "violet" | "amber";
  price: string;
  monthly: string;
  usd: string;
  features: readonly string[];
  selectable?: boolean;
  disabledReason?: string | null;
};

export type PaymentMethod = {
  id: string;
  label: string;
  description: string;
};

function accentClasses(accent: PaymentPlan["accent"], selected: boolean) {
  if (selected) {
    return "border-emerald-500 bg-emerald-50 shadow-[0_12px_28px_rgba(22,163,74,0.18)]";
  }

  if (accent === "sky") {
    return "border-slate-200 bg-white shadow-[8px_8px_0_rgba(59,130,246,0.08),-8px_8px_0_rgba(239,68,68,0.06),0_-8px_0_rgba(250,204,21,0.10)]";
  }

  if (accent === "violet") {
    return "border-slate-200 bg-white shadow-[8px_8px_0_rgba(217,70,239,0.08),-8px_8px_0_rgba(59,130,246,0.06),0_-8px_0_rgba(250,204,21,0.10)]";
  }

  if (accent === "amber") {
    return "border-slate-200 bg-white shadow-[8px_8px_0_rgba(250,204,21,0.10),-8px_8px_0_rgba(59,130,246,0.06),0_-8px_0_rgba(239,68,68,0.06)]";
  }

  return "border-slate-200 bg-white shadow-[8px_8px_0_rgba(22,163,74,0.08),-8px_8px_0_rgba(59,130,246,0.06),0_-8px_0_rgba(250,204,21,0.10)]";
}

function accentClassesWithTheme(accent: PaymentPlan["accent"], selected: boolean, isDark: boolean) {
  if (!isDark) {
    return accentClasses(accent, selected);
  }

  if (selected) {
    return "border-emerald-400 bg-emerald-500/10 shadow-[0_12px_28px_rgba(22,163,74,0.20)]";
  }

  if (accent === "sky") {
    return "border-cyan-300/16 bg-white/4 shadow-[0_18px_40px_rgba(0,0,0,0.24)]";
  }

  if (accent === "violet") {
    return "border-violet-300/16 bg-white/4 shadow-[0_18px_40px_rgba(0,0,0,0.24)]";
  }

  if (accent === "amber") {
    return "border-amber-300/16 bg-white/4 shadow-[0_18px_40px_rgba(0,0,0,0.24)]";
  }

  return "border-emerald-300/16 bg-white/4 shadow-[0_18px_40px_rgba(0,0,0,0.24)]";
}

export function PlanPaymentModal({
  open,
  isDark,
  title,
  subtitle,
  plans,
  selectedPlanId,
  onSelectedPlanIdChange,
  planOptionsLabel = "Opciones disponibles",
  includedLabel = "Incluye:",
  cancelLabel = "Cancelar",
  popularLabel = "Más popular",
  paymentMethods = [],
  onClose,
  onConfirm,
}: {
  open: boolean;
  isDark: boolean;
  title: string;
  subtitle?: string;
  plans: readonly PaymentPlan[];
  selectedPlanId: string;
  onSelectedPlanIdChange?: (planId: string) => void;
  planOptionsLabel?: string;
  includedLabel?: string;
  cancelLabel?: string;
  popularLabel?: string;
  paymentMethods?: readonly PaymentMethod[];
  onClose: () => void;
  onConfirm: (plan: PaymentPlan, paymentMethodId?: string) => void;
}) {
  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0];
  const selectedPaymentMethodId = paymentMethods[0]?.id;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-3 py-4">
      <button
        type="button"
        className={isDark ? "absolute inset-0 bg-slate-950/55 backdrop-blur-sm" : "absolute inset-0 bg-slate-950/45 backdrop-blur-sm"}
        onClick={onClose}
        aria-label="Cerrar modal de planes"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={isDark
          ? "relative z-10 max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-[1.3rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(7,16,31,0.98),rgba(8,17,32,0.94))] p-3 text-white shadow-[0_28px_90px_rgba(0,0,0,0.42)] sm:p-4"
          : "relative z-10 max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-[1.3rem] bg-white p-3 shadow-[0_28px_90px_rgba(15,23,42,0.28)] sm:p-4"}
      >
        <button
          type="button"
          onClick={onClose}
          className={isDark
            ? "absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-sm font-semibold text-slate-200 transition hover:scale-105 hover:bg-white/10"
            : "absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:scale-105 hover:bg-slate-50"}
          aria-label="Cerrar"
        >
          X
        </button>

        <div className="mx-auto max-w-3xl text-center">
          <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.22em] text-slate-400" : "text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"}>
            {planOptionsLabel}
          </p>
          <h3 className={isDark ? "mt-2 text-xl font-bold text-white sm:text-[1.6rem]" : "mt-2 text-xl font-bold text-slate-950 sm:text-[1.6rem]"}>
            {title}
          </h3>
          {subtitle && subtitle.trim() ? (
            <p className={isDark ? "mt-2 text-xs leading-6 text-slate-300" : "mt-2 text-xs leading-6 text-slate-600"}>
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className={isDark ? "mt-4 rounded-[1.2rem] bg-white/4 px-3 py-3 sm:px-4" : "mt-4 rounded-[1.2rem] bg-slate-50 px-3 py-3 sm:px-4"}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-center">
          {plans.map((plan) => {
            const isSelected = plan.id === selectedPlan.id;

            const selectable = plan.selectable !== false;

            return (
              <article
                key={plan.id}
                className={`flex flex-1 flex-col rounded-[1rem] border px-3 py-4 text-center transition ${accentClassesWithTheme(plan.accent, isSelected, isDark)} ${
                  isSelected ? "scale-[1.01]" : ""
                }`}
              >
                {plan.accent === "emerald" ? (
                  <div className="mb-4 flex justify-end">
                    <span className="inline-flex rounded-full border border-yellow-200 bg-[linear-gradient(180deg,#fde68a,#f59e0b)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-950 shadow-[0_12px_24px_rgba(245,158,11,0.28)]">
                      {popularLabel}
                    </span>
                  </div>
                ) : null}
                <div className="min-h-[5rem]">
                  <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.16em] text-slate-400" : "text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"}>
                    {plan.badge}
                  </p>
                  <p className={isDark ? "mt-2 text-3xl font-extrabold text-white" : "mt-2 text-3xl font-extrabold text-slate-950"}>
                    {plan.price.replace(" COP", "")}
                  </p>
                  <p className={isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500"}>
                    {plan.monthly}
                  </p>
                </div>

                <div className="mx-auto mt-4 w-full max-w-xs text-left">
                  <p className={isDark ? "mb-2 text-center text-xs font-semibold text-white" : "mb-2 text-center text-xs font-semibold text-slate-900"}>
                    {includedLabel}
                  </p>
                  <ul className="space-y-1.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className={isDark ? "text-xs leading-5 text-slate-300" : "text-xs leading-5 text-slate-700"}>
                        • {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectable) {
                        return;
                      }
                      onSelectedPlanIdChange?.(plan.id);
                      onConfirm(plan, selectedPaymentMethodId);
                    }}
                    disabled={!selectable}
                    className={`inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-xs font-semibold transition hover:scale-105 ${
                      isSelected
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-900 text-white"
                    } ${!selectable ? "cursor-not-allowed bg-slate-300 text-slate-500 hover:scale-100" : ""}`}
                    aria-pressed={isSelected}
                  >
                    {!selectable
                      ? plan.disabledReason === "purchase_limit"
                        ? "Límite alcanzado"
                        : plan.disabledReason === "downgrade_blocked"
                          ? "Bloqueado"
                          : "No disponible"
                      : "Seleccionar"}
                  </button>
                </div>

                {!selectable && plan.disabledReason ? (
                  <p className={isDark ? "mt-3 text-xs text-slate-400" : "mt-3 text-xs text-slate-500"}>
                    {plan.disabledReason === "purchase_limit"
                      ? "Ya alcanzaste el límite de compra para este plan en 30 días."
                      : plan.disabledReason === "downgrade_blocked"
                        ? "No puedes comprar un nivel inferior mientras tienes uno superior activo."
                        : "Este plan no está disponible ahora."}
                  </p>
                ) : null}
              </article>
            );
          })}
          </div>
        </div>

        {paymentMethods.length > 0 ? (
          <div className={isDark ? "mx-auto mt-5 max-w-xl rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-center" : "mx-auto mt-5 max-w-xl rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center"}>
            <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-900"}>Método de pago</p>
            {paymentMethods.map((method) => (
              <p key={method.id} className={isDark ? "mt-2 text-sm text-slate-300" : "mt-2 text-sm text-slate-600"}>
                {method.label}: {method.description}
              </p>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className={isDark
              ? "inline-flex min-w-[180px] items-center justify-center rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:scale-105 hover:bg-white/10"
              : "inline-flex min-w-[180px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:scale-105 hover:bg-slate-50"}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
