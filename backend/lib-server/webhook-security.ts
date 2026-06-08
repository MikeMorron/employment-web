import { createHmac } from "crypto";

function getWebhookHashSecret() {
  const explicitSecret = process.env.WEBHOOK_HASH_SECRET?.trim();
  if (explicitSecret) {
    return explicitSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing WEBHOOK_HASH_SECRET");
  }

  return "dev-webhook-secret";
}

export function hashWebhookPayload(payload: string | Buffer): string {
  const secret = getWebhookHashSecret();
  return createHmac("sha256", secret)
    .update(typeof payload === "string" ? payload : payload)
    .digest("hex");
}
