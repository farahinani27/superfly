---
name: svg-schematic-sections
description: Gotchas for self-drawing inline-SVG artwork and GSAP pinned horizontal scrollers — the traps that cost real time, and the checker that catches them
metadata:
  type: project
---

Lessons from building the SUPERFLY "Arsenal" pinned horizontal scroller with
six self-drawing SVG blueprints. These are not visible in the finished code.

**Why:** eyeballing screenshots missed 16 label collisions and out-of-bounds
callouts across six drawings; a 30-line geometric checker found all of them in
one pass. And two of the bugs below each burned a full render cycle.

**How to apply:**

- **Validate SVG artwork geometrically, not visually.** Estimate each `<text>`
  box from character count (JetBrains Mono ≈ 0.6em advance + letter-spacing),
  honour `text-anchor`, then report box overlaps, anything outside the viewBox,
  and anything below a reserved band. Also parse every `d` attribute against the
  path grammar (command + argument-count) — a `%s` count mismatch in a generator
  produces a silently malformed path, not an error.
- **Text inside a viewBox scales with the drawing.** To keep callouts near 10px
  on screen you must counter-size `font-size` per breakpoint. There is a hard
  ceiling: past it, long callouts run off the right edge of the artwork, because
  the drawing is fixed and only the type grows. For a 620-unit viewBox with
  ~20-character callouts the ceiling was 15px. Find the ceiling by running the
  checker at the candidate size, not by looking.
- **Reserve a title block.** A ruled strip across the bottom of every schematic
  (part code left, sheet number right) both looks authentically like an
  engineering drawing and gives the checker a hard "nothing below this y" line
  that stops artwork colliding with the caption.
- **ScrollTrigger `containerAnimation`: the first panel never fires.** Its start
  maps onto the pin's own start boundary, so the panel sits at its trigger point
  and stays in the "from" state — panel 1 renders blank. Give the first panel an
  ordinary vertical trigger instead (it then draws as the section scrolls up
  into view, which is better UX anyway).
- **Draw animation:** `getTotalLength()` works on path, circle, ellipse, line,
  polyline, polygon and rect, so all of them can use the stroke-dasharray /
  stroke-dashoffset trick. Guard for a 0 length (unmeasurable / not rendered)
  and fade those in instead. Put `vector-effect:non-scaling-stroke` on the
  strokes so hairlines stay hairlines at any scale — dash values stay in user
  units and are unaffected.
- **Leave the artwork visible by default.** Arm the dash offsets from JS inside
  the gsap.matchMedia context, never from CSS, so a page without JS (or with
  reduced motion) still shows a finished drawing, and `mm.revert()` restores it.

Related: [[superfly-revamp]], [[previewing-ui-locally]]
