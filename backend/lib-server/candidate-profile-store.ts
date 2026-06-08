import type { Prisma, PrismaClient } from "@prisma/client";
import type { ExperienceItem, StructuredSkill } from "@/types/profile";

type CandidateProfileStoreClient = PrismaClient | Prisma.TransactionClient;

export async function replaceCandidateExperiences(
  prismaClient: CandidateProfileStoreClient,
  userId: string,
  experiences: ExperienceItem[],
): Promise<void> {
  await prismaClient.candidateExperience.deleteMany({ where: { userId } });

  for (const [index, exp] of experiences.entries()) {
    await prismaClient.candidateExperience.create({
        data: {
          userId,
          rol: exp.rol,
          empresa: exp.empresa,
          empresaNit: exp.empresaNit ?? null,
          tiempo: exp.tiempo,
          startDate: exp.fechaInicio ?? null,
          endDate: exp.fechaFin ?? null,
          current: exp.actualidad ?? false,
          durationMonths: exp.durationMonths ?? null,
          opinion: exp.opinion ?? null,
          description: exp.description ?? null,
          canonicalRole: exp.canonicalRole ?? null,
          roleFamily: exp.roleFamily ?? null,
          companyIndustry: exp.companyIndustry ?? null,
          employmentType: exp.employmentType ?? null,
          location: exp.location ?? null,
          workMode: exp.workMode ?? null,
          achievements: exp.achievements ?? null,
          skillsUsed: exp.skillsUsed ?? [],
          domainTags: exp.domainTags ?? [],
          functionalTags: exp.functionalTags ?? [],
          teamScope: exp.teamScope ?? null,
          peopleLedCount: exp.peopleLedCount ?? null,
          productsWorkedOn: exp.productsWorkedOn ?? [],
          sortOrder: index,
        },
      });
  }
}

export async function replaceCandidateStructuredSkills(
  prismaClient: CandidateProfileStoreClient,
  userId: string,
  skills: StructuredSkill[] | undefined,
): Promise<void> {
  if (!skills) return;
  await prismaClient.candidateSkill.deleteMany({ where: { userId } });

  for (const skill of skills) {
    const entry = skill as StructuredSkill & {
      name?: string;
      level?: string;
      category?: string;
      skillName?: string;
      skillLevel?: string;
      skillCategory?: string;
    };

    await prismaClient.candidateSkill.create({
      data: {
        userId,
        skillName: entry.name ?? entry.skillName ?? "",
        skillLevel: entry.level ?? entry.skillLevel ?? null,
        skillCategory: entry.category ?? entry.skillCategory ?? null,
      },
    });
  }
}
