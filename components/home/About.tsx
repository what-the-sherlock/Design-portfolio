"use client";

import { useRef } from "react";
import { site } from "@/content/site";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { splitScrollReveal } from "@/lib/split";
import { setTheme } from "../PageSetup";
import { useReady } from "../Providers";

export function About() {
  const root = useRef<HTMLElement>(null);
  const ready = useReady();

  useGSAP(
    () => {
      if (!ready) return;
      splitScrollReveal(root.current!.querySelector<HTMLElement>("[data-split-scroll]"));
      // data-theme-change="theme-1"
      ScrollTrigger.create({
        trigger: root.current,
        start: "top 50%",
        end: "bottom 50%",
        onEnter: () => setTheme("theme-1"),
        onEnterBack: () => setTheme("theme-1"),
      });
    },
    { scope: root, dependencies: [ready] },
  );

  return (
    <section ref={root} className="about-me-sec">
      <div className="container pad-120">
        <div className="about-me-texts main-grid-8">
          <div className="about-me-left">
            <h2 className="h2-tag">( About Me )</h2>
          </div>
          <div className="about-me-right">
            <p aria-label={site.about}>
              <span aria-hidden="true" data-split-scroll="">
                {site.about}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
