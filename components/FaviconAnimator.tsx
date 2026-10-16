"use client";

import { useEffect } from "react";

// Two pixel marks (asterisk / code) on a black tile, swapped every 1.5s like the original.
const A = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="8" fill="black"/><path d="M47 14H53V86H47V14ZM14 47H86V53H14V47ZM58 34H66V42H58V34ZM50 42H58V50H50V42ZM42 50H50V58H42V50ZM34 58H42V66H34V58ZM26 66H34V74H26V66ZM26 26H34V34H26V26ZM34 34H42V42H34V34ZM42 42H50V50H42V42ZM50 50H58V58H50V50ZM58 58H66V66H58V58ZM66 66H74V74H66V66ZM66 26H74V34H66V26Z" fill="white"/></svg>`;
const B = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="8" fill="black"/><path d="M84 50H92V58H84V50ZM76 58H84V66H76V58ZM68 66H76V74H68V66ZM60 74H68V82H60V74ZM60 18H68V26H60V18ZM68 26H76V34H68V26ZM76 34H84V42H76V34ZM84 42H92V50H84V42ZM16 34H24V42H16V34ZM44 50H52V58H44V50ZM8 42H16V50H8V42ZM40 58H48V66H40V58ZM32 74H40V82H32V74ZM32 18H40V26H32V18ZM52 34H60V42H52V34ZM8 50H16V58H8V50ZM16 58H24V66H16V58ZM24 66H32V74H24V66ZM24 26H32V34H24V26ZM48 42H56V50H48V42Z" fill="white"/></svg>`;

export const FAVICON_A = `data:image/svg+xml,${encodeURIComponent(A)}`;
const FAVICON_B = `data:image/svg+xml,${encodeURIComponent(B)}`;

export function FaviconAnimator() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let link = document.querySelector<HTMLLinkElement>("link[data-anim-favicon]");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/svg+xml";
      link.dataset.animFavicon = "";
      document.head.appendChild(link);
    }
    let flip = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => {
      if (document.hidden || !link) return;
      flip = !flip;
      link.href = flip ? FAVICON_B : FAVICON_A;
    };
    const start = () => {
      if (!timer) timer = setInterval(tick, 1500);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVis = () => (document.hidden ? stop() : (tick(), start()));
    link.href = FAVICON_A;
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return null;
}
