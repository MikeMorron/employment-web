"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PaymentPlan } from "@/compartido/components/payments/plan-payment-modal";
import { getCandidatePlanUiCards } from "@/frontend/usuario/lib/candidate-plan-ui";
import { buildCandidateSections } from "@/frontend/usuario/app/ajustes/_lib/candidate-settings-sections";
import { getUpgradeCtaCopy } from "@/compartido/lib/role-access";
import {
  MATCHES_MIN_SCORE_KEY,
  MATCHES_MIN_SCORE_KEYS,
  APPLICATION_STATUS_AUTO_CLOSE_EVENT,
  APPLICATION_STATUS_AUTO_CLOSE_KEY,
  APPLICATION_STATUS_AUTO_CLOSE_KEYS,
  STORAGE_CONSENT_COOKIE_KEY,
  STORAGE_CONSENT_COOKIE_KEYS,
  STORAGE_CONSENT_KEY,
  STORAGE_CONSENT_KEYS,
  VERIFIED_COMPANIES_ONLY_KEY,
  VERIFIED_COMPANIES_ONLY_KEYS,
  readCookieValue,
  readFirstStorageValue,
} from "@/compartido/lib/app-runtime";
import { apiRequest } from "@/compartido/lib/api";
import { maskEmail, resolveSections } from "@/compartido/app/ajustes/_lib/settings-sections";
import { useSettingsUiState } from "@/compartido/app/ajustes/_hooks/use-settings-ui-state";
import type { AppUser } from "@/compartido/types/profile";

export type CandidatePlanSnapshot = {
  currentPlan?: { id: string; nameEs: string; nameEn: string };
  applicationQuotaRemaining?: number;
  plans?: Array<{ id: string; disabled?: boolean; disabledReason?: string | null }>;
  state?: {
    boostActiveUntil?: string | null;
    boostInventory?: Array<{ id: string; sourcePlanId: string; durationHours: number; remainingUses: number }>;
    applicationQuotaWindowEndsAt?: string;
  };
} | null;

export function useCandidateSettingsState({
  authUser,
  isEnglish,
}: {
  authUser: AppUser | null | undefined;
  isEnglish: boolean;
}) {
  const activeSections = useMemo(() => buildCandidateSections(maskEmail), []);
  const {
    activeSection,
    choiceState,
    expandedItems,
    setChoiceState,
    setExpandedItems,
    setSliderState,
    setToggleState,
    sliderState,
    toggleState,
  } = useSettingsUiState(activeSections);
  const [showPlanPaymentModal, setShowPlanPaymentModal] = useState(false);
  const [showBoostActivationModal, setShowBoostActivationModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("boost-pack-3");
  const [purchaseToast, setPurchaseToast] = useState<string | null>(null);
  const [candidatePlanSnapshot, setCandidatePlanSnapshot] = useState<CandidatePlanSnapshot>(null);
  const purchaseToastTimeoutRef = useRef<number | null>(null);
  const notificationPrefsReadyRef = useRef(false);

  useEffect(() => {
    notificationPrefsReadyRef.current = false;
  }, [authUser?.id]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const response = await apiRequest<Omit<NonNullable<CandidatePlanSnapshot>, never> & { ok: boolean }>("/api/candidate/plan");
      if (!cancelled && response.ok) {
        setCandidatePlanSnapshot(response.data ?? null);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedMatchScore = readFirstStorageValue(window.localStorage, MATCHES_MIN_SCORE_KEYS);
    const parsedMatchScore = Number(storedMatchScore);
    const storedConsent =
      readFirstStorageValue(window.localStorage, STORAGE_CONSENT_KEYS) ??
      readCookieValue(document.cookie, STORAGE_CONSENT_COOKIE_KEYS);
    const storedVerifiedCompaniesOnly = readFirstStorageValue(
      window.localStorage,
      VERIFIED_COMPANIES_ONLY_KEYS,
    );

    setSliderState((current) => ({
      ...current,
      "minimum-match":
        Number.isFinite(parsedMatchScore) && parsedMatchScore >= 60 && parsedMatchScore <= 95
          ? parsedMatchScore
          : current["minimum-match"] ?? 82,
      "smart-match-threshold":
        Number.isFinite(parsedMatchScore) && parsedMatchScore >= 60 && parsedMatchScore <= 95
          ? parsedMatchScore
          : current["smart-match-threshold"] ?? 78,
    }));

    if (storedConsent === "essential" || storedConsent === "denied") {
      setChoiceState((current) => ({ ...current, "cookie-mode": "essential" }));
    }

    if (storedConsent === "full" || storedConsent === "granted") {
      setChoiceState((current) => ({ ...current, "cookie-mode": "full" }));
    }

    if (storedVerifiedCompaniesOnly === "true" || storedVerifiedCompaniesOnly === "false") {
      setToggleState((current) => ({
        ...current,
        "verified-company-only": storedVerifiedCompaniesOnly === "true",
      }));
    }

    const storedApplicationStatusAutoClose = readFirstStorageValue(
      window.localStorage,
      APPLICATION_STATUS_AUTO_CLOSE_KEYS,
    );

    if (storedApplicationStatusAutoClose === "true" || storedApplicationStatusAutoClose === "false") {
      setToggleState((current) => ({
        ...current,
        "application-status-auto-close": storedApplicationStatusAutoClose === "true",
      }));
    }
  }, [setChoiceState, setSliderState, setToggleState]);

  useEffect(() => {
    let cancelled = false;

    const loadNotificationPreferences = async () => {
      if (!authUser?.id) {
        notificationPrefsReadyRef.current = true;
        return;
      }

      const response = await apiRequest<{
        ok: boolean;
        settings?: { emailTypes?: string[] };
      }>("/api/preferences/settings");

      if (cancelled) {
        return;
      }

      const enabledTypes = new Set(response.data?.settings?.emailTypes ?? []);
      const useDefaults = enabledTypes.size === 0;

      setToggleState((current) => ({
        ...current,
        "email-opportunities": useDefaults || enabledTypes.has("new_matching_job"),
        "email-companies": useDefaults || enabledTypes.has("profile_interest_digest"),
        "email-profile":
          useDefaults ||
          enabledTypes.has("profile_incomplete") ||
          enabledTypes.has("profile_needs_update"),
      }));
      notificationPrefsReadyRef.current = true;
    };

    void loadNotificationPreferences();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id, setToggleState]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const minimumMatch = sliderState["minimum-match"];
    if (typeof minimumMatch === "number") {
      window.localStorage.setItem(MATCHES_MIN_SCORE_KEY, String(minimumMatch));
    }
  }, [sliderState]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const cookieMode = choiceState["cookie-mode"];
    if (cookieMode !== "essential" && cookieMode !== "full") {
      return;
    }

    window.localStorage.setItem(STORAGE_CONSENT_KEY, cookieMode);
    document.cookie = `${STORAGE_CONSENT_COOKIE_KEY}=${cookieMode}; path=/; max-age=31536000; SameSite=Lax`;
  }, [choiceState]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const verifiedOnly = toggleState["verified-company-only"];
    if (typeof verifiedOnly === "boolean") {
      window.localStorage.setItem(VERIFIED_COMPANIES_ONLY_KEY, String(verifiedOnly));
    }
  }, [toggleState]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const autoCloseApplicationStatus = toggleState["application-status-auto-close"];
    if (typeof autoCloseApplicationStatus === "boolean") {
      window.localStorage.setItem(
        APPLICATION_STATUS_AUTO_CLOSE_KEY,
        String(autoCloseApplicationStatus),
      );
      window.dispatchEvent(new CustomEvent(APPLICATION_STATUS_AUTO_CLOSE_EVENT));
    }
  }, [toggleState]);

  useEffect(() => {
    if (!authUser?.id || !notificationPrefsReadyRef.current) {
      return;
    }

    const emailTypes = [
      ...(toggleState["email-opportunities"] ? ["new_matching_job"] : []),
      ...(toggleState["email-companies"] ? ["profile_interest_digest"] : []),
      ...(toggleState["email-profile"] ? ["profile_incomplete", "profile_needs_update"] : []),
    ];

    void apiRequest("/api/preferences/settings", {
      method: "PATCH",
      body: JSON.stringify({ emailTypes }),
    });
  }, [authUser?.id, toggleState]);

  useEffect(() => {
    const currentToastTimeout = purchaseToastTimeoutRef.current;
    return () => {
      if (currentToastTimeout) {
        window.clearTimeout(currentToastTimeout);
      }
    };
  }, []);

  const currentSections = useMemo(
    () => resolveSections(activeSections, isEnglish),
    [activeSections, isEnglish],
  );
  const modalPlans = useMemo<PaymentPlan[]>(
    () =>
      getCandidatePlanUiCards(isEnglish).map((plan) => ({
        id: plan.id,
        badge: plan.name,
        accent: plan.highlighted ? "emerald" : "amber",
        price: plan.price,
        monthly: plan.period,
        usd: "",
        features: plan.features,
        selectable:
          candidatePlanSnapshot?.plans?.find((item) => item.id === plan.id)?.disabled !== true &&
          plan.selectable,
        disabledReason:
          candidatePlanSnapshot?.plans?.find((item) => item.id === plan.id)?.disabledReason ?? null,
      })),
    [candidatePlanSnapshot?.plans, isEnglish],
  );
  const candidateBoostInventory = candidatePlanSnapshot?.state?.boostInventory ?? [];
  const currentCandidatePlanName = candidatePlanSnapshot?.currentPlan
    ? isEnglish
      ? candidatePlanSnapshot.currentPlan.nameEn
      : candidatePlanSnapshot.currentPlan.nameEs
    : "Free";
  const upgrade = getUpgradeCtaCopy("candidate", authUser?.plan ?? "basic", isEnglish);

  return {
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
    upgrade,
  };
}
