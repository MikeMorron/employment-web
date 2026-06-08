export type CompanyBillingHistoryEntry = {
  id: string;
  plan: "free" | "basic" | "pro" | "business" | "premium";
  amountCop: number;
  status: "paid" | "pending" | "failed";
  paidAt: string;
  renewalAt?: string;
  description: string;
};
