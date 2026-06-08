export type ProductNotificationType =
  | "platform_announcement"
  | "plan_status"
  | "application_submitted"
  | "application_received"
  | "application_review"
  | "application_preselected"
  | "application_evaluation"
  | "application_shortlist"
  | "application_decision"
  | "application_offer"
  | "application_offer_accepted"
  | "application_offer_rejected"
  | "application_rejected"
  | "application_not_selected"
  | "application_process_closed"
  | "application_vacancy_cancelled"
  | "application_withdrawn"
  | "profile_viewed"
  | "recommended_job"
  | "company_high_match_candidate"
  | "company_pending_review"
  | "company_job_stale"
  | "activation_nudge"
  | "retention_reminder"
  | "verification_update";

export type ProductNotificationCategory =
  | "platform"
  | "workflow"
  | "insight"
  | "retention"
  | "trust";

export type ProductNotification = {
  id: string;
  userId: string;
  type: ProductNotificationType;
  category: ProductNotificationCategory;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  applicationId?: string;
  jobId?: string;
  entityId?: string;
  status?: string;
  linkHref?: string;
  metadata?: Record<string, unknown>;
};

export type CandidateApplicationNotificationType = ProductNotificationType;
export type CandidateApplicationNotification = ProductNotification;
