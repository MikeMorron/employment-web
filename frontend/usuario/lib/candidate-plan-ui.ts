import { candidateBoostPlans } from "@/lib/plan-catalog";

export interface CandidatePlanUiCard {
  id: string;
  planKey: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  selectable: boolean;
}

export function getCandidatePlanUiCards(isEnglish: boolean): CandidatePlanUiCard[] {
  return candidateBoostPlans.map((plan) => ({
    id: plan.id,
    planKey: plan.id,
    name: isEnglish ? plan.nameEn : plan.nameEs,
    price:
      plan.priceCop > 0
        ? `$${plan.priceCop.toLocaleString("es-CO")} COP`
        : "$0",
    period: isEnglish ? plan.durationLabelEn : plan.durationLabelEs,
    description: isEnglish ? plan.descriptionEn : plan.descriptionEs,
    features: isEnglish ? plan.featureLinesEn : plan.featureLinesEs,
    highlighted: Boolean(plan.highlighted),
    selectable: plan.checkoutEnabled,
  }));
}
