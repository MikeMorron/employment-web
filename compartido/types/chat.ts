import type { CandidateApplicationStatus, CompanyApplicant } from "@/types/workflows";

export type ChatParticipant = {
  id: string;
  name: string;
  role: "candidate" | "company";
  headline: string;
  location?: string;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  sentAt: string;
  kind?: "user" | "system" | "auto_intro";
};

export type ChatParticipantState = {
  muted: boolean;
  blocked: boolean;
  blockedAt: string | null;
  lastReadAt: string | null;
  reportedAt: string | null;
  reportReason: string | null;
  cooldownUntil?: string | null;
};

export type ChatConversation = {
  id: string;
  applicationId: string;
  createdAt: string;
  createdById: string;
  status: "active" | "closed" | "pending_review";
  jobId?: string;
  jobTitle?: string;
  companyName?: string;
  participants: ChatParticipant[];
  participantState: Record<string, ChatParticipantState>;
  messages: ChatMessage[];
};

export type ChatPendingInvite = {
  id: string;
  applicationId: string;
  candidateId: string;
  companyUserId: string;
  companyName: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  applicationStatus: CandidateApplicationStatus;
  applicantStage: CompanyApplicant["stage"];
  sentAt: string;
  messageTemplatePreview: string;
  canRespond: boolean;
  canInviteAgainAt?: string | null;
};

export type CompanyChatCandidateDirectoryItem = {
  applicationId: string;
  candidateId: string;
  nombre: string;
  rol: string;
  ubicacion?: string;
  jobId: string;
  jobTitle: string;
  applicationStatus: CandidateApplicationStatus;
  applicantStage: CompanyApplicant["stage"];
  inviteStatus: "ready" | "pending" | "accepted" | "cooldown";
  latestInviteId?: string | null;
  canInviteAt?: string | null;
  activeConversationId?: string | null;
};

export type ChatReport = {
  id: string;
  conversationId: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  createdAt: string;
};

export type ChatStore = {
  version: 1;
  conversations: ChatConversation[];
  pendingInvites: ChatPendingInvite[];
  reports: ChatReport[];
};

export type ChatModerationWarning = {
  message: string;
  penaltyPct: number;
  warningCountMonth: number;
  suspendedForReview: boolean;
};
