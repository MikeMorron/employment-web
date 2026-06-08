export const COMPANY_BUSINESS_PLAN = {
  id: "business",
  name: "Business",
  priceId: process.env.STRIPE_PRO_PRICE_ID ?? process.env.STRIPE_BUSINESS_PRICE_ID ?? "",
  amountCop: Number(process.env.STRIPE_BUSINESS_AMOUNT_COP ?? "199000"),
  maxJobs: 10,
  maxCandidateViews: 500,
} as const;
