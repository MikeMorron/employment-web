export type ActivationMilestoneStatus = "locked" | "in_progress" | "completed";

export type ActivationMilestoneRecord = {
  key: string;
  title: string;
  description: string;
  status: ActivationMilestoneStatus;
  score: number;
  completedAt?: string | null;
  ctaHref?: string;
};

export type ActivationSummary = {
  role: "candidate" | "company";
  progressPercent: number;
  firstValueReached: boolean;
  firstValueLabel: string;
  milestones: ActivationMilestoneRecord[];
};

export type RetentionTaskRecord = {
  id: string;
  kind: string;
  channel: string;
  status: string;
  role?: string;
  scheduledAt: string;
  sentAt?: string | null;
  providerMessageId?: string | null;
  retries?: number;
  lastError?: string | null;
  payload?: Record<string, unknown> | null;
};

export type VerificationRequestRecord = {
  id: string;
  role: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string | null;
  notes?: string | null;
};
