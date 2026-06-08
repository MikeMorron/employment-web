import { promises as fs } from "node:fs";
import { join } from "node:path";

const DEFAULT_BAD_WORDS_PATH = join(process.cwd(), "backend", "data", "malas.txt");
const FALLBACK_WORDS = [
  "idiota",
  "imbecil",
  "estupido",
  "estúpido",
  "mierda",
  "puta",
  "puto",
  "fuck",
  "shit",
  "bitch",
  "asshole",
];

let cachedWords:
  | {
      source: string;
      values: string[];
    }
  | null = null;

function normalizeWord(value: string) {
  return value.trim().toLowerCase();
}

function normalizeChar(value: string) {
  const stripped = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (!stripped) {
    return "";
  }

  const mapped = stripped
    .replace(/[@4]/g, "a")
    .replace(/[8]/g, "b")
    .replace(/[3]/g, "e")
    .replace(/[6]/g, "g")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/[7+]/g, "t")
    .replace(/[2]/g, "z");

  return mapped.replace(/[^a-z]/g, "");
}

function isSkippableSeparator(value: string) {
  return /[\s._\-~]/u.test(value);
}

function buildNormalizedMessageMap(message: string) {
  let normalized = "";
  const indexMap: number[] = [];

  for (let index = 0; index < message.length; index += 1) {
    const char = message[index];
    const normalizedChar = normalizeChar(char);

    if (!normalizedChar || isSkippableSeparator(char)) {
      continue;
    }

    const previous = normalized.at(-1);
    const beforePrevious = normalized.at(-2);
    if (
      previous === normalizedChar &&
      beforePrevious === normalizedChar
    ) {
      continue;
    }

    normalized += normalizedChar;
    indexMap.push(index);
  }

  return { normalized, indexMap };
}

function buildMaskLength(value: string, normalizedLength: number) {
  const nonSeparatorLength = value.replace(/[\s._\-~]/gu, "").length;
  return Math.max(4, normalizedLength, nonSeparatorLength);
}

function mergeRanges(
  ranges: Array<{
    start: number;
    end: number;
    normalizedLength: number;
    match: string;
  }>,
) {
  if (ranges.length === 0) {
    return [];
  }

  const ordered = [...ranges].sort((left, right) => left.start - right.start);
  const merged = [ordered[0]];

  for (const current of ordered.slice(1)) {
    const previous = merged.at(-1);
    if (!previous) {
      merged.push(current);
      continue;
    }

    if (current.start <= previous.end + 1) {
      previous.end = Math.max(previous.end, current.end);
      previous.normalizedLength = Math.max(
        previous.normalizedLength,
        current.normalizedLength,
      );
      if (current.match.length > previous.match.length) {
        previous.match = current.match;
      }
      continue;
    }

    merged.push(current);
  }

  return merged;
}

async function readWordList(pathname: string) {
  const raw = await fs.readFile(pathname, "utf8");

  return Array.from(
    new Set(
      raw
        .split(/\r?\n/)
        .map((line) => line.replace(/#.*/, ""))
        .map(normalizeWord)
        .filter(Boolean),
    ),
  );
}

export async function getBadWordsList() {
  const configuredPath = process.env.CHAT_BAD_WORDS_PATH?.trim() || DEFAULT_BAD_WORDS_PATH;

  if (cachedWords?.source === configuredPath) {
    return cachedWords.values;
  }

  try {
    const values = await readWordList(configuredPath);
    cachedWords = {
      source: configuredPath,
      values: values.length > 0 ? values : FALLBACK_WORDS,
    };
    return cachedWords.values;
  } catch {
    cachedWords = {
      source: configuredPath,
      values: FALLBACK_WORDS,
    };
    return cachedWords.values;
  }
}

export async function censorProfanity(message: string) {
  const words = await getBadWordsList();
  const normalizedWords = Array.from(
    new Set(
      words
        .map((word) => buildNormalizedMessageMap(word).normalized)
        .filter((word) => word.length >= 2),
    ),
  );

  const { normalized, indexMap } = buildNormalizedMessageMap(message);
  const rawRanges: Array<{
    start: number;
    end: number;
    normalizedLength: number;
    match: string;
  }> = [];

  for (const word of normalizedWords) {
    let cursor = 0;

    while (cursor < normalized.length) {
      const foundAt = normalized.indexOf(word, cursor);
      if (foundAt === -1) {
        break;
      }

      const start = indexMap[foundAt];
      const end = indexMap[foundAt + word.length - 1];

      if (typeof start === "number" && typeof end === "number") {
        rawRanges.push({
          start,
          end,
          normalizedLength: word.length,
          match: message.slice(start, end + 1),
        });
      }

      cursor = foundAt + 1;
    }
  }

  const ranges = mergeRanges(rawRanges);
  const matches = ranges.map((range) => range.match);

  let cursor = 0;
  let censored = "";

  for (const range of ranges) {
    censored += message.slice(cursor, range.start);
    censored += "*".repeat(
      buildMaskLength(message.slice(range.start, range.end + 1), range.normalizedLength),
    );
    cursor = range.end + 1;
  }

  censored += message.slice(cursor);

  return {
    censored,
    matches,
    profanityHits: matches.length,
  };
}
