const SAFE_COMMENT_CHAR_PATTERN = /[\p{L}\p{N}\s.,:_¿?¡!“”-]/u;

export function sanitizeCommentInput(value: string) {
  let result = "";

  for (const char of value) {
    if (SAFE_COMMENT_CHAR_PATTERN.test(char)) {
      result += char;
    }
  }

  return result;
}
