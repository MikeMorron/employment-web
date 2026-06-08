import type { DbClient } from "@/lib/server/db-types";
import type { AppUser, CandidateProfile } from "@/types/profile";

async function canCompanyViewCandidateApplicant(
  prisma: DbClient,
  companyId: string,
  candidateId: string,
) {
  const companyJobs = await prisma.job.findMany({
    where: { ownerCompanyId: companyId },
    select: { id: true },
  });
  const ownedJobIds = companyJobs.map((job) => job.id);

  if (ownedJobIds.length === 0) {
    return false;
  }

  const application = await prisma.application.findFirst({
    where: {
      candidateId,
      jobId: {
        in: ownedJobIds,
      },
    },
    select: { id: true },
  });

  return Boolean(application);
}

export async function getCandidateProfileAccess(
  prisma: DbClient,
  viewer: AppUser | null,
  candidate: CandidateProfile,
) {
  const isOwner = viewer?.id === candidate.id;
  let companyCanViewApplicant = false;

  if (!isOwner && viewer?.role === "company") {
    companyCanViewApplicant = await canCompanyViewCandidateApplicant(prisma, viewer.id, candidate.id);
  }

  const recruiterCanViewProfile =
    viewer?.role === "company" &&
    (candidate.profileVisibility === "public" ||
      candidate.profileVisibility === "recruiters_only");

  return {
    isOwner,
    companyCanViewApplicant,
    canViewProfile:
      isOwner ||
      companyCanViewApplicant ||
      candidate.profileVisibility === "public" ||
      recruiterCanViewProfile,
    canViewPrivateAssets: isOwner || companyCanViewApplicant,
    canViewContact:
      isOwner ||
      companyCanViewApplicant ||
      (viewer?.role === "company" && candidate.profileVisibility === "recruiters_only"),
  };
}
