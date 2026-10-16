"use client";

import { useRef } from "react";
import { featured, type Project } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { lines, masks, parallax, splitLines } from "@/lib/split";
import { LqipImage } from "../LqipImage";
import { useReady } from "../Providers";
import { useOverlays } from "./Overlays";

const isTouchLayout = () => window.matchMedia("(max-width: 768px), (hover: none) and (pointer: coarse)").matches;

function CaseCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const play = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  };
  const pause = () => {
    if (!isTouchLayout()) videoRef.current?.pause();
  };

  return (
    <div
      className="case-card"
      data-slug={project.slug}
      role="button"
      tabIndex={0}
      aria-label={`Open ${project.title}`}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
      onMouseEnter={play}
      onMouseLeave={pause}
    >
      <div className="case-card-thumb">
        <div className="case-overlay" />
        <LqipImage slug={project.slug} media={project.media} alt={project.title} focus={project.focus} parallax sizes="(max-width: 480px) 100vw, (max-width: 1080px) 55vw, 50vw" />
        <video ref={videoRef} poster={`/media/${project.slug}/cover-1200.webp`} muted loop playsInline preload="metadata" aria-hidden="true">
          <source src={`/media/${project.slug}/preview.webm`} type="video/webm" />
          <source src={`/media/${project.slug}/preview.mp4`} type="video/mp4" />
        </video>
      </div>
      <h2 className="case-card-title" data-split="">
        {project.title}
      </h2>
      <div className="case-card-tags">
        {project.tags.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

export function Cases() {
  const root = useRef<HTMLElement>(null);
  const ready = useReady();
  const { openProject } = useOverlays();

  // Reveal preset (port of scrollAnims.js `D`) + parallax + touch autoplay.
  useGSAP(
    () => {
      if (!ready) return;
      const cards = Array.from(root.current!.querySelectorAll<HTMLElement>(".case-card"));
      cards.forEach((card) => {
        const thumb = card.querySelector(".case-card-thumb");
        const title = card.querySelector<HTMLElement>(".case-card-title");
        const tags = card.querySelector(".case-card-tags");
        if (!thumb || !title) return;
        splitLines(title);
        parallax(card.querySelector<HTMLElement>("img[data-parallax-img]"));

        gsap.set(thumb, { clipPath: "inset(0% 0% 100% 0%)" });
        gsap.set(lines(title), { yPercent: 110, autoAlpha: 0 });
        if (tags) gsap.set(tags, { autoAlpha: 0, y: 15 });

        ScrollTrigger.create({
          trigger: card,
          start: "top 85%",
          once: true,
          onEnter: () => {
            const tl = gsap.timeline();
            tl.to(thumb, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power3.inOut", clearProps: "clipPath" });
            tl.to(
              lines(title),
              { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08, ease: "power3.out", onComplete: () => gsap.set(masks(title), { overflow: "visible" }) },
              "-=0.35",
            );
            if (tags) tl.to(tags, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", clearProps: "transform,opacity,visibility" }, "-=0.3");
          },
        });

        // On touch layouts the preview is always visible, so play it while on screen.
        const video = card.querySelector("video");
        if (video) {
          ScrollTrigger.create({
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) => {
              if (!isTouchLayout()) return;
              if (self.isActive) {
                video.muted = true;
                video.play().catch(() => {});
              } else video.pause();
            },
          });
        }
      });
    },
    { scope: root, dependencies: [ready] },
  );

  return (
    <section ref={root} className="cases-sec" id="projects">
      <div className="container pad-120">
        <div className="cases-contain main-grid-8">
          {featured.map((p) => (
            <CaseCard key={p.slug} project={p} onOpen={() => openProject(p)} />
          ))}
        </div>
      </div>
    </section>
  );
}
