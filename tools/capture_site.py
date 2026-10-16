"""Capture portfolio media for one site.

usage: python tools/capture_site.py <slug> <base_url> <out_dir> [extra_path ...]

Writes to <out_dir>/<slug>/:
  hero.png            1440x960 (3:2) first viewport after intro animations settle
  section_NN.png      1440x960 viewport shots every 0.9 viewport down the page
  full.png            full-page capture (after a warm-up scroll so reveals have fired)
  mobile_hero.png     390x844 first viewport (2x DPR)
  page_<path>.png     1440x960 first viewport of each extra path
  scroll.webm         ~12s smooth wheel-scroll recording at 1440x960
"""
import os
import sys
import time
import urllib.request

from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))

W, H = 1440, 960
slug, base, out_root, *extra = sys.argv[1:]
out = os.path.join(out_root, slug)
os.makedirs(out, exist_ok=True)

from capture_common import HIDE_NOISE, SEED_CONSENT  # noqa: E402




def new_context(browser, **kw):
    ctx = browser.new_context(**kw)
    ctx.add_init_script(SEED_CONSENT)
    return ctx


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


def settle(page, ms=3500):
    try:
        page.wait_for_load_state("networkidle", timeout=20000)
    except Exception:
        pass
    page.evaluate("document.fonts.ready.then(() => true)")
    page.wait_for_timeout(ms)


def warm_scroll(page):
    """Wheel through the page so whileInView / ScrollTrigger reveals fire, then return to top."""
    height = page.evaluate("document.documentElement.scrollHeight")
    y = 0
    while y < height:
        page.mouse.wheel(0, 500)
        page.wait_for_timeout(120)
        y += 500
        height = page.evaluate("document.documentElement.scrollHeight")
    page.wait_for_timeout(800)
    page.evaluate("(window.lenis && typeof window.lenis.scrollTo === 'function') ? window.lenis.scrollTo(0, {immediate: true}) : window.scrollTo(0, 0)")
    page.wait_for_timeout(1200)


def scroll_to(page, y):
    page.evaluate("y => (window.lenis && typeof window.lenis.scrollTo === 'function') ? window.lenis.scrollTo(y, {immediate: true, force: true}) : window.scrollTo(0, y)", y)


wait_for_server(base)

with sync_playwright() as p:
    browser = p.chromium.launch()

    # --- desktop stills
    ctx = new_context(browser, viewport={"width": W, "height": H}, device_scale_factor=1)
    page = ctx.new_page()
    page.goto(base, wait_until="load", timeout=180000)
    page.add_style_tag(content=HIDE_NOISE)
    settle(page, 5000)
    page.screenshot(path=f"{out}/hero.png")

    warm_scroll(page)
    height = page.evaluate("document.documentElement.scrollHeight")
    step = int(H * 0.9)
    for i, y in enumerate(range(0, max(height - H, 0) + 1, step)):
        scroll_to(page, y)
        page.wait_for_timeout(1300)
        page.screenshot(path=f"{out}/section_{i:02d}.png")
    scroll_to(page, 0)
    page.wait_for_timeout(800)
    try:
        page.screenshot(path=f"{out}/full.png", full_page=True, timeout=120000)
    except Exception as e:  # very tall pages can exceed GPU texture limits
        print("full-page capture failed:", e)

    for path in extra:
        page.goto(base.rstrip("/") + path, wait_until="load", timeout=180000)
        page.add_style_tag(content=HIDE_NOISE)
        settle(page, 4000)
        name = path.strip("/").replace("/", "_") or "root"
        page.screenshot(path=f"{out}/page_{name}.png")
    ctx.close()

    # --- mobile hero
    mctx = new_context(browser, viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    mpage = mctx.new_page()
    mpage.goto(base, wait_until="load", timeout=180000)
    mpage.add_style_tag(content=HIDE_NOISE)
    settle(mpage, 5000)
    mpage.screenshot(path=f"{out}/mobile_hero.png")
    mctx.close()

    # --- scroll recording (smooth, constant-pace wheel)
    vdir = os.path.join(out, "_video")
    vctx = new_context(browser, viewport={"width": W, "height": H}, record_video_dir=vdir, record_video_size={"width": W, "height": H})
    vpage = vctx.new_page()
    vpage.goto(base, wait_until="load", timeout=180000)
    vpage.add_style_tag(content=HIDE_NOISE)
    settle(vpage, 4500)
    t_end = time.time() + 12
    while time.time() < t_end:
        vpage.mouse.wheel(0, 60)
        vpage.wait_for_timeout(45)
    vpage.wait_for_timeout(500)
    video_path = vpage.video.path()
    vctx.close()
    os.replace(video_path, os.path.join(out, "scroll.webm"))
    try:
        os.rmdir(vdir)
    except OSError:
        pass

    browser.close()

print("done", slug, out)
