"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { loaderWillPlay } from "@/lib/intro";
import { getLenis } from "@/lib/lenis";
import { isMuted, playSound, toggleMute } from "@/lib/sfx";
import { VolumeIcon } from "./icons";

export function Navbar() {
  const root = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const [muted, setMutedState] = useState(false);

  // Drop-in after the loader (port of Navbar.astro script).
  useGSAP(
    () => {
      const items = Array.from(root.current?.querySelectorAll<HTMLElement>(".nav__link, .btn-volume") ?? []).filter(
        (el) => el.offsetParent !== null,
      );
      if (!items.length) return;
      if (loaderWillPlay()) {
        gsap.fromTo(items, { y: -30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: "power3.out", delay: 3.6 });
      } else {
        gsap.set(items, { autoAlpha: 1, y: 0 });
      }
    },
    { scope: root },
  );

  useEffect(() => {
    setMutedState(isMuted());
    const onChange = () => setMutedState(isMuted());
    window.addEventListener("sfx:mute-change", onChange);
    return () => window.removeEventListener("sfx:mute-change", onChange);
  }, []);

  const onVolume = () => {
    const nowMuted = toggleMute();
    if (!nowMuted) playSound("click");
  };

  // Same-page navigation scrolls smoothly with Lenis instead of jumping.
  const onHome = (e: React.MouseEvent) => {
    if (pathname !== "/") return;
    e.preventDefault();
    history.pushState(null, "", "/");
    getLenis()?.scrollTo(0);
  };
  const onProjects = (e: React.MouseEvent) => {
    if (pathname !== "/") return;
    const target = document.getElementById("projects");
    if (!target) return;
    e.preventDefault();
    history.pushState(null, "", "/#projects");
    getLenis()?.scrollTo(target);
  };

  return (
    <nav ref={root} className="navbar">
      <div className="container">
        <div className="nav__contain main-grid-8">
          <div className="nav__left">
            <Link href="/" onClick={onHome} className={`nav__link${pathname === "/" ? " active" : ""}`} aria-label="Home">
              <span className="num">01.</span>
              <span className="name">Home</span>
            </Link>
          </div>
          <div className="nav__middle">
            <Link href="/#projects" onClick={onProjects} className="nav__link" aria-label="Projects">
              <span className="num">02.</span>
              <span className="name">Projects</span>
            </Link>
            <Link href="/contact" className={`nav__link${pathname.startsWith("/contact") ? " active" : ""}`} aria-label="Contact me">
              <span className="num">03.</span>
              <span className="name">Contact me</span>
            </Link>
          </div>
          <div className="nav__right">
            <button
              type="button"
              className="btn-volume"
              data-sfx="none"
              aria-label={muted ? "Unmute sound" : "Mute sound"}
              onClick={onVolume}
            >
              <VolumeIcon muted={muted} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
