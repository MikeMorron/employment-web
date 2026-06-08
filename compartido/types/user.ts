import type { CandidateProfile } from "@/types/profile";

export type User = CandidateProfile;

export type UserJobFitSkill = {
  label: string;
  score: number;
  target: number;
};

export type UserJobFit = {
  jobId: string;
  skillsMatch: UserJobFitSkill[];
};
