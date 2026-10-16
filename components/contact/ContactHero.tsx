"use client";

import { useRef } from "react";
import { contact, site } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { introDelay } from "@/lib/intro";
import { lines, masks, splitLines } from "@/lib/split";
import { useReady } from "../Providers";
import { StyledText, plain } from "../StyledText";

const TILES = 30;

/** Contact hero (port of Hero.astro script): title lines rise, tiles pop from the centre. */
export function ContactHero() {
  const root = useRef<HTMLDivElement>(null);
  const ready = useReady();

  useGSAP(
    () => {
      if (!ready) return;
      const el = root.current!;
      window.__heroAnimComplete = false;
      const h1 = el.querySelector<HTMLElement>(".hero-h1 [data-split]");
      const sub = el.querySelector<HTMLElement>(".hero-subtitle [data-split]");
      splitLines(h1);
      splitLines(sub);

      const tl = gsap.timeline({ delay: introDelay(), defaults: { ease: "power3.out" } });
      tl.set(el.querySelector(".hero-texts"), { visibility: "visible" });
      if (lines(h1).length) {
        tl.fromTo(lines(h1), { yPercent: 110 }, { yPercent: 0, duration: 0.8, stagger: 0.1 });
        tl.set(masks(h1), { overflow: "visible" }, "-=0.3");
      }
      if (lines(sub).length) tl.fromTo(lines(sub), { yPercent: 100 }, { yPercent: 0, duration: 0.8, stagger: 0.1 }, "-=0.5");
      const tiles = Array.from(el.querySelectorAll<HTMLElement>(".hero-boxes .grid-box")).filter((t) => t.offsetParent !== null);
      if (tiles.length)
        tl.fromTo(
          tiles,
          { autoAlpha: 0, scale: 0.4 },
          { autoAlpha: 1, scale: 1, ease: "elastic.out(1, 0.75)", duration: 1.2, stagger: { grid: "auto", from: "center", amount: 0.4 } },
          0.6,
        );
      tl.call(
        () => {
          window.__heroAnimComplete = true;
          window.dispatchEvent(new CustomEvent("heroAnimComplete"));
        },
        undefined,
        "-=0.4",
      );
    },
    { scope: root, dependencies: [ready] },
  );

  return (
    <div ref={root} className="hero-common-sec">
      <div className="container">
        <div className="hero-texts">
          <h1 className="hero-h1" aria-label={plain(contact.heroWord)}>
            <span data-split="" aria-hidden="true">
              <StyledText text={contact.heroWord} />
            </span>
          </h1>
          <p className="hero-subtitle">
            <span data-split="">
              {contact.subtitle} <a href={`mailto:${site.email}`}>email me</a>
            </span>
          </p>
        </div>
        <div className="hero-boxes main-grid-8">
          {Array.from({ length: TILES }, (_, i) => (
            <div key={i} className="grid-box" />
          ))}
        </div>
      </div>
    </div>
  );
}
