"use client";

import Link from "next/link";
import { useRef } from "react";
import { site } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { lines, masks, splitLines } from "@/lib/split";
import { setTheme } from "./PageSetup";
import { useReady } from "./Providers";
import { StyledText } from "./StyledText";

const TILES = 30;

export function Footer({ showTop = true, showCta = true }: { showTop?: boolean; showCta?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const ready = useReady();

  useGSAP(
    () => {
      if (!ready) return;
      const footer = root.current!;

      // data-theme-change="theme-1"
      ScrollTrigger.create({
        trigger: footer,
        start: "top 50%",
        end: "bottom 50%",
        onEnter: () => setTheme("theme-1"),
        onEnterBack: () => setTheme("theme-1"),
      });

      // Footer-top reveal (port of scrollAnims.js `k`).
      const top = footer.querySelector<HTMLElement>(".footer-top");
      if (top) {
        const h2 = top.querySelector<HTMLElement>("h2");
        const info = top.querySelector<HTMLElement>(".footer-top-info");
        const btn = top.querySelector(".btn-primary");
        splitLines(h2);
        splitLines(info);
        gsap.set([...lines(h2), ...lines(info)], { yPercent: 110, autoAlpha: 0 });
        if (btn) gsap.set(btn, { autoAlpha: 0, y: 20 });
        ScrollTrigger.create({
          trigger: top,
          start: "top 85%",
          once: true,
          onEnter: () => {
            const tl = gsap.timeline();
            const h = lines(h2);
            if (h.length) tl.to(h, { yPercent: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1, ease: "power3.out", onComplete: () => gsap.set(masks(h2), { overflow: "visible" }) });
            const i = lines(info);
            if (i.length) tl.to(i, { yPercent: 0, autoAlpha: 1, duration: 0.8, stagger: 0.05, ease: "power3.out", onComplete: () => gsap.set(masks(info), { overflow: "visible" }) }, h.length ? "-=0.5" : 0);
            if (btn) tl.to(btn, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", clearProps: "transform,opacity,visibility" }, "-=0.6");
          },
        });
      }

      // Pinned name fill (port of FooterMiddle.astro script): outline name fills bottom-up over 700px.
      const name = footer.querySelector(".footer-page-name");
      const cta = footer.querySelector(".footer-cta");
      if (name) {
        const tl = gsap
          .timeline({
            scrollTrigger: { trigger: footer, start: "bottom bottom", end: "+=700", pin: true, pinSpacing: true, anticipatePin: 1, scrub: true, invalidateOnRefresh: true },
          })
          .fromTo(name, { "--fill-progress": "0%" }, { "--fill-progress": "100%", ease: "none", duration: 1 }, 0);
        // Closing CTA blurs up as the fill completes (same treatment as the original's footer prompt).
        if (cta) tl.fromTo(cta, { autoAlpha: 0, y: 20, filter: "blur(12px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", ease: "power2.out", duration: 0.3 }, 0.65);
      }
    },
    { scope: root, dependencies: [ready] },
  );

  const toTop = (e: React.MouseEvent) => {
    e.preventDefault();
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nameMarkup = site.nameWords.map((w, i) => (
    <span key={w}>
      {i > 0 ? " " : ""}
      <StyledText text={w} />
    </span>
  ));

  return (
    <footer ref={root} className={`footer${showTop ? "" : " no-top"}`}>
      <div className="container">
        {showTop && (
          <div className="footer-top main-grid-8">
            <div className="footer-top-left">
              <h2 data-split="">
                <StyledText text={site.footer.headline[0]} />
                <br />
                <StyledText text={site.footer.headline[1]} />
              </h2>
            </div>
            <div className="footer-top-right">
              <p className="footer-top-info" data-split="">
                {site.footer.info}
              </p>
              <Link href="/contact" className="btn-primary">
                Contact me
              </Link>
            </div>
          </div>
        )}
        <div className="footer-middle">
          <div className="footer-page-name" aria-label={site.name}>
            <span className="text-stroke" aria-hidden="true">
              {nameMarkup}
            </span>
            <span className="text-fill" aria-hidden="true">
              {nameMarkup}
            </span>
          </div>
          {showCta && (
            <div className="footer-cta">
              <Link href="/contact" className="btn-primary">
                {site.footer.cta.label}
              </Link>
              <span className="footer-cta-note mono">{site.footer.cta.note}</span>
            </div>
          )}
          <div className="footer-boxes main-grid-8">
            {Array.from({ length: TILES }, (_, i) => (
              <div key={i} className="grid-box" />
            ))}
          </div>
        </div>
        <div className="footer-bottom main-grid-8">
          <div className="footer-bottom-left">
            <p className="copyright">
              © <span>{new Date().getFullYear()}</span> {site.name}. All rights reserved.
            </p>
          </div>
          <div className="footer-bottom-right">
            <div className="footer-socials">
              <a href={`mailto:${site.email}`}>Email</a>
              {site.socials.linkedin && (
                <a href={site.socials.linkedin} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              )}
              {site.socials.instagram && (
                <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              )}
            </div>
            <div className="footer-info">
              <a href="#top" className="btn-to-top" onClick={toTop}>
                To top
              </a>
              <p className="availability">{site.footer.availability}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
