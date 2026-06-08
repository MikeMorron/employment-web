"use client";

import { apiRequest } from "@/lib/api";

const responseCache = new Map<string, unknown>();
const requestCache = new Map<string, Promise<unknown>>();

export function clearCachedResource(prefix: string) {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }

  for (const key of requestCache.keys()) {
    if (key.startsWith(prefix)) {
      requestCache.delete(key);
    }
  }
}

export function primeCachedResource<T>(key: string, value: T) {
  responseCache.set(key, value);
}

export async function fetchCachedResource<T>(key: string, input: RequestInfo | URL) {
  if (responseCache.has(key)) {
    return responseCache.get(key) as T;
  }

  const existingRequest = requestCache.get(key);
  if (existingRequest) {
    return existingRequest as Promise<T>;
  }

  const request = (async () => {
    const requestUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : String(input);
    const response = await apiRequest<T>(requestUrl);
    if (!response.ok || !response.data) {
      throw new Error(`Failed to fetch resource: ${key}`);
    }

    responseCache.set(key, response.data);
    return response.data;
  })().finally(() => {
    requestCache.delete(key);
  });

  requestCache.set(key, request);
  return request;
}
