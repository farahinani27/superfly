---
name: morphing-svg-silhouettes
description: How to author several SVG shapes that GSAP can tween into each other via attr d, and how to verify the tween will actually work before shipping
metadata:
  type: project
---

GSAP's attr plugin can tween a `d` attribute between two paths, but ONLY if the
two strings are structurally identical: same command letters in the same order
AND the same count of numbers. Otherwise GSAP snaps instead of morphing, with no
error. Built for the SUPERFLY "Find your fit" fitment finder, which morphs
between underbone / scooter / adventure-scooter silhouettes.

**Why:** hand-authoring three different shapes with matching command counts is
fiddly and fails silently, so the structure has to be guaranteed by
construction rather than checked afterwards.

**How to apply:**

- Generate each shape as a **closed Catmull-Rom through exactly N anchor
  points** (stdlib Python, no build step — the prototype has none). That always
  emits `M` + N cubics + `Z`, so equal N across variants guarantees equal
  command counts. 34 points was enough for a recognisable motorcycle.
- To get sharp corners without changing the command count, scale the **tangent
  per point** (0 = hard corner, 1 = smooth). Control-point values change,
  structure does not.
- Verify by **blanking the numbers**: `re.sub(r'-?\d*\.?\d+', '#', d)`. If the
  signatures of all variants are byte-identical, the tween will work. Do this in
  the generator AND again in the JS at init — the JS check decides between
  morphing and a crossfade fallback, and warns to the console.
- Keep this check per shape *family*. The finder has three families (body,
  exhaust, fender) each internally matched; they do not need to match each other.

Do NOT fold wheels, fork, swingarm, shock, exhaust or fender into the single
outline — see [[vehicle-silhouette-accuracy]] for why that wrecks the drawing.
Those parts are plain `<circle>`/`<line>`/short `<path>` elements whose numeric
attributes are driven from one tweened state object via `onUpdate`, which is
simpler than many attr tweens and keeps them in sync.

Two verification notes that mattered:

- A test suite can pass while the thing is visibly wrong. 43 DOM assertions were
  green while every hotspot pin rendered dimmed, because
  `classList.toggle(name, undefined)` **toggles** instead of forcing — and
  `!fit || fit.inactive` yields `undefined`, not `false`, for the healthy case.
  Assert the *computed style* of a rendered node, not just class/JS state.
- Spokes drawn once at unit radius 100 in `<defs>` and placed with
  `transform="translate(cx,cy) scale(r/100)"` rescale with the wheel for free.

Related: [[superfly-revamp]], [[svg-schematic-sections]], [[previewing-ui-locally]]
