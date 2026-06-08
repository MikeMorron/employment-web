import { APP_TMP_ROOT } from "@/lib/app-runtime";

export const UPLOADS_DIR =
  process.env.UPLOAD_DIR ||
  (process.env.NODE_ENV === "production"
    ? "/var/app/uploads"
    : `${APP_TMP_ROOT}/uploads`);

export function sanitizeFileSegment(value: string, maxLength: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, maxLength);
}

export function sanitizeStoredFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "");
}

export function sanitizeStoredUserId(value: string) {
  return sanitizeFileSegment(value, 40);
}

export function sanitizeDownloadName(value: string, fallback = "download") {
  return (
    value
      .replace(/[^a-zA-Z0-9_.-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || fallback
  );
}

export function resolveStoredUploadPath(storedFileName: string) {
  const sanitized = sanitizeStoredFileName(storedFileName);
  if (!sanitized || sanitized !== storedFileName.replace(/[^a-zA-Z0-9._-]/g, "")) {
    return null;
  }

  return `${UPLOADS_DIR}/${sanitized}`;
}

export function isOwnedStoredFile(
  storedFileName: string,
  userId: string,
  kind: "avatar" | "cv" | "certification",
) {
  const sanitizedUserId = sanitizeStoredUserId(userId);

  if (!sanitizedUserId) {
    return false;
  }

  return sanitizeStoredFileName(storedFileName).startsWith(`${kind}_${sanitizedUserId}_`);
}

export async function ensureUploadsDir() {
  const { promises: fs } = await import("node:fs");
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export function getCurrentDateLabel() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function isPdfBuffer(buffer: Buffer) {
  return buffer.subarray(0, 5).equals(Buffer.from("%PDF-"));
}

export function getImageExtension(file: File) {
  const lowerName = file.name.toLowerCase();

  if (
    (file.type === "image/png" || lowerName.endsWith(".png")) &&
    lowerName.endsWith(".png")
  ) {
    return "png" as const;
  }

  if (
    (file.type === "image/jpeg" || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) &&
    (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg"))
  ) {
    return "jpg" as const;
  }

  return null;
}

export function isValidImageBuffer(buffer: Buffer, extension: "png" | "jpg") {
  if (extension === "png") {
    return buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }

  return (
    buffer.length > 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[buffer.length - 2] === 0xff &&
    buffer[buffer.length - 1] === 0xd9
  );
}
