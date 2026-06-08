"use client";

import { PlanPaymentModal } from "@/compartido/components/payments/plan-payment-modal";
import { AppFooter } from "@/compartido/components/sections/app-footer";
import { MiniPageNav } from "@/compartido/components/ui/mini-page-nav";
import { trackEvent } from "@/compartido/lib/analytics/trackEvent";
import type { CandidateBoostPlanId } from "@/compartido/lib/plan-catalog";
import { apiRequest } from "@/compartido/lib/api";
import { useAppLanguage } from "@/compartido/hooks/use-app-language";
import { useAuthUser } from "@/compartido/hooks/use-auth-user";
import { useVacancyTheme } from "@/compartido/theme/use-vacancy-theme";
import { BoostActivationModal } from "@/compartido/app/ajustes/_components/boost-activation-modal";
import { CurrentPlanPanel } from "@/compartido/app/ajustes/_components/current-plan-panel";
import { LanguageSwitcher } from "@/compartido/app/ajustes/_components/language-switcher";
import { SettingsBlock } from "@/compartido/app/ajustes/_components/settings-block";
import { SettingsSidebar } from "@/compartido/app/ajustes/_components/settings-sidebar";
import { useCandidateSettingsState } from "@/frontend/usuario/app/ajustes/_hooks/use-candidate-settings-state";

export default function AjustesUsuarioPage() {
  const { isDark, themeReady, toggleTheme } = useVacancyTheme();
  const { isEnglish, language, setLanguage } = useAppLanguage();
  const { authUser, refreshUser } = useAuthUser();
  const {
    activeSection,
    candidateBoostInventory,
    candidatePlanSnapshot,
    choiceState,
    currentCandidatePlanName,
    currentSections,
    expandedItems,
    modalPlans,
    purchaseToast,
    purchaseToastTimeoutRef,
    selectedPlanId,
    setCandidatePlanSnapshot,
    setChoiceState,
    setExpandedItems,
    setPurchaseToast,
    setSelectedPlanId,
    setShowBoostActivationModal,
    setShowPlanPaymentModal,
    setSliderState,
    setToggleState,
    showBoostActivationModal,
    showPlanPaymentModal,
    sliderState,
    toggleState,
  } = useCandidateSettingsState({
    authUser,
    isEnglish,
  });

  return (
    <main
      className={`min-h-screen px-4 py-6 sm:px-5 sm:py-10 ${
        isDark
          ? "vacancies-shell bg-[radial-gradient(circle_at_top,#0b1730_0%,#050816_45%,#071224_100%)] text-[#eef6ff]"
          : "bg-[radial-gradient(circle_at_top,#eff9ff_0%,#f7fbff_42%,#eef4f8_100%)] text-slate-900"
      } ${themeReady ? "" : "invisible"}`}
    >
      <div className="mx-auto max-w-7xl">
        <MiniPageNav isDark={isDark} onToggleTheme={toggleTheme} />

        <section
          className={
            isDark
              ? "mt-4 rounded-[1.7rem] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(7,16,31,0.94),rgba(8,17,32,0.9))] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.32)] sm:mt-6 sm:rounded-[2.2rem] sm:p-8"
              : "mt-4 rounded-[1.7rem] border border-slate-300/70 bg-white/82 p-5 shadow-[0_24px_70px_rgba(148,163,184,0.16)] backdrop-blur-xl sm:mt-6 sm:rounded-[2.2rem] sm:p-8"
          }
        >
          <h1 className={isDark ? "text-3xl font-semibold text-white" : "text-3xl font-semibold text-slate-950"}>
            {isEnglish ? "Settings" : "Ajustes"}
          </h1>

          <div className="mt-5">
            <LanguageSwitcher isDark={isDark} language={language} onSetLanguage={setLanguage} />
          </div>

          <div className={isDark ? "mt-5 rounded-[1.3rem] border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-300" : "mt-5 rounded-[1.3rem] border border-slate-300 bg-slate-50/90 px-4 py-3 text-sm text-slate-700"}>
            <p className={isDark ? "font-semibold text-white" : "font-semibold text-slate-950"}>
              {isEnglish ? "Candidate configuration" : "Configuración de candidato"}
            </p>
            <p className="mt-1">
              {isEnglish
                ? "Keep this screen focused on security, visibility, recommendations, notifications, and boosts."
                : "Mantén esta vista enfocada en seguridad, visibilidad, recomendaciones, notificaciones y boosts."}
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:mt-8 lg:gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <SettingsSidebar isDark={isDark} sections={currentSections} activeSection={activeSection} />

            <div className="space-y-6">
              {currentSections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className={
                    isDark
                      ? "rounded-[1.35rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 sm:rounded-[1.8rem] sm:p-5"
                      : "rounded-[1.35rem] border border-slate-300 bg-white/92 p-4 shadow-[0_18px_44px_rgba(148,163,184,0.10)] sm:rounded-[1.8rem] sm:p-5"
                  }
                >
                  <div>
                    <h2 className={isDark ? "text-2xl font-semibold text-white" : "text-2xl font-semibold text-slate-950"}>
                      {section.title}
                    </h2>
                    <p className={isDark ? "mt-2 text-sm text-slate-300" : "mt-2 text-sm text-slate-600"}>
                      {section.copy}
                    </p>
                  </div>

                  {section.id === "plan" ? (
                    <CurrentPlanPanel
                      isDark={isDark}
                      title={isEnglish ? "Current plan" : "Plan actual"}
                      subtitle={
                        isEnglish
                          ? "Your boosts and application capacity are now managed from a protected modal window."
                          : "Tus boosts y la capacidad de postulaciones ahora se gestionan desde una ventana modal protegida."
                      }
                      currentPlanLabel={isEnglish ? "Current tier" : "Nivel actual"}
                      currentPlanValue={currentCandidatePlanName}
                      secondaryLabel={isEnglish ? "Applications left" : "Postulaciones restantes"}
                      secondaryValue={String(candidatePlanSnapshot?.applicationQuotaRemaining ?? 0)}
                      tertiaryLabel={isEnglish ? "Boost inventory" : "Inventario de boosts"}
                      tertiaryValue={String(candidateBoostInventory.reduce((sum, item) => sum + item.remainingUses, 0))}
                      openPlansLabel={isEnglish ? "Open plans modal" : "Ver Opciones de Boost"}
                      onOpenPlans={() => {
                        void trackEvent({
                          type: "view_plan",
                          entityId: candidatePlanSnapshot?.currentPlan?.id ?? "free",
                          metadata: { role: "candidate", source: "settings_current_plan" },
                        });
                        setSelectedPlanId(candidatePlanSnapshot?.currentPlan?.id ?? "free");
                        setShowPlanPaymentModal(true);
                      }}
                      openBoostsLabel={isEnglish ? "Use boosts" : "Usar boosts"}
                      onOpenBoosts={() => setShowBoostActivationModal(true)}
                    />
                  ) : (
                    <SettingsBlock
                      isDark={isDark}
                      isEnglish={isEnglish}
                      blocks={section.blocks}
                      toggleState={toggleState}
                      sliderState={sliderState}
                      choiceState={choiceState}
                      expandedItems={expandedItems}
                      onToggle={(id) =>
                        setToggleState((current) => ({ ...current, [id]: !current[id] }))
                      }
                      onSliderChange={(id, value) =>
                        setSliderState((current) => ({ ...current, [id]: value }))
                      }
                      onChoiceChange={(id, value) =>
                        setChoiceState((current) => ({ ...current, [id]: value }))
                      }
                      onToggleExpanded={(id) =>
                        setExpandedItems((current) => ({ ...current, [id]: !current[id] }))
                      }
                    />
                  )}
                </section>
              ))}
            </div>
          </div>
        </section>
      </div>

      <PlanPaymentModal
        open={showPlanPaymentModal}
        isDark={isDark}
        title={isEnglish ? "Candidate boost plans" : "Planes de boosts para candidatos"}
        subtitle={
          isEnglish
            ? "Buy boosts, improve visibility, and add application capacity from the same protected modal."
            : "Compra boosts, mejora visibilidad y agrega capacidad de postulaciones desde el mismo modal protegido."
        }
        plans={modalPlans}
        selectedPlanId={selectedPlanId}
        onSelectedPlanIdChange={setSelectedPlanId}
        planOptionsLabel={isEnglish ? "Available plans" : "Planes disponibles"}
        includedLabel={isEnglish ? "Includes:" : "Incluye:"}
        cancelLabel={isEnglish ? "Cancel" : "Cancelar"}
        popularLabel={isEnglish ? "Most popular" : "Más popular"}
        onClose={() => setShowPlanPaymentModal(false)}
        onConfirm={async (plan) => {
          if (purchaseToastTimeoutRef.current) window.clearTimeout(purchaseToastTimeoutRef.current);
          const response = await apiRequest<{ ok: boolean; message?: string }>("/api/candidate/plan", {
            method: "POST",
            body: JSON.stringify({ planId: plan.id as CandidateBoostPlanId }),
          });

          if (response.ok) {
            setShowPlanPaymentModal(false);
            await refreshUser();
            const snapshot = await apiRequest<{
              ok: boolean;
              currentPlan?: { id: string; nameEs: string; nameEn: string };
              applicationQuotaRemaining?: number;
              plans?: Array<{ id: string; disabled?: boolean; disabledReason?: string | null }>;
              state?: {
                boostActiveUntil?: string | null;
                boostInventory?: Array<{ id: string; sourcePlanId: string; durationHours: number; remainingUses: number }>;
                applicationQuotaWindowEndsAt?: string;
              };
            }>("/api/candidate/plan");
            if (snapshot.ok) {
              setCandidatePlanSnapshot(snapshot.data ?? null);
            }
            void trackEvent({
              type: "purchase_plan",
              entityId: plan.id,
              metadata: { role: "candidate" },
            });
            setPurchaseToast(isEnglish ? "Boost plan purchased." : "Plan de boosts comprado.");
          } else {
            setPurchaseToast(response.data?.message ?? "No se pudo procesar la compra");
          }

          purchaseToastTimeoutRef.current = window.setTimeout(() => setPurchaseToast(null), 3000);
        }}
      />

      <BoostActivationModal
        open={showBoostActivationModal}
        isDark={isDark}
        inventory={candidateBoostInventory}
        onClose={() => setShowBoostActivationModal(false)}
        onConfirm={async (durationHours, quantity) => {
          const response = await apiRequest<{ ok: boolean; message?: string }>("/api/candidate/plan/use-boost", {
            method: "POST",
            body: JSON.stringify({ durationHours, quantity }),
          });

          if (response.ok) {
            setShowBoostActivationModal(false);
            await refreshUser();
            const snapshot = await apiRequest<{
              ok: boolean;
              currentPlan?: { id: string; nameEs: string; nameEn: string };
              applicationQuotaRemaining?: number;
              plans?: Array<{ id: string; disabled?: boolean; disabledReason?: string | null }>;
              state?: {
                boostActiveUntil?: string | null;
                boostInventory?: Array<{ id: string; sourcePlanId: string; durationHours: number; remainingUses: number }>;
                applicationQuotaWindowEndsAt?: string;
              };
            }>("/api/candidate/plan");
            if (snapshot.ok) {
              setCandidatePlanSnapshot(snapshot.data ?? null);
            }
            setPurchaseToast(isEnglish ? "Boost activated." : "Boost activado.");
            purchaseToastTimeoutRef.current = window.setTimeout(() => setPurchaseToast(null), 3000);
            return;
          }

          setPurchaseToast(response.data?.message ?? "No se pudo activar el boost");
          purchaseToastTimeoutRef.current = window.setTimeout(() => setPurchaseToast(null), 3000);
        }}
      />

      {purchaseToast ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-[10000] max-w-sm">
          <div className={isDark ? "rounded-[1rem] border border-emerald-300/20 bg-emerald-400/12 px-4 py-3 text-sm font-semibold text-emerald-100 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl" : "rounded-[1rem] border border-emerald-300 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-[0_18px_40px_rgba(148,163,184,0.18)]"}>
            {purchaseToast}
          </div>
        </div>
      ) : null}

      <AppFooter />
    </main>
  );
}
