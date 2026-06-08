import { prisma } from "@/lib/server/db";
import { buildAvatarFileHref } from "@/lib/file-links";
import { slugifyCompanyName } from "@/lib/company-public-slug";

function normalizeCompanyName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function findCompanyWithPublishedJobsBySlug(slug: string) {
  const users = await prisma.user.findMany({
    where: { role: "company" },
    include: {
      profile: true,
      jobs: {
        where: { status: "published" },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  const company = users.find(
    (user) =>
      user.profile &&
      slugifyCompanyName(user.profile.companyName ?? user.displayName) === slug,
  );

  if (!company?.profile) {
    return null;
  }

  return {
    id: company.id,
    displayName: company.displayName,
    profile: company.profile,
    jobs: company.jobs,
    avatarUrl: company.profile.avatarAssetPublicId
      ? buildAvatarFileHref(company.profile.avatarAssetPublicId)
      : company.profile.avatar ?? undefined,
  };
}

export async function findCompanyWithPublishedJobsByName(name: string) {
  const normalizedName = normalizeCompanyName(name);
  if (!normalizedName) {
    return null;
  }

  const users = await prisma.user.findMany({
    where: { role: "company" },
    include: {
      profile: true,
      jobs: {
        where: { status: "published" },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  const company = users.find(
    (user) =>
      user.profile &&
      normalizeCompanyName(user.profile.companyName ?? user.displayName) === normalizedName,
  );

  if (!company?.profile) {
    return null;
  }

  return {
    id: company.id,
    displayName: company.displayName,
    profile: company.profile,
    jobs: company.jobs,
    avatarUrl: company.profile.avatarAssetPublicId
      ? buildAvatarFileHref(company.profile.avatarAssetPublicId)
      : company.profile.avatar ?? undefined,
  };
}
