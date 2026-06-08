import { censorProfanity } from "@/backend/lib-server/chat-bad-words";

const SKIPPED_KEYS = new Set([
  "avatar",
  "avatarStoredFileName",
  "cv",
  "cvStoredFileName",
  "languageCode",
  "profileVisibility",
  "proofImageAssetId",
  "proofImageAssetPublicId",
  "proofImageName",
  "proofImageStoredFileName",
  "proofImageThumbnailStoredFileName",
  "proofImageThumbnailUrl",
  "proofImageUrl",
  "proofVideoAssetId",
  "proofVideoAssetPublicId",
  "proofVideoName",
  "proofVideoStoredFileName",
  "proofVideoUrl",
  "website",
  "companyWebsite",
]);

const SKIPPED_KEY_PATTERNS = [
  /url$/i,
  /asset/i,
  /publicid$/i,
  /storedfilename$/i,
  /date$/i,
  /levelsystem$/i,
] as const;

const URL_LIKE_PATTERN = /^(?:https?:\/\/|data:|blob:)/i;
const DATE_LIKE_PATTERN = /^\d{4}(?:-\d{2}){0,2}$/;

function shouldSkipKey(key: string | null) {
  if (!key) {
    return false;
  }

  return SKIPPED_KEYS.has(key) || SKIPPED_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function collectModeratedText(
  value: unknown,
  output: string[],
  key: string | null = null,
) {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized || shouldSkipKey(key) || URL_LIKE_PATTERN.test(normalized) || DATE_LIKE_PATTERN.test(normalized)) {
      return;
    }

    output.push(normalized);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectModeratedText(item, output, key);
    }
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const [entryKey, entryValue] of Object.entries(value)) {
    collectModeratedText(entryValue, output, entryKey);
  }
}

export async function findBlockedWordsInPayload(value: unknown) {
  const textValues: string[] = [];
  collectModeratedText(value, textValues);

  const matches = new Map<string, string>();

  for (const textValue of textValues) {
    const moderation = await censorProfanity(textValue);

    for (const match of moderation.matches) {
      const normalizedMatch = match.trim().toLowerCase();
      if (!normalizedMatch || matches.has(normalizedMatch)) {
        continue;
      }

      matches.set(normalizedMatch, match.trim());
    }
  }

  return [...matches.values()];
}

export async function censorProfanityInPayload<T>(value: T, key: string | null = null): Promise<T> {
  if (typeof value === "string") {
    if (shouldSkipKey(key) || URL_LIKE_PATTERN.test(value) || DATE_LIKE_PATTERN.test(value)) {
      return value as T;
    }

    return (await censorProfanity(value)).censored as T;
  }

  if (Array.isArray(value)) {
    const nextItems = await Promise.all(
      value.map((item) => censorProfanityInPayload(item, key)),
    );
    return nextItems as T;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const output: Record<string, unknown> = {};
  for (const [entryKey, entryValue] of Object.entries(value)) {
    output[entryKey] = await censorProfanityInPayload(entryValue, entryKey);
  }

  return output as T;
}
