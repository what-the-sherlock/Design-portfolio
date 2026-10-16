"use client";

// Port of the original scrollAnims.js line-split system.
//
// - splitLines(el): SplitText into masked lines (.split-line inside .split-line-mask). Not animated here;
//   each component's reveal preset animates the lines.
// - splitScrollReveal(el): split + self-revealing on scroll (top 85%), used by [data-split-scroll].
// - parallax(el): image (110% tall) drifts yPercent -9.09 → 0 (original: 120% / -16.66) across the viewport.
// - A width-only resize handler (200ms debounce) re-splits every live instance and keeps its revealed/hidden state.
//
// Splits must be created inside a gsap.context / useGSAP so they revert on unmount.

import { gsap, ScrollTrigger, SplitText } from "./gsap";

type Entry = { el: HTMLElement; split: SplitText };
const SPLIT_VARS = { type: "lines", linesClass: "split-line", mask: "lines" } as const;
let entries: Entry[] = [];
let lastWidth = typeof window !== "undefined" ? window.innerWidth : 0;
let resizeTimer: ReturnType<typeof setTimeout> | undefined;

function onResize() {
  const width = window.innerWidth;
  if (width === lastWidth) return;
  lastWidth = width;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    entries = entries.filter(({ el, split }) => el.isConnected && split.isSplit);
    entries.forEach(({ el, split }) => {
      const firstLine = el.querySelector<HTMLElement>(".split-line");
      const wasVisible =
        !!firstLine &&
        getComputedStyle(firstLine).visibility !== "hidden" &&
        parseFloat(getComputedStyle(firstLine).opacity) > 0.5;
      try {
        split.split(SPLIT_VARS);
        const lines = el.querySelectorAll(".split-line");
        const masks = el.querySelectorAll(".split-line-mask");
        if (wasVisible) {
          gsap.set(lines, { yPercent: 0, autoAlpha: 1 });
          if (masks.length) gsap.set(masks, { overflow: "visible" });
        } else {
          gsap.set(lines, { yPercent: 110, autoAlpha: 0 });
        }
      } catch {}
    });
    ScrollTrigger.refresh();
  }, 200);
}

if (typeof window !== "undefined") window.addEventListener("resize", onResize, { passive: true });

export function splitLines(el: HTMLElement | null): SplitText | null {
  if (!el) return null;
  try {
    const split = new SplitText(el, SPLIT_VARS);
    entries.push({ el, split });
    return split;
  } catch {
    return null;
  }
}

export function lines(el: Element | null | undefined) {
  return el ? Array.from(el.querySelectorAll<HTMLElement>(".split-line")) : [];
}

export function masks(el: Element | null | undefined) {
  return el ? Array.from(el.querySelectorAll<HTMLElement>(".split-line-mask")) : [];
}

/** [data-split-scroll]: split, hide, reveal once at top 85%. */
export function splitScrollReveal(el: HTMLElement | null) {
  if (!el) return;
  splitLines(el);
  const ls = lines(el);
  if (!ls.length) return;
  gsap.set(ls, { yPercent: 110, autoAlpha: 0 });
  ScrollTrigger.create({
    trigger: el,
    start: "top 85%",
    once: true,
    onEnter: () => {
      const ms = masks(el);
      gsap.to(lines(el), {
        yPercent: 0,
        autoAlpha: 1,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
        onComplete: () => {
          if (ms.length) gsap.set(ms, { overflow: "visible" });
        },
      });
    },
  });
}

/** [data-parallax-img]: image is 110% tall and drifts its full overscan with scroll. */
export function parallax(el: HTMLElement | null) {
  if (!el) return;
  gsap.fromTo(
    el,
    { yPercent: -9.09 },
    {
      yPercent: 0,
      ease: "none",
      scrollTrigger: { trigger: el.parentElement || el, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
    },
  );
}
