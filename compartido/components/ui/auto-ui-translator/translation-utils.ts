import { PATTERN_MAP } from "./pattern-map";
import { PHRASE_MAP } from "./phrase-map";
import { WORD_MAP } from "./word-map";
import { sanitizeVisibleText } from "@/lib/ui-visible-text";

export const AUTO_UI_TRANSLATOR_SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "TEXTAREA",
]);

function replaceWords(input: string) {
  return input.replace(/\b[\p{L}]+\b/gu, (word) => WORD_MAP[word] ?? word);
}

export function translateText(input: string) {
  const sanitizedInput = sanitizeVisibleText(input);
  const trimmed = sanitizedInput.trim();

  if (!trimmed) {
    return sanitizedInput;
  }

  const phrase = PHRASE_MAP[trimmed];
  if (phrase) {
    return sanitizeVisibleText(sanitizedInput.replace(trimmed, phrase));
  }

  for (const pattern of PATTERN_MAP) {
    if (pattern.test.test(trimmed)) {
      return sanitizeVisibleText(sanitizedInput.replace(trimmed, trimmed.replace(pattern.test, pattern.replace as never)));
    }
  }

  return sanitizeVisibleText(sanitizedInput.replace(trimmed, replaceWords(trimmed)));
}
