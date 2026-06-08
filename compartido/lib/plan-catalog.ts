export type CandidateBoostPlanId =
  | "free"
  | "starter-boost"
  | "basic-boost"
  | "mid-boost"
  | "high-boost"
  | "pro-boost";

export type CompanySubscriptionPlanId =
  | "company-basic"
  | "company-pro"
  | "company-business"
  | "company-premium";

export type CandidateBoostPlan = {
  id: CandidateBoostPlanId;
  rank: number;
  nameEs: string;
  nameEn: string;
  priceCop: number;
  durationLabelEs: string;
  durationLabelEn: string;
  descriptionEs: string;
  descriptionEn: string;
  featureLinesEs: string[];
  featureLinesEn: string[];
  boostHours: number[];
  additionalApplications: number;
  applicationWindowDays: number;
  maxPurchasesPer30Days: number;
  highlighted?: boolean;
  checkoutEnabled: boolean;
};

export type CompanySubscriptionPlan = {
  id: CompanySubscriptionPlanId;
  rank: number;
  planKey: "basic" | "pro" | "business" | "premium";
  nameEs: string;
  nameEn: string;
  priceCop: number;
  featureLinesEs: string[];
  featureLinesEn: string[];
  maxPublishedJobs: number;
  activeJobs: number;
  urgentJobs: number;
  topCandidates: number;
  collaboratorLimit: number;
  highlighted?: boolean;
  checkoutEnabled: boolean;
};

export const FREE_CANDIDATE_APPLICATIONS = 3;
export const FREE_CANDIDATE_WINDOW_DAYS = 15;

export const candidateBoostPlans: CandidateBoostPlan[] = [
  {
    id: "free",
    rank: 0,
    nameEs: "Free",
    nameEn: "Free",
    priceCop: 0,
    durationLabelEs: "Incluido",
    durationLabelEn: "Included",
    descriptionEs: "Perfil base con visibilidad orgánica.",
    descriptionEn: "Baseline profile with organic visibility.",
    featureLinesEs: [
      "Crea perfil.",
      "3 postulaciones cada 15 días.",
      "Visibilidad orgánica.",
      "Alertas de empleo básicas.",
    ],
    featureLinesEn: [
      "Create your profile.",
      "3 applications every 15 days.",
      "Organic visibility.",
      "Basic job alerts.",
    ],
    boostHours: [],
    additionalApplications: 0,
    applicationWindowDays: FREE_CANDIDATE_WINDOW_DAYS,
    maxPurchasesPer30Days: 0,
    checkoutEnabled: false,
  },
  {
    id: "starter-boost",
    rank: 1,
    nameEs: "Starter Boost - 1 Día",
    nameEn: "Starter Boost - 1 Day",
    priceCop: 3000,
    durationLabelEs: "1 día",
    durationLabelEn: "1 day",
    descriptionEs: "Entrada rápida para ganar visibilidad temporal.",
    descriptionEn: "Quick entry point for temporary visibility.",
    featureLinesEs: [
      "1 boost de 24 horas.",
      "Mayor visibilidad temporal para tu perfil.",
      "Alertas mejoradas temporalmente.",
      "+1 postulación adicional durante 15 días.",
    ],
    featureLinesEn: [
      "1 boost for 24 hours.",
      "Temporary visibility increase for your profile.",
      "Temporarily improved alerts.",
      "+1 extra application for 15 days.",
    ],
    boostHours: [24],
    additionalApplications: 1,
    applicationWindowDays: 15,
    maxPurchasesPer30Days: 5,
    checkoutEnabled: true,
  },
  {
    id: "basic-boost",
    rank: 2,
    nameEs: "Basic Boost - 3 Días",
    nameEn: "Basic Boost - 3 Days",
    priceCop: 7900,
    durationLabelEs: "3 días",
    durationLabelEn: "3 days",
    descriptionEs: "Más alcance durante la semana.",
    descriptionEn: "More reach across the week.",
    featureLinesEs: [
      "3 boosts de 24 horas cada uno.",
      "Más alcance durante la semana.",
      "Mejor visibilidad frente a otros candidatos.",
      "+2 postulaciones adicionales cada 15 días.",
      "Alertas laborales por correo.",
    ],
    featureLinesEn: [
      "3 boosts of 24 hours each.",
      "More reach during the week.",
      "Better visibility against other candidates.",
      "+2 extra applications every 15 days.",
      "Job alerts by email.",
    ],
    boostHours: [24, 24, 24],
    additionalApplications: 2,
    applicationWindowDays: 15,
    maxPurchasesPer30Days: 5,
    checkoutEnabled: true,
  },
  {
    id: "mid-boost",
    rank: 3,
    nameEs: "Mid Boost - 1 Semana",
    nameEn: "Mid Boost - 1 Week",
    priceCop: 14900,
    durationLabelEs: "1 semana",
    durationLabelEn: "1 week",
    descriptionEs: "Mayor exposición en vacantes compatibles.",
    descriptionEn: "Higher exposure in compatible jobs.",
    featureLinesEs: [
      "3 boosts de 24 horas y 2 boosts de 48 horas.",
      "Mayor exposición en vacantes compatibles.",
      "Aparece durante 24 horas en recomendados de empresas para ofertas compatibles.",
      "+3 postulaciones adicionales cada 10 días.",
      "Alertas laborales por correo.",
    ],
    featureLinesEn: [
      "3 boosts of 24 hours and 2 boosts of 48 hours.",
      "Higher exposure in compatible jobs.",
      "Appears for 24 hours in company recommendations for compatible jobs.",
      "+3 extra applications every 10 days.",
      "Job alerts by email.",
    ],
    boostHours: [24, 24, 24, 48, 48],
    additionalApplications: 3,
    applicationWindowDays: 10,
    maxPurchasesPer30Days: 1,
    checkoutEnabled: true,
  },
  {
    id: "high-boost",
    rank: 4,
    nameEs: "High Boost - Más Popular - 2 Semanas",
    nameEn: "High Boost - Most Popular - 2 Weeks",
    priceCop: 19900,
    durationLabelEs: "2 semanas",
    durationLabelEn: "2 weeks",
    descriptionEs: "Máxima visibilidad con la mejor relación costo-beneficio.",
    descriptionEn: "Maximum visibility with the best cost-benefit ratio.",
    featureLinesEs: [
      "4 boosts de 48 horas y 2 boosts de 72 horas.",
      "Prioridad frente a candidatos normales.",
      "Aparece durante 72 horas en recomendados de empresas para ofertas compatibles.",
      "+4 postulaciones adicionales cada 10 días.",
      "Notificaciones y alertas mejoradas.",
    ],
    featureLinesEn: [
      "4 boosts of 48 hours and 2 boosts of 72 hours.",
      "Priority over standard candidates.",
      "Appears for 72 hours in company recommendations for compatible jobs.",
      "+4 extra applications every 10 days.",
      "Improved notifications and alerts.",
    ],
    boostHours: [48, 48, 48, 48, 72, 72],
    additionalApplications: 4,
    applicationWindowDays: 10,
    maxPurchasesPer30Days: 1,
    highlighted: true,
    checkoutEnabled: true,
  },
  {
    id: "pro-boost",
    rank: 5,
    nameEs: "Pro Boost - 1 Mes",
    nameEn: "Pro Boost - 1 Month",
    priceCop: 29900,
    durationLabelEs: "1 mes",
    durationLabelEn: "1 month",
    descriptionEs: "Prioridad constante y exposición sostenida.",
    descriptionEn: "Constant priority and sustained exposure.",
    featureLinesEs: [
      "10 boosts de 72 horas.",
      "Máxima visibilidad en vacantes compatibles.",
      "Mayor exposición frente a otros candidatos.",
      "+10 postulaciones adicionales cada 10 días.",
      "Notificaciones laborales activas.",
      "Alertas por correo prioritaria en trabajos relacionados.",
    ],
    featureLinesEn: [
      "10 boosts of 72 hours.",
      "Maximum visibility in compatible jobs.",
      "Higher exposure than other candidates.",
      "+10 extra applications every 10 days.",
      "Active job notifications.",
      "Priority email alerts for related jobs.",
    ],
    boostHours: Array.from({ length: 10 }, () => 72),
    additionalApplications: 10,
    applicationWindowDays: 10,
    maxPurchasesPer30Days: 1,
    checkoutEnabled: true,
  },
];

export const companySubscriptionPlans: CompanySubscriptionPlan[] = [
  {
    id: "company-basic",
    rank: 1,
    planKey: "basic",
    nameEs: "Básico",
    nameEn: "Basic",
    priceCop: 49900,
    featureLinesEs: [
      "3 vacantes disponibles.",
      "2 vacantes activas simultáneamente.",
      "Filtros básicos.",
      "Soporte técnico.",
    ],
    featureLinesEn: [
      "3 available jobs.",
      "2 simultaneously active jobs.",
      "Basic filters.",
      "Technical support.",
    ],
    maxPublishedJobs: 3,
    activeJobs: 2,
    urgentJobs: 0,
    topCandidates: 0,
    collaboratorLimit: 0,
    checkoutEnabled: true,
  },
  {
    id: "company-pro",
    rank: 2,
    planKey: "pro",
    nameEs: "Pro",
    nameEn: "Pro",
    priceCop: 79900,
    featureLinesEs: [
      "5 vacantes disponibles.",
      "3 vacantes activas simultáneamente.",
      "Filtros y estadísticas básicas.",
      "3 preguntas filtro.",
      "Soporte técnico.",
    ],
    featureLinesEn: [
      "5 available jobs.",
      "3 simultaneously active jobs.",
      "Basic filters and analytics.",
      "3 screening questions.",
      "Technical support.",
    ],
    maxPublishedJobs: 5,
    activeJobs: 3,
    urgentJobs: 0,
    topCandidates: 0,
    collaboratorLimit: 0,
    checkoutEnabled: true,
  },
  {
    id: "company-business",
    rank: 3,
    planKey: "business",
    nameEs: "Business - Más Vendido",
    nameEn: "Business - Best Seller",
    priceCop: 149900,
    featureLinesEs: [
      "8 vacantes disponibles.",
      "6 vacantes activas simultáneamente.",
      "1 vacante urgente de 72 horas gratis.",
      "Acceso prioritario a los 10 mejores candidatos con match superior al 80%.",
      "Notificación de visibilidad para candidatos con boost que encajen con la oferta.",
      "Filtros y estadísticas completas.",
      "Puede designar 1 colaborador.",
      "Soporte preferencial.",
      "Sello de empresa verificada.",
    ],
    featureLinesEn: [
      "8 available jobs.",
      "6 simultaneously active jobs.",
      "1 free urgent 72-hour job.",
      "Priority access to the top 10 candidates above 80% match.",
      "Visibility notification for boosted candidates who fit the job.",
      "Full filters and analytics.",
      "Can assign 1 collaborator.",
      "Priority support.",
      "Verified company badge.",
    ],
    maxPublishedJobs: 8,
    activeJobs: 6,
    urgentJobs: 1,
    topCandidates: 10,
    collaboratorLimit: 1,
    highlighted: true,
    checkoutEnabled: true,
  },
  {
    id: "company-premium",
    rank: 4,
    planKey: "premium",
    nameEs: "Premium",
    nameEn: "Premium",
    priceCop: 179900,
    featureLinesEs: [
      "10 vacantes disponibles.",
      "8 vacantes activas simultáneamente.",
      "2 vacantes urgentes de 72 horas gratis.",
      "Acceso prioritario a los 20 candidatos nuevos con match superior al 80%.",
      "Mayor visibilidad para candidatos con boost que encajen con la oferta.",
      "Notificación de visibilidad para candidatos con boost que encajen con la oferta.",
      "Filtros y estadísticas completas.",
      "Puede designar 2 colaboradores.",
      "Soporte prioritario.",
      "Sello de empresa verificada.",
    ],
    featureLinesEn: [
      "10 available jobs.",
      "8 simultaneously active jobs.",
      "2 free urgent 72-hour jobs.",
      "Priority access to the top 20 new candidates above 80% match.",
      "Higher visibility for boosted candidates who fit the job.",
      "Visibility notification for boosted candidates who fit the job.",
      "Full filters and analytics.",
      "Can assign 2 collaborators.",
      "Priority support.",
      "Verified company badge.",
    ],
    maxPublishedJobs: 10,
    activeJobs: 8,
    urgentJobs: 2,
    topCandidates: 20,
    collaboratorLimit: 2,
    checkoutEnabled: true,
  },
];

export function getCandidateBoostPlan(planId: CandidateBoostPlanId | string) {
  return candidateBoostPlans.find((plan) => plan.id === planId);
}

export function getCompanySubscriptionPlan(planId: CompanySubscriptionPlanId | string) {
  return companySubscriptionPlans.find((plan) => plan.id === planId);
}

export function mapCandidateBoostPlanToUserPlan(planId: CandidateBoostPlanId) {
  if (planId === "pro-boost") {
    return "pro" as const;
  }

  if (planId === "free") {
    return "basic" as const;
  }

  return "boosted" as const;
}
