import { prisma } from "@/lib/server/db";

export type CandidateSearchHistoryEntry = {
  query: string;
  searchedAt: string;
  category?: string;
  modality?: string;
  department?: string;
  municipality?: string;
};

function parseSearchMetadata(metadataJson: string | null) {
  if (!metadataJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(metadataJson) as {
      query?: unknown;
      category?: unknown;
      modality?: unknown;
      department?: unknown;
      municipality?: unknown;
    };

    const query = typeof parsed.query === "string" ? parsed.query.trim() : "";
    if (!query) {
      return null;
    }

    return {
      query,
      category: typeof parsed.category === "string" ? parsed.category.trim() || undefined : undefined,
      modality: typeof parsed.modality === "string" ? parsed.modality.trim() || undefined : undefined,
      department: typeof parsed.department === "string" ? parsed.department.trim() || undefined : undefined,
      municipality: typeof parsed.municipality === "string" ? parsed.municipality.trim() || undefined : undefined,
    };
  } catch {
    return null;
  }
}

export async function listCandidateSearchHistory(userId: string, limit = 100) {
  const rows = await prisma.event.findMany({
    where: {
      userId,
      type: "search_jobs",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: Math.max(1, Math.min(limit, 100)),
    select: {
      metadataJson: true,
      createdAt: true,
    },
  });

  return rows.reduce<CandidateSearchHistoryEntry[]>((accumulator, row) => {
    const parsed = parseSearchMetadata(row.metadataJson);
    if (!parsed) {
      return accumulator;
    }

    accumulator.push({
      ...parsed,
      searchedAt: row.createdAt.toISOString(),
    });

    return accumulator;
  }, []);
}

