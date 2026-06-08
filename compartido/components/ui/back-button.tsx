"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface BackButtonProps {
  children: ReactNode;
  fallbackHref?: string;
  className?: string;
}

export function BackButton({ children, fallbackHref = "/", className = "" }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button type="button" onClick={handleBack} className={className}>
      {children}
    </button>
  );
}
