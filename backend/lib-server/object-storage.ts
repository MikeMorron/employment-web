import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { promises as fs } from "node:fs";
import { Readable } from "node:stream";
import { ensureUploadsDir, resolveStoredUploadPath } from "@/lib/server/file-security";

type StoredObjectResult = {
  body: BodyInit;
  contentLength: number | null;
  contentType: string;
  contentRange?: string | null;
  acceptRanges?: string | null;
};

function parseRangeHeader(rangeHeader: string | null | undefined, totalSize: number) {
  if (!rangeHeader?.startsWith("bytes=")) {
    return null;
  }

  const [startRaw, endRaw] = rangeHeader.replace("bytes=", "").split("-");
  const start = Number(startRaw);
  const end = endRaw ? Number(endRaw) : totalSize - 1;

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || end >= totalSize) {
    return null;
  }

  return { start, end };
}

function getEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function getStorageConfig() {
  const bucket = getEnv("OBJECT_STORAGE_BUCKET");
  const endpoint = getEnv("OBJECT_STORAGE_ENDPOINT");
  const region = getEnv("OBJECT_STORAGE_REGION") ?? "auto";
  const accessKeyId = getEnv("OBJECT_STORAGE_ACCESS_KEY_ID");
  const secretAccessKey = getEnv("OBJECT_STORAGE_SECRET_ACCESS_KEY");

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    bucket,
    region,
    endpoint,
    accessKeyId,
    secretAccessKey,
  };
}

function isLocalStorageFallbackAllowed() {
  return process.env.NODE_ENV !== "production";
}

let clientInstance: S3Client | null | undefined;

function getS3Client() {
  if (clientInstance !== undefined) {
    return clientInstance;
  }

  const config = getStorageConfig();
  if (!config) {
    clientInstance = null;
    return clientInstance;
  }

  clientInstance = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  });

  return clientInstance;
}

function getBucketName() {
  return getStorageConfig()?.bucket ?? null;
}

export function isObjectStorageConfigured() {
  return Boolean(getS3Client() && getBucketName());
}

export async function putStoredObject(input: {
  storageKey: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
}) {
  const client = getS3Client();
  const bucket = getBucketName();

  if (!client || !bucket) {
    if (!isLocalStorageFallbackAllowed()) {
      throw new Error("Object storage is not configured");
    }

    await ensureUploadsDir();
    const filePath = resolveStoredUploadPath(input.storageKey);
    if (!filePath) {
      throw new Error("Invalid storage key");
    }

    await fs.writeFile(filePath, input.body);
    return;
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.storageKey,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl,
    }),
  );
}

export async function deleteStoredObject(storageKey: string) {
  const client = getS3Client();
  const bucket = getBucketName();

  if (!client || !bucket) {
    if (!isLocalStorageFallbackAllowed()) {
      throw new Error("Object storage is not configured");
    }

    const filePath = resolveStoredUploadPath(storageKey);
    if (filePath) {
      await fs.rm(filePath, { force: true });
    }
    return;
  }

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: storageKey,
    }),
  ).catch(() => null);
}

export async function headStoredObject(storageKey: string) {
  const client = getS3Client();
  const bucket = getBucketName();

  if (!client || !bucket) {
    if (!isLocalStorageFallbackAllowed()) {
      throw new Error("Object storage is not configured");
    }

    const filePath = resolveStoredUploadPath(storageKey);
    if (!filePath) {
      return null;
    }

    try {
      const stats = await fs.stat(filePath);
      return {
        contentLength: stats.size,
      };
    } catch {
      return null;
    }
  }

  try {
    const response = await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      }),
    );

    return {
      contentLength: response.ContentLength ?? null,
    };
  } catch {
    return null;
  }
}

export async function getStoredObject(input: {
  storageKey: string;
  contentType: string;
  range?: string | null;
}): Promise<StoredObjectResult | null> {
  const client = getS3Client();
  const bucket = getBucketName();

  if (!client || !bucket) {
    if (!isLocalStorageFallbackAllowed()) {
      throw new Error("Object storage is not configured");
    }

    const filePath = resolveStoredUploadPath(input.storageKey);
    if (!filePath) {
      return null;
    }

    try {
      const fileBuffer = await fs.readFile(filePath);
      const range = parseRangeHeader(input.range, fileBuffer.length);

      if (range) {
        return {
          body: fileBuffer.subarray(range.start, range.end + 1),
          contentLength: range.end - range.start + 1,
          contentType: input.contentType,
          contentRange: `bytes ${range.start}-${range.end}/${fileBuffer.length}`,
          acceptRanges: "bytes",
        };
      }

      return {
        body: fileBuffer,
        contentLength: fileBuffer.length,
        contentType: input.contentType,
        acceptRanges: "bytes",
      };
    } catch {
      return null;
    }
  }

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: input.storageKey,
        Range: input.range ?? undefined,
      }),
    );

    if (!response.Body) {
      return null;
    }

    const streamBody = response.Body as Readable & {
      transformToWebStream?: () => ReadableStream;
    };

    return {
      body:
        typeof streamBody.transformToWebStream === "function"
          ? (streamBody.transformToWebStream() as BodyInit)
          : (Readable.toWeb(streamBody) as BodyInit),
      contentLength: response.ContentLength ?? null,
      contentType: response.ContentType ?? input.contentType,
      contentRange: response.ContentRange ?? null,
      acceptRanges: response.AcceptRanges ?? "bytes",
    };
  } catch {
    return null;
  }
}
