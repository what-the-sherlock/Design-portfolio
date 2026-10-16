# rekhchandsahu.com: Pre-Replication Analysis

Analysis date: 2026-10-17
Sources: `rekhchandsahu.com.zip` (76 files), the live site at https://rekhchandsahu.com/, and Playwright captures of the live site at 1440, 1024, 768 and 390 px.
File paths below are relative to the archive root, so `rekhchandsahu.com/_astro/X.js` means the file inside the zip.

Each finding is marked by how it was established:
- **[V-code]**: read directly in the archive source.
- **[V-live]**: observed on the live site (screenshot, DOM probe or HTTP check).
- **[Inferred]**: a reasoned conclusion that was not directly observed.

---

## 0. Key findings

1. **The archive is a browser "save page" capture of a compiled Astro build, not the source project.** It contains no `.astro`, `.jsx`, `package.json` or Sanity schema files, so the component architecture has to be re-authored from the compiled output. [V-code]
2. **The capture tool pretty-printed every file and broke 18 of the 25 JS bundles.** It rewrote `??` as `? ?`, `?.` as `? .`, `&&=` as `&& =` and `||=` as `|| =`, and `node --check` fails on all 18. [V-code]
   - **Fix:** the live server still serves the *identical* hashed bundles. I downloaded all 28 original JS/CSS files into scratch and every one parses. The archived HTML is byte-identical to the live HTML after whitespace normalisation. [V-live]
3. **The archive covers only the home page.** `/contact/`, `/about/` and `/projects/{voy,plutus,happystack,feedback-hq}/` exist live (HTTP 200) but are not in the zip. [V-live]
4. **Some assets are missing from the archive** (see §4.6). Every one of them is still downloadable from the live site or the Sanity CDN. [V-live]
5. **Stack:** Astro 5-style build with `<ClientRouter/>` view transitions, a React 19.2.7 island (Snake game), GSAP 3.15.0 (core, ScrollTrigger, SplitText and CustomEase), Lenis 1.3.25 and Sanity CMS. It is hosted on Netlify. [V-code/V-live]

---

## 1. Project overview

| Aspect | Finding | Evidence |
|---|---|---|
| Framework | Astro (static output, scoped CSS `data-astro-cid-*`, `astro-island`, `<ClientRouter/>` with `prefetchAll: true`, default strategy `hover`, fallback `animate`) | `index.html:9-11`, `index.html:853`, `_astro/ClientRouter…CTgtIFyY.js` |
| UI islands | One React island: `SnakeGame` hydrated with `client:only="react"` | `index.html:853` (`opts={"name":"ReactSnakeGame","value":"react"}`) |
| React | 19.2.7 (`react.SAN1c27M.js`, `client.8i2wDXlV.js` = react-dom/client, `client.CBS2sgm2.js` = @astrojs/react renderer) | version strings in bundles |
| Animation | GSAP 3.15.0 with ScrollTrigger 3.15.0, SplitText 3.15.0 and CustomEase 3.15.0 (inlined into the Loader bundle) | `gsap.CvDoa17S.js`, `ScrollTrigger.CDDhF-DF.js`, `SplitText.D2RYeBm1.js`, `Loader…BTF5wTKm.js:234` |
| Smooth scroll | Lenis 1.3.25, bundled inside `scrollAnims` | `scrollAnims.CPBboQkJ.js:10, 211-620` |
| CMS | Sanity (project `q4vr0ek7`, dataset `production`). Content is baked in at build time and images use Sanity's image URL params (`?w=…&auto=format&q=90`) | all `cdn.sanity.io` URLs |
| Audio | Web Audio API, custom `sfx` module | `sfx.Cr-LaPh8.js` |
| Hosting | Netlify (`Server: Netlify`). The `/contact/` form is probably Netlify Forms [Inferred] | response headers |
| Build tool | Vite (Astro default). Hashed chunk names such as `Name.HASH.js` | file naming |

**Not used [V-code]:** Framer Motion, WebGL/Three.js, Web Animations API, or any custom cursor. The only `<canvas>` belongs to the Snake game.

### Entry points and module graph

`index.html` loads these as `type="module"` scripts:

```
ClientRouter.astro…js ─► client.Bbg9OBwT.js (Astro router / view-transitions runtime)
Loader.astro…js       ─► gsap, SplitText (+ inlined CustomEase)
Navbar.astro…js       ─► gsap, sfx
HomeHeroOdometer…js   ─► gsap
HomeHero.astro…js     ─► gsap, scrollAnims(o = initSplit), utilities(t = introDelay)
HomeProjects…js       ─► scrollAnims(a = caseCardReveal)
HomeMoreProjects…js   ─► scrollAnims(i = moreProjectsReveal)
HomeServices…js       ─► gsap, ScrollTrigger, themeController(t = setTheme)
FooterMiddle…js       ─► gsap, ScrollTrigger, client.Bbg9OBwT(t = navigate)
Footer.astro…js       ─► scrollAnims(r = footerTopReveal)
inline <script>       ─► floating scrollbar (index.html:922-929)
astro-island          ─► SnakeGame.js ─► react, jsx-runtime, sfx
```

`Layout.astro…js` is the global layout script (imported by Astro on every page). It imports `scrollAnims`, `utilities`, `sfx`, `themeController` and `pageTransitions`, all of which self-initialise as side effects, and it owns the modal system and favicon animation. **Init lifecycle:** nearly every module initialises on `astro:page-load` and tears down on `astro:before-swap`. Re-init guards use `data-*Init="true"` attributes.

---

## 2. Directory and file map

```
rekhchandsahu.com/
  index.html                         Home page (SSR output, all content inline)
  favicon.svg / favicon.ico
  sfx/click.wav, key-press.wav       UI sounds
  _astro/
    Layout.DiRY6JX7.css              Tokens, fonts, reset, grid, btn-primary, Loader, Navbar, FooterMiddle, Footer, FloatingScrollbar styles
    index.BF0GB3K9.css               Home components: ExpandIcon, Odometer, StarsGroup, HomeHero, HomeProjects, HomeMoreProjects, AboutMe, HomeServices, Modal
    SnakeGame.DoOffdud.css           Snake game UI
    Layout.astro…B48OPoo8.js         Modal system + animated favicon (+ global module imports)
    Loader.astro…BTF5wTKm.js         Intro loader timeline (+ CustomEase)
    Navbar.astro…BticVWGS.js         Nav intro + mute button
    HomeHero.astro…DC6o7tuu.js       Hero intro timeline
    HomeHeroOdometer…DNLlUu21.js     Year odometer reels
    HomeProjects…CFvQ9ovV.js         Case-card video hover
    HomeMoreProjects…CobHOyq_.js     Directional hover (desktop) / scroll focus list (≤1280)
    HomeServices…Cms9TfL_.js         Pinned horizontal services scene
    FooterMiddle…BSKrCFem.js         Pinned footer text-fill
    Footer.astro…CYWcK76K.js         IST clock, to-top, footer reveal
    scrollAnims.CPBboQkJ.js          Lenis + SplitText reveal system + parallax + reveal presets
    pageTransitions.B-5FVfcF.js      Case-card → case-page FLIP, video autoplay rescue, hash/scroll handling
    themeController.DNSErAxu.js      data-theme switcher driven by ScrollTrigger
    utilities.Bf_CmStm.js            intro-delay helper, accordion (unused on home)
    sfx.Cr-LaPh8.js                  Web Audio SFX engine + global click/key sounds + mute
    SnakeGame.Ce8Ws_uE.js            React Snake game
    gsap / ScrollTrigger / SplitText / react / client.* / jsx-runtime   vendor chunks
    *.woff2                          4 of 5 fonts
    ico-*.svg, logo-snake.svg        icons
cdn.sanity.io/images/…               case thumbnails, video posters, 8px LQIP placeholders
cdn.sanity.io/files/…                project videos (webm + one mp4)
_DataURI/…txt                        decoded data-URI (pixel-arrow mask used by .btn-primary; already inline in CSS)
```

### Astro scope ids mapped to components [V-code]
These ids let us recover the original component boundaries:

| cid | Component (inferred name) | Root |
|---|---|---|
| `7oxgzymq` | Loader | `.loader` |
| `zk4oyc2d` | Navbar | `nav.navbar` |
| `574c6pqd` | VolumeIcon (inside Navbar) | `.mute-line` |
| `glgfkru5` | HomeHero | `.hero-home-sec` |
| `tjp3xtk6` | ExpandIcon (Snake tile) | `.path-1/.path-2` |
| `dxszrbic` | StarsGroup | `.stars-group` |
| `emlmmlsi` | HomeHeroOdometer | `.odometer-grid` |
| `o3izd6um` | HomeProjects | `.cases-sec` |
| `t2vorde3` | SanityImage | `.sanity-img-container` |
| `bbyriyvf` | HomeMoreProjects | `.more-projects-sec` |
| `7cdrz2x2` | AboutMe | `.about-me-sec` |
| `tlk6l7dj` | HomeServices | `.services-sec` |
| `goujy4cs` | SnakeModal | `.modal.snake-game-modal` |
| `fn43irff` | Footer | `footer.footer` |
| `z34lt5uk` | FooterMiddle | `.footer-middle` |
| `ttvzoyuy` | FloatingScrollbar (`transition:persist`) | `#floating-scrollbar` |

---

## 3. Component hierarchy (home page)

```
Layout (html[data-theme="theme-1"])
├─ inline script: add html.skip-loader if same-origin referrer or sessionStorage.loaderPlayed
├─ Loader
├─ Navbar  (01 Home · 02 Projects · 03 Contact me · VolumeButton)
├─ HomeHero
│   ├─ .hero-texts  (h1 two word-masks, bio p[data-split])
│   └─ .hero-boxes.main-grid-8  (32 .grid-box tiles; 11 "typed" tiles + filler)
│       SnakeTile(ExpandIcon + logo-snake) · Instagram · StarsGroup×4 · Odometer · Role · LinkedIn · Email · PixelArrow · SpinningStar
├─ HomeProjects #projects  (4 × CaseCard: SanityImage parallax + hover video + title[data-split] + tags)
├─ HomeMoreProjects  (heading + 13 × MoreProjectItem: bg tile, title, tags, thumb(video|SanityImage))
├─ AboutMe [data-theme-change=theme-1]  (h2-tag + paragraph[data-split-scroll])
├─ HomeServices  (.services-wrapper: 4 × 100vw panels)
│   ├─ Panel 1 .service-design: title with inline .slot-1 holding the travelling .transition-box (2 pixel icons)
│   ├─ Panel 2 .service-group-2: .slot-2 target + "Design" + 30-tile grid (7 labelled)
│   ├─ Panel 3 .service-dev: title with inline .slot-3
│   └─ Panel 4 .service-group-4: .slot-4 target + "Development" + 30-tile grid (7 labelled)
├─ SnakeModal (.modal-bg, .modal-close, .modal-contain → astro-island SnakeGame)
├─ Footer [data-theme-change=theme-1]
│   ├─ .footer-top: "Let's work together" + info + .btn-primary "Contact me"
│   ├─ FooterMiddle: outlined + filled name, 30 tiles
│   └─ .footer-bottom: © year, Email/LinkedIn/Instagram, To top, IST clock
└─ FloatingScrollbar (persisted across navigations)
```

---

## 4. Asset inventory

### 4.1 Fonts (Pangram Pangram commercial families) [V-code]
| Family (CSS name) | File | Weight/style | Role (token) |
|---|---|---|---|
| Editorial New | `PPEditorialNew-Ultralight.fq-4W-Eu.woff2` | 200 normal | `--font-display`: h1–h3, nav links, service titles |
| Editorial New | `PPEditorialNew-UltralightItalic.DRFp7sTr.woff2` | 200 italic | `<em>` accents ("ch**a**nd", *intuitive*, *together*) and italic nav/buttons |
| Neue Montreal | `PPNeueMontreal-Regular.978PBIaN.woff2` | 400 | `--font-body` |
| Neue Montreal | `PPNeueMontreal-Book.8gtBOkHq.woff2` | 300 | **Missing from archive.** Available live (29,731 B). Declared but not loaded on home [V-live: `document.fonts` shows no 300] |
| Supply Mono | `PPSupplyMono-Regular.CcDbH3Bk.woff2` | 400 | `--font-mono`: tags, labels, h2-tags, odometer, footer meta |

### 4.2 Icons and SVG [V-code]
- `ico-instagram`, `ico-linkedin`, `ico-email` (48×48, colour; grayscale by CSS), `ico-arrow-pixel` (80×80), `ico-star-small` (20×20, used 16× in StarsGroup), `logo-snake.svg` (500×140 pixel wordmark).
- Inline SVGs:
  - loader logo (two copies: base at 20% opacity, top copy revealed by clip)
  - ExpandIcon (`.path-1/.path-2` animated via CSS `d: path()` on hover)
  - spinning pixel asterisk (`.type-star`)
  - volume icon with `.mute-line` (stroke-dash animation)
  - two 56×56 pixel icons in `.transition-box` (pixel asterisk and pixel `</>`)
  - modal close X
- `.btn-primary` pixel-arrow mask is an inline data-URI in CSS (`Layout.css:319-320`). It is duplicated in `_DataURI/`.
- **Favicon animation:** two inline SVGs in `Layout.astro…js:117-121` swap every 1.5 s.

### 4.3 Images (Sanity CDN) [V-code + V-live]
`SanityImage` renders a container with an **8 px-wide LQIP as `background-image` and `image-rendering: pixelated`**, which gives a deliberately pixelated placeholder. A lazy `<img>` with `srcset` 800/1400/1920w sits on top. Case cards add `data-parallax-img`.

| Use | Asset | In archive? |
|---|---|---|
| Case: Voy | `c772ae…-3000x2400.jpg` | ✅ full (saved as `…-2645c39f11321.jpg`) + 8px LQIP |
| Case: Plutus | `5f6d63…-3000x2400.jpg` | ✅ full + LQIP |
| Case: Happystack | `4ece2e…-3000x2400.jpg` | ✅ full + LQIP |
| Case: Feedback HQ | `050ad4…-3000x2400.jpg` | ✅ full + LQIP |
| Video posters (Voy, Plutus, Happystack, Feedback HQ, Needl, Manual, Perry) | `76fe4c….jpg`, `ffab49….avif`, `a2bb01….avif`, `e6fb6f….webp`, `6fc119….webp`, `298923….webp`, `af6f94….webp` | ✅ |
| More-projects thumbs: Peblo, 4ward, Insightreel, Jamboree, Roobka, Ninedots, Tipple, Martinsen Mayer, Upmostly, Jslytics | `*-1440x960.jpg` | ⚠️ **Only the ~300-byte 8px LQIPs.** The full images were never loaded during capture. Available from the CDN. |
| OG/Twitter image | `74d9af…-1200x630.jpg` | ❌ missing |

### 4.4 Videos [V-code]
| Use | webm | mp4 fallback |
|---|---|---|
| Voy card | `92a13e….webm` ✅ | `10db1f….mp4` ❌ |
| Plutus card | `1e6061….webm` ✅ | `a42dc8….mp4` ❌ |
| Happystack card | `62bd0f….webm` ✅ | `eacc7a….mp4` ❌ |
| Feedback HQ card | `40dedc….webm` ✅ | `cbf7f4….mp4` ❌ |
| Needl (more) | n/a | `0448b3….mp4` ✅ |
| Manual (more) | `947b8b….webm` ✅ | `a89181….mp4` ❌ |
| Perry (more) | `52139….webm` ✅ | `533f21….mp4` ❌ |

Missing mp4 fallbacks matter for older Safari and iOS.

### 4.5 Audio [V-code + V-live]
`sfx.js` registers click, key-press, card-flip, match, error, complete, eat, game-over and level-up.
- **In archive:** `click.wav` and `key-press.wav`.
- **Used on home but missing:** `eat.wav`, `game-over.wav`, `level-up.wav` (Snake). They exist live as distinct real WAVs.
- **Unused on home:** card-flip, match, error, complete (probably another game on another page) [Inferred].

### 4.6 Missing-asset summary (all retrievable)
1. PPNeueMontreal-Book.woff2
2. 3 Snake sounds
3. 10 full-res more-project images
4. 6 mp4 fallbacks
5. OG image
6. Clean (un-mangled) JS bundles: fetched OK into scratch

---

## 5. Styling and design system

### 5.1 Tokens (`Layout.css:1173-1236`, duplicated in every CSS chunk) [V-code]
```
--container-spacing: 2.5rem      (≤1080: 1.5rem, ≤480: 1rem)
--box-size: (100vw − 2·spacing) / 8   (≥2400: /10, ≤1080: /6, ≤768: /4, ≤480: /3)
--nav-height: 6.25rem (≤768: 4.5rem)
--font-s-h1: var(--box-size)      (≤1080: box·2/3, ≤768: box·.7, ≤480: box·2/3)
--font-s-h2: 2.25rem (≤1080: 2rem)
--font-s-mono: .875rem (≤768: .75rem, ≤480: .6875rem)
--br-sm: 4px      --gap-56: 3.5rem
--ease-out: cubic-bezier(.2, 1, .36, 1)   ← used by almost every CSS transition
```

**Three themes.** The *page* re-colours by switching `html[data-theme]`. `body` transitions `background-color` and `color` over .5s with `--ease-out`.

| token | theme-1 (mono) | theme-2 (slate) | theme-3 (oxblood) |
|---|---|---|---|
| primary | #030303 | #2b5164 | #90211d |
| primary-2 | #232323 | #346279 | #90211d |
| white / secondary (bg) | #fff | #efeeeb | #f2ebde |
| box | #fdfdfd | #f6f5f4 | #f9f6f0 |
| border | #00000012 | #2b51641a | #90211d1a |
| border-light | #0000000a | #efeeeb | #f2ebde |

The Snake UI hard-codes theme-2 slate (`#2B5164`).

### 5.2 Grid system
- **`.main-grid-8`:** 8 equal columns with zero gap and `grid-auto-flow: dense`. It becomes 10 / 6 / 4 / 3 columns at the ≥2400 / ≤1080 / ≤768 / ≤480 breakpoints.
- **`.grid-box`:** a square (`aspect-ratio: 1`) with a 1px *inset box-shadow* border (`--color-border-light`) and a `--color-box` fill. This tile is the signature motif across the hero, services and footer. Each section shows only as many tiles as fit its rows at each breakpoint, using `:nth-child(n+X){display:none}`:
  - hero: 32 / 40 / 25 / 18 / 19 tiles
  - services: 24 / 30 / 18 / 20 / 15 tiles
  - footer: 24 / 30 / 18 / 12 tiles
- **Explicit placement:** typed tiles are placed per breakpoint with `grid-area: row/col` (`index.css` hero 469-660, services 1384-1597).
- **Breakpoints:** 2400 (min), 1440, 1280, 1080, 768 and 480 (max). Uses media-range syntax (`width<=1080px`). Touch is detected with `(hover:none) and (pointer:coarse)` and receives the "≤1080" hover-less styles.

### 5.3 Typography scale
- **Hero h1:** Editorial New 200 at `--box-size` (≈170px at 1440), letter-spacing −.03em, line-height 1. It sits absolutely over the tile grid at `top: box·1.1`.
- **Service and footer titles:** 6.75rem (7.5rem at ≥2400). At ≤1440 they become `box·.64`, then `box·.46` (services) or `box·.42` (footer) at ≤768, and `box·.40` at ≤480.
- **h2-tag:** Supply Mono uppercase with `( Label )` styling.
- **Body:** 1rem / 1.4. The about paragraph is 2rem (1.5rem at ≤480).
- **More-projects title (≤1280):** `font-s-h1 · .8`, centred.

### 5.4 Distinctive visual techniques
- **Pixelated LQIP:** an 8px background image with `image-rendering: pixelated`.
- **Masked line reveals:** SplitText `mask: "lines"` creates `.split-line-mask` wrappers. Lines slide from `yPercent: 110`, then the mask `overflow` is set to `visible` (so descenders and italics aren't clipped afterwards).
- **Clip-path reveals:**
  - case thumbs use `inset(0 0 100% 0)` → `0`
  - more-project thumbs clip from the entry direction
  - the loader logo uses `inset(0 100% 0 0)` → `0`
  - the footer fill uses `clip-path: inset(calc(110% − p·1.2) …)`, driven by the `--fill-progress` custom property
- **CSS custom properties animated by GSAP:** `--border-opacity` (hero frame), `--border-scale` (more-project row rules), `--fill-progress` (footer).
- **CSS `d: path()` hover morph** on ExpandIcon (Chromium/Firefox only; static in Safari [Inferred]).
- **Native scrollbar hidden** (`scrollbar-width: none`) and replaced with a custom floating scrollbar.
- **Stacking:** the loader and modal use z-index 100, the navbar is sticky at z 99 and transparent, and the scrollbar sits at z 95. Inside services, `.service-design` is z 20, `.transition-box-outer` z 30 and `.transition-box` z 50, so the box flies over neighbouring panels.

---

## 6. Animation breakdown

### 6.1 Infrastructure
**Lenis + GSAP ticker** (`scrollAnims.js:625-633`):
```js
new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - 2 ** (-10 * t)), smoothWheel: true })
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0)
window.lenis = lenis
```
**Global init** on DOMContentLoaded and on every `astro:page-load`: `initLenis → splitAll([data-split]) → splitScroll([data-split-scroll]) → parallax → ScrollTrigger.sort(); refresh()`. A second `refresh()` runs on `window.load` (`scrollAnims.js:774-779`).

**SplitText line system** (`scrollAnims.js:707-767`):
- `[data-split]` elements are split into lines (`linesClass: split-line`, `mask: lines`) but **not animated by default**. Each component's reveal preset animates them.
- `[data-split-scroll]` elements reveal themselves: they start at `yPercent: 110, autoAlpha: 0`, and at `top 85%` they animate once to 0 (duration .8, stagger .08, `power3.out`).
- Resize handler (debounced 200ms, width changes only): re-splits and preserves the revealed or hidden state (`scrollAnims.js:678-705`).

**Parallax** (`scrollAnims.js:635-673`): `[data-parallax-img]` images are 120% tall and scrub `yPercent: -16.66 → 0` from `top bottom` to `bottom top`. `[data-parallax-speed]` is supported but not used on home.

**Intro delay helper** (`utilities.js:3-15`): returns `3.6` s if the loader will play, otherwise `.05`. The hero and navbar timelines wait on this value.

**Custom ease:** `CustomEase.create("loader", "0.65, 0.01, 0.05, 0.99")`.

### 6.2 Loader (first visit per session only) — `Loader.astro…js:236-319`
Skip conditions: `html.skip-loader` (set by the inline head script if the referrer is same-origin or `sessionStorage.loaderPlayed` exists, and also set on any client-side navigation).

| t (s) | Action | Ease / dur |
|---|---|---|
| 0 → 3.0 | bottom progress bar `scaleX 0→1`; logo top copy `clipPath inset(0 100% 0 0) → 0` (white wipe over a 20% base) | `loader`, 3 |
| 0 → ~0.8 | "Hold tight" chars `yPercent 125→0`, autoAlpha in | .6, stagger .02 |
| ~1.2 | "Hold tight" chars out (`yPercent → −125`) **and** "Hi there!" chars in | .4 out / .6 in |
| 2.5 | "Hi there!" chars out (`hideContent − 0.5`) | .4 |
| 3.0 → 3.5 | container `autoAlpha → 0`; bar `scaleX → 0` from the right | .5 |
| 3.0 → 4.0 | black bg panel `yPercent → −101` (wipes up, revealing the page) | `loader`, 1 |
| 4.0 | loader `display: none` | n/a |

Verified with screenshots at 0.3 / 1.2 / 2.4 / 3.3 / 4.2 / 5.6 s [V-live].

### 6.3 Navbar — `Navbar.astro…js`
Links and the volume button go from `y: −30, autoAlpha: 0` to rest (duration .6, stagger .1, `power3.out`, **delay 3.6**). CSS hides them while `html:not(.skip-loader)`. Links show at opacity .5 and the active one at 1. The volume button toggles mute and plays a click on unmute.

### 6.4 Hero intro — `HomeHero.astro…js`
Timeline delay is 3.6 (or .05), with default ease `power3.out`:
1. `.hero-texts` visibility set to visible.
2. Words `.hero-word`: `yPercent 110→0`, duration .8, stagger .1. At −0.3 the word masks get `overflow: visible`.
3. Bio lines: `yPercent 100→0`, duration .8, stagger .1, starting at −0.5.
4. **Typed tiles** (class contains `type-`) at t=.6: `autoAlpha 0, scale .4 → 1`, `elastic.out(1, 0.75)`, duration 1, `stagger { amount: .5, from: "random" }`. Then `--border-opacity → 1` (.4, `power2.out`).
5. **Plain tiles** at t=1.0 (or .6): `autoAlpha 0→1`, .6.
6. **Desktop only** (≥1081px, non-touch), at t=1.2: social icons tween from colour (`scale 1.15, rotate −5`) to the grayscale resting state (1.2, `clearProps`). This briefly "demos" the hover state.

**Odometer** (`HomeHeroOdometer…js`):
- 4 reels each contain 0–9 three times (30 spans). Each rolls to `yPercent −(10 + digit)·100` with duration `1.6 + i·.3`, delay `introDelay + .6 + i·.08`, `power3.out`.
- Target digits come from build-time `data-target` (renders the year **2026**).
- On `mouseenter` (once the previous roll finishes) each reel rolls another full 10 digits (duration `1.2 + i·.2`). If a reel's index is ≥20 it is first normalised back by 10, so the effect loops infinitely.

**CSS-only hero interactions:**
- StarsGroup: star `opacity .4→1` and `rotate(360deg)` on hover, 0.25s.
- Spinning asterisk: `spin` 10s linear infinite.
- Social tiles: on hover the bg turns `--color-white` and the icon goes grayscale→colour with `scale(1.15) rotate(-5deg)`, 0.4s `--ease-out`.
- Snake tile: on hover the logo fades in and scales `.4→1` while ExpandIcon corner paths morph outward.
- Role tile: vertical rotated mono text.

### 6.5 Case cards — `scrollAnims.js:782-837` + `HomeProjects…js` + CSS
- **Reveal** (once, `top 85%`): thumb `clipPath inset(0 0 100% 0) → inset(0)` (1s, `power3.inOut`). Then title lines (−.35 overlap, .7, stagger .08), then tags `y 15→0` (−.3).
- **Parallax** on the thumb image (see §6.1).
- **Hover** (desktop):
  - `.case-overlay` → opacity 1 (`#00000080`, .2s)
  - the `<video>` (80% width, absolute) goes from `opacity 0, scale(.95) translateY(25%)` to `scale(1) translateY(0)` (.5s `--ease-out`)
  - JS plays the video on `mouseenter` and pauses it on `mouseleave`
- **Touch / ≤768:** overlay and video are always visible and autoplaying [V-live phone captures].
- **Layout:** the 4 cards alternate column spans 3 / 4 / 4 / 3 on the 8-col grid. Even cards end at the last column, with `align-items: end` and a 7.5rem row gap. This produces the staggered "off-grid" look.

### 6.6 More projects — `HomeMoreProjects…js` + `scrollAnims.js:839-890` + CSS
- **Reveal:** each row's top border `--border-scale 0→1` (1s, `power3.inOut`), then title and tag lines (−.6 overlap, .8, stagger .1).
- **Desktop (>1280): directional hover.**
  - On entry the script detects the top or bottom half. The grey `.mp-bg-tile` jumps to `translateY(∓100%)` with `transition: none`, a reflow is forced, and it slides to 0 (.5s `--ease-out`).
  - The thumb (absolute, right-aligned, `box·2` wide) clips in from `inset(0 0 60% 0)` or `inset(60% 0 0 0)` to full (.75s), with `opacity` and `scale .9→1`. The inner media goes from `scale 1.06 → 1`.
  - Leaving reverses toward the exit side. An `is-leaving` class (750ms) keeps the leaving row above its siblings.
  - Videos play and pause with hover.
- **≤1280: scroll-driven focus list.** The rows become a centred column. On scroll (rAF-throttled, Lenis-direction aware) the item nearest a focal line becomes `.is-active`. The focal line sits at 64% of the viewport scrolling down and 36% scrolling up, with 80px hysteresis and a section margin of ±12% vh.
  - Active row: title `scale .6→1`, `opacity .4→1`.
  - Thumb wrapper expands via `grid-template-rows 0fr→1fr` (.8s `cubic-bezier(.16, 1, .3, 1)`) and the thumb clips in from the scroll direction.
  - Clicking a row smooth-scrolls it to centre (Lenis, .8s).

### 6.7 About
A `[data-split-scroll]` paragraph uses the generic line reveal (§6.1). The real text is held in an `aria-label`; the visible span is `aria-hidden`.

### 6.8 Services (the centrepiece) — `HomeServices…js`
Built with `gsap.matchMedia()`. **Desktop (≥769px):**
- **Pin:** `.services-sec` pins `top top` for `(wrapper.scrollWidth − innerWidth) · 1.16` px with `scrub: 1`, `anticipatePin: 1` and `refreshPriority: 1`. At 1440 this is 4320 · 1.16 = **5011 px** of scroll [V-live: wrapper travelled exactly −4320].
- **Wrapper track** (keyframes, normalised timeline length 1.0, ease `none`). `m` = 4320 at 1440:

| progress | x |
|---|---|
| 0 → .30 | 0 → −m/3 |
| .30 → .38 | hold |
| .38 → .65 | → −2m/3 |
| .65 → .92 | → −m |
| .92 → 1.0 | hold |

- **Travelling `.transition-box`.** A white square starts inline in the panel-1 title (slot-1). Slot offsets d2/d3/d4 are measured against slot-1 with the wrapper's x temporarily zeroed, and re-measured on every refresh.
  - .04–.30: x → d2, rotate 180°, y arcs **up** 180px (`power1.out`) then down to d2.y (`power1.in`). Scales to 0 at .26–.30, so it drops into slot-2.
  - **.30:** `call()` plays the panel-2 grid "pop" once. Tiles go `opacity 0, scale .4 → 1`, `elastic.out(1, .75)`, 1.2s, stagger = distance from grid centre / max · .5 (**radial stagger from centre**).
  - .38: scales back to 1. .38–.65: x → d3 (slot-3 inline in panel-3 title), rotate 360°, y arcs **down** +160px.
  - .65–.92: x → d4, rotate 540°, arcs up 180px. Scales to 0 at .88–.92. **.92:** the panel-4 grid pop plays.
- **Theme and icon:** `onUpdate` sets `theme-2` while progress < .5, otherwise `theme-3`. It swaps `.transition-icon-1` (pixel asterisk) and `.transition-icon-2` (pixel `</>`) via a `.hide` class (CSS .4s scale/opacity). `onLeaveBack` returns to `theme-1`.

**Mobile (≤768px):** no pin and no horizontal track. Panels stack vertically, each 100vh. The same box travels with a scrubbed timeline over the whole section (`top top → bottom bottom`), swinging sideways by `min(28vw, 140px)` while moving down to each slot. Grid pops fire from the timeline or from `center center` triggers. `.service-design` at `top 60%` switches to theme-2.

### 6.9 Footer
- **Footer top** (`scrollAnims.js:892-952`): h2 lines (.8, stagger .1), then info lines (−.5, stagger .05), then the button `y 20→0` (−.6).
- **Footer middle** (`FooterMiddle…js`): the footer pins at `bottom bottom` for **700px** (`scrub: true`). It scrubs `--fill-progress 0%→100%`, so the solid name wipes **up** over its 40%-opacity 1px-stroke twin (`-webkit-text-stroke`).
  - On case pages (`data-next-url`) reaching 99% calls Astro `navigate(nextUrl)`, an infinite "next project" flow, and `.footer-keep-scrolling` fades in with blur. **Neither is present on home.**
- **Clock:** `IST - HH:MM:SS` using `Intl.DateTimeFormat('en-GB', {timeZone: 'Asia/Kolkata'})`, updated every 1s. **To top:** `window.scrollTo({behavior: smooth})`.
- **`.btn-primary` hover:** the pixel-arrow pseudo-element swaps sides. `:before` blurs, rotates 90° and fades; `:after` un-blurs and rotates in on the right, while padding shifts (.4s `--ease-out`).

### 6.10 Theme controller — `themeController.js`
Each `[data-theme-change]` element (AboutMe and Footer use `theme-1`) gets a ScrollTrigger (`top 50%` → `bottom 50%`) that sets `html[data-theme]` on enter and on enter-back. This works together with the services `onUpdate`. Verified sequence across the page: theme-1 → theme-2 → theme-3 → theme-1 [V-live].

### 6.11 Modal and Snake — `Layout.astro…js:11-111` + `SnakeGame.js`
- **Open** (a `[data-modal-open="snake-game"]` tile click): the timeline runs `.modal-bg` height 0→100% (.35, `power3.out`; bg `#fffc` + `backdrop-filter: blur(32px)`), then `.modal-contain` `opacity 0, y 36, scale .97 → rest` (.45 @ .2), then the close X `scale .7, rotate −45 → 0` (`back.out(1.7)` @ .35).
- **Close** (X, bg click or Esc): the same timeline reverses at 1.5× speed.
- A `snake-modal-change` CustomEvent mounts and unmounts the React game, so the game only exists while the modal is open.
- **Game:**
  - Canvas with DPR scaling. Cell size is 20px (16px under 480px viewport). The grid size is computed from the container via ResizeObserver.
  - Faint grid lines (`rgba(43,81,100,.02)`). The snake is drawn as `#2B5164` squares and the food as a circle.
  - Speed tiers by score: 120 / 100 / 80 / 65 / 50 / 35 ms at 0 / 10 / 20 / 40 / 80 / 120.
  - Controls: arrows or WASD to steer, Space to start, on-screen D-pad (with active flash).
  - States: idle (logo + START GAME) → playing (score bar + D-pad + restart) → gameover (score card + RESTART). Sounds: eat, level-up, game-over and key-press.

### 6.12 SFX — `sfx.js`
- **Engine:** a lazily created AudioContext that resumes on the first pointer, key or touch. Click and key-press are preloaded on idle; others are fetched on demand.
- **Global click delegation:** any `a`, `button`, `[role=button]` or `[data-sfx]` click plays `click` (vol .6, pitch randomised ±4%). Clicks with `e.detail === 0` (keyboard) are ignored.
- **Global keydown** on a focused interactive element plays `key-press` (.25, throttle 50ms). `[data-sfx-hover]` is supported but unused on home.
- **Mute:** persisted in `localStorage.sfx_muted` and exposed as `window.sfx`.

### 6.13 Page transitions — `pageTransitions.js` + ClientRouter
- `history.scrollRestoration = 'manual'`. Same-page hash and Home-link clicks are intercepted and scrolled with Lenis.
- **Case-card click:** records the thumb's rect and radius, adds `html.is-flipping` (which disables root view-transition animations) and stops Lenis. After the swap, `.hero-case-image` on the new page is FLIP-animated from the card rect (1.1s, `power3.inOut`).
- **Video autoplay rescue:** IntersectionObserver plus first-interaction listeners call `play()` on autoplay videos.
- **Router lifecycle:** all ScrollTriggers are killed on `astro:before-swap`, and `skip-loader` is propagated to the new document.
- **Only half of this is observable on home.** The receiving `.hero-case-image` lives on the case pages, which are not in the archive.

### 6.14 Floating scrollbar (inline, `index.html:922-929`)
- Fixed at the right edge: a 4px track, 150px tall, with a 36px thumb positioned from `lenis.scroll / lenis.limit`.
- Shows on scroll or when the mouse is within 100px of the right edge, and hides 1.1s after.
- Track click → `lenis.scrollTo(…, {duration: .9})`. Thumb drag uses pointer capture with `lenis.scrollTo(…, {immediate: true})`.
- Hidden at ≤768px and on touch. It survives navigation via `transition:persist`.

### 6.15 Animated favicon — `Layout.astro…js:117-144`
Toggles the favicon between the pixel-asterisk and pixel-code SVGs every 1.5s. It pauses when the tab is hidden and is disabled under `prefers-reduced-motion`.

### 6.16 Reduced motion (observation)
Only CSS transitions and animations and the favicon respect `prefers-reduced-motion`. **None of the GSAP timelines check it.** The replica should match this unless you want to improve it.

---

## 7. Section-by-section summary (desktop 1440×900 measurements [V-live])

| # | Section | Top / height | Theme | Key behaviour |
|---|---|---|---|---|
| 0 | Loader | fixed overlay | n/a | 4s intro, once per session |
| 1 | Navbar | sticky, 100px tall, transparent | follows theme | staggered drop-in |
| 2 | Hero | 100 / 680 (4 tile rows) | 1 | name over tile grid, elastic tile pop, odometer |
| 3 | Cases | 780 / 1495 | 1 | clip reveal, parallax, hover video |
| 4 | More projects | 2275 / 1485 | 1 | directional hover rows / mobile focus list |
| 5 | About | 3760 / 598 | 1 | scroll line reveal |
| 6 | Services | 4358 / 900, pinned for 5011px | 2 → 3 | horizontal track, flying box, radial grid pops |
| 7 | Footer | 10269 / 1186 (+700 pin) | 1 | reveal, text-fill pin, IST clock |

Total scroll limit is 11,255px at 1440×900 (9,919 at 1024, 10,133 at 768, 9,067 at 390).

---

## 8. Interaction map

| Interaction | Element | Code |
|---|---|---|
| Wheel/touch scroll (smoothed) | page | Lenis, `scrollAnims.js:625` |
| Hover social tile | `.social-box` | CSS `index.css` hero |
| Hover/click Snake tile → modal | `[data-modal-open=snake-game]` | `Layout.astro…js:83-110` |
| Hover odometer → re-roll | `.type-odometer` | `HomeHeroOdometer…js` |
| Hover stars | `.star-box` | CSS |
| Hover case card → overlay + video | `.case-card` | CSS + `HomeProjects…js` |
| Click case card → FLIP transition | `.case-card` | `pageTransitions.js` |
| Hover more-project row (desktop) | `.more-project-item` | `HomeMoreProjects…js:24-56` |
| Scroll focus / click row (≤1280) | `.more-project-item` | `HomeMoreProjects…js:58-130` |
| Hover btn-primary | `.btn-primary` | CSS |
| Click "To top" | `.btn-to-top` | `Footer.astro…js` |
| Click/drag custom scrollbar | `#floating-scrollbar` | inline script |
| Mute toggle (click/Enter/Space) | `.btn-volume` | `Navbar.astro…js` + `sfx.js` |
| Any link/button click → click SFX | global | `sfx.js:h()` |
| Esc → close modal | window | `Layout.astro…js:103-108` |
| Snake: arrows/WASD/Space/D-pad | modal | `SnakeGame.js` |
| Nav "Projects" → smooth scroll to `#projects` | `.nav__link` | `pageTransitions.js` |
| Link hover → prefetch | all internal links | ClientRouter `prefetchAll` |

---

## 9. Dependency and runtime requirements

**To run the original as-is (static mirror):**
- Any static server serving the folder at the domain root (paths are root-absolute `/_astro/...`).
- **Replace the 18 mangled bundles with the originals** (already downloaded to scratch).
- Either the network (Sanity CDN for the 10 thumbnails, mp4s and OG image) or localised copies of those files.
- The 3 missing sounds and the Book font.
- **`file://` will not work:** ES modules and root-absolute paths need a server.

**To rebuild the source (recommended):**
- Node 22 (installed: v22.14.0)
- Astro 5 with `@astrojs/react`
- `react` / `react-dom` 19.2.x
- `gsap@3.15.0` (core, ScrollTrigger, SplitText and CustomEase are all in the free public npm package since 3.13)
- `lenis@1.3.25`
- Optional: `@sanity/client` + `@sanity/image-url`. The proposal is a local JSON content file instead; see the decisions.

**External runtime services:** Sanity CDN (images and video), Netlify (hosting, likely forms on `/contact`). No analytics or third-party scripts were found on the home page [V-code].

---

## 10. Replication strategy (proposed)

**Approach:** rebuild as a clean **Astro 5 project** that mirrors the original component boundaries (§2 cid table), with de-minified, readable versions of each script. Keep every timing, ease, threshold and breakpoint value from the original. Use the downloaded originals as the source of truth for logic, and the archive CSS (de-scoped) for styles.

```
src/
  layouts/Layout.astro            tokens, fonts, ClientRouter, global scripts, FloatingScrollbar, favicon anim
  components/
    Loader.astro  Navbar.astro  VolumeIcon.astro
    home/HomeHero.astro  HomeHeroOdometer.astro  StarsGroup.astro  ExpandIcon.astro
    home/HomeProjects.astro  CaseCard.astro
    home/HomeMoreProjects.astro  AboutMe.astro  HomeServices.astro
    SanityImage.astro (→ "LqipImage")  Modal.astro  SnakeGame.jsx
    Footer.astro  FooterMiddle.astro  FloatingScrollbar.astro
  scripts/  scrollAnims.ts  lenis.ts  sfx.ts  themeController.ts  pageTransitions.ts  utilities.ts  modal.ts
  data/home.json                  projects, more-projects, services, socials (extracted from index.html)
  styles/global.css               tokens + reset + grid + btn-primary
public/
  fonts/  sfx/  media/            all assets localised (archive + fetched missing ones)
```

**Implementation sequence (most structural and visual first):**
1. **Scaffold and foundation:** Astro + React, pinned deps, fonts, tokens, reset, `.main-grid-8` / `.grid-box`, Layout, Navbar (static).
2. **Asset localisation:** copy archive assets, fetch the missing ones (§4.6), build `home.json`.
3. **Static sections with exact CSS** at all breakpoints: Hero tiles → Cases → More projects → About → Services (static horizontal layout) → Footer. Checkpoint: screenshot-compare against the live site at 1440 / 1024 / 768 / 390 with motion disabled.
4. **Motion infrastructure:** Lenis ↔ ScrollTrigger ticker bridge, SplitText line system, parallax, theme controller.
5. **Loader, hero intro, navbar intro and odometer** (with the 3.6s choreography).
6. **Case cards** (reveal, parallax, hover video) and **more projects** (directional hover plus the ≤1280 focus list).
7. **Services pinned scene:** track keyframes, slot measurement, flying box, radial grid pops, theme and icon switching, mobile variant. This is the highest-risk item.
8. **Footer** reveal, pinned text fill and clock. Then the floating scrollbar and animated favicon.
9. **SFX engine and mute**, then the **modal and the Snake React island**.
10. **ClientRouter and page-transition plumbing:** only meaningful if other pages are in scope.
11. **Verification pass** (§12) using the same Playwright script against both sites.

---

## 11. Potential challenges and uncertainties

| # | Challenge | Mitigation |
|---|---|---|
| 1 | Archive JS is syntactically broken | Use the live originals (downloaded, all parse) as the logic reference |
| 2 | No original source; component split is inferred | The cid map and script filenames give high-confidence boundaries |
| 3 | Services timeline depends on precise slot measurement after fonts load | Measure in `onRefresh`, refresh after `document.fonts.ready` and `load` (as the original does), and keep `refreshPriority: 1` |
| 4 | ScrollTrigger ordering: services pin (5011px) and footer pin (700px) shift everything below | Keep creation order and `ScrollTrigger.sort()` + `refresh()` exactly as the original |
| 5 | Elastic tile pops and the "random" stagger are non-deterministic | Acceptable; it is random in the original too |
| 6 | Webm-only case videos (mp4 fallbacks missing) | Fetch the mp4s |
| 7 | CSS `d: path()` hover morph is unsupported in Safari | Same as the original; optional SMIL/JS fallback |
| 8 | Sanity CDN dependency / content rights | Localise media; see the decisions |
| 9 | Pangram Pangram fonts are commercially licensed | See the decisions |
| 10 | Live-only pages (`/contact`, `/about`, 4 case studies) aren't in the archive | Would need a separate capture and analysis pass if they are in scope |
| 11 | Sound behaviour and the FLIP case transition are **unverified live** (headless capture has no audio, and only stills were taken) | Verify interactively during the build |
| 12 | Motion "feel" (scrub smoothing, Lenis inertia) was verified only through stills and scroll-position probes, not video | Compare side by side, recording both sites during verification |

---

## 12. Verification checklist

**Layout and visual (at 1440, 1024, 768 and 390 px):**
- [ ] Tile grid column count, tile size (`--box-size`) and 1px inset borders match
- [ ] Hero: name size and position, bio position, typed-tile placement and hidden tiles per breakpoint
- [ ] Case-card spans 3/4/4/3, bottom alignment, row gaps, tag separators
- [ ] More-projects row grid (3fr/5fr), thumb size `box·2`, ≤1280 centred list
- [ ] Services panels 100vw×100vh; slot positions; tile placements per breakpoint
- [ ] Footer typography, 3-row tile band, outlined name, bottom meta grid
- [ ] All three theme palettes and the .5s body colour transition
- [ ] Fonts: Editorial New 200 normal and italic, Neue Montreal 400, Supply Mono 400

**Motion and timing:**
- [ ] Loader: 3s bar and logo wipe, text swap at ~1.2s, panel wipes up 3.0–4.0s, shown once per session, skipped on internal navigation
- [ ] Hero words and tiles start at 3.6s; elastic random tile pop; icon colour-to-grayscale demo (desktop)
- [ ] Odometer rolls to the current build year, re-rolls on hover
- [ ] SplitText line reveals at `top 85%` with masks released afterwards
- [ ] Case clip reveal, parallax travel (−16.66% → 0), hover video slide-up
- [ ] More projects: directional entry and exit; ≤1280 focal-line activation and expansion
- [ ] Services: pinned for (scrollWidth − vw)·1.16; holds at .30–.38 and .92–1.0; box arcs and rotations; grids pop radially at .30 and .92; theme-2 → theme-3 at 50%; icon swap
- [ ] Footer pin of 700px with upward text fill; IST clock ticking
- [ ] Lenis feel (duration 1.2, expo-out easing); custom scrollbar show, hide and drag

**Interactions:**
- [ ] Modal open/close choreography; Esc, background and X all close it
- [ ] Snake: sizing, speed tiers, controls, D-pad, sounds, states
- [ ] Click and key SFX, mute persistence across reloads
- [ ] Animated favicon
- [ ] Nav "Projects" smooth-scrolls; prefetch on hover

**Automated:** reuse the Playwright capture script (scroll sweep plus theme and `services-wrapper` transform probes). The replica should produce the same theme sequence and wrapper x values at the same scroll offsets (±1%).
