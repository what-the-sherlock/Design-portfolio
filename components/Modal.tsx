"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { playSound } from "@/lib/sfx";
import { CloseX } from "./icons";

/**
 * Modal with the original choreography (Layout.astro script):
 * bg grows 0→100% height, content rises in, close button spins in with back.out;
 * closing reverses the same timeline at 1.5× speed.
 */
export function Modal({
  open,
  onClose,
  onClosed,
  className = "",
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onClosed?: () => void;
  className?: string;
  label: string;
  children: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const wasOpen = useRef(false);
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  useGSAP(
    () => {
      const el = root.current!;
      const bg = el.querySelector(".modal-bg");
      const contain = el.querySelector(".modal-contain");
      const close = el.querySelector(".modal-close");
      const t = gsap.timeline({
        paused: true,
        onStart: () => {
          el.classList.add("show");
          gsap.set(el, { opacity: 1, visibility: "visible" });
        },
        onReverseComplete: () => {
          el.classList.remove("show");
          gsap.set(el, { opacity: 0, visibility: "hidden" });
          t.pause();
          onClosedRef.current?.();
        },
      });
      t.fromTo(bg, { height: 0 }, { height: "100%", duration: 0.35, ease: "power3.out" }, 0);
      t.fromTo(contain, { opacity: 0, y: 36, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" }, 0.2);
      t.fromTo(close, { opacity: 0, scale: 0.7, rotate: -45 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.35, ease: "back.out(1.7)" }, 0.35);
      tl.current = t;
    },
    { scope: root },
  );

  useEffect(() => {
    const t = tl.current;
    if (!t) return;
    if (open) {
      wasOpen.current = true;
      getLenis()?.stop();
      t.timeScale(1).play();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      getLenis()?.start();
      t.timeScale(1.5).reverse();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        playSound("key-press");
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      ref={root}
      className={`modal ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      aria-hidden={!open}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-bg" onClick={onClose} />
      <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
        <CloseX />
      </button>
      <div className="modal-contain" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {children}
      </div>
    </div>
  );
}
