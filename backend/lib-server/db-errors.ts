export function isDatabaseUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("connect econnrefused") ||
    msg.includes("connection refused") ||
    msg.includes("p1001") ||
    msg.includes("p1002") ||
    msg.includes("cannot reach database server") ||
    msg.includes("can't reach database server")
  );
}

export function isMissingTableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("p2021") || msg.includes("table") || msg.includes("does not exist");
}
