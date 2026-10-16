"use client";

import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";

let instance: Lenis | null = null;

/** Single Lenis instance driven by the GSAP ticker (port of scrollAnims.js `initLenis`). */
export function initLenis(): Lenis | null {
  if (typeof window === "undefined") return null;
  if (instance) return instance;

  instance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
    smoothWheel: true,
  });
  instance.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => instance?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // Expose for debugging, as the original did (Lenis' own typings declare window.lenis as its version stub).
  (window as unknown as { lenis: Lenis }).lenis = instance;
  return instance;
}

export function getLenis(): Lenis | null {
  return instance;
}

/** Scroll helper that prefers Lenis and falls back to native smooth scrolling. */
export function scrollToTarget(
  target: number | HTMLElement,
  opts: { offset?: number; duration?: number; immediate?: boolean; easing?: (t: number) => number } = {},
) {
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target, opts);
    return;
  }
  const top =
    typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0);
  window.scrollTo({ top, behavior: opts.immediate ? "auto" : "smooth" });
}
