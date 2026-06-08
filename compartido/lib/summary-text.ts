const SUMMARY_TAG_PATTERN = /<[^>]*>/g;
const SUMMARY_CONTROL_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const SUMMARY_BREAK_PATTERN = /<\s*br\s*\/?\s*>/gi;
const SUMMARY_BLOCK_CLOSE_PATTERN = /<\s*\/\s*(p|div|li|ul|ol|h[1-6])\s*>/gi;

function normalizeSummarySource(value: string) {
  return value
    .replace(SUMMARY_BREAK_PATTERN, "\n")
    .replace(SUMMARY_BLOCK_CLOSE_PATTERN, "\n")
    .replace(SUMMARY_TAG_PATTERN, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\r\n?/g, "\n")
    .replace(SUMMARY_CONTROL_PATTERN, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sanitizeSummaryText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return normalizeSummarySource(value);
}

export function countSummaryWords(value: string) {
  const plainText = sanitizeSummaryText(value);
  return plainText ? plainText.split(/\s+/).length : 0;
}

export function truncateSummaryText(value: unknown, maxWords: number) {
  const plainText = sanitizeSummaryText(value);
  if (!plainText) {
    return "";
  }

  const tokens = plainText.match(/\S+|\s+/g) ?? [];
  let words = 0;
  let output = "";

  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      if (words > 0) {
        output += token;
      }
      continue;
    }

    words += 1;
    if (words > maxWords) {
      break;
    }

    output += token;
  }

  return sanitizeSummaryText(output);
}

export function isSummaryTextEmpty(value: string | null | undefined) {
  return !sanitizeSummaryText(value ?? "");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "…";
}

export function buildProfileSummary(
  displayName: string,
  role: string,
  location: string,
): string {
  const parts = [displayName, role, location].filter(Boolean);
  return parts.join(" · ");
}

export function formatApplicationCount(count: number, isEnglish: boolean): string {
  if (count === 0) return isEnglish ? "No applications yet" : "Sin postulaciones";
  if (count === 1) return isEnglish ? "1 application" : "1 postulación";
  return isEnglish ? `${count} applications` : `${count} postulaciones`;
}

export function formatJobCount(count: number, isEnglish: boolean): string {
  if (count === 0) return isEnglish ? "No open positions" : "Sin vacantes activas";
  if (count === 1) return isEnglish ? "1 open position" : "1 vacante activa";
  return isEnglish ? `${count} open positions` : `${count} vacantes activas`;
}
