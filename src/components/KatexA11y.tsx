"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Overflowed display math can be focused and scrolled from the keyboard. */
export default function KatexA11y() {
  const pathname = usePathname();
  useEffect(() => {
    const displays = document.querySelectorAll<HTMLElement>(".katex-display");
    for (const el of displays) {
      if (el.scrollWidth > el.clientWidth + 1) {
        el.tabIndex = 0;
      }
    }
  }, [pathname]);
  return null;
}
