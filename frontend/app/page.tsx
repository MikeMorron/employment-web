"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginModal } from "@/components/auth/login-modal";
import { HomeLandingPage } from "@/components/home/home-landing-page";
import { MiniPageNav } from "@/components/ui/mini-page-nav";
import { useHomePageController } from "@/hooks/use-home-page-controller";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useAuthUser } from "@/hooks/use-auth-user";
import { CandidateHomeDashboard } from "@/frontend/usuario/components/home/candidate-home-dashboard";
import { consumeHomeRedirectSuppression, getDefaultRouteForRole } from "@/lib/auth";
import { safeRouterReplace } from "@/lib/safe-redirect";

export default function HomePage() {
  const router = useRouter();
  const { language, isEnglish, setLanguage } = useAppLanguage();
  const [loginOpen, setLoginOpen] = useState(false);
  const welcomePreviewTimersRef = useRef<number[]>([]);
  const stayOnAuthenticatedHomeRef = useRef(false);
  const { isAuthenticated, authUser } = useAuthUser();
  const accountRole = authUser?.role === "company" ? "company" : "candidate";
  const candidateUser = authUser?.role === "candidate" ? authUser : null;

  const featuredJobs = useMemo(() => [], []);
  const {
    hasHydrated,
    isDark,
    setIsDark,
    storageConsent,
    selectedConsentMode,
    setSelectedConsentMode,
    cookieBannerDismissed,
    dismissConsentBanner,
    saveConsent,
  } = useHomePageController(featuredJobs, authUser?.id ?? null);
  const showAuthenticatedUi = hasHydrated && isAuthenticated;

  const clearWelcomePreviewTimers = () => {
    welcomePreviewTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    welcomePreviewTimersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearWelcomePreviewTimers();
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !authUser) {
      stayOnAuthenticatedHomeRef.current = false;
      return;
    }

    if (authUser.role === "company" || authUser.role === "admin") {
      safeRouterReplace(router, getDefaultRouteForRole(authUser.role), "/");
      return;
    }

    if (stayOnAuthenticatedHomeRef.current) {
      return;
    }

    if (consumeHomeRedirectSuppression()) {
      stayOnAuthenticatedHomeRef.current = true;
      return;
    }

    safeRouterReplace(router, getDefaultRouteForRole(authUser.role), "/");
  }, [authUser, hasHydrated, isAuthenticated, router]);

  if (showAuthenticatedUi && candidateUser) {
    return (
      <main
        className={`min-h-screen px-5 py-10 ${
          isDark
            ? "vacancies-shell bg-[radial-gradient(circle_at_top,#0b1730_0%,#050816_45%,#071224_100%)] text-[#eef6ff]"
            : "bg-[radial-gradient(circle_at_top,#eff9ff_0%,#f7fbff_42%,#eef4f8_100%)] text-slate-900"
        }`}
      >
        <div className="mx-auto max-w-7xl">
          <MiniPageNav
            isDark={isDark}
            onToggleTheme={() => setIsDark((current) => !current)}
          />

          <CandidateHomeDashboard user={candidateUser} isDark={isDark} />
        </div>
      </main>
    );
  }

  return (
    <>
      <HomeLandingPage
        isDark={isDark}
        isEnglish={isEnglish}
        language={language}
        accountRole={accountRole}
        storageConsent={storageConsent}
        selectedConsentMode={selectedConsentMode}
        cookieBannerDismissed={cookieBannerDismissed}
        onOpenLogin={() => setLoginOpen(true)}
        onSetLanguage={setLanguage}
        onToggleTheme={() => setIsDark((current) => !current)}
        onSelectConsentMode={setSelectedConsentMode}
        onAcceptConsent={() => {
          if (selectedConsentMode) {
            saveConsent(selectedConsentMode);
          }
        }}
        onCloseConsent={dismissConsentBanner}
      />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
