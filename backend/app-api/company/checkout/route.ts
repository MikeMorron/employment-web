import { randomUUID } from "node:crypto";
import { requireCompanyUser } from "@/lib/server/api-auth";
import { createCompanyBusinessCheckout, isStripeConfigured } from "@/lib/server/billing-provider";
import { prisma } from "@/lib/server/db";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

const CHECKOUT_DISABLED_MESSAGE = "Stripe no está configurado.";
const CHECKOUT_PENDING_MESSAGE = "Checkout creado. Continúa el pago en Stripe.";

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const auth = await requireCompanyUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "company-checkout-write",
    maxRequests: 20,
    windowMs: 60_000,
    userId: auth.id,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  if (!isStripeConfigured()) {
    return jsonWithSecurity(
      { ok: false, message: CHECKOUT_DISABLED_MESSAGE },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      plan?: string;
    };

    const plan = body.plan === "company-business" ? "business" : body.plan;
    if (plan !== "business") {
      return jsonWithSecurity({ ok: false, message: "Checkout inválido" }, { status: 400 });
    }

    const checkout = await createCompanyBusinessCheckout({
      companyUserId: auth.id,
      companyEmail: auth.email,
    });

    const checkoutSession = await prisma.$transaction(async (tx) => {
      await tx.billingCheckoutSession.updateMany({
        where: {
          companyUserId: auth.id,
          status: "pending",
        },
        data: {
          status: "cancelled",
        },
      });

      await tx.profile.update({
        where: { userId: auth.id },
        data: {
          planStatus: "pending",
          billingProvider: checkout.provider,
          billingCheckoutSessionId: checkout.providerSessionId,
        },
      });

      return tx.billingCheckoutSession.create({
        data: {
          id: randomUUID(),
          companyUserId: auth.id,
          plan: "business",
          method: "card",
          provider: checkout.provider,
          status: "pending",
          providerSessionId: checkout.providerSessionId,
          checkoutUrl: checkout.checkoutUrl,
        },
      });
    });

    return jsonWithSecurity({
      ok: true,
      message: CHECKOUT_PENDING_MESSAGE,
      checkout: {
        plan: "business",
        method: checkoutSession.method,
        status: checkoutSession.status,
        checkoutSessionId: checkoutSession.providerSessionId,
        checkoutUrl: checkoutSession.checkoutUrl,
      },
    });
  } catch {
    return jsonWithSecurity({ ok: false, message: "No se pudo procesar el checkout" }, { status: 500 });
  }
}
