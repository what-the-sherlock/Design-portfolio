"use client";

import { useEffect, useRef } from "react";
import { getLenis } from "@/lib/lenis";

/** Custom scrollbar: appears on scroll / near the right edge, click-to-jump, draggable thumb. */
export function FloatingScrollbar() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const t = track.current;
    const th = thumb.current;
    if (!el || !t || !th) return;

    let dragging = false;
    let startY = 0;
    let startThumb = 0;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const metrics = () => {
      const lenis = getLenis();
      const scroll = lenis ? lenis.scroll : window.scrollY;
      const limit = lenis ? lenis.limit : document.documentElement.scrollHeight - window.innerHeight;
      return { scroll, limit };
    };

    const show = () => {
      el.classList.add("is-visible");
      if (hideTimer) clearTimeout(hideTimer);
      if (!dragging) hideTimer = setTimeout(() => el.classList.remove("is-visible"), 1100);
    };

    const update = () => {
      const { scroll, limit } = metrics();
      if (!limit || limit <= 10) {
        el.style.display = "none";
        return;
      }
      el.style.display = "";
      const y = Math.max(0, Math.min(1, scroll / limit)) * (t.clientHeight - th.clientHeight);
      th.style.transform = `translate3d(0, ${y}px, 0)`;
    };

    const scrollToRatio = (ratio: number, immediate: boolean) => {
      const lenis = getLenis();
      const { limit } = metrics();
      if (lenis) lenis.scrollTo(ratio * limit, immediate ? { immediate: true } : { duration: 0.9 });
      else window.scrollTo({ top: ratio * limit, behavior: immediate ? "auto" : "smooth" });
    };

    const onTrackClick = (e: MouseEvent) => {
      if (e.target === th || dragging) return;
      const rect = t.getBoundingClientRect();
      const range = rect.height - th.clientHeight;
      const pos = Math.max(0, Math.min(range, e.clientY - rect.top - th.clientHeight / 2));
      scrollToRatio(range > 0 ? pos / range : 0, false);
      show();
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      e.preventDefault();
      const range = t.clientHeight - th.clientHeight;
      const pos = Math.max(0, Math.min(range, startThumb + (e.clientY - startY)));
      scrollToRatio(range > 0 ? pos / range : 0, true);
    };

    const onUp = (e: PointerEvent) => {
      dragging = false;
      document.documentElement.classList.remove("scrollbar-grabbing");
      th.classList.remove("is-dragging");
      try {
        th.releasePointerCapture(e.pointerId);
      } catch {}
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      show();
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      startY = e.clientY;
      const { scroll, limit } = metrics();
      startThumb = (limit > 0 ? scroll / limit : 0) * (t.clientHeight - th.clientHeight);
      document.documentElement.classList.add("scrollbar-grabbing");
      th.classList.add("is-dragging");
      el.classList.add("is-visible");
      th.setPointerCapture(e.pointerId);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    };

    const onMouse = (e: MouseEvent) => {
      if (window.innerWidth - e.clientX < 100) show();
    };
    const onScroll = () => {
      update();
      show();
    };

    t.addEventListener("click", onTrackClick);
    th.addEventListener("pointerdown", onDown);
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    // Lenis is created by the Providers effect, which may run after this one.
    let lenisBound = false;
    const bind = () => {
      const lenis = getLenis();
      if (lenis && !lenisBound) {
        lenis.on("scroll", onScroll);
        lenisBound = true;
      }
    };
    bind();
    window.addEventListener("scroll", onScroll, { passive: true });
    const bindTimer = setTimeout(bind, 300);
    update();

    return () => {
      clearTimeout(bindTimer);
      if (hideTimer) clearTimeout(hideTimer);
      t.removeEventListener("click", onTrackClick);
      th.removeEventListener("pointerdown", onDown);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", onScroll);
      if (lenisBound) getLenis()?.off("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={root} className="floating-scrollbar" aria-hidden="true">
      <div ref={track} className="scrollbar-track">
        <div ref={thumb} className="scrollbar-thumb" />
      </div>
    </div>
  );
}
