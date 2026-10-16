"use client";

import { useRef } from "react";
import { site } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { introDelay } from "@/lib/intro";
import { lines, splitLines } from "@/lib/split";
import { ExpandIcon, PixelCode } from "../icons";
import { useReady } from "../Providers";
import { StyledText } from "../StyledText";
import { useOverlays } from "./Overlays";

const PLAIN_TILES = 28;

function Stars({ n }: { n: number }) {
  return (
    <div className={`grid-box type-stars type-${n}`}>
      <div className="stars-group">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="star-box">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/ico-star-small.svg" width={20} height={20} alt="" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Odometer() {
  const year = String(new Date().getFullYear()).padStart(4, "0");
  const reel = Array.from({ length: 30 }, (_, i) => i % 10);
  return (
    <div className="grid-box type-odometer" aria-label={`Since ${year}`}>
      <div className="odometer-grid">
        {year.split("").map((digit, i) => (
          <div key={i} className={`odo-cell d${i + 1}`}>
            <div className="odo-reel-contain">
              <div className="odo-reel" data-target={digit}>
                {reel.map((n, j) => (
                  <span key={j}>{n}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const ready = useReady();
  const { openSnake } = useOverlays();

  // Intro timeline (port of HomeHero.astro script).
  useGSAP(
    () => {
      if (!ready) return;
      const el = root.current!;
      const texts = el.querySelector(".hero-texts");
      const boxes = el.querySelector<HTMLElement>(".hero-boxes");
      if (!texts || !boxes) return;
      const bio = el.querySelector<HTMLElement>(".hero-bio [data-split]");
      splitLines(bio);

      const tl = gsap.timeline({ delay: introDelay(), defaults: { ease: "power3.out" } });
      tl.set(texts, { visibility: "visible" });

      const words = el.querySelectorAll(".hero-h1 .hero-word");
      if (words.length) {
        tl.fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 0.8, stagger: 0.1 });
        tl.set(el.querySelectorAll(".hero-h1 .hero-word-mask"), { overflow: "visible" }, "-=0.3");
      }
      const bioLines = lines(bio);
      if (bioLines.length) tl.fromTo(bioLines, { yPercent: 100 }, { yPercent: 0, duration: 0.8, stagger: 0.1 }, "-=0.5");

      const visible = Array.from(boxes.querySelectorAll<HTMLElement>(":scope > .grid-box")).filter(
        (b) => getComputedStyle(b).display !== "none" && b.offsetParent !== null,
      );
      const typed = visible.filter((b) => b.className.includes("type-"));
      const filler = visible.filter((b) => !b.className.includes("type-"));
      if (typed.length) {
        tl.fromTo(
          typed,
          { autoAlpha: 0, scale: 0.4 },
          { autoAlpha: 1, scale: 1, ease: "elastic.out(1, 0.75)", duration: 1, stagger: { amount: 0.5, from: "random" } },
          0.6,
        );
        tl.to(boxes, { "--border-opacity": 1, duration: 0.4, ease: "power2.out" });
      }
      if (filler.length) tl.fromTo(filler, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power2.out" }, typed.length ? 1 : 0.6);

      if (window.matchMedia("(min-width: 1081px)").matches && !window.matchMedia("(hover: none) and (pointer: coarse)").matches) {
        const icons = boxes.querySelectorAll(".social-box img");
        if (icons.length)
          tl.fromTo(
            icons,
            { filter: "grayscale(0)", opacity: 1, scale: 1.15, rotation: -5 },
            { filter: "grayscale(1)", opacity: 0.6, scale: 1, rotation: 0, duration: 1.2, ease: "power3.out", clearProps: "all" },
            1.2,
          );
      }
    },
    { scope: root, dependencies: [ready] },
  );

  // Year odometer (port of HomeHeroOdometer script): rolls in, re-rolls a full turn on hover.
  useGSAP(
    () => {
      const tile = root.current!.querySelector<HTMLElement>(".type-odometer");
      const reels = Array.from(root.current!.querySelectorAll<HTMLElement>(".type-odometer .odo-reel"));
      if (!tile || !reels.length) return;
      let busy = true;
      const delay = introDelay() + 0.6;
      reels.forEach((reel, i) => {
        const target = 10 + parseInt(reel.dataset.target || "0", 10);
        const last = i === reels.length - 1;
        gsap.fromTo(
          reel,
          { yPercent: 0 },
          { yPercent: -target * 100, duration: 1.6 + i * 0.3, delay: delay + i * 0.08, ease: "power3.out", onComplete: () => last && (busy = false) },
        );
      });
      const onEnter = () => {
        if (busy) return;
        busy = true;
        reels.forEach((reel, i) => {
          let idx = Math.round(Math.abs(gsap.getProperty(reel, "yPercent") as number) / 100);
          if (idx >= 20) {
            idx -= 10;
            gsap.set(reel, { yPercent: -idx * 100 });
          }
          const last = i === reels.length - 1;
          gsap.to(reel, { yPercent: -(idx + 10) * 100, duration: 1.2 + i * 0.2, delay: i * 0.06, ease: "power3.out", onComplete: () => last && (busy = false) });
        });
      };
      tile.addEventListener("mouseenter", onEnter);
      return () => tile.removeEventListener("mouseenter", onEnter);
    },
    { scope: root },
  );

  const { linkedin, instagram } = site.socials;

  return (
    <section ref={root} className="hero-home-sec">
      <div className="container">
        <div className="hero-texts">
          <h1 className="hero-h1" aria-label={site.name}>
            {site.nameWords.map((w) => (
              <span key={w} className="hero-word-mask">
                <span className="hero-word">
                  <StyledText text={w} />
                </span>
              </span>
            ))}
          </h1>
          <p className="hero-bio" aria-label={site.heroBio}>
            <span data-split="" aria-hidden="true">
              {site.heroBio}
            </span>
          </p>
        </div>
        <div className="hero-boxes main-grid-8">
          <div
            className="grid-box type-snake"
            data-modal-open="snake-game"
            data-sfx=""
            role="button"
            tabIndex={0}
            aria-label="Play Snake"
            onClick={openSnake}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openSnake())}
          >
            <ExpandIcon />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/logo-snake.svg" alt="" className="logo-snake" />
          </div>
          <div className="grid-box type-ig">
            {instagram ? (
              <a href={instagram} target="_blank" rel="noopener noreferrer" className="social-box">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/ico-instagram.svg" width={48} height={48} alt="Instagram" />
              </a>
            ) : (
              <a href="#projects" className="social-box" aria-label="See motion work">
                <PixelCode className="tile-mark" />
              </a>
            )}
          </div>
          <Stars n={1} />
          <Stars n={2} />
          <Stars n={3} />
          <Stars n={4} />
          <Odometer />
          <div className="grid-box type-role">
            <span>
              {site.role[0]} <br /> {site.role[1]}
            </span>
          </div>
          <div className="grid-box type-linkedin">
            {linkedin ? (
              <a href={linkedin} target="_blank" rel="noopener noreferrer" className="social-box">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/ico-linkedin.svg" width={48} height={48} alt="LinkedIn" />
              </a>
            ) : (
              <div className="status-tile mono" aria-label={site.footer.availability}>
                <span className="status-dot" />
                <span>Available</span>
              </div>
            )}
          </div>
          <div className="grid-box type-email">
            <a href={`mailto:${site.email}`} className="social-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/ico-email.svg" width={48} height={48} alt="Email" />
            </a>
          </div>
          <div className="grid-box type-arrow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/ico-arrow-pixel.svg" width={80} height={80} alt="" />
          </div>
          <div className="grid-box type-star">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
              <rect x="26.3" width="3" height="56" fill="var(--color-primary)" />
              <rect y="26.5" width="56" height="3" fill="var(--color-primary)" />
              {[[32, 20], [28, 24], [24, 28], [20, 32], [16, 36], [12, 40], [8, 44], [8, 8], [12, 12], [16, 16], [20, 20], [24, 24], [28, 28], [32, 32], [36, 36], [40, 40], [44, 44], [36, 16], [40, 12], [44, 8]].map(([x, y]) => (
                <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" fill="var(--color-primary)" />
              ))}
            </svg>
          </div>
          {Array.from({ length: PLAIN_TILES }, (_, i) => (
            <div key={i} className="grid-box" />
          ))}
        </div>
      </div>
    </section>
  );
}
