import type { UserRole } from "@/types/account";

export type CandidateApplicationStatus =
  | "application_submitted"
  | "application_received"
  | "in_review"
  | "preselected"
  | "in_evaluation"
  | "shortlisted"
  | "in_decision"
  | "offer_sent"
  | "offer_accepted"
  | "offer_rejected"
  | "rejected"
  | "not_selected"
  | "process_closed"
  | "vacancy_cancelled"
  | "withdrawn"
  | "submitted"
  | "shortlist"
  | "interview"
  | "offer";

export type CompanyJobStatus = "draft" | "published" | "paused" | "closed";

export type CandidateApplication = {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  vacancyTitle?: string;
  title: string;
  companyName: string;
  location: string;
  modality: string;
  salary?: string;
  status: CandidateApplicationStatus;
  appliedAt: string;
  lastUpdatedAt: string;
  fitLabel: string;
  matchScore?: number;
  coverNote?: string;
};

export type CompanyApplicant = {
  id: string;
  candidateId?: string;
  name: string;
  role: string;
  location: string;
  matchScore: number;
  stage: "new" | "review" | "shortlist" | "interview" | "offer" | "rejected";
  appliedAt: string;
  source: "marketplace" | "direct";
};

export type CompanyJobPost = {
  id: string;
  ownerCompanyId: string;
  companyName: string;
  companyVerificationStatus?: "verified" | "pending" | "unverified";
  title: string;
  location: string;
  modality: string;
  salary?: string;
  description: string;
  tags: string[];
  status: CompanyJobStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  applicants: CompanyApplicant[];
};

export type CompanyJobHistoryEntry = {
  id: string;
  archivedAt: string;
  job: Omit<CompanyJobPost, "applicants">;
};

export type AllowedRouteRole = UserRole | "guest";
