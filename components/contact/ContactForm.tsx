"use client";

import { useRef, useState } from "react";
import { contact } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { introDelay } from "@/lib/intro";
import { getLenis } from "@/lib/lenis";
import { lines, masks, splitLines } from "@/lib/split";
import { PixelAsterisk, PixelFrame, PixelPlay } from "../icons";
import { setTheme } from "../PageSetup";
import { useReady } from "../Providers";

const ICONS = { frame: PixelFrame, asterisk: PixelAsterisk, play: PixelPlay } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;

/**
 * Two-step enquiry form (adapted from the original ContactForm.astro script, minus its budget step):
 * choose a service → details. Each step reveals with line + box animations
 * and the page scrolls to it; submission posts to /api/contact (Resend).
 */
export function ContactForm() {
  const root = useRef<HTMLElement>(null);
  const ready = useReady();
  const [service, setService] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const revealRef = useRef<(el: HTMLElement | null, delay?: number) => void>(() => {});

  const scrollToEl = (el: Element | null) => {
    if (!el) return;
    const offset = window.innerWidth <= 480 ? -80 : -120;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el as HTMLElement, { offset, duration: 1, easing: easeOutQuart });
    else el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useGSAP(
    (_, contextSafe) => {
      if (!ready || !contextSafe) return;
      const form = root.current!;

      // data-theme-change="theme-2"
      ScrollTrigger.create({
        trigger: form,
        start: "top 50%",
        end: "bottom 50%",
        onEnter: () => setTheme("theme-2"),
        onEnterBack: () => setTheme("theme-2"),
      });

      const reveal = contextSafe((el: HTMLElement | null, delay = 0) => {
        if (!el) return;
        el.classList.add("is-visible");
        gsap.set(el, { visibility: "visible" });
        const h2 = el.querySelector<HTMLElement>("h2");
        const sub = el.querySelector<HTMLElement>(".form-step-subtitle");
        if (h2 && !h2.querySelector(".split-line")) splitLines(h2);
        if (sub && !sub.querySelector(".split-line")) splitLines(sub);
        const boxes = Array.from(el.querySelectorAll(".step-box, .submit-wrapper"));
        const tl = gsap.timeline({ delay, onUpdate: () => ScrollTrigger.refresh(), onComplete: () => ScrollTrigger.refresh() });
        const hl = lines(h2);
        const sl = lines(sub);
        if (hl.length) {
          gsap.set(hl, { yPercent: 110, autoAlpha: 0 });
          tl.to(hl, { yPercent: 0, autoAlpha: 1, duration: 0.8, stagger: 0.08, ease: "power3.out", onComplete: () => gsap.set(masks(h2), { overflow: "visible" }) }, 0);
        }
        if (sl.length) {
          gsap.set(sl, { yPercent: 110, autoAlpha: 0 });
          tl.to(sl, { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.06, ease: "power3.out", onComplete: () => gsap.set(masks(sub), { overflow: "visible" }) }, hl.length ? "-=0.5" : 0);
        }
        if (boxes.length) {
          gsap.set(boxes, { y: 30, autoAlpha: 0 });
          tl.to(boxes, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1, ease: "power3.out", clearProps: "transform,opacity,visibility" }, sl.length || hl.length ? "-=0.4" : 0);
        }
      });
      revealRef.current = reveal;

      // Step 1 waits for the hero intro (or a fallback timeout).
      const step1 = form.querySelector<HTMLElement>(".step-1");
      let started = false;
      const start = () => {
        if (started) return;
        started = true;
        reveal(step1, 0);
      };
      if (window.__heroAnimComplete) start();
      else {
        window.addEventListener("heroAnimComplete", start, { once: true });
        const t = setTimeout(start, (introDelay(3.6, 0.1) + 1.4) * 1000);
        return () => {
          clearTimeout(t);
          window.removeEventListener("heroAnimComplete", start);
        };
      }
    },
    { scope: root, dependencies: [ready] },
  );

  const nextStep = (cls: string) => {
    const el = root.current?.querySelector<HTMLElement>(cls);
    if (!el) return;
    setTimeout(() => {
      if (!el.classList.contains("is-visible")) revealRef.current(el, 0.3);
      scrollToEl(el);
    }, 240);
  };

  const fail = (msg: string, focus?: string, scrollTo?: string) => {
    setError(msg);
    if (focus) root.current?.querySelector<HTMLElement>(focus)?.focus();
    if (scrollTo) scrollToEl(root.current!.querySelector(scrollTo));
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const overview = String(data.get("overview") || "").trim();
    const company = String(data.get("company") || "");

    if (!service) return fail("Please select an option in Step 1.", undefined, ".step-1");
    if (!name) return fail("Please enter your name.", "#input-name");
    if (!email) return fail("Please enter your email address.", "#input-email");
    if (!EMAIL_RE.test(email)) return fail("Please enter a valid email address.", "#input-email");
    if (!overview) return fail("Please enter a brief project overview.", "#input-overview");

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, service, overview, company }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Something went wrong.");
      }
      const container = root.current!.querySelector(".contact-form-container");
      scrollToEl(container);
      const formEl = root.current!.querySelector<HTMLElement>(".contact-form");
      const success = root.current!.querySelector<HTMLElement>(".form-success-card");
      gsap.to(formEl, {
        opacity: 0,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => {
          if (formEl) formEl.style.display = "none";
          if (success) {
            success.style.display = "flex";
            ScrollTrigger.refresh();
            revealRef.current(success, 0.1);
          }
        },
      });
    } catch (err) {
      setSending(false);
      fail(err instanceof Error ? `${err.message} You can also email me directly.` : "Something went wrong.");
    }
  };

  const { service: s1, details } = contact.steps;

  return (
    <section ref={root} className="contact-sec">
      <div className="container pad-120">
        <div className="contact-form-container">
          <form className="contact-form" noValidate onSubmit={onSubmit}>
            <div className="form-step step-1 is-visible">
              <h2>{s1.title}</h2>
              <div className="step-grid main-grid-8" role="radiogroup" aria-label={s1.title}>
                {s1.options.map(({ value, icon }) => {
                  const Icon = ICONS[icon as keyof typeof ICONS];
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={service === value}
                      className={`step-box${service === value ? " selected" : ""}`}
                      onClick={() => {
                        setService(value);
                        setError("");
                        nextStep(".step-2");
                      }}
                    >
                      <span className="step-box-icon">
                        <Icon />
                      </span>
                      <span className="step-box-texts">
                        <span className="step-box-title">{value}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-step step-2">
              <h2>{details.title}</h2>
              <div className="step-grid main-grid-8 input-grid">
                <label className="step-box with-input input-1" htmlFor="input-name">
                  <span className="label">Name</span>
                  <input type="text" name="name" placeholder="Jane Doe" id="input-name" autoComplete="name" required />
                </label>
                <label className="step-box with-input input-2" htmlFor="input-email">
                  <span className="label">Email</span>
                  <input type="email" name="email" placeholder="jane@company.com" id="input-email" autoComplete="email" required />
                </label>
                <label className="step-box with-input input-3" htmlFor="input-overview">
                  <span className="sr-only">Project overview</span>
                  <textarea name="overview" placeholder="Project overview" id="input-overview" required />
                </label>
                <div className="hp-field" aria-hidden="true">
                  <label htmlFor="input-company">Company</label>
                  <input type="text" name="company" id="input-company" tabIndex={-1} autoComplete="off" />
                </div>
                <div className="submit-wrapper">
                  <button type="submit" className="submit-button" disabled={sending}>
                    <span className="btn-primary">{sending ? "Sending..." : "Send inquiry"}</span>
                  </button>
                  <div className={`form-error-msg${error ? " is-visible" : ""}`} role="alert">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          </form>
          <div className="form-success-card" role="status">
            <h2>{contact.success.title}</h2>
            <p className="form-step-subtitle">{contact.success.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
