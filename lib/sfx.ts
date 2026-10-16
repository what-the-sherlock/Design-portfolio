"use client";

// Web Audio sound effects (port of sfx.js from the original build).

type SoundName = "click" | "key-press" | "eat" | "game-over" | "level-up";

const PRELOAD: Partial<Record<SoundName, string>> = {
  click: "/sfx/click.wav",
  "key-press": "/sfx/key-press.wav",
};

const SOURCES: Record<SoundName, string> = {
  click: "/sfx/click.wav",
  "key-press": "/sfx/key-press.wav",
  eat: "/sfx/eat.wav",
  "game-over": "/sfx/game-over.wav",
  "level-up": "/sfx/level-up.wav",
};

const DEFAULT_VOLUME: Partial<Record<SoundName, number>> = { click: 0.6, "key-press": 0.25 };

let ctx: AudioContext | null = null;
const buffers = new Map<string, AudioBuffer>();
const lastPlayed = new Map<string, number>();
let muted = false;

if (typeof window !== "undefined") {
  try {
    muted = localStorage.getItem("sfx_muted") === "true";
  } catch {}
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) ctx = new Ctor();
  }
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export async function loadSound(name: SoundName): Promise<AudioBuffer | null> {
  if (typeof window === "undefined") return null;
  const cached = buffers.get(name);
  if (cached) return cached;
  const src = SOURCES[name];
  if (!src) return null;
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.arrayBuffer();
    const audio = getContext();
    if (!audio) return null;
    const buffer = await audio.decodeAudioData(data);
    buffers.set(name, buffer);
    return buffer;
  } catch (err) {
    console.warn(`[SFX] Failed to load sound "${name}" from ${src}:`, err);
    return null;
  }
}

export function playSound(
  name: SoundName,
  opts: { volume?: number; randomizePitch?: boolean; pitch?: number; throttle?: number } = {},
) {
  if (muted) return;
  const { volume = DEFAULT_VOLUME[name] ?? 0.4, randomizePitch = false, pitch = 1, throttle = 0 } = opts;
  const now = performance.now();
  if (throttle > 0 && now - (lastPlayed.get(name) || 0) < throttle) return;
  lastPlayed.set(name, now);

  const audio = getContext();
  if (!audio) return;
  const buffer = buffers.get(name);
  if (!buffer) {
    loadSound(name).then((b) => b && playSound(name, opts));
    return;
  }
  try {
    const source = audio.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = randomizePitch ? pitch * (0.96 + Math.random() * 0.08) : pitch;
    const gain = audio.createGain();
    gain.gain.value = Math.max(0, Math.min(1, volume));
    source.connect(gain);
    gain.connect(audio.destination);
    source.start(0);
  } catch (err) {
    console.warn(`[SFX] Playback error on "${name}":`, err);
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(value: boolean) {
  muted = !!value;
  try {
    localStorage.setItem("sfx_muted", String(muted));
  } catch {}
  window.dispatchEvent(new CustomEvent("sfx:mute-change", { detail: { isMuted: muted } }));
}

export function toggleMute() {
  setMuted(!muted);
  return muted;
}

let globalsAttached = false;

/** Global listeners: unlock audio, click/keyboard sounds, preload. Call once on the client. */
export function attachSfxListeners() {
  if (typeof window === "undefined" || globalsAttached) return;
  globalsAttached = true;

  const unlock = () => {
    const audio = getContext();
    if (audio && audio.state === "running") {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    }
  };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest('[data-sfx="none"], [data-no-sfx]') || e.detail === 0) return;
    const el = target.closest("[data-sfx], a, button, [role='button']");
    if (el) {
      const name = el.getAttribute("data-sfx");
      playSound((name && name !== "" ? name : "click") as SoundName, { randomizePitch: true });
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.repeat || ["Meta", "Shift", "Control", "Alt", "Tab"].includes(e.key)) return;
    const active = document.activeElement;
    if (!active || !(active instanceof Element) || ["INPUT", "TEXTAREA"].includes(active.tagName) || (active as HTMLElement).isContentEditable) return;
    const el = active.closest("a, button, [role='button'], [data-sfx]");
    if (el && !el.closest('[data-sfx="none"], [data-no-sfx]')) playSound("key-press", { randomizePitch: true, throttle: 50 });
  });

  const preload = () => (Object.keys(PRELOAD) as SoundName[]).forEach((n) => loadSound(n));
  if ("requestIdleCallback" in window) window.requestIdleCallback(preload);
  else setTimeout(preload, 500);
}
