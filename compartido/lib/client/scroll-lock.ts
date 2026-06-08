"use client";

let lockCount = 0;
let previousBodyOverflow = "";
let previousHtmlOverflow = "";
let previousBodyOverscroll = "";

export function lockPageScroll() {
  if (typeof document === "undefined") {
    return () => {};
  }

  if (lockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousHtmlOverflow = document.documentElement.style.overflow;
    previousBodyOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
  }

  lockCount += 1;

  return () => {
    if (typeof document === "undefined") {
      return;
    }

    lockCount = Math.max(0, lockCount - 1);

    if (lockCount === 0) {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
    }
  };
}
