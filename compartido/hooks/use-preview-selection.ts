"use client";

import { useCallback, useState } from "react";

export function usePreviewSelection<T>() {
  const [selected, setSelected] = useState<T | null>(null);

  const openPreview = useCallback((value: T) => {
    setSelected(value);
  }, []);

  const closePreview = useCallback(() => {
    setSelected(null);
  }, []);

  return {
    selected,
    hasSelection: selected !== null,
    openPreview,
    closePreview,
    setSelected,
  };
}
