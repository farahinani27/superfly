# SUPERFLY — home page revamp (concept)

A standalone concept rebuild of the superflymotos.com.my home page.
**Nothing here touches the live Unicart store.** The live site was read only,
to pull brand colours, product photography and copy.

## Run it

```bash
python3 -m http.server 8770 --directory .
```

Then open <http://localhost:8770>. There is no build step.

From the Durian Bikers repo this is also wired as a named dev server:
`preview_start { name: "superfly-revamp" }`.

## The idea

SUPERFLY's real differentiator — parts developed at Sepang, validated by Grand
Prix riders — is invisible on the current template. So the design language is
**telemetry and CNC drawings** rather than generic dark ecommerce: suspension
traces, damping curves, blueprint schematics, a circuit map.

Brand colours were sampled from the live site: `#FF19AB` magenta on near-black,
with `#29ABE2` T-Blue picked up from the Project RA colourway.

## Sections

| # | Section | What it does |
|---|---------|--------------|
| 1 | Hero | Circuit trace draws itself, running lap dot, live suspension-travel telemetry strip, per-character title reveal, pointer-parallax product |
| 2 | Teardown | Three.js product stage — orbit, 6 spec hotspots anchored in 3D, live rebound dial driving a damping curve + spring compression, 3 colourways |
| 3 | Arsenal | Pinned horizontal scroller, six product lines, each with a self-drawing blueprint schematic |
| 4 | Find your fit | Pick a bike → silhouette morphs, hotspot pins light up on the parts that fit |
| 5 | Sepang | Circuit map with annotated corner markers, counters |
| 6 | Racing | Alonso Lopez (Moto2) / Ivan Ortola (Moto3), parallax |

## The 3D stage

`js/teardown.js`. The scene, camera, lighting, hex platter, rings, floor grid
and **all six hotspot anchors** are real 3D. The product itself is a
camera-facing textured plane — a photographic stand-in, as agreed, until a
scanned model exists.

**To drop in a real model:** replace the `PlaneGeometry` + `TextureLoader`
block (marked `product (swap this for a .glb)`) with a `GLTFLoader` call. The
hotspot anchors are plain `Object3D`s parented to the `product` group at
normalised positions — re-point their `at:` coordinates at the mesh and
everything else (projection, camera easing, panel binding) keeps working.

The yaw-billboard (`product.rotation.y = az`) exists only to keep the flat
stand-in facing the lens. **Delete that line when a real mesh goes in.**

## Assets

`assets/products/shock-*.png` are cut out from SUPERFLY's own Project RA studio
photography. `shock-black.png` is the real Midnight Black product shot;
`shock-tblue.png` and `shock-nardo.png` are **luminance-ramped colour studies**,
not photographs of those finishes — replace them with real shots before this
goes anywhere public.

Rider images are cropped from the site's own "proudly sponsors" banner.

## Things that are invented and need checking

- **Fitment data** for sport rims, brake pump, brake disc, quickshifter and
  bodykit is indicative only. Every invented value carries a `†` and the section
  footnote says so. The Project RA fitment (Little Boy / Fat Man sizes) is real,
  taken from SUPERFLY's own product sheet.
- **The Sepang map is stylised** — 15 corners and 5.543 km are correct, the
  geometry is drawn for legibility, not surveyed.
- **Corner annotations** (what T1/T9/T15 each test) are plausible engineering
  reasoning, not something SUPERFLY has published.
- **Arsenal spec chips** beyond the Project RA are illustrative.

## Regenerating the Arsenal schematics

`partials/arsenal.html` is **generated**, not hand-written — 364 SVG paths come
out of `tools/arsenal-schematics.py` (stdlib only, runs from any directory).
Verified to reproduce the committed partial byte-for-byte.

```bash
python3 tools/arsenal-schematics.py
```

Edit the generator, not the partial.

## Dev helper

`./bump.sh` rewrites the `?v=` query on every local css/js reference so the
browser cannot serve a stale file. Run it after editing and reload.

## Known limits

- GSAP SplitText is a paid plugin, so character splitting is hand-rolled in
  `js/main.js` (`splitChars`).
- Three.js is pinned to r147 — the last version shipping a UMD build, which
  keeps this a no-build project.
- Everything honours `prefers-reduced-motion`. GSAP writes inline styles, so
  the CSS guard in `tokens.css` cannot reach tween durations — every tween
  length therefore goes through a `D()` helper that returns 0 when the
  preference is set. The check is read live rather than snapshotted at load, so
  changing the OS setting mid-session takes effect. Verified at runtime: the
  Arsenal drops from 7 ScrollTriggers to 0 with all 364 paths fully drawn and no
  pinning; the teardown drops auto-rotate and the compression bounce.

- The `RM358` chip in the Arsenal is a literal. In a WordPress build it must
  come from `wc_price()` / `get_price_html()` instead.
