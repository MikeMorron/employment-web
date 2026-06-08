"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/compartido/lib/api";
import type { CompanyProfile } from "@/compartido/types/profile";

type CompanyAnalyticsResponse = {
  ok: boolean;
  kpis?: {
    activeJobs: number;
    viewsTotal: number;
    clicksTotal: number;
    uniqueVisitors: number;
    bounceRate: number;
    applicationsTotal: number;
    visitToApplyRate: number;
    interviewsCreated: number;
    offersSent: number;
    closedSuccess: number;
    averageResponseHours: number;
  };
  applicationsByTime?: Array<{ label: string; value: number }>;
  performanceByJob?: Array<{ jobId: string; title: string; views: number; clicks: number; applications: number; ctr: number; conversionRate: number; ageInDays: number }>;
  pipelineDistribution?: Array<{ label: string; value: number }>;
  deviceBreakdown?: Array<{ label: string; value: number }>;
  referrerBreakdown?: Array<{ label: string; value: number }>;
};

const EMPTY_ANALYTICS: Required<CompanyAnalyticsResponse> = {
  ok: true,
  kpis: {
    activeJobs: 0,
    viewsTotal: 0,
    clicksTotal: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    applicationsTotal: 0,
    visitToApplyRate: 0,
    interviewsCreated: 0,
    offersSent: 0,
    closedSuccess: 0,
    averageResponseHours: 0,
  },
  applicationsByTime: [],
  performanceByJob: [],
  pipelineDistribution: [],
  deviceBreakdown: [],
  referrerBreakdown: [],
};

export function useCompanyAnalytics(company: CompanyProfile | null) {
  const companyId = company?.id ?? null;
  const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!companyId) {
        setAnalytics(EMPTY_ANALYTICS);
        return;
      }

      const response = await apiRequest<CompanyAnalyticsResponse>("/api/company/analytics");
      if (!cancelled && response.ok) {
        startTransition(() => {
          setAnalytics({
            ok: true,
            kpis: response.data?.kpis ?? EMPTY_ANALYTICS.kpis,
            applicationsByTime: response.data?.applicationsByTime ?? [],
            performanceByJob: response.data?.performanceByJob ?? [],
            pipelineDistribution: response.data?.pipelineDistribution ?? [],
            deviceBreakdown: response.data?.deviceBreakdown ?? [],
            referrerBreakdown: response.data?.referrerBreakdown ?? [],
          });
        });
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [companyId, refreshNonce]);

  const refreshAnalytics = useCallback(() => {
    setRefreshNonce((current) => current + 1);
  }, []);

  return { analytics, refreshAnalytics };
}
