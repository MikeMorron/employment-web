import { requireAuthUser } from "@/lib/server/api-auth";
import { prisma } from "@/lib/server/db";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const interests = await prisma.categoryInterest.findMany({
    where: { userId: auth.id },
    orderBy: { category: "asc" },
  });
  return jsonWithSecurity({
    ok: true,
    clicks: Object.fromEntries(interests.map((item) => [item.category, item.clicks])),
  });
}

export async function PATCH(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "preferences-category-interest-write",
    maxRequests: 80,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const body = (await request.json()) as { category?: string; increment?: number };
    const category = body.category?.trim() ?? "";
    const increment = Math.max(1, Math.min(10, Number(body.increment ?? 1) || 1));

    if (!category) {
      return jsonWithSecurity({ ok: false, message: "Categoría inválida" }, { status: 400 });
    }

    const existing = await prisma.categoryInterest.findUnique({
      where: {
        userId_category: {
          userId: auth.id,
          category,
        },
      },
    });
    const nextClicks = Math.min(10_000, (existing?.clicks ?? 0) + increment);
    await prisma.categoryInterest.upsert({
      where: {
        userId_category: {
          userId: auth.id,
          category,
        },
      },
      update: { clicks: nextClicks },
      create: {
        userId: auth.id,
        category,
        clicks: nextClicks,
      },
    });

    const interests = await prisma.categoryInterest.findMany({
      where: { userId: auth.id },
      orderBy: { category: "asc" },
    });
    const clicks = Object.fromEntries(interests.map((item) => [item.category, item.clicks]));

    return jsonWithSecurity({ ok: true, clicks });
  } catch {
    return jsonWithSecurity({ ok: false, message: "No se pudo guardar el interés" }, { status: 500 });
  }
}
