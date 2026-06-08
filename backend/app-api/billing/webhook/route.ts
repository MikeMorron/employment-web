import { prisma } from "@/lib/server/db";
import { COMPANY_BUSINESS_PLAN } from "@/lib/server/billing-plans";
import { verifyStripeWebhook } from "@/lib/server/billing-provider";
import { createBillingHistoryEntry } from "@/lib/server/preferences-store";
import { jsonWithSecurity } from "@/lib/server/security";
import { hashWebhookPayload } from "@/lib/server/webhook-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return jsonWithSecurity({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  let event;
  try {
    event = await verifyStripeWebhook(rawBody, signature);
  } catch {
    return jsonWithSecurity({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const deliveryId = event.id;
  const payloadHash = hashWebhookPayload(rawBody);
  const eventType = event.type;

  let checkoutSessionId = "";
  let customerId: string | null = null;
  let subscriptionId: string | null = null;
  let periodEnd: Date | null = null;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    checkoutSessionId = session.id;
    customerId = typeof session.customer === "string" ? session.customer : null;
    subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
  } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as typeof event.data.object & {
      subscription?: string | null;
      subscription_details?: {
        metadata?: Record<string, unknown>;
      };
    };
    checkoutSessionId = typeof invoice.subscription_details?.metadata?.checkout_session_id === "string"
      ? invoice.subscription_details.metadata.checkout_session_id
      : "";
    customerId = typeof invoice.customer === "string" ? invoice.customer : null;
    subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;
    periodEnd = typeof invoice.lines.data[0]?.period?.end === "number"
      ? new Date(invoice.lines.data[0].period.end * 1000)
      : null;
  } else if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as typeof event.data.object & {
      current_period_end?: number;
      metadata?: Record<string, unknown>;
    };
    checkoutSessionId = typeof subscription.metadata?.checkout_session_id === "string"
      ? subscription.metadata.checkout_session_id
      : "";
    subscriptionId = subscription.id;
    customerId = typeof subscription.customer === "string" ? subscription.customer : null;
    periodEnd = typeof subscription.current_period_end === "number"
      ? new Date(subscription.current_period_end * 1000)
      : null;
  }

  if (!eventType || (!checkoutSessionId && !subscriptionId)) {
    return jsonWithSecurity({ ok: false, message: "Payload inválido" }, { status: 400 });
  }

  const existingDelivery = await prisma.webhookDelivery.findFirst({
    where: {
      provider: "billing",
      deliveryId,
    },
  });

  if (existingDelivery?.processedAt) {
    return jsonWithSecurity({ ok: true, status: "duplicate" });
  }

  if (existingDelivery && existingDelivery.payloadHash !== payloadHash) {
    return jsonWithSecurity({ ok: false, message: "Replay payload mismatch" }, { status: 409 });
  }

  if (!existingDelivery) {
    try {
      await prisma.webhookDelivery.create({
        data: {
          provider: "billing",
          deliveryId,
          payloadHash,
        },
      });
    } catch {
      const retryDelivery = await prisma.webhookDelivery.findFirst({
        where: {
          provider: "billing",
          deliveryId,
        },
      });

      if (retryDelivery?.processedAt) {
        return jsonWithSecurity({ ok: true, status: "duplicate" });
      }
    }
  }

  const checkoutSession = checkoutSessionId
    ? await prisma.billingCheckoutSession.findUnique({
        where: {
          providerSessionId: checkoutSessionId,
        },
      })
    : subscriptionId
      ? await prisma.billingCheckoutSession.findFirst({
          where: {
            subscriptionId,
          },
        })
      : null;

  if (!checkoutSession?.companyUserId) {
    return jsonWithSecurity({ ok: false, message: "Checkout no encontrado" }, { status: 404 });
  }

  if (eventType === "checkout.session.completed" || eventType === "invoice.paid") {
    await prisma.$transaction([
      prisma.billingCheckoutSession.update({
        where: { id: checkoutSession.id },
        data: {
          status: "completed",
          customerId: customerId ?? checkoutSession.customerId,
          subscriptionId: subscriptionId ?? checkoutSession.subscriptionId,
          periodEnd: periodEnd ?? checkoutSession.periodEnd,
          confirmedAt: new Date(),
          rawPayloadJson: rawBody,
        },
      }),
      prisma.user.update({
        where: { id: checkoutSession.companyUserId },
        data: {
          plan: "business",
        },
      }),
      prisma.profile.update({
        where: { userId: checkoutSession.companyUserId },
        data: {
          planStatus: "active",
          billingProvider: "stripe",
          billingCustomerId: customerId ?? checkoutSession.customerId,
          billingSubscriptionId: subscriptionId ?? checkoutSession.subscriptionId,
          billingCheckoutSessionId: checkoutSession.providerSessionId,
          currentPeriodEnd: periodEnd ?? checkoutSession.periodEnd,
        },
      }),
      prisma.webhookDelivery.updateMany({
        where: {
          provider: "billing",
          deliveryId,
        },
        data: {
          processedAt: new Date(),
        },
      }),
    ]);

    await createBillingHistoryEntry({
      userId: checkoutSession.companyUserId,
      plan: "business",
      amountCop: COMPANY_BUSINESS_PLAN.amountCop,
      status: "paid",
      paidAt: new Date(),
      renewalAt: periodEnd,
      description: `Pago Business confirmado vía Stripe`,
      provider: "stripe",
      providerReference: subscriptionId ?? checkoutSession.providerSessionId,
    });

    return jsonWithSecurity({ ok: true, status: "completed" });
  }

  if (
    eventType === "invoice.payment_failed" ||
    eventType === "checkout.session.expired" ||
    eventType === "customer.subscription.deleted"
  ) {
    await prisma.$transaction([
      prisma.billingCheckoutSession.update({
        where: { id: checkoutSession.id },
        data: {
          status:
            eventType === "invoice.payment_failed"
              ? "failed"
              : eventType === "customer.subscription.deleted"
                ? "cancelled"
                : "expired",
          rawPayloadJson: rawBody,
        },
      }),
      prisma.profile.update({
        where: { userId: checkoutSession.companyUserId },
        data: {
          planStatus:
            eventType === "invoice.payment_failed"
              ? "past_due"
              : "cancelled",
        },
      }),
      prisma.webhookDelivery.updateMany({
        where: {
          provider: "billing",
          deliveryId,
        },
        data: {
          processedAt: new Date(),
        },
      }),
    ]);

    if (eventType === "invoice.payment_failed") {
      await createBillingHistoryEntry({
        userId: checkoutSession.companyUserId,
        plan: "business",
        amountCop: COMPANY_BUSINESS_PLAN.amountCop,
        status: "failed",
        paidAt: new Date(),
        renewalAt: periodEnd,
        description: "Intento de cobro fallido en Stripe",
        provider: "stripe",
        providerReference: subscriptionId ?? checkoutSession.providerSessionId,
      });
    }

    return jsonWithSecurity({ ok: true, status: "updated" });
  }

  return jsonWithSecurity({ ok: false, message: "Evento no soportado" }, { status: 400 });
}
