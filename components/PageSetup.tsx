"use client";

import { useEffect, useLayoutEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { useReady } from "./Providers";

export type Theme = "theme-1" | "theme-2" | "theme-3";

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

/**
 * Sets the page's starting theme and, once every section has created its ScrollTriggers
 * (this component is rendered last, and passive effects run after all layout effects),
 * sorts and refreshes them — the equivalent of the original's post-init `sort(); refresh()`.
 */
export function PageSetup({ theme }: { theme: Theme }) {
  const ready = useReady();

  useLayoutEffect(() => {
    setTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!ready) return;
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    const id = requestAnimationFrame(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(id);
  }, [ready]);

  return null;
}
