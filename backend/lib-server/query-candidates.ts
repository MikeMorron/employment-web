import type { CandidateProfile } from "@/types/profile";
import { prisma } from "./db";
import { rowToUser } from "./app-state";

export interface CandidateListFilters {
  category?: string;
  city?: string;
  mode?: string;
  query?: string;
  page?: number;
  limit?: number;
}

export async function listDiscoverableCandidates(
  filters: CandidateListFilters = {},
): Promise<CandidateProfile[]> {
  const { category, city, mode, query, page = 0, limit = 20 } = filters;

  const users = await prisma.user.findMany({
    where: {
      role: "candidate",
      profile: {
        NOT: {
          profileVisibility: "private",
        },
        ...(category
          ? { categoriasEnfoqueJson: { contains: category } }
          : {}),
        ...(city ? { ubicacion: { contains: city, mode: "insensitive" } } : {}),
        ...(mode ? { modalidadTrabajo: { contains: mode, mode: "insensitive" } } : {}),
      },
      ...(query
        ? {
            OR: [
              { displayName: { contains: query, mode: "insensitive" } },
              { profile: { rol: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { profile: true },
    take: limit,
    skip: page * limit,
    orderBy: { createdAt: "desc" },
  });

  return users
    .filter((u) => u.profile)
    .map((u) => rowToUser(u, u.profile!) as CandidateProfile);
}
