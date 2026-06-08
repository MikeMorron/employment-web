"use client";

import { useEffect } from "react";

export function UploadedImageProtection() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "IMG" &&
        target.closest("[data-protected-image]")
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  return null;
}
