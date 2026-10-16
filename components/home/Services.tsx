"use client";

import { useRef } from "react";
import { services } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { PixelCode, PixelPlay } from "../icons";
import { setTheme } from "../PageSetup";
import { useReady } from "../Providers";
import { StyledText } from "../StyledText";

const GRID_TILES = 30;

function Grid({ items }: { items: string[] }) {
  return (
    <div className="service-boxes-outer">
      <div className="container">
        <div className="service-boxes main-grid-8">
          {Array.from({ length: GRID_TILES }, (_, i) => (
            <div key={i} className="grid-box">
              {items[i] ? <span>{items[i]}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Pinned horizontal scene (port of HomeServices.astro script).
 * Desktop: the wrapper slides through four 100vw panels while a white box carrying the pixel icon
 * arcs between slots; tile grids pop radially from the centre; theme switches at 50%.
 * ≤768px: panels stack vertically and the box swings down the page instead.
 */
export function Services() {
  const root = useRef<HTMLElement>(null);
  const ready = useReady();

  useGSAP(
    () => {
      if (!ready) return;
      const sec = root.current!;
      const wrapper = sec.querySelector<HTMLElement>(".services-wrapper");
      const box = sec.querySelector<HTMLElement>(".transition-box");
      const icon1 = sec.querySelector(".transition-icon-1");
      const icon2 = sec.querySelector(".transition-icon-2");
      const slot1 = sec.querySelector(".slot-1");
      const slot2 = sec.querySelector(".slot-2");
      const slot3 = sec.querySelector(".slot-3");
      const slot4 = sec.querySelector(".slot-4");
      if (!wrapper || !box || !icon1 || !icon2 || !slot1 || !slot2 || !slot3 || !slot4) return;

      const firstHalf = () => {
        setTheme("theme-2");
        icon1.classList.remove("hide");
        icon2.classList.add("hide");
      };
      const secondHalf = () => {
        setTheme("theme-3");
        icon1.classList.add("hide");
        icon2.classList.remove("hide");
      };

      // Grid "pop": tiles scale in with a stagger proportional to distance from the grid centre.
      const makePop = (selector: string, amount = 0.5) => {
        const group = sec.querySelector(selector);
        const grid = group?.querySelector(".service-boxes");
        if (!group || !grid) return null;
        const tiles = Array.from(group.querySelectorAll<HTMLElement>(".grid-box")).filter((t) => getComputedStyle(t).display !== "none");
        if (!tiles.length) return null;
        const g = grid.getBoundingClientRect();
        const cx = g.width / 2;
        const cy = g.height / 2;
        const dist = tiles.map((t) => {
          const r = t.getBoundingClientRect();
          return Math.hypot(r.left - g.left + r.width / 2 - cx, r.top - g.top + r.height / 2 - cy);
        });
        const max = Math.max(...dist, 1);
        const tl = gsap.timeline({ paused: true });
        tl.fromTo(tiles, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, ease: "elastic.out(1,0.75)", duration: 1.2, stagger: (i) => (dist[i] / max) * amount }, 0);
        return tl;
      };

      const mm = gsap.matchMedia();

      mm.add("(min-width: 769px)", () => {
        const measure = () => {
          const x = gsap.getProperty(wrapper, "x");
          gsap.set(wrapper, { x: 0 });
          const a = slot1.getBoundingClientRect();
          const b = slot2.getBoundingClientRect();
          const c = slot3.getBoundingClientRect();
          const d = slot4.getBoundingClientRect();
          gsap.set(wrapper, { x });
          return {
            d2: { x: b.left - a.left, y: b.top - a.top },
            d3: { x: c.left - a.left, y: c.top - a.top },
            d4: { x: d.left - a.left, y: d.top - a.top },
          };
        };
        let s = measure();
        const travel = () => wrapper.scrollWidth - window.innerWidth;
        let popped2 = false;
        let popped4 = false;
        let pop2 = makePop(".service-group-2");
        let pop4 = makePop(".service-group-4");

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sec,
            pin: true,
            scrub: 1,
            start: "top top",
            end: () => `+=${travel() * 1.16}`,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            refreshPriority: 1,
            onRefresh: () => {
              s = measure();
              if (!popped2) {
                pop2?.kill();
                pop2 = makePop(".service-group-2");
              }
              if (!popped4) {
                pop4?.kill();
                pop4 = makePop(".service-group-4");
              }
            },
            onLeaveBack: () => setTheme("theme-1"),
            onUpdate: (self) => (self.progress < 0.5 ? firstHalf() : secondHalf()),
          },
        });

        tl.to(
          wrapper,
          {
            keyframes: [
              { x: 0, duration: 0 },
              { x: () => -travel() / 3, duration: 0.3, ease: "none" },
              { x: () => -travel() / 3, duration: 0.08, ease: "none" },
              { x: () => (-travel() * 2) / 3, duration: 0.27, ease: "none" },
              { x: () => -travel(), duration: 0.27, ease: "none" },
              { x: () => -travel(), duration: 0.08, ease: "none" },
            ],
            ease: "none",
          },
          0,
        );
        gsap.set(box, { opacity: 1 });
        tl.to(box, { x: () => s.d2.x, rotation: 180, ease: "none", duration: 0.26 }, 0.04);
        tl.to(box, { keyframes: [{ y: () => s.d2.y - 180, ease: "power1.out", duration: 0.13 }, { y: () => s.d2.y, ease: "power1.in", duration: 0.13 }], ease: "none" }, 0.04);
        tl.to(box, { scale: 0, ease: "none", duration: 0.04 }, 0.26);
        tl.to(box, { x: () => s.d3.x, rotation: 360, ease: "none", duration: 0.27 }, 0.38);
        tl.to(box, { keyframes: [{ y: () => Math.max(s.d2.y, s.d3.y) + 160, ease: "power1.out", duration: 0.135 }, { y: () => s.d3.y, ease: "power1.in", duration: 0.135 }], ease: "none" }, 0.38);
        tl.to(box, { scale: 1, ease: "none", duration: 0.04 }, 0.38);
        tl.to(box, { scale: 0, ease: "none", duration: 0.04 }, 0.88);
        tl.to(box, { x: () => s.d4.x, rotation: 540, ease: "none", duration: 0.27 }, 0.65);
        tl.to(box, { keyframes: [{ y: () => Math.min(s.d3.y, s.d4.y) - 180, ease: "power1.out", duration: 0.135 }, { y: () => s.d4.y, ease: "power1.in", duration: 0.135 }], ease: "none" }, 0.65);
        tl.call(() => {
          if (!popped2) {
            popped2 = true;
            pop2?.play();
          }
        }, undefined, 0.3);
        tl.call(() => {
          if (!popped4) {
            popped4 = true;
            pop4?.play();
          }
        }, undefined, 0.92);
      });

      mm.add("(max-width: 768px)", () => {
        const measure = () => {
          const a = slot1.getBoundingClientRect();
          const b = slot2.getBoundingClientRect();
          const c = slot3.getBoundingClientRect();
          const d = slot4.getBoundingClientRect();
          return {
            d2: { x: b.left - a.left, y: b.top - a.top },
            d3: { x: c.left - a.left, y: c.top - a.top },
            d4: { x: d.left - a.left, y: d.top - a.top },
          };
        };
        let s = measure();
        let popped2 = false;
        let popped4 = false;
        let pop2 = makePop(".service-group-2");
        let pop4 = makePop(".service-group-4");
        gsap.set(box, { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 });
        const swing = () => Math.min(window.innerWidth * 0.28, 140);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sec,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            invalidateOnRefresh: true,
            onRefresh: () => {
              s = measure();
              if (!popped2) {
                pop2?.kill();
                pop2 = makePop(".service-group-2");
              }
              if (!popped4) {
                pop4?.kill();
                pop4 = makePop(".service-group-4");
              }
            },
            onLeaveBack: () => setTheme("theme-1"),
            onUpdate: (self) => (self.progress < 0.5 ? firstHalf() : secondHalf()),
          },
        });
        tl.to(box, { keyframes: [{ x: () => s.d2.x + swing(), ease: "power1.out", duration: 0.165 }, { x: () => s.d2.x, ease: "power1.in", duration: 0.165 }], rotation: 180, ease: "none", duration: 0.33 }, 0);
        tl.to(box, { y: () => s.d2.y, ease: "none", duration: 0.33 }, 0);
        tl.to(box, { scale: 0, ease: "none", duration: 0.04 }, 0.29);
        tl.call(() => {
          if (!popped2) {
            popped2 = true;
            pop2?.play();
          }
        }, undefined, 0.33);
        tl.to(box, { scale: 1, ease: "none", duration: 0.04 }, 0.42);
        tl.to(box, { keyframes: [{ x: () => Math.max(s.d2.x, s.d3.x) - swing(), ease: "power1.out", duration: 0.123 }, { x: () => s.d3.x, ease: "power1.in", duration: 0.124 }], rotation: 360, ease: "none", duration: 0.247 }, 0.42);
        tl.to(box, { y: () => s.d3.y, ease: "none", duration: 0.247 }, 0.42);
        tl.to(box, { keyframes: [{ x: () => Math.min(s.d3.x, s.d4.x) + swing(), ease: "power1.out", duration: 0.165 }, { x: () => s.d4.x, ease: "power1.in", duration: 0.165 }], rotation: 540, ease: "none", duration: 0.33 }, 0.67);
        tl.to(box, { y: () => s.d4.y, ease: "none", duration: 0.33 }, 0.67);
        tl.to(box, { scale: 0, ease: "none", duration: 0.04 }, 0.96);
        tl.call(() => {
          if (!popped4) {
            popped4 = true;
            pop4?.play();
          }
        }, undefined, 1);

        ScrollTrigger.create({ trigger: ".service-group-2", start: "center center", onEnter: () => !popped2 && ((popped2 = true), pop2?.play()) });
        ScrollTrigger.create({ trigger: ".service-group-4", start: "center center", onEnter: () => !popped4 && ((popped4 = true), pop4?.play()) });
        ScrollTrigger.create({ trigger: ".service-first", start: "top 60%", end: "bottom top", onEnter: firstHalf, onLeaveBack: () => setTheme("theme-1") });
      });

      return () => mm.revert();
    },
    { scope: root, dependencies: [ready] },
  );

  const { first, second } = services;

  return (
    <section ref={root} className="services-sec">
      <div className="services-wrapper">
        <div className="service-group service-first" aria-label={first.ariaLabel}>
          <h2 className="h2-tag">( {first.tag} )</h2>
          <div className="service-title" aria-hidden="true">
            <StyledText text={first.line1} />
            <br />
            <StyledText text={first.line2a} />
            <span className="transition-box-outer slot-1">
              <span className="transition-box">
                <span className="transition-icon-1">
                  <PixelCode />
                </span>
                <span className="transition-icon-2 hide">
                  <PixelPlay />
                </span>
              </span>
            </span>
            <StyledText text={first.line2b} />
            <br />
            <StyledText text={first.line3} />
          </div>
        </div>
        <div className="service-group service-group-2">
          <div className="slot-target slot-2" />
          <div className="service-title">{first.gridTitle}</div>
          <Grid items={first.items} />
        </div>
        <div className="service-group service-second" aria-label={second.ariaLabel}>
          <h2 className="h2-tag">( {second.tag} )</h2>
          <div className="service-title" aria-hidden="true">
            <StyledText text={second.line1} />
            <br />
            <StyledText text={second.line2a} />
            <span className="transition-box-outer slot-3" />
            <StyledText text={second.line2b} />
            <br />
            <StyledText text={second.line3} />
          </div>
        </div>
        <div className="service-group service-group-4">
          <div className="slot-target slot-4" />
          <div className="service-title">{second.gridTitle}</div>
          <Grid items={second.items} />
        </div>
      </div>
    </section>
  );
}
