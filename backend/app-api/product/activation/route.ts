import { prisma } from "@/lib/server/db";
import { requireAuthUser } from "@/lib/server/api-auth";
import { buildProductStateForUser } from "@/lib/server/product-context";
import { syncActivationMilestones, syncRetentionTasks } from "@/lib/server/product-engine";
import { jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  if (auth.role === "admin") {
    return jsonWithSecurity({
      ok: true,
      activationSummary: {
        role: "company",
        progressPercent: 100,
        firstValueReached: true,
        firstValueLabel: "Admin activo",
        milestones: [],
      },
      retentionTasks: [],
    });
  }

  const state = await buildProductStateForUser(auth);
  const activationSummary = await syncActivationMilestones(prisma, state, auth);
  const retentionTasks = await syncRetentionTasks(prisma, state, activationSummary, auth, auth.id);

  return jsonWithSecurity({
    ok: true,
    activationSummary,
    retentionTasks,
  });
}
