export type AnalyticsEventType =
  | "api_request"
  | "search_jobs"
  | "view_job"
  | "click_job"
  | "apply_job"
  | "view_profile"
  | "save_candidate"
  | "invite_candidate"
  | "create_job"
  | "edit_job"
  | "publish_job"
  | "move_stage"
  | "shortlist_candidate"
  | "reject_candidate"
  | "view_plan"
  | "click_upgrade"
  | "purchase_plan"
  | "view_candidates"
  | "view_analytics"
  | "complete_profile";

export type AnalyticsEventSurface =
  | "candidate_feed"
  | "candidate_matches"
  | "candidate_profile"
  | "candidate_applications"
  | "company_candidates"
  | "company_pipeline"
  | "company_jobs"
  | "company_analytics"
  | "settings"
  | "home"
  | "unknown";

export type AnalyticsEventSource =
  | "client_api"
  | "jobs_feed"
  | "candidate_search"
  | "company_dashboard"
  | "pipeline_board"
  | "pipeline_list"
  | "settings_plan"
  | "home_dashboard"
  | "direct"
  | "unknown";

export type AnalyticsEventContext = {
  sessionId?: string;
  source?: AnalyticsEventSource;
  surface?: AnalyticsEventSurface;
  pathname?: string;
  referrer?: string;
  deviceType?: "mobile" | "tablet" | "desktop" | "server" | "unknown";
  actorRole?: "candidate" | "company" | "admin" | "anonymous";
  timeOnPageMs?: number;
  dedupeKey?: string;
};

export type AnalyticsEventRecord = {
  id: string;
  userId?: string | null;
  type: AnalyticsEventType;
  entityId: string;
  metadata?: Record<string, unknown>;
  context?: AnalyticsEventContext;
  createdAt: string;
  happenedAt?: string;
};
