import { prisma } from "./db";

export interface RegisteredCompany {
  id: string;
  displayName: string;
  industry?: string;
  avatar?: string;
}

export async function searchRegisteredCompanies(query: string): Promise<RegisteredCompany[]> {
  const users = await prisma.user.findMany({
    where: {
      role: "company",
      displayName: { contains: query, mode: "insensitive" },
    },
    include: { profile: true },
    take: 20,
  });

  return users.map((u) => ({
    id: u.id,
    displayName: u.displayName,
    industry: u.profile?.industry ?? undefined,
    avatar: u.profile?.avatar ?? undefined,
  }));
}
