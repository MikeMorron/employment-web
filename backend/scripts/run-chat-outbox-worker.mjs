const appUrl = process.env.APP_URL?.trim();
const secret =
  process.env.CHAT_OUTBOX_RUNNER_SECRET?.trim() ||
  process.env.RETENTION_RUNNER_SECRET?.trim();
const limit = Number.parseInt(process.env.CHAT_OUTBOX_BATCH_LIMIT ?? "50", 10);

if (!appUrl) {
  throw new Error("APP_URL is required to run the chat outbox worker");
}

if (!secret) {
  throw new Error("CHAT_OUTBOX_RUNNER_SECRET or RETENTION_RUNNER_SECRET is required");
}

const response = await fetch(`${appUrl.replace(/\/$/, "")}/api/internal/chat-outbox/run`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-chat-outbox-secret": secret,
  },
  body: JSON.stringify({
    limit: Number.isFinite(limit) ? Math.max(1, Math.min(limit, 200)) : 50,
  }),
});

const data = await response.json().catch(() => ({}));

if (!response.ok) {
  throw new Error(`Chat outbox worker failed (${response.status}): ${JSON.stringify(data)}`);
}

process.stdout.write(`${JSON.stringify(data)}\n`);
