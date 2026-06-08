import { runChatInviteOutboxDispatch } from "@/backend/lib-server/chat-notification-outbox";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  jsonWithSecurity,
} from "@/lib/server/security";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret =
    process.env.CHAT_OUTBOX_RUNNER_SECRET?.trim() ||
    process.env.RETENTION_RUNNER_SECRET?.trim();
  return Boolean(secret) && request.headers.get("x-chat-outbox-secret") === secret;
}

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "internal-chat-outbox-run",
    maxRequests: 10,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  if (!isAuthorized(request)) {
    return jsonWithSecurity({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const result = await runChatInviteOutboxDispatch(
    typeof body.limit === "number" ? Math.max(1, Math.min(body.limit, 200)) : 50,
  );

  return jsonWithSecurity({
    ok: true,
    ...result,
  });
}
