import { buildAvatarAccessUrl, buildCvAccessUrl } from "@/lib/server/private-media";

export function buildAvatarFileHref(publicId: string) {
  return buildAvatarAccessUrl(publicId);
}

export function buildCvDownloadHref(publicId: string) {
  return buildCvAccessUrl(publicId);
}
