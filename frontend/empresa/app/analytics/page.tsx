"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BriefcaseBusiness, Clock3, Download, MousePointerClick, RefreshCw, Target, Users } from "lucide-react";
import { RoleRouteGuard } from "@/compartido/components/role/role-route-guard";
import { useAuthUser } from "@/compartido/hooks/use-auth-user";
import { useVacancyTheme } from "@/compartido/theme/use-vacancy-theme";
import {
  AUTO_REFRESH_MS,
  formatRemaining,
  MANUAL_REFRESH_LIMIT,
  MANUAL_REFRESH_WINDOW_MS,
  readRefreshState,
  type RefreshState,
  useRefreshClock,
  writeRefreshState,
} from "@/frontend/empresa/components/analytics/company-analytics-refresh";
import {
  buildChartSeries,
  formatDuration,
  MetricCard,
  SimpleBars,
  TrafficChart,
} from "@/frontend/empresa/components/analytics/company-analytics-primitives";
import { CompanyDashboardShell } from "@/frontend/empresa/components/system/company-dashboard-shell";
import { useCompanyAnalytics } from "@/frontend/empresa/hooks/use-company-analytics";
import { useCompanyJobs } from "@/frontend/empresa/hooks/use-company-jobs";

export default function AnalyticsPage() {
  const { isDark, toggleTheme } = useVacancyTheme();
  const { authUser } = useAuthUser();
  const company = authUser?.role === "company" ? authUser : null;
  const { companyJobs, refreshCompanyJobs } = useCompanyJobs(company);
  const { analytics, refreshAnalytics } = useCompanyAnalytics(company);
  const [refreshState, setRefreshState] = useState<RefreshState>(() => (company?.id ? readRefreshState(company.id) : { lastFetchedAt: Date.now(), manualRefreshes: [] }));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const clockTick = useRefreshClock();

  useEffect(() => {
    if (!company?.id || clockTick - refreshState.lastFetchedAt < AUTO_REFRESH_MS) {
      return;
    }

    void Promise.all([refreshCompanyJobs(), refreshAnalytics()]).finally(() => {
      const nextState = { ...refreshState, lastFetchedAt: Date.now() };
      setRefreshState(nextState);
      writeRefreshState(company.id, nextState);
    });
  }, [clockTick, company?.id, refreshAnalytics, refreshCompanyJobs, refreshState]);

  const reviewCandidates = useMemo(
    () => companyJobs.flatMap((job) => job.applicants).filter((item) => item.stage === "review").length,
    [companyJobs],
  );
  const recentManualRefreshes = refreshState.manualRefreshes.filter((timestamp) => clockTick - timestamp < MANUAL_REFRESH_WINDOW_MS);
  const canRefreshManually = recentManualRefreshes.length < MANUAL_REFRESH_LIMIT;
  const nextRefreshAvailableAt = canRefreshManually ? null : recentManualRefreshes[0] + MANUAL_REFRESH_WINDOW_MS;

  const chartData = useMemo(
    () => buildChartSeries(analytics.applicationsByTime, analytics.kpis.clicksTotal, analytics.kpis.viewsTotal),
    [analytics.applicationsByTime, analytics.kpis.clicksTotal, analytics.kpis.viewsTotal],
  );

  const referrerItems = useMemo(() => {
    if (analytics.referrerBreakdown.length > 0) {
      return analytics.referrerBreakdown.slice(0, 4).map((item) => ({
        label: item.label,
        value: item.value,
      }));
    }

    const performance = analytics.performanceByJob.slice(0, 4);
    if (performance.length > 0) {
      return performance.map((item) => ({
        label: item.title,
        value: item.views || item.clicks || item.applications || 0,
      }));
    }

    return [
      { label: "Direct", value: 512 },
      { label: "Product Hunt", value: 238 },
      { label: "Twitter", value: 174 },
      { label: "Blog", value: 104 },
    ];
  }, [analytics.performanceByJob, analytics.referrerBreakdown]);

  const deviceItems = useMemo(() => {
    if (analytics.deviceBreakdown.length > 0) {
      const total = Math.max(analytics.deviceBreakdown.reduce((sum, item) => sum + item.value, 0), 1);
      return analytics.deviceBreakdown.map((item) => ({
        label: item.label[0]?.toUpperCase() + item.label.slice(1),
        value: Math.round((item.value / total) * 100),
      }));
    }

    return [
      { label: "Desktop", value: 74 },
      { label: "Mobile", value: 22 },
      { label: "Tablet", value: 4 },
    ];
  }, [analytics.deviceBreakdown]);

  const handleManualRefresh = async () => {
    if (!company?.id || !canRefreshManually || isRefreshing) {
      return;
    }

    const currentState = readRefreshState(company.id);
    const validRefreshes = currentState.manualRefreshes.filter((timestamp) => Date.now() - timestamp < MANUAL_REFRESH_WINDOW_MS);
    if (validRefreshes.length >= MANUAL_REFRESH_LIMIT) {
      const blocked = { ...currentState, manualRefreshes: validRefreshes };
      setRefreshState(blocked);
      writeRefreshState(company.id, blocked);
      return;
    }

    setIsRefreshing(true);
    await Promise.all([refreshCompanyJobs(), refreshAnalytics()]);
    const nextState = { lastFetchedAt: Date.now(), manualRefreshes: [...validRefreshes, Date.now()] };
    setRefreshState(nextState);
    writeRefreshState(company.id, nextState);
    setIsRefreshing(false);
  };

  return (
    <RoleRouteGuard allowedRole="company">
      <CompanyDashboardShell
        isDark={isDark}
        onToggleTheme={toggleTheme}
        title="Dashboard"
        description=""
        actions={
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={!canRefreshManually || isRefreshing}
            className={`${!canRefreshManually || isRefreshing ? "cursor-not-allowed opacity-70" : ""} ${isDark ? "inline-flex items-center gap-2 rounded-[1rem] bg-white px-4 py-2.5 text-sm font-medium text-slate-900" : "inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"}`}
          >
            {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isRefreshing ? "Actualizando..." : "Recargar"}
          </button>
        }
      >
        <section className={isDark ? "mb-4 rounded-[1.4rem] border border-cyan-300/18 bg-cyan-300/8 px-4 py-3 text-sm text-cyan-100" : "mb-4 rounded-[1.4rem] border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-700"}>
          {canRefreshManually
            ? `Actualización automática cada 10 minutos. Próxima en ${formatRemaining(AUTO_REFRESH_MS - (clockTick - refreshState.lastFetchedAt))}.`
            : `Límite de 3 recargas por hora alcanzado. Disponible otra vez en ${formatRemaining((nextRefreshAvailableAt ?? clockTick) - clockTick)}.`}
        </section>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          {[
            { key: "overview", label: "Overview", active: false },
            { key: "analytics", label: "Analytics", active: true },
            { key: "reports", label: "Reports", active: false, disabled: true },
            { key: "notifications", label: "Notifications", active: false, disabled: true },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              disabled={tab.disabled}
              className={
                tab.active
                  ? isDark
                    ? "rounded-[0.9rem] border border-cyan-300/18 bg-cyan-300/12 px-3 py-2 text-xs font-semibold text-cyan-100"
                    : "rounded-[0.9rem] border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700"
                  : isDark
                    ? "rounded-[0.9rem] border border-white/8 bg-white/4 px-3 py-2 text-xs text-slate-400 disabled:opacity-70"
                    : "rounded-[0.9rem] border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 disabled:opacity-70"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section className={isDark ? "rounded-[1.8rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(7,16,31,0.96),rgba(8,17,32,0.92))] px-4 py-4 shadow-[inset_0_1px_0_rgba(125,211,252,0.05)] sm:px-5" : "rounded-[1.8rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] px-4 py-4 shadow-[0_18px_44px_rgba(148,163,184,0.10)] sm:px-5"}>
          <div>
            <h2 className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>Traffic Overview</h2>
            <p className={isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500"}>Weekly clicks and unique visitors</p>
          </div>
          <TrafficChart isDark={isDark} data={chartData} />
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard isDark={isDark} icon={MousePointerClick} label="Total Clicks" value={analytics.kpis.clicksTotal.toLocaleString("en-US")} helper="+12.4% vs last week" />
          <MetricCard isDark={isDark} icon={Users} label="Unique Visitors" value={analytics.kpis.uniqueVisitors.toLocaleString("en-US")} helper="+5.8% vs last week" />
          <MetricCard isDark={isDark} icon={Target} label="Bounce Rate" value={`${analytics.kpis.bounceRate}%`} helper="-3.2% vs last week" />
          <MetricCard isDark={isDark} icon={Clock3} label="Avg. Session" value={formatDuration(analytics.kpis.averageResponseHours)} helper="+18s vs last week" />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.8fr)]">
          <article className={isDark ? "rounded-[1.7rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(7,16,31,0.96),rgba(8,17,32,0.92))] p-5" : "rounded-[1.7rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5"}>
            <h3 className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>Referrers</h3>
            <p className={isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500"}>Top sources driving traffic</p>
            <div className="mt-6">
              <SimpleBars isDark={isDark} items={referrerItems} />
            </div>
          </article>

          <article className={isDark ? "rounded-[1.7rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(7,16,31,0.96),rgba(8,17,32,0.92))] p-5" : "rounded-[1.7rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5"}>
            <h3 className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>Devices</h3>
            <p className={isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500"}>How users access your app</p>
            <div className="mt-6">
              <SimpleBars isDark={isDark} items={deviceItems} suffix="%" />
            </div>
          </article>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-3">
          <article className={isDark ? "rounded-[1.5rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(7,16,31,0.94),rgba(8,17,32,0.90))] p-5" : "rounded-[1.5rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5"}>
            <div className="flex items-center justify-between gap-3">
              <span className={isDark ? "text-xs uppercase tracking-[0.18em] text-slate-500" : "text-xs uppercase tracking-[0.18em] text-slate-500"}>Open jobs</span>
              <BriefcaseBusiness className={isDark ? "h-4 w-4 text-cyan-200" : "h-4 w-4 text-sky-700"} />
            </div>
            <p className={isDark ? "mt-3 text-2xl font-semibold text-white" : "mt-3 text-2xl font-semibold text-slate-950"}>{analytics.kpis.activeJobs}</p>
          </article>
          <article className={isDark ? "rounded-[1.5rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(7,16,31,0.94),rgba(8,17,32,0.90))] p-5" : "rounded-[1.5rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5"}>
            <div className="flex items-center justify-between gap-3">
              <span className={isDark ? "text-xs uppercase tracking-[0.18em] text-slate-500" : "text-xs uppercase tracking-[0.18em] text-slate-500"}>Applications</span>
              <Users className={isDark ? "h-4 w-4 text-cyan-200" : "h-4 w-4 text-sky-700"} />
            </div>
            <p className={isDark ? "mt-3 text-2xl font-semibold text-white" : "mt-3 text-2xl font-semibold text-slate-950"}>{analytics.kpis.applicationsTotal}</p>
          </article>
          <article className={isDark ? "rounded-[1.5rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(7,16,31,0.94),rgba(8,17,32,0.90))] p-5" : "rounded-[1.5rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5"}>
            <div className="flex items-center justify-between gap-3">
              <span className={isDark ? "text-xs uppercase tracking-[0.18em] text-slate-500" : "text-xs uppercase tracking-[0.18em] text-slate-500"}>In review</span>
              <Activity className={isDark ? "h-4 w-4 text-cyan-200" : "h-4 w-4 text-sky-700"} />
            </div>
            <p className={isDark ? "mt-3 text-2xl font-semibold text-white" : "mt-3 text-2xl font-semibold text-slate-950"}>{reviewCandidates}</p>
          </article>
        </section>
      </CompanyDashboardShell>
    </RoleRouteGuard>
  );
}
