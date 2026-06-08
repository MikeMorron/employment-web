"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/compartido/lib/api";
import { clearCachedResource } from "@/compartido/lib/client/resource-cache";
import type { CompanyProfile } from "@/compartido/types/profile";
import type { CompanyJobHistoryEntry, CompanyJobPost, CompanyJobStatus } from "@/compartido/types/workflows";

type UpsertJobInput = {
  id?: string;
  title: string;
  location: string;
  modality: string;
  salary?: string;
  description: string;
  tags: string[];
  status: CompanyJobStatus;
  featured?: boolean;
};

type CompanyJobsResponse = {
  ok: boolean;
  jobs?: CompanyJobPost[];
  message?: string;
};

type CompanyJobHistoryResponse = {
  ok: boolean;
  history?: CompanyJobHistoryEntry[];
  message?: string;
};

function mergeCompanyJob(current: CompanyJobPost, incoming: CompanyJobPost) {
  const shouldPreserveApplicants =
    current.applicants.length > 0 &&
    Array.isArray(incoming.applicants) &&
    incoming.applicants.length === 0;

  return {
    ...current,
    ...incoming,
    applicants: shouldPreserveApplicants ? current.applicants : incoming.applicants,
  };
}

function invalidateVacancyFeedCache() {
  clearCachedResource("vacancy-feed");
}

export function useCompanyJobs(company: CompanyProfile | null) {
  const companyId = company?.id ?? null;
  const [jobs, setJobs] = useState<CompanyJobPost[]>([]);
  const [jobHistory, setJobHistory] = useState<CompanyJobHistoryEntry[]>([]);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setJobs([]);
      return;
    }

    const response = await apiRequest<CompanyJobsResponse>("/api/company/jobs");
    if (response.ok && response.data?.jobs) {
      setJobs(response.data.jobs);
    }
  }, [companyId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!companyId) {
        startTransition(() => setJobs([]));
        startTransition(() => setJobHistory([]));
        return;
      }

      const [jobsResponse, historyResponse] = await Promise.all([
        apiRequest<CompanyJobsResponse>("/api/company/jobs"),
        apiRequest<CompanyJobHistoryResponse>("/api/company/jobs/history"),
      ]);
      if (!cancelled && jobsResponse.ok && jobsResponse.data?.jobs) {
        startTransition(() => setJobs(jobsResponse.data?.jobs ?? []));
      }
      if (!cancelled && historyResponse.ok && historyResponse.data?.history) {
        startTransition(() => setJobHistory(historyResponse.data?.history ?? []));
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const upsertJob = useCallback(async (input: UpsertJobInput) => {
    if (!companyId) {
      return null;
    }

    if (input.id) {
      const response = await apiRequest<{ ok: boolean; job?: CompanyJobPost; message?: string }>(`/api/company/jobs/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(response.data?.message ?? "No se pudo guardar la vacante.");
      }

      if (response.data?.job) {
        invalidateVacancyFeedCache();
        setJobs((current) =>
          current
            .map((job) => (job.id === response.data?.job?.id ? mergeCompanyJob(job, response.data.job) : job))
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        );
        return response.data.job;
      }

      return null;
    }

    const response = await apiRequest<CompanyJobsResponse & { job?: CompanyJobPost }>("/api/company/jobs", {
      method: "POST",
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(response.data?.message ?? "No se pudo guardar la vacante.");
    }

    if (response.data?.jobs) {
      invalidateVacancyFeedCache();
      setJobs(response.data.jobs);
      return response.data.job ?? null;
    }

    return null;
  }, [companyId]);

  const updateJobStatus = useCallback(async (jobId: string, status: CompanyJobStatus) => {
    const response = await apiRequest<{ ok: boolean; job?: CompanyJobPost; message?: string }>(`/api/company/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(response.data?.message ?? "No se pudo actualizar el estado.");
    }

    if (response.data?.job) {
      invalidateVacancyFeedCache();
      setJobs((current) =>
        current
          .map((job) => (job.id === response.data?.job?.id ? mergeCompanyJob(job, response.data.job) : job))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
      );
    }
  }, []);

  const deleteJob = useCallback(async (jobId: string) => {
    const response = await apiRequest<{ ok: boolean; jobs?: CompanyJobPost[]; message?: string }>(`/api/company/jobs/${jobId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(response.data?.message ?? "No se pudo eliminar la vacante.");
    }

    setJobs(response.data?.jobs ?? jobs.filter((job) => job.id !== jobId));
    const historyResponse = await apiRequest<CompanyJobHistoryResponse>("/api/company/jobs/history");
    if (historyResponse.ok && historyResponse.data?.history) {
      setJobHistory(historyResponse.data.history);
    }
    invalidateVacancyFeedCache();
  }, [jobs]);

  const refreshJobHistory = useCallback(async () => {
    if (!companyId) {
      setJobHistory([]);
      return [];
    }

    const response = await apiRequest<CompanyJobHistoryResponse>("/api/company/jobs/history");
    if (response.ok && response.data?.history) {
      setJobHistory(response.data.history);
      return response.data.history;
    }

    return [];
  }, [companyId]);

  const deleteJobHistoryEntry = useCallback(async (historyId: string) => {
    const response = await apiRequest<CompanyJobHistoryResponse>("/api/company/jobs/history", {
      method: "DELETE",
      body: JSON.stringify({ historyId }),
    });

    if (!response.ok) {
      throw new Error(response.data?.message ?? "No se pudo eliminar del historial.");
    }

    setJobHistory(response.data?.history ?? []);
  }, []);

  const moveApplicantStage = useCallback(async (jobId: string, applicantId: string, stage: CompanyJobPost["applicants"][number]["stage"]) => {
    const ownsJob = jobs.some((job) => job.id === jobId);
    if (!ownsJob) {
      return;
    }

    const response = await apiRequest<{ ok: boolean }>(`/api/company/applications/${applicantId}`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    });

    if (response.ok) {
      void refresh();
    }
  }, [jobs, refresh]);

  const analytics = useMemo(() => {
    const published = jobs.filter((job) => job.status === "published");
    const allApplicants = jobs.flatMap((job) => job.applicants);
    const interviews = allApplicants.filter((item) => item.stage === "interview").length;
    const offers = allApplicants.filter((item) => item.stage === "offer").length;
    const shortlisted = allApplicants.filter((item) => item.stage === "shortlist").length;
    const rejected = allApplicants.filter((item) => item.stage === "rejected").length;

    return {
      totalJobs: jobs.length,
      publishedJobs: published.length,
      totalApplicants: allApplicants.length,
      interviews,
      offers,
      shortlisted,
      rejected,
      conversionRate: allApplicants.length > 0 ? Math.round((offers / allApplicants.length) * 100) : 0,
    };
  }, [jobs]);

  return {
    companyJobs: jobs,
    allCompanyJobs: jobs,
    jobHistory,
    analytics,
    upsertJob,
    updateJobStatus,
    deleteJob,
    deleteJobHistoryEntry,
    moveApplicantStage,
    refreshCompanyJobs: refresh,
    refreshJobHistory,
  };
}
