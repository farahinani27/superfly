---
name: superfly-revamp
description: The SUPERFLY home-page revamp prototype lives in a separate repo from durianbikers, is built section-by-section by parallel agents, and its Arsenal partial is machine-generated
metadata:
  type: project
---

SUPERFLY (superflymotos.com.my) has a static home-page revamp prototype at
`/Users/superfly2026/sites/superfly-revamp/` — a plain HTML/CSS/JS concept, no
WordPress, no build step. Separate from the durianbikers repo.

**Why:** the owner runs two companies and commissions SUPERFLY design work as a
throwaway prototype before any of it reaches a real theme. Several agents build
different sections of the same page in parallel, so conventions are shared and
collisions are real.

**How to apply:**

- The section contract is fixed. One section = three files:
  `partials/<name>.html` (bare `<section id="name">`, no script/link/style),
  `css/<name>.css`, `js/<name>.js` exposing exactly one global
  `window.init<Name>()` that does nothing on load. `js/main.js` fetches each
  partial into `<div data-slot="name">` in `index.html` and then calls the
  init functions. GSAP + ScrollTrigger are loaded and registered by the page.
- `css/tokens.css` is the shared design system (`--sf-*` vars, `.sf-eyebrow`,
  `.sf-h2`, `.sf-lede`, `.sf-section`, `.sf-wrap`, `.sf-chip`). Do not redefine
  tokens or restyle primitives — scope everything under your own section id.
  `main.css` holds the global reset, so repeat `box-sizing:border-box` inside
  your own scope rather than inheriting it by luck.
- **`partials/arsenal.html` is generated, not hand-written.** Its ~360 SVG
  paths come out of `tools/arsenal-schematics.py` (stdlib only, no build step,
  run it from anywhere — it derives the output path from its own location and
  emits the whole partial). Edit the generator and re-run it; do not hand-edit
  the path data. `css/arsenal.css` and `js/arsenal.js` are hand-written, and
  the `.ars-draw` / `.ars-fade` / `.ars-in` class names are a contract between
  the generator and the JS.
- `assets/products/p-1..p-4.jpg` and `cat-1..3.jpg` are NOT product photos —
  they are marketing banners with headline text already burnt in ("DEALERS IN
  MALAYSIA", "WHEELS", "BRAKE SYSTEM"). Dropping them into a section gives you
  a second competing headline. `shock-studio.png` is the only usable cut-out,
  and it still has opaque studio-grey down its left edge and along the bottom
  (crop to x 70–500, y 0–1105 of 675×1164).

Related: [[previewing-ui-locally]], [[svg-schematic-sections]]
