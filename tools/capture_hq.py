"""High-quality capture for portfolio media.

usage: python tools/capture_hq.py <slug> <base_url> <out_dir> [--no-preview | --preview-only]

Writes to <out_dir>/<slug>/:
  hero@2x.png        1440x960 viewport at 2x DPR (2880x1920)
  full@2x.png        full page at 2x DPR (after a warm-up scroll so reveals have fired)
  preview_frames/    JPEG frames from a CDP screencast of a smooth scroll (real-time, ~30-60fps)
  preview_frames.txt ffmpeg concat list with per-frame durations
"""
import base64
import os
import shutil
import sys
import time
import urllib.request

from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from capture_common import HIDE_NOISE, SEED_CONSENT  # noqa: E402

W, H = 1440, 960
args = [a for a in sys.argv[1:] if not a.startswith("--")]
slug, base, out_root = args
want_preview = "--no-preview" not in sys.argv
want_stills = "--preview-only" not in sys.argv
out = os.path.join(out_root, slug)
os.makedirs(out, exist_ok=True)


def wait_for_server(url, timeout=240):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                if r.status < 500:
                    return
        except Exception:
            pass
        time.sleep(2)
    raise SystemExit(f"server not ready: {url}")


def settle(page, ms=4000):
    try:
        page.wait_for_load_state("networkidle", timeout=20000)
    except Exception:
        pass
    page.evaluate("document.fonts.ready.then(() => true)")
    page.wait_for_timeout(ms)


def warm_scroll(page):
    height = page.evaluate("document.documentElement.scrollHeight")
    y = 0
    while y < height:
        page.mouse.wheel(0, 500)
        page.wait_for_timeout(120)
        y += 500
        height = page.evaluate("document.documentElement.scrollHeight")
    page.wait_for_timeout(1000)
    page.evaluate("(window.lenis && typeof window.lenis.scrollTo === 'function') ? window.lenis.scrollTo(0, {immediate: true}) : window.scrollTo(0, 0)")
    page.wait_for_timeout(1500)


def full_page_2x(page, path):
    try:
        page.screenshot(path=path, full_page=True, timeout=180000)
        return
    except Exception as e:
        print("single full-page capture failed, slicing:", str(e)[:120])
    # Fallback: capture the full page in horizontal slices and stitch.
    from PIL import Image
    total = page.evaluate("document.documentElement.scrollHeight")
    step = 3000
    parts = []
    for i, y in enumerate(range(0, total, step)):
        h = min(step, total - y)
        part = os.path.join(out, f"_slice_{i}.png")
        page.screenshot(path=part, full_page=True, clip={"x": 0, "y": y, "width": W, "height": h}, timeout=180000)
        parts.append(part)
    imgs = [Image.open(pp) for pp in parts]
    canvas = Image.new("RGB", (imgs[0].width, sum(i.height for i in imgs)), "white")
    yy = 0
    for im in imgs:
        canvas.paste(im, (0, yy))
        yy += im.height
    canvas.save(path)
    for pp in parts:
        os.remove(pp)


wait_for_server(base)

with sync_playwright() as p:
    browser = p.chromium.launch()

    # --- 2x stills
    if want_stills:
        ctx = browser.new_context(viewport={"width": W, "height": H}, device_scale_factor=2)
        ctx.add_init_script(SEED_CONSENT)
        page = ctx.new_page()
        page.goto(base, wait_until="load", timeout=180000)
        page.add_style_tag(content=HIDE_NOISE)
        settle(page, 5000)
        page.screenshot(path=f"{out}/hero@2x.png")
        warm_scroll(page)
        full_page_2x(page, f"{out}/full@2x.png")
        ctx.close()

    # --- screencast preview: smooth scroll, frames at native rate with real timestamps
    if want_preview:
        fdir = os.path.join(out, "preview_frames")
        shutil.rmtree(fdir, ignore_errors=True)
        os.makedirs(fdir)
        vctx = browser.new_context(viewport={"width": W, "height": H}, device_scale_factor=1)
        vctx.add_init_script(SEED_CONSENT)
        vpage = vctx.new_page()
        vpage.goto(base, wait_until="load", timeout=180000)
        vpage.add_style_tag(content=HIDE_NOISE)
        settle(vpage, 4500)

        cdp = vctx.new_cdp_session(vpage)
        frames = []

        def on_frame(ev):
            frames.append((ev["metadata"]["timestamp"], ev["data"]))
            cdp.send("Page.screencastFrameAck", {"sessionId": ev["sessionId"]})

        cdp.on("Page.screencastFrame", on_frame)
        cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 92, "maxWidth": W, "maxHeight": H, "everyNthFrame": 1})
        vpage.wait_for_timeout(600)
        t_end = time.time() + 14
        while time.time() < t_end:
            vpage.mouse.wheel(0, 45)
            vpage.wait_for_timeout(30)
        vpage.wait_for_timeout(600)
        cdp.send("Page.stopScreencast")
        vctx.close()

        # Write frames + an ffmpeg concat list using the real inter-frame timings.
        lines = []
        for i, (ts, data) in enumerate(frames):
            name = f"f{i:05d}.jpg"
            with open(os.path.join(fdir, name), "wb") as f:
                f.write(base64.b64decode(data))
            dur = (frames[i + 1][0] - ts) if i + 1 < len(frames) else 1 / 30
            lines.append(f"file 'preview_frames/{name}'\nduration {max(dur, 1 / 120):.5f}")
        lines.append(f"file 'preview_frames/f{len(frames) - 1:05d}.jpg'")
        with open(os.path.join(out, "preview_frames.txt"), "w") as f:
            f.write("\n".join(lines) + "\n")
        span = frames[-1][0] - frames[0][0] if frames else 0
        print(f"{slug}: {len(frames)} frames over {span:.1f}s ({len(frames) / max(span, 0.01):.0f} fps)")

    browser.close()

print("done", slug)
