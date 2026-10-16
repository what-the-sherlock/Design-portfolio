"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { loaderWillPlay } from "@/lib/intro";
import { PixelAsterisk, PixelPlay } from "./icons";

function Mark() {
  return (
    <div className="loader__mark" aria-hidden="true">
      <span className="loader__mark-row">
        <span>
          A<em>a</em>sh<em>uto</em>sh
        </span>
      </span>
      <span className="loader__mark-row">
        <span>
          M<em>al</em>i
        </span>
        <PixelAsterisk />
        <PixelPlay />
      </span>
    </div>
  );
}

/** Intro loader (port of Loader.astro script): 3s progress + logo wipe, text swap, panel wipes up. */
export function Loader() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const wrap = root.current;
      if (!wrap) return;
      if (!loaderWillPlay()) {
        wrap.style.display = "none";
        return;
      }
      try {
        sessionStorage.setItem("loaderPlayed", "true");
      } catch {}

      const container = wrap.querySelector("[data-load-container]");
      const bg = wrap.querySelector("[data-load-bg]");
      const progress = wrap.querySelector("[data-load-progress]");
      const logo = wrap.querySelector("[data-load-logo]");
      const texts = Array.from(wrap.querySelectorAll<HTMLElement>("[data-load-text]"));
      const resets = Array.from(wrap.querySelectorAll("[data-load-reset]:not([data-load-text])"));

      const tl = gsap
        .timeline({ defaults: { ease: "loader", duration: 3 } })
        .set(wrap, { display: "block" })
        .to(progress, { scaleX: 1 })
        .to(logo, { clipPath: "inset(0% 0% 0% 0%)" }, "<")
        .to(container, { autoAlpha: 0, duration: 0.5 })
        .to(progress, { scaleX: 0, transformOrigin: "right center", duration: 0.5 }, "<")
        .add("hideContent", "<")
        .to(bg, { yPercent: -101, duration: 1 }, "hideContent")
        .set(wrap, { display: "none" });

      if (resets.length) tl.set(resets, { autoAlpha: 1 }, 0);

      if (texts.length >= 2) {
        const first = new SplitText(texts[0], { type: "lines,chars", mask: "lines" });
        const second = new SplitText(texts[1], { type: "lines,chars", mask: "lines" });
        gsap.set([first.chars, second.chars], { autoAlpha: 0, yPercent: 125 });
        gsap.set(texts, { autoAlpha: 1 });
        tl.to(first.chars, { autoAlpha: 1, yPercent: 0, duration: 0.6, stagger: { each: 0.02 } }, 0);
        tl.to(first.chars, { autoAlpha: 0, yPercent: -125, duration: 0.4, stagger: { each: 0.02 } }, ">+=0.4");
        tl.to(second.chars, { autoAlpha: 1, yPercent: 0, duration: 0.6, stagger: { each: 0.02 } }, "<");
        tl.to(second.chars, { autoAlpha: 0, yPercent: -125, duration: 0.4, stagger: { each: 0.02 } }, "hideContent-=0.5");
      }
    },
    { scope: root },
  );

  return (
    <div ref={root} data-load-wrap="" className="loader">
      <div data-load-bg="" className="loader__bg">
        <div data-load-progress="" className="loader__bg-bar" />
      </div>
      <div data-load-container="" className="loader__container">
        <div className="loader__logo-wrap">
          <div className="loader__logo-item is--base">
            <Mark />
          </div>
          <div data-load-logo="" className="loader__logo-item is--top">
            <Mark />
          </div>
        </div>
        <div className="loader__text-wrap">
          <span data-load-text="" data-load-reset="" className="loader__text-el">
            Hold tight
          </span>
          <span data-load-text="" data-load-reset="" className="loader__text-el">
            Hi there!
          </span>
        </div>
      </div>
    </div>
  );
}
