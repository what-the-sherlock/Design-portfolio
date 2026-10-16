"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { initLenis, getLenis } from "@/lib/lenis";
import { attachSfxListeners } from "@/lib/sfx";

const ReadyContext = createContext(false);

/** True once web fonts have loaded — line splitting and slot measurement wait for it. */
export function useReady() {
  return useContext(ReadyContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const firstPath = useRef(true);

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    initLenis();
    attachSfxListeners();
    let alive = true;
    document.fonts.ready.then(() => alive && setReady(true));
    const onLoad = () => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    };
    window.addEventListener("load", onLoad);
    return () => {
      alive = false;
      window.removeEventListener("load", onLoad);
    };
  }, []);

  // Client-side navigation: never replay the loader, reset scroll (or go to the hash target).
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    document.documentElement.classList.add("skip-loader");
    window.__loaderWillPlay = false;
    const lenis = getLenis();
    const hash = window.location.hash;
    lenis?.start();
    requestAnimationFrame(() => {
      const target = hash ? document.querySelector<HTMLElement>(hash) : null;
      if (target) lenis ? lenis.scrollTo(target, { immediate: true }) : target.scrollIntoView();
      else lenis ? lenis.scrollTo(0, { immediate: true, force: true }) : window.scrollTo(0, 0);
    });
  }, [pathname]);

  return <ReadyContext.Provider value={ready}>{children}</ReadyContext.Provider>;
}
