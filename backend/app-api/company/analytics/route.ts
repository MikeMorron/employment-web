import { prisma } from "@/lib/server/db";
import { requireCompanyUser } from "@/lib/server/api-auth";
import { candidateToApplicantStage } from "@/lib/server/app-state-notifications";
import { getFeedbackSummary } from "@/lib/server/product-engine";
import { jsonWithSecurity } from "@/lib/server/security";
import type { CandidateApplicationStatus } from "@/types/workflows";

export const runtime = "nodejs";

function getDaysSince(date: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)));
}

function parseFitScore(value: string) {
  const matched = value.match(/(\d{1,3})/);
  if (!matched) {
    return null;
  }

  const score = Number(matched[1]);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : null;
}

function getReferrerLabel(rawReferrer: string | null, source: string | null) {
  if (rawReferrer) {
    try {
      const parsed = new URL(rawReferrer);
      return parsed.hostname.replace(/^www\./, "") || "Direct";
    } catch {
      return rawReferrer;
    }
  }

  return source || "Direct";
}

export async function GET(request: Request) {
  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const jobs = await prisma.job.findMany({
    where: { ownerCompanyId: auth.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  const jobIds = jobs.map((job) => job.id);
  const [applications, events] = await Promise.all([
    jobIds.length > 0
      ? prisma.application.findMany({
          where: {
            jobId: { in: jobIds },
            status: { not: "withdrawn" },
          },
          orderBy: { appliedAt: "desc" },
          select: {
            id: true,
            jobId: true,
            status: true,
            appliedAt: true,
            lastUpdatedAt: true,
            fitLabel: true,
          },
        })
      : Promise.resolve([]),
    jobIds.length > 0
      ? prisma.event.findMany({
          where: {
            entityId: {
              in: jobIds,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      : Promise.resolve([]),
  ]);

  const trafficEvents = events.filter((event) => event.type === "view_job" || event.type === "click_job");

  const viewsTotal = trafficEvents.filter((event) => event.type === "view_job").length;
  const clicksTotal = trafficEvents.filter((event) => event.type === "click_job").length;
  const sessionBuckets = trafficEvents.reduce<Map<string, number>>((accumulator, event) => {
    const key = event.sessionId ?? `${event.userId ?? "anon"}:${event.deviceType ?? "unknown"}`;
    accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
    return accumulator;
  }, new Map());
  const uniqueVisitors = sessionBuckets.size;
  const bouncedSessions = Array.from(sessionBuckets.values()).filter((count) => count <= 1).length;
  const bounceRate = uniqueVisitors > 0 ? Math.round((bouncedSessions / uniqueVisitors) * 100) : 0;
  const deviceBreakdownMap = trafficEvents.reduce<Map<string, number>>((accumulator, event) => {
    const key = event.deviceType ?? "unknown";
    accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
    return accumulator;
  }, new Map());
  const referrerBreakdownMap = trafficEvents.reduce<Map<string, number>>((accumulator, event) => {
    const key = getReferrerLabel(event.referrer, event.source);
    accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
    return accumulator;
  }, new Map());
  const applicationsByJobId = new Map<string, typeof applications>();
  const stageCounts = {
    new: 0,
    review: 0,
    shortlist: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  };
  const fitScores: number[] = [];

  for (const application of applications) {
    const current = applicationsByJobId.get(application.jobId) ?? [];
    current.push(application);
    applicationsByJobId.set(application.jobId, current);

    const stage = candidateToApplicantStage(application.status as CandidateApplicationStatus);
    stageCounts[stage] += 1;

    const fitScore = parseFitScore(application.fitLabel);
    if (fitScore != null) {
      fitScores.push(fitScore);
    }
  }

  const applyTotal = applications.length;
  const interviewsCreated = stageCounts.interview;
  const offersSent = stageCounts.offer;
  const respondedApplications = applications.filter((application) => {
    const stage = candidateToApplicantStage(application.status as CandidateApplicationStatus);
    return stage !== "new";
  });
  const averageResponseHours = respondedApplications.length > 0
    ? Math.round(
        respondedApplications.reduce((sum, application) => {
          const diffMs = application.lastUpdatedAt.getTime() - application.appliedAt.getTime();
          return sum + Math.max(0, diffMs / (1000 * 60 * 60));
        }, 0) / respondedApplications.length,
      )
    : 0;
  const closedSuccess = jobs.filter((job) => {
    if (job.status !== "closed") {
      return false;
    }

    const relatedApplications = applicationsByJobId.get(job.id) ?? [];
    return relatedApplications.some((application) => candidateToApplicantStage(application.status as CandidateApplicationStatus) === "offer");
  }).length;

  const applicationsByDayBuckets = new Map<string, number>();
  applications.forEach((application) => {
    const label = application.appliedAt.toISOString().slice(5, 10);
    applicationsByDayBuckets.set(label, (applicationsByDayBuckets.get(label) ?? 0) + 1);
  });

  const eventsByJobId = new Map<string, typeof events>();
  for (const event of events) {
    const current = eventsByJobId.get(event.entityId) ?? [];
    current.push(event);
    eventsByJobId.set(event.entityId, current);
  }

  const performanceByJob = jobs.map((job) => {
    const jobEvents = eventsByJobId.get(job.id) ?? [];
    const jobApplications = applicationsByJobId.get(job.id) ?? [];
    let views = 0;
    let clicks = 0;

    for (const event of jobEvents) {
      if (event.type === "view_job") {
        views += 1;
      } else if (event.type === "click_job") {
        clicks += 1;
      }
    }

    return {
      jobId: job.id,
      title: job.title,
      views,
      clicks,
      applications: jobApplications.length,
      ctr: views > 0 ? Math.round((clicks / views) * 100) : 0,
      conversionRate: clicks > 0 ? Math.round((jobApplications.length / clicks) * 100) : 0,
      ageInDays: getDaysSince(job.createdAt.toISOString()),
    };
  });

  const funnelByJob = performanceByJob.slice(0, 5).map((job) => {
    const jobApplications = applicationsByJobId.get(job.jobId) ?? [];
    const stageDistribution = jobApplications.reduce(
      (accumulator, application) => {
        accumulator[candidateToApplicantStage(application.status as CandidateApplicationStatus)] += 1;
        return accumulator;
      },
      { new: 0, review: 0, shortlist: 0, interview: 0, offer: 0, rejected: 0 },
    );

    return {
      jobId: job.jobId,
      title: job.title,
      stages: [
        { label: "Vistas", value: job.views },
        { label: "Clicks", value: job.clicks },
        { label: "Postulaciones", value: job.applications },
        { label: "Revisión", value: stageDistribution.review },
        { label: "Entrevista", value: stageDistribution.interview },
        { label: "Oferta", value: stageDistribution.offer },
      ],
    };
  });

  const pipelineDistribution = [
    { label: "Nuevos", value: stageCounts.new },
    { label: "Revisión", value: stageCounts.review },
    { label: "Shortlist", value: stageCounts.shortlist },
    { label: "Entrevista", value: interviewsCreated },
    { label: "Oferta", value: offersSent },
    { label: "Cerrados", value: stageCounts.rejected },
  ];

  const averageStageDays = [
    { label: "Revisión", stage: "review" },
    { label: "Shortlist", stage: "shortlist" },
    { label: "Entrevista", stage: "interview" },
    { label: "Oferta", stage: "offer" },
  ].map(({ label, stage }) => {
    const stageApplications = applications.filter((application) => candidateToApplicantStage(application.status as CandidateApplicationStatus) === stage);
    const totalDays = stageApplications.reduce(
      (sum, application) => sum + getDaysSince(application.appliedAt.toISOString()),
      0,
    );

    return {
      label,
      value: stageApplications.length > 0 ? Math.round(totalDays / stageApplications.length) : 0,
    };
  });

  const matchQuality = {
    averageMatch: fitScores.length > 0
      ? Math.round(fitScores.reduce((sum, score) => sum + score, 0) / fitScores.length)
      : 0,
    high: fitScores.filter((score) => score >= 85).length,
    medium: fitScores.filter((score) => score >= 70 && score < 85).length,
    low: fitScores.filter((score) => score < 70).length,
  };
  const feedbackSummary = await getFeedbackSummary(prisma, auth.id);

  return jsonWithSecurity({
    ok: true,
    kpis: {
      activeJobs: jobs.filter((job) => job.status === "published").length,
      viewsTotal,
      clicksTotal,
      uniqueVisitors,
      bounceRate,
      applicationsTotal: applyTotal,
      visitToApplyRate: viewsTotal > 0 ? Math.round((applyTotal / viewsTotal) * 100) : 0,
      interviewsCreated,
      offersSent,
      closedSuccess,
      averageResponseHours,
    },
    funnelByJob,
    applicationsByTime: [...applicationsByDayBuckets.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-7),
    performanceByJob,
    pipelineDistribution,
    deviceBreakdown: [...deviceBreakdownMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    referrerBreakdown: [...referrerBreakdownMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6),
    averageStageDays,
    matchQuality,
    feedbackSummary,
  });
}
