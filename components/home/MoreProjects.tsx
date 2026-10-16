"use client";

import { useRef } from "react";
import { moreProjects } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { lines, masks, splitLines } from "@/lib/split";
import { LqipImage } from "../LqipImage";
import { useReady } from "../Providers";
import { useOverlays } from "./Overlays";

const MOBILE = "(max-width: 1280px)";
type Edge = "top" | "bottom";
type ScrollDir = "down" | "up";

const edgeOf = (e: MouseEvent, el: HTMLElement): Edge => {
  const r = el.getBoundingClientRect();
  return e.clientY - r.top < r.height / 2 ? "top" : "bottom";
};

// ≤1280: activate/deactivate with a clip-path entering from the scroll direction.
function activate(item: HTMLElement, dir: ScrollDir) {
  item.classList.add("is-active");
  const thumb = item.querySelector<HTMLElement>(".mp-thumb");
  if (thumb) {
    thumb.style.transition = "none";
    thumb.style.clipPath = dir === "down" ? "inset(0 0 100% 0)" : "inset(100% 0 0 0)";
    void thumb.offsetHeight;
    thumb.style.transition = "";
    thumb.style.clipPath = "inset(0 0 0 0)";
  }
  item.querySelector("video")?.play().catch(() => {});
}

function deactivate(item: HTMLElement, dir?: ScrollDir) {
  item.classList.remove("is-active");
  const thumb = item.querySelector<HTMLElement>(".mp-thumb");
  if (thumb) {
    thumb.style.clipPath = dir ? (dir === "down" ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)") : "";
    if (!dir) thumb.style.transition = "";
  }
  item.querySelector("video")?.pause();
}

export function MoreProjects() {
  const root = useRef<HTMLElement>(null);
  const ready = useReady();
  const { openProject } = useOverlays();

  useGSAP(
    () => {
      if (!ready) return;
      const section = root.current!;
      const items = Array.from(section.querySelectorAll<HTMLElement>(".more-project-item"));
      if (!items.length) return;
      const mq = window.matchMedia(MOBILE);
      const abort = new AbortController();
      const { signal } = abort;

      // --- Reveal (port of scrollAnims.js `O`): row rule draws in, then title + tag lines.
      items.forEach((item) => {
        const title = item.querySelector<HTMLElement>(".mp-title");
        const tags = item.querySelector<HTMLElement>(".mp-tags");
        if (!title) return;
        splitLines(title);
        splitLines(tags);
        gsap.set(lines(item), { yPercent: 110, autoAlpha: 0 });
        const hasRule = getComputedStyle(item, "::before").display !== "none";
        if (hasRule) gsap.set(item, { "--border-scale": 0 });
        ScrollTrigger.create({
          trigger: item,
          start: "top 85%",
          once: true,
          onEnter: () => {
            const tagsShown = !!tags && getComputedStyle(tags).display !== "none";
            const all = [...lines(title), ...(tagsShown ? lines(tags) : [])];
            const allMasks = [...masks(title), ...(tagsShown ? masks(tags) : [])];
            const tl = gsap.timeline();
            if (hasRule) tl.to(item, { "--border-scale": 1, duration: 1, ease: "power3.inOut", clearProps: "--border-scale" });
            if (all.length)
              tl.to(all, { yPercent: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1, ease: "power3.out", onComplete: () => gsap.set(allMasks, { overflow: "visible" }) }, hasRule ? "-=0.6" : 0);
          },
        });
      });

      // --- Desktop (>1280): directional hover — tile and thumb enter/leave from the edge the cursor crossed.
      const tileFrom: Record<Edge, string> = { top: "translateY(-100%)", bottom: "translateY(100%)" };
      const clipFrom: Record<Edge, string> = { top: "inset(0 0 60% 0)", bottom: "inset(60% 0 0 0)" };
      items.forEach((item) => {
        const tile = item.querySelector<HTMLElement>(".mp-bg-tile");
        const thumb = item.querySelector<HTMLElement>(".mp-thumb");
        const video = item.querySelector("video");
        let leaveTimer: ReturnType<typeof setTimeout> | undefined;
        item.addEventListener(
          "mouseenter",
          (e) => {
            if (mq.matches) return;
            clearTimeout(leaveTimer);
            item.classList.remove("is-leaving");
            item.classList.add("is-hovered");
            video?.play().catch(() => {});
            const edge = edgeOf(e, item);
            if (tile) {
              tile.style.transition = "none";
              tile.style.transform = tileFrom[edge];
              void tile.offsetHeight;
              tile.style.transition = "";
              tile.style.transform = "translateY(0%)";
            }
            if (thumb) {
              thumb.style.transition = "none";
              thumb.style.clipPath = clipFrom[edge];
              void thumb.offsetHeight;
              thumb.style.transition = "";
              thumb.style.clipPath = "inset(0 0 0 0)";
            }
            item.dataset.status = `enter-${edge}`;
          },
          { signal },
        );
        item.addEventListener(
          "mouseleave",
          (e) => {
            if (mq.matches) return;
            const edge = edgeOf(e, item);
            item.dataset.status = `leave-${edge}`;
            item.classList.remove("is-hovered");
            item.classList.add("is-leaving");
            video?.pause();
            if (tile) tile.style.transform = tileFrom[edge];
            if (thumb) thumb.style.clipPath = clipFrom[edge];
            clearTimeout(leaveTimer);
            leaveTimer = setTimeout(() => item.classList.remove("is-leaving"), 750);
          },
          { signal },
        );
      });

      // --- ≤1280: the row nearest a focal line (64% vh scrolling down, 36% up) becomes active.
      let active: HTMLElement | null = null;
      let raf: number | null = null;
      let lastY = window.scrollY;
      let dir: ScrollDir = "down";
      const evaluate = () => {
        raf = null;
        if (!mq.matches) {
          if (active) deactivate(active);
          active = null;
          return;
        }
        const focal = dir === "down" ? window.innerHeight * 0.64 : window.innerHeight * 0.36;
        const rect = section.getBoundingClientRect();
        const margin = window.innerHeight * 0.12;
        if (focal < rect.top - margin || focal > rect.bottom + margin) {
          if (active) deactivate(active, dir);
          active = null;
          return;
        }
        let best: HTMLElement | null = null;
        let bestDist = Infinity;
        for (const it of items) {
          const r = it.getBoundingClientRect();
          const d = Math.abs(r.top + r.height / 2 - focal);
          if (d < bestDist) {
            bestDist = d;
            best = it;
          }
        }
        if (best && active && best !== active) {
          const r = active.getBoundingClientRect();
          if (bestDist > Math.abs(r.top + r.height / 2 - focal) - 80) return; // hysteresis
        }
        if (best !== active) {
          if (active) deactivate(active, dir);
          if (best) activate(best, dir);
          active = best;
        }
      };
      const onScroll = () => {
        const lenis = getLenis();
        const y = lenis ? lenis.scroll : window.scrollY;
        if (Math.abs(y - lastY) >= 1) {
          dir = y > lastY ? "down" : "up";
          lastY = y;
        }
        if (raf === null) raf = requestAnimationFrame(evaluate);
      };
      window.addEventListener("scroll", onScroll, { passive: true, signal });
      window.addEventListener("resize", onScroll, { passive: true, signal });
      const lenis = getLenis();
      const onLenis = (l: { direction: number }) => {
        if (l.direction === 1) dir = "down";
        else if (l.direction === -1) dir = "up";
        onScroll();
      };
      lenis?.on("scroll", onLenis);
      ScrollTrigger.addEventListener("refresh", onScroll);
      evaluate();

      // Click: desktop opens the project; ≤1280 centres the row first, then opens on a second tap.
      items.forEach((item, i) => {
        item.addEventListener(
          "click",
          () => {
            const project = moreProjects[i];
            if (!mq.matches || item.classList.contains("is-active")) {
              openProject(project);
              return;
            }
            const l = getLenis();
            if (l) l.scrollTo(item, { offset: -window.innerHeight / 2 + item.offsetHeight / 2, duration: 0.8 });
            else item.scrollIntoView({ behavior: "smooth", block: "center" });
          },
          { signal },
        );
      });

      mq.addEventListener(
        "change",
        (e) => {
          if (e.matches) {
            items.forEach((it) => {
              it.classList.remove("is-hovered", "is-leaving");
              const tile = it.querySelector<HTMLElement>(".mp-bg-tile");
              const thumb = it.querySelector<HTMLElement>(".mp-thumb");
              if (tile) tile.style.transform = "";
              if (thumb) thumb.style.clipPath = "";
            });
          }
          onScroll();
        },
        { signal },
      );

      return () => {
        abort.abort();
        if (raf !== null) cancelAnimationFrame(raf);
        lenis?.off("scroll", onLenis);
        ScrollTrigger.removeEventListener("refresh", onScroll);
        if (active) deactivate(active);
      };
    },
    { scope: root, dependencies: [ready] },
  );

  return (
    <section ref={root} className="more-projects-sec">
      <div className="container pad-120">
        <div className="more-projects-contain">
          <div className="more-projects-heading">
            <h2 className="h2-tag">( More projects )</h2>
          </div>
          <div className="more-projects-list">
            {moreProjects.map((p) => (
              <div
                key={p.slug}
                className="more-project-item"
                role="button"
                tabIndex={0}
                aria-label={`Open ${p.title}`}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openProject(p))}
              >
                <div className="mp-bg-wrap">
                  <div className="mp-bg-tile" />
                </div>
                <h3 className="mp-title" data-split="">
                  {p.title}
                </h3>
                <div className="mp-tags" data-split="" aria-hidden="true">
                  {p.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <div className="mp-thumb-wrap">
                  <div className="mp-thumb">
                    <LqipImage slug={p.slug} media={p.media} alt="" sizes="(max-width: 480px) 100vw, (max-width: 1280px) 60vw, 25vw" />
                    <video poster={`/media/${p.slug}/cover-800.webp`} muted loop playsInline preload="none" aria-hidden="true">
                      <source src={`/media/${p.slug}/preview.webm`} type="video/webm" />
                      <source src={`/media/${p.slug}/preview.mp4`} type="video/mp4" />
                    </video>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
