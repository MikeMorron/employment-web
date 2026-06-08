"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChartColumn,
  CircleDollarSign,
  Clock3,
  MapPin,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import { CookieConsentBanner } from "@/components/home/cookie-consent-banner";
import { FooterSection } from "@/components/sections/footer-section";
import { MarketPanoramaSection } from "@/components/sections/market-panorama-section";
import { Stars } from "@/components/ui/stars";
import { useUiCopy } from "@/lib/i18n/ui-copy";
import { marketDashboardData } from "@/lib/market/dashboard-data";
import type { DashboardResponse } from "@/lib/market/types";

const initialMarketStats: DashboardResponse = marketDashboardData;

const nodes = [
  { top: "10%", left: "56%" },
  { top: "16%", left: "65%" },
  { top: "24%", left: "58%" },
  { top: "31%", left: "69%" },
  { top: "39%", left: "62%" },
  { top: "47%", left: "71%" },
  { top: "54%", left: "59%" },
  { top: "63%", left: "67%" },
  { top: "72%", left: "60%" },
  { top: "80%", left: "64%" },
  { top: "28%", left: "49%" },
  { top: "43%", left: "51%" },
  { top: "58%", left: "48%" },
];

const links = [
  { top: "14%", left: "58%", width: "12%", rotate: "28deg" },
  { top: "21%", left: "59%", width: "9%", rotate: "-24deg" },
  { top: "29%", left: "60%", width: "13%", rotate: "18deg" },
  { top: "37%", left: "61%", width: "11%", rotate: "-18deg" },
  { top: "45%", left: "60%", width: "13%", rotate: "18deg" },
  { top: "53%", left: "58%", width: "12%", rotate: "-20deg" },
  { top: "62%", left: "59%", width: "10%", rotate: "18deg" },
  { top: "71%", left: "60%", width: "7%", rotate: "28deg" },
  { top: "24%", left: "49%", width: "10%", rotate: "14deg" },
  { top: "39%", left: "50%", width: "11%", rotate: "11deg" },
  { top: "54%", left: "48%", width: "12%", rotate: "20deg" },
];

function FlagEs({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" aria-hidden="true" className={className}>
      <rect width="36" height="24" fill="#fcd116" />
      <rect y="12" width="36" height="6" fill="#003893" />
      <rect y="18" width="36" height="6" fill="#ce1126" />
    </svg>
  );
}

function FlagEn({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" aria-hidden="true" className={className}>
      <rect width="36" height="24" fill="#012169" />
      <path d="M0 0 36 24M36 0 0 24" stroke="#fff" strokeWidth="4" />
      <path d="M0 0 36 24M36 0 0 24" stroke="#c8102e" strokeWidth="2" />
      <path d="M18 0v24M0 12h36" stroke="#fff" strokeWidth="6" />
      <path d="M18 0v24M0 12h36" stroke="#c8102e" strokeWidth="3.5" />
    </svg>
  );
}

function getFeaturedCardSurface(accent: string, isDark: boolean) {
  if (accent === "bg-[#f6c453]") {
    return isDark
      ? "border-[#f6c453]/34 bg-[linear-gradient(180deg,rgba(246,196,83,0.18),rgba(32,25,10,0.92))] hover:border-[#f6c453]/60 hover:shadow-[0_28px_60px_rgba(246,196,83,0.16)]"
      : "border-[#f6c453]/55 bg-[linear-gradient(180deg,rgba(252,241,202,0.96),rgba(248,244,228,0.94))] hover:border-[#d9a514] hover:shadow-[0_24px_52px_rgba(245,158,11,0.14)]";
  }

  if (accent === "bg-[#ff5a67]") {
    return isDark
      ? "border-[#ff5a67]/34 bg-[linear-gradient(180deg,rgba(255,90,103,0.16),rgba(35,14,18,0.92))] hover:border-[#ff5a67]/58 hover:shadow-[0_28px_60px_rgba(255,90,103,0.16)]"
      : "border-[#ff5a67]/55 bg-[linear-gradient(180deg,rgba(255,230,233,0.96),rgba(252,242,243,0.94))] hover:border-[#ff5a67] hover:shadow-[0_24px_52px_rgba(251,113,133,0.14)]";
  }

  return isDark
    ? "border-[#0d63ff]/34 bg-[linear-gradient(180deg,rgba(13,99,255,0.16),rgba(11,18,35,0.92))] hover:border-[#63a4ff]/58 hover:shadow-[0_28px_60px_rgba(13,99,255,0.16)]"
    : "border-[#0d63ff]/50 bg-[linear-gradient(180deg,rgba(226,238,255,0.98),rgba(240,246,255,0.94))] hover:border-[#0d63ff] hover:shadow-[0_24px_52px_rgba(59,130,246,0.14)]";
}

type HomeLandingPageProps = {
  isDark: boolean;
  isEnglish: boolean;
  language: "es" | "en";
  accountRole: "candidate" | "company";
  storageConsent: "essential" | "full" | null;
  selectedConsentMode: "essential" | "full" | null;
  cookieBannerDismissed: boolean;
  onOpenLogin: () => void;
  onSetLanguage: (language: "es" | "en") => void;
  onToggleTheme: () => void;
  onSelectConsentMode: (mode: "essential" | "full") => void;
  onAcceptConsent: () => void;
  onCloseConsent: () => void;
};

export function HomeLandingPage({
  isDark,
  isEnglish,
  language,
  accountRole: _accountRole,
  storageConsent,
  selectedConsentMode,
  cookieBannerDismissed,
  onOpenLogin,
  onSetLanguage,
  onToggleTheme,
  onSelectConsentMode,
  onAcceptConsent,
  onCloseConsent,
}: HomeLandingPageProps) {
  void _accountRole;
  const t = useUiCopy("home");
  const s = useUiCopy("homeSections");

  const cards = [
    {
      icon: ChartColumn,
      title: s("card1Title"),
      text: s("card1Text"),
      accent:
        "border-white/8 bg-[linear-gradient(180deg,rgba(255,214,102,0.10),rgba(7,14,28,0.96))] hover:border-[#f6c453]/60 hover:shadow-[0_20px_56px_rgba(246,196,83,0.18)]",
      iconColor: "text-[#f6c453]",
    },
    {
      icon: ShieldCheck,
      title: s("card2Title"),
      text: s("card2Text"),
      accent:
        "border-white/8 bg-[linear-gradient(180deg,rgba(71,214,255,0.10),rgba(7,14,28,0.96))] hover:border-[#47d6ff]/65 hover:shadow-[0_20px_56px_rgba(71,214,255,0.20)]",
      iconColor: "text-[#47d6ff]",
    },
    {
      icon: Sparkles,
      title: s("card3Title"),
      text: s("card3Text"),
      accent:
        "border-white/8 bg-[linear-gradient(180deg,rgba(45,212,191,0.08),rgba(7,14,28,0.96))] hover:border-[#2dd4bf]/58 hover:shadow-[0_20px_56px_rgba(45,212,191,0.18)]",
      iconColor: "text-[#2dd4bf]",
    },
  ];

  const entryPoints = [
    {
      icon: BriefcaseBusiness,
      title: s("entryTalentTitle"),
      text: s("entryTalentText"),
    },
    {
      icon: ChartColumn,
      title: s("entryCompanyTitle"),
      text: s("entryCompanyText"),
    },
  ];

  const featuredJobs = useMemo(
    () => ([
      { accent: "bg-[#0d63ff]", role: s("featuredRole1"), salary: s("featuredSalary1"), location: "Bogotá", demand: 4.92 },
      { accent: "bg-[#ff5a67]", role: s("featuredRole2"), salary: s("featuredSalary2"), location: "Medellín", demand: 4.36 },
      { accent: "bg-[#f6c453]", role: s("featuredRole3"), salary: s("featuredSalary3"), location: "Cali", demand: 4.18 },
      { accent: "bg-[#0d63ff]", role: s("featuredRole4"), salary: s("featuredSalary4"), location: "Barranquilla", demand: 4.38 },
      { accent: "bg-[#ff5a67]", role: s("featuredRole5"), salary: s("featuredSalary5"), location: "Cartagena", demand: 3.97 },
      { accent: "bg-[#f6c453]", role: s("featuredRole6"), salary: s("featuredSalary6"), location: "Bucaramanga", demand: 4.74 },
      { accent: "bg-[#0d63ff]", role: s("featuredRole7"), salary: s("featuredSalary7"), location: "Pereira", demand: 4.21 },
      { accent: "bg-[#ff5a67]", role: s("featuredRole8"), salary: s("featuredSalary8"), location: "Bogotá", demand: 4.88 },
      { accent: "bg-[#f6c453]", role: s("featuredRole9"), salary: s("featuredSalary9"), location: "Medellín", demand: 3.84 },
      { accent: "bg-[#0d63ff]", role: s("featuredRole10"), salary: s("featuredSalary10"), location: "Cali", demand: 4.09 },
    ]),
    [s],
  );

  const flowSteps = [
    {
      step: s("flowStep1"),
      title: s("flowStep1Title"),
      text: s("flowStep1Text"),
    },
    {
      step: s("flowStep2"),
      title: s("flowStep2Title"),
      text: s("flowStep2Text"),
    },
  ];

  return (
    <main
      className={
        isDark
          ? "min-h-screen overflow-x-hidden bg-[#050816] text-[#eef6ff] transition-colors duration-300"
          : "min-h-screen overflow-x-hidden bg-slate-100 text-slate-950 transition-colors duration-300"
      }
    >
      <section className={isDark ? "relative isolate border-b border-white/8" : "relative isolate border-b border-slate-300/70"}>
        <div className={isDark ? "absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(71,214,255,0.16),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(34,211,238,0.12),transparent_18%),radial-gradient(circle_at_50%_80%,rgba(45,212,191,0.06),transparent_22%),linear-gradient(180deg,#050816_0%,#071224_52%,#050816_100%)]" : "absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(87,196,214,0.18),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(59,130,246,0.10),transparent_20%),linear-gradient(180deg,#eff7f8_0%,#e6f1f4_52%,#ddecef_100%)]"} />
        <div className={isDark ? "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" : "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/60 to-transparent"} />
        <div className="absolute left-[12%] top-20 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[8%] top-24 h-80 w-80 rounded-full bg-sky-500/8 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-cyan-300/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-5 sm:px-6 sm:pb-28 lg:px-8 lg:pb-32">
          <div className="relative z-30 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button type="button" onClick={onToggleTheme} aria-label={isDark ? t("enableLightMode") : t("enableDarkMode")} className={isDark ? "inline-flex h-11 w-11 items-center justify-center rounded-[1.35rem] border border-cyan-300/25 bg-cyan-300/8 text-cyan-200 shadow-[0_0_40px_rgba(71,214,255,0.18)] transition-colors duration-300 hover:bg-white/10" : "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/40 bg-[#f4fbfc] text-sky-700 shadow-[0_0_30px_rgba(56,189,248,0.10)] transition-colors duration-300 hover:bg-white"}>
                {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </button>
              <span className={isDark ? "inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200" : "inline-flex items-center gap-2 rounded-full border border-slate-300 bg-[#f4fbfc] px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-700"}>
                <span className="flex h-5 w-5 flex-col overflow-hidden rounded-full border border-slate-300/80">
                  <span className="flex-1 bg-[#fcd116]" />
                  <span className="flex-1 bg-[#003893]" />
                  <span className="flex-1 bg-[#ce1126]" />
                </span>
                Colombia
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <button type="button" onClick={onOpenLogin} className={isDark ? "rounded-[1rem] border border-cyan-300/20 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10" : "rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"}>{t("logIn")}</button>

              <Link href="/registro" className={`inline-flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_20px_44px_rgba(76,29,149,0.32)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.38),0_22px_48px_rgba(59,130,246,0.20)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 ${isDark ? "rounded-[1rem] focus-visible:ring-offset-[#050816]" : "rounded-full focus-visible:ring-offset-white"}`}>
                {isEnglish ? "Join TalentSyncro" : "Únete a TalentSyncro"}
                <ArrowRight className="h-4 w-4" />
              </Link>

              <div className={isDark ? "inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-white/6 p-1" : "inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white p-1"}>
                <button type="button" onClick={() => onSetLanguage("es")} aria-pressed={language === "es"} className={language === "es" ? "inline-flex scale-105 items-center gap-1.5 rounded-full bg-[#4d7994] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-[0_8px_18px_rgba(77,121,148,0.28)] transition-all duration-250" : isDark ? "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-all duration-250 hover:bg-white/10" : "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition-all duration-250 hover:bg-slate-100"}>
                  <FlagEs className="h-3.5 w-3.5" />
                  ES
                </button>
                <button type="button" onClick={() => onSetLanguage("en")} aria-pressed={language === "en"} className={language === "en" ? "inline-flex scale-105 items-center gap-1.5 rounded-full bg-[#944d4d] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-[0_8px_18px_rgba(148,77,77,0.28)] transition-all duration-250" : isDark ? "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-all duration-250 hover:bg-white/10" : "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition-all duration-250 hover:bg-slate-100"}>
                  <FlagEn className="h-3.5 w-3.5" />
                  EN
                </button>
              </div>
            </div>
          </div>

          <div className="relative pt-12 lg:pt-16">
            <div className={isDark ? "pointer-events-none absolute inset-x-0 top-0 z-0 mx-auto h-[38rem] max-w-6xl opacity-46" : "pointer-events-none absolute inset-x-0 top-0 z-0 mx-auto h-[34rem] max-w-6xl opacity-35"}>
              <div className="absolute left-[18%] top-[12%] h-24 w-24 rounded-full bg-cyan-400/12 blur-3xl" />
              <div className="absolute right-[16%] top-[10%] h-24 w-24 rounded-full bg-fuchsia-500/8 blur-3xl" />
              {links.map((line) => (
                <span key={`hero-${line.top}-${line.left}-${line.rotate}`} className="absolute h-px origin-left bg-gradient-to-r from-cyan-300/0 via-cyan-300/90 to-cyan-300/0 shadow-[0_0_10px_rgba(71,214,255,0.42)]" style={{ top: line.top, left: line.left, width: line.width, transform: `rotate(${line.rotate})` }} />
              ))}
              {nodes.map((node) => (
                <span key={`hero-node-${node.top}-${node.left}`} className="absolute h-3 w-3 rounded-full border border-cyan-200/60 bg-cyan-300 shadow-[0_0_16px_rgba(71,214,255,0.55)]" style={{ top: node.top, left: node.left }} />
              ))}
            </div>

            <div className="relative z-10 grid gap-16 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center">
              <div className="mx-auto flex max-w-3xl flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left">

                <h1 className={isDark ? "mt-2 max-w-4xl font-[family-name:var(--font-serif-display)] text-[1.65rem] font-semibold uppercase leading-[1.02] tracking-[0.04em] text-[#f5fbff] sm:text-[2.05rem] lg:text-[2.6rem]" : "mt-2 max-w-4xl font-[family-name:var(--font-serif-display)] text-[1.65rem] font-semibold uppercase leading-[1.02] tracking-[0.04em] text-black sm:text-[2.05rem] lg:text-[2.6rem]"}>
                  {t("heroTitlePrefix")}
                  <span className="inline">
                    <span className="text-[#fed130]">{t("heroTitleAccent")}</span>{" "}
                    <span className="bg-gradient-to-r from-[#003893] via-[#003893] to-[#ce1126] bg-clip-text text-transparent">{t("heroTitleSuffix")}</span>
                  </span>
                </h1>
                <p className={isDark ? "mt-6 max-w-xl text-sm leading-8 text-slate-300 sm:text-base" : "mt-6 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg"}>{t("heroDescription")}</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link href="/registro" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-[0_22px_50px_rgba(76,29,149,0.32)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.38),0_22px_48px_rgba(59,130,246,0.20)] sm:w-auto">
                    {t("startFree")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button type="button" onClick={onOpenLogin} className={isDark ? "inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-300/18 bg-white/6 px-6 py-3.5 text-center text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/35 sm:w-auto" : "inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/90 px-6 py-3.5 text-center text-sm font-semibold text-slate-900 transition duration-300 hover:-translate-y-0.5 hover:border-sky-300 sm:w-auto"}>
                    {t("postJobFast")}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <div className="grid w-full gap-4 lg:gap-5">
                  {entryPoints.map((item) => {
                    const Icon = item.icon;
                    return (
                      <article key={item.title} className={isDark ? "rounded-[1.8rem] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(8,17,33,0.84),rgba(8,16,30,0.76))] p-5 shadow-[inset_0_1px_0_rgba(103,232,249,0.18),0_0_0_1px_rgba(34,211,238,0.03),0_30px_70px_rgba(0,0,0,0.32)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-cyan-200/28 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.05),0_22px_48px_rgba(8,145,178,0.14)] sm:p-6" : "rounded-[1.8rem] border border-slate-300 bg-[#f8fbfc]/92 p-5 shadow-[0_16px_36px_rgba(148,163,184,0.12)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-sky-300 hover:bg-white hover:shadow-[0_18px_40px_rgba(148,163,184,0.18)] sm:p-6"}>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={isDark ? "flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/8 text-cyan-200" : "flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 bg-white text-sky-700"}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <p className={isDark ? "min-w-0 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200" : "min-w-0 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700"}>{item.title}</p>
                        </div>
                        <p className={isDark ? "mt-4 text-sm leading-7 text-slate-300" : "mt-4 text-sm leading-7 text-slate-700"}>{item.text}</p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="panorama" className="relative mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-end">
          <div>
            <p className={isDark ? "text-sm font-semibold uppercase tracking-[0.34em] text-cyan-200" : "text-sm font-semibold uppercase tracking-[0.34em] text-sky-700"}>{t("panorama")}</p>
            <h2 className={isDark ? "font-display mt-4 max-w-4xl text-[1.65rem] font-bold uppercase leading-[1.02] tracking-[0.04em] text-white sm:text-[2.05rem] lg:text-[2.6rem]" : "font-display mt-4 max-w-4xl text-[1.65rem] font-bold uppercase leading-[1.02] tracking-[0.04em] text-slate-950 sm:text-[2.05rem] lg:text-[2.6rem]"}>{s("marketSignalsTitle")}</h2>
          </div>
          <p className={isDark ? "max-w-md text-sm leading-7 text-slate-400 sm:text-base" : "max-w-md text-sm leading-7 text-slate-600 sm:text-base"}>{s("marketSignalsText")}</p>
        </div>
        <div className="mt-10 grid gap-5 lg:mt-12 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className={`group rounded-[1.75rem] border p-6 transition duration-300 sm:p-7 ${isDark ? `${card.accent} shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_20px_60px_rgba(0,0,0,0.24)] hover:-translate-y-1` : "border-slate-300 bg-[#f8fbfc] shadow-[0_12px_30px_rgba(148,163,184,0.08)] hover:-translate-y-1 hover:border-sky-300 hover:bg-white hover:shadow-[0_18px_40px_rgba(148,163,184,0.18)]"}`}>
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? "border border-current/20 bg-white/4" : "border border-slate-200 bg-white"} ${isDark ? card.iconColor : card.title === "Mercado vivo y visible" ? "text-[#d29b00]" : card.title === "Empresas filtradas" ? "text-[#0284c7]" : "text-[#a21caf]"}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className={isDark ? "mt-6 text-2xl font-semibold text-white" : "mt-6 text-2xl font-semibold text-slate-900"}>{card.title}</h3>
                <p className={isDark ? "mt-4 text-sm leading-7 text-slate-400 sm:text-base" : "mt-4 text-sm leading-7 text-slate-700 sm:text-base"}>{card.text}</p>
              </article>
            );
          })}
        </div>
        <MarketPanoramaSection isDark={isDark} initialData={initialMarketStats} />
      </section>

      <section id="vacantes" className={isDark ? "relative overflow-hidden bg-[#08101d] text-white" : "bg-[#e6f1f4] text-slate-950"}>
        {isDark ? (
          <>
            <div className="pointer-events-none absolute left-[8%] top-10 h-72 w-72 rounded-full bg-cyan-400/6 blur-3xl" />
            <div className="pointer-events-none absolute right-[10%] bottom-0 h-80 w-80 rounded-full bg-sky-500/6 blur-3xl" />
          </>
        ) : null}
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className={isDark ? "text-sm font-semibold uppercase tracking-[0.34em] text-cyan-200" : "text-sm font-semibold uppercase tracking-[0.34em] text-slate-600"}>{t("editorialPicks")}</p>
              <h2 className={isDark ? "font-display mt-4 text-[1.65rem] font-bold uppercase leading-[1.02] tracking-[0.04em] text-white sm:text-[2.05rem] lg:text-[2.6rem]" : "font-display mt-4 text-[1.65rem] font-bold uppercase leading-[1.02] tracking-[0.04em] text-slate-900 sm:text-[2.05rem] lg:text-[2.6rem]"}>{t("highImpact")}</h2>
            </div>
            <Link href="/vacantes" className={isDark ? "inline-flex w-full items-center justify-start gap-2 text-sm font-semibold text-slate-300 transition hover:text-slate-100 sm:w-auto sm:justify-end" : "inline-flex w-full items-center justify-start gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900 sm:w-auto sm:justify-end"}>
              {t("fullBoard")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4">
            <p className={isDark ? "text-sm text-slate-400" : "text-sm text-slate-600"}>{t("salaryTop")}</p>
          </div>
          <div className="relative mt-10 lg:mt-12">
            <div className={isDark ? "pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#0b111b] to-transparent lg:w-20" : "pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#e6f1f4] to-transparent lg:w-20"} />
            <div className={isDark ? "pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#0b111b] to-transparent lg:w-20" : "pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#e6f1f4] to-transparent lg:w-20"} />
            <div className="overflow-hidden px-1 pb-3">
              <div className="flex w-max gap-5 animate-[editorial-carousel_66.3s_linear_infinite]">
                {[...featuredJobs, ...featuredJobs].map((job, index) => (
                  <article key={`${job.role}-${index}`} className={`w-[20.5rem] shrink-0 overflow-hidden rounded-[2rem] border shadow-[0_16px_42px_rgba(148,163,184,0.10)] transition duration-300 hover:-translate-y-1.5 ${getFeaturedCardSurface(job.accent, isDark)}`}>
                    <div className={`h-2 w-full ${job.accent}`} />
                    <div className="p-6 sm:p-7">
                      <div className="flex items-center justify-between gap-4">
                        <span className={isDark ? "rounded-full border border-[#f6c453]/28 bg-[#f6c453]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#fde68a]" : "rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800"}>{s("topJob")}</span>
                        <div className={isDark ? "flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-slate-300" : "flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600"}>
                          <BriefcaseBusiness className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className={isDark ? "mt-6 text-[1.35rem] font-semibold leading-tight text-white" : "mt-6 text-[1.35rem] font-semibold leading-tight text-slate-900"}>{job.role}</h3>
                      <div className={isDark ? "mt-6 rounded-[1.5rem] bg-white/4 p-4" : "mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-4"}>
                        <div className={isDark ? "flex items-center gap-3 py-2 text-sm text-slate-300" : "flex items-center gap-3 py-2 text-sm text-slate-700"}>
                          <CircleDollarSign className={isDark ? "h-4.5 w-4.5 text-slate-400" : "h-4.5 w-4.5 text-slate-600"} />
                          <span>{job.salary}</span>
                        </div>
                        <div className={isDark ? "flex items-center gap-3 py-2 text-sm text-slate-300" : "flex items-center gap-3 py-2 text-sm text-slate-700"}>
                          <MapPin className={isDark ? "h-4.5 w-4.5 text-slate-400" : "h-4.5 w-4.5 text-slate-600"} />
                          <span>{job.location}</span>
                        </div>
                        <div className={isDark ? "py-2 text-sm text-slate-300" : "py-2 text-sm text-slate-700"}>
                          <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-slate-400" : "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"}>{s("demand")}</p>
                          <Stars rating={job.demand} />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="registro" className={isDark ? "relative isolate border-t border-white/8" : "relative isolate border-t border-slate-300/70"}>
        <div className={isDark ? "absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,214,255,0.12),transparent_20%),radial-gradient(circle_at_left_center,rgba(45,212,191,0.08),transparent_22%),linear-gradient(180deg,#07101f_0%,#0b111b_100%)]" : "absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,214,255,0.10),transparent_20%),linear-gradient(180deg,#e6f1f4_0%,#ddecef_100%)]"} />
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,0.9fr)] lg:items-start">
            <div>
              <p className={isDark ? "text-sm font-semibold uppercase tracking-[0.34em] text-cyan-200" : "text-sm font-semibold uppercase tracking-[0.34em] text-sky-700"}>{t("flow")}</p>
              <h2 className={isDark ? "font-display mt-4 max-w-4xl text-[2rem] font-bold uppercase leading-[0.96] tracking-[0.08em] text-white sm:text-[2.8rem] lg:text-[3.6rem]" : "font-display mt-4 max-w-4xl text-[2rem] font-bold uppercase leading-[0.96] tracking-[0.08em] text-slate-900 sm:text-[2.8rem] lg:text-[3.6rem]"}>{t("startTwoMinutes")}</h2>
              <p className={isDark ? "mt-6 max-w-2xl text-sm leading-8 text-slate-400 sm:text-base" : "mt-6 max-w-2xl text-sm leading-8 text-slate-700 sm:text-base"}>{t("flowDescription")}</p>
            </div>
            <div className="space-y-5">
              {flowSteps.map((item) => (
                <article key={item.step} className={isDark ? "rounded-[1.8rem] border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(10,19,34,0.92),rgba(9,16,29,0.88))] p-6 shadow-[inset_0_1px_0_rgba(125,211,252,0.04),0_24px_80px_rgba(0,0,0,0.30)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-200/24 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.05),0_22px_48px_rgba(8,145,178,0.14)]" : "rounded-[1.8rem] border border-slate-300 bg-[#f8fbfc] p-6 shadow-[0_12px_30px_rgba(148,163,184,0.08)] transition duration-300 hover:border-slate-400 hover:bg-white hover:shadow-[0_18px_40px_rgba(226,232,240,0.8)]"}>
                  <div className="flex items-center justify-between gap-4">
                    <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.28em] text-sky-700"}>{item.step}</p>
                    <div className={isDark ? "flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/8 text-cyan-200" : "flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 bg-white text-sky-700"}>
                      <Clock3 className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className={isDark ? "mt-5 text-2xl font-semibold text-white" : "mt-5 text-2xl font-semibold text-slate-900"}>{item.title}</h3>
                  <p className={isDark ? "mt-3 text-sm leading-7 text-slate-400 sm:text-base" : "mt-3 text-sm leading-7 text-slate-700 sm:text-base"}>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FooterSection isDark={isDark} />

      {storageConsent === null && !cookieBannerDismissed ? (
        <CookieConsentBanner
          isDark={isDark}
          isEnglish={isEnglish}
          selectedMode={selectedConsentMode}
          onSelectMode={onSelectConsentMode}
          onAccept={onAcceptConsent}
          onClose={onCloseConsent}
        />
      ) : null}
    </main>
  );
}
