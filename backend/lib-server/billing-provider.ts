import Stripe from "stripe";
import { COMPANY_BUSINESS_PLAN } from "@/lib/server/billing-plans";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
}

export async function createCompanyBusinessCheckout(params: {
  companyUserId: string;
  companyEmail: string;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<{ provider: "stripe"; providerSessionId: string; checkoutUrl: string }> {
  const stripe = getStripe();
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const successUrl = params.successUrl ?? `${appUrl}/ajustes?billing=success`;
  const cancelUrl = params.cancelUrl ?? `${appUrl}/ajustes?billing=cancelled`;
  const priceId = COMPANY_BUSINESS_PLAN.priceId;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: params.companyEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      companyUserId: params.companyUserId,
      plan: COMPANY_BUSINESS_PLAN.id,
    },
  });

  return {
    provider: "stripe",
    providerSessionId: session.id,
    checkoutUrl: session.url ?? cancelUrl,
  };
}

export async function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string,
): Promise<Stripe.Event> {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET ?? "",
  );
}
