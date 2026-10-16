// Builds optimised portfolio media from high-quality captures and source films.
// Requires ffmpeg/ffprobe on PATH.
//   npm run media                       build whatever is missing
//   npm run media -- --force            rebuild everything
//   npm run media -- --only=plume,dros  limit to some slugs
//
// Inputs per web project (captures/<slug>/, from tools/capture_hq.py):
//   hero@2x.png, full@2x.png, preview_frames.txt (+ preview_frames/)
//   ...or overrides declared below (a PDF-extracted page, a hand-made screen recording).
//
// Outputs (public/media/<slug>/):
//   cover-{800,1200,1600,2400}.webp   responsive 3:2 cover
//   full/tile-NN-{1200,2400}.webp      full page sliced into tiles for the viewer (lazy-loaded, 1x/2x)
//   preview.mp4, preview.webm          muted hover preview
//   film.mp4                           motion projects only
// plus content/media.generated.json with LQIP + dimensions + tile heights per slug.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const CAPTURES = path.join(ROOT, "captures");
const OUT = path.join(ROOT, "public", "media");
const MANIFEST = path.join(ROOT, "content", "media.generated.json");
const force = process.argv.includes("--force");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",");

const COVER_WIDTHS = [800, 1200, 1600, 2400];
const TILE_WIDTHS = [1200, 2400]; // the viewer is ≤1200 CSS px wide → 1x / 2x
const TILE_BASE_HEIGHT = 1200; // tile height at 1200w
const PREVIEW_SECONDS = 10;

// Web projects. Optional overrides:
//   hero / full: alternative source images (e.g. extracted from a full-page PDF capture)
//   previewSrc: hand-made screen recording; previewCrop "w:h:x:y" trims empty margins (the clip keeps
//   its own aspect ratio — the featured-card preview floats as an inset window)
//   previewStart / previewSeconds / previewSpeed: excerpt and speed-up
const WEB = [
  {
    slug: "metal-labs",
    hero: "captures/metal-labs/hero-pdf.png",
    full: "captures/metal-labs/full-pdf.png",
    previewSrc: "C:/Users/Aashutosh/Videos/Screen Recordings/Screen Recording 2026-10-17 041256.mp4",
    previewCrop: "1696:914:100:0",
    previewStart: 0,
    previewSeconds: 18,
    previewSpeed: 1.5,
  },
  { slug: "litlabs" },
  { slug: "plume" },
  { slug: "robyn" },
  { slug: "chapeau" },
  { slug: "dros" },
  { slug: "roswell" },
  { slug: "venturecite" },
];

// Motion films: poster frame + preview excerpt chosen from contact sheets.
const FILMS = [
  { slug: "wenup-film", src: "D:/litlabs/wenup video/out/wenup-brand-film-40s.mp4", poster: 33.5, previewStart: 23 },
  { slug: "plume-film", src: "D:/litlabs/Plume/video/out/plume-demo-40s-share.mp4", poster: 31, previewStart: 3 },
  { slug: "venturecite-film", src: "C:/Users/Aashutosh/Downloads/VentureCite-v3.mp4", poster: 87, previewStart: 4 },
];

const abs = (p) => (path.isAbsolute(p) ? p : path.join(ROOT, p));
const stale = (file) => force || !existsSync(file);

function ff(args) {
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
}

function probeSize(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height", "-of", "csv=p=0", file]).toString().trim();
  const [width, height] = out.split(",").map(Number);
  return { width, height };
}

function lqip(file) {
  // 8px-wide PNG, rendered with image-rendering: pixelated while the real image loads (original technique).
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-vf", "scale=8:-1:flags=area", "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "-"]);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function encodeCover(src, dir) {
  const { width } = probeSize(src);
  for (const w of COVER_WIDTHS) {
    const out = path.join(dir, `cover-${w}.webp`);
    // Top 3:2 of the source, never upscaled.
    if (stale(out))
      ff(["-i", src, "-vf", `crop=iw:'min(ih,iw*2/3)':0:0,scale=${Math.min(w, width)}:-2:flags=lanczos`, "-c:v", "libwebp", "-quality", "86", "-compression_level", "6", "-frames:v", "1", out]);
  }
}

function encodeTiles(src, dir) {
  const { width, height } = probeSize(src);
  const tdir = path.join(dir, "full");
  if (force) rmSync(tdir, { recursive: true, force: true });
  mkdirSync(tdir, { recursive: true });
  const scale = TILE_WIDTHS[0] / width; // tile geometry is defined at 1200w
  const total = Math.round(height * scale);
  const tiles = [];
  for (let i = 0, y = 0; y < total; i++, y += TILE_BASE_HEIGHT) {
    const h = Math.min(TILE_BASE_HEIGHT, total - y);
    tiles.push(h);
    for (const w of TILE_WIDTHS) {
      const out = path.join(tdir, `tile-${String(i).padStart(2, "0")}-${w}.webp`);
      if (!stale(out)) continue;
      const sy = Math.round(y / scale);
      const sh = Math.min(Math.round(h / scale), height - sy);
      const k = w / TILE_WIDTHS[0];
      ff(["-i", src, "-vf", `crop=${width}:${sh}:0:${sy},scale=${w}:${Math.round(h * k)}:flags=lanczos`, "-c:v", "libwebp", "-quality", "84", "-compression_level", "6", "-frames:v", "1", out]);
    }
  }
  return { width: TILE_WIDTHS[0], height: total, tiles };
}

function encodePreview({ input, inputArgs = [], vf, dir, seconds }) {
  const mp4 = path.join(dir, "preview.mp4");
  const webm = path.join(dir, "preview.webm");
  const t = seconds ? ["-t", String(seconds)] : [];
  if (stale(mp4))
    ff([...inputArgs, "-i", input, ...t, "-an", "-vf", vf, "-r", "30", "-c:v", "libx264", "-preset", "slow", "-crf", "25", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]);
  if (stale(webm))
    ff([...inputArgs, "-i", input, ...t, "-an", "-vf", vf, "-r", "30", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "35", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", webm]);
}

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
const selected = (slug) => !only || only.includes(slug);

for (const p of WEB.filter((w) => selected(w.slug))) {
  const { slug } = p;
  const cap = path.join(CAPTURES, slug);
  const dir = path.join(OUT, slug);
  mkdirSync(dir, { recursive: true });
  console.log(`• ${slug}`);

  encodeCover(abs(p.hero ?? path.join(cap, "hero@2x.png")), dir);
  const full = encodeTiles(abs(p.full ?? path.join(cap, "full@2x.png")), dir);

  if (p.previewSrc) {
    const speed = p.previewSpeed ?? 1;
    encodePreview({
      input: p.previewSrc,
      inputArgs: ["-ss", String(p.previewStart ?? 0)],
      vf: `${p.previewCrop ? `crop=${p.previewCrop},` : ""}setpts=PTS/${speed},scale=-2:800:flags=lanczos`,
      dir,
      seconds: (p.previewSeconds ?? PREVIEW_SECONDS) / speed,
    });
  } else {
    // Screencast frames with real per-frame durations → constant 30fps.
    encodePreview({ input: path.join(cap, "preview_frames.txt"), inputArgs: ["-f", "concat", "-safe", "0"], vf: "scale=1200:800:flags=lanczos", dir, seconds: PREVIEW_SECONDS });
  }

  manifest[slug] = { lqip: lqip(path.join(dir, "cover-800.webp")), cover: probeSize(path.join(dir, "cover-1600.webp")), full };
}

for (const { slug, src, poster, previewStart } of FILMS.filter((f) => selected(f.slug))) {
  const dir = path.join(OUT, slug);
  mkdirSync(dir, { recursive: true });
  console.log(`• ${slug}`);

  const posterPng = path.join(dir, "_poster.png");
  ff(["-ss", String(poster), "-i", src, "-frames:v", "1", posterPng]);
  for (const w of COVER_WIDTHS) {
    const out = path.join(dir, `cover-${w}.webp`);
    if (stale(out)) ff(["-i", posterPng, "-vf", `scale=${Math.min(w, 1920)}:-2:flags=lanczos`, "-c:v", "libwebp", "-quality", "86", "-frames:v", "1", out]);
  }
  encodePreview({ input: src, inputArgs: ["-ss", String(previewStart)], vf: "scale=1280:720:flags=lanczos", dir, seconds: PREVIEW_SECONDS });

  const film = path.join(dir, "film.mp4");
  if (stale(film))
    ff(["-i", src, "-c:v", "libx264", "-preset", "slow", "-crf", "22", "-pix_fmt", "yuv420p", "-r", "60", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", film]);

  manifest[slug] = { lqip: lqip(posterPng), cover: probeSize(path.join(dir, "cover-1600.webp")) };
  rmSync(posterPng);
}

mkdirSync(path.dirname(MANIFEST), { recursive: true });
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`wrote ${path.relative(ROOT, MANIFEST)}`);
