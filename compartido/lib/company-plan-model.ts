import type { Plan } from "@/types/account";

export function normalizeCompanyPlan(plan: Plan | string | null | undefined): "basic" | "pro" | "business" | "premium" {
  if (plan === "premium" || plan === "business" || plan === "pro" || plan === "basic") {
    return plan;
  }

  return "basic";
}
