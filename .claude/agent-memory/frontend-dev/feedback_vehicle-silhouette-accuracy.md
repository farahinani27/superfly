---
name: vehicle-silhouette-accuracy
description: Draw bike artwork from real engineering dimensions, not by eye — this audience spots wrong proportions instantly
metadata:
  type: feedback
---

When drawing motorcycles/scooters for SUPERFLY or Durian Bikers, lay the shape
out from **real dimensions** (wheelbase, wheel outside diameter, seat height,
overall length, rake) scaled to the canvas. Do not sketch it by eye.

**Why:** two rounds of the "Find your fit" silhouettes were rejected — they read
as "a generic bicycle / dirt bike", and the note back was that *SUPERFLY's
customers will spot it instantly*. These are people who buy parts for a specific
kapchai; the drawing is a fitment aid, so a wrong profile undermines the whole
section. The three concrete faults were:

1. **Headstock placed far behind the front axle.** With the steering head ~170px
   above the axle, a realistic ~26° rake puts it only ~70px behind it. I had it
   190px behind, which turns the fork into a long diagonal strut — the single
   biggest reason it read as a bicycle.
2. **A union-of-everything closed outline.** Tracing wheels + body as one loop
   fills the open triangle under the seat and welds the wheels into a slug. The
   outline must dive up into the under-seat notch and arc back *over* the rear
   wheel, so the wheel stays visible beneath the tail.
3. **No front fender.** Without it the front wheel looks detached from the
   bodywork, whatever else you fix.

A second review round rejected three more things, all of the same kind —
"this still reads as a bicycle":

4. **Wheels too big and tyres hairline-thin.** A kapchai wheel must read as a
   17" rim inside a chunky tyre, not a 700c road wheel. Draw each wheel as
   THREE circles: tyre outer, tyre inner (a real gap between them = the
   carcass), then a smaller rim. Keep axle y = groundline − tyre radius so the
   wheel still sits on the ground when you resize it.
5. **A thin diagonal strut from the rear hub up to the seat reads as a
   chainstay/seatstay.** A kapchai has a swingarm, not a rear triangle: one
   stout filled arm from the pivot straight back to the axle. On scooters the
   same element becomes a single solid engine/CVT mass low at the rear.
6. **The rear shock must be drawn as an actual coil-over** — SUPERFLY's
   flagship product is a shock absorber, so a pin floating over empty space is
   the worst possible defect in this section. Two parallel lines for the damper
   body, a zigzag spring over the upper half, an eye at each end, ~60–70° from
   horizontal. Draw it brightest of anything on the bike.

**How to apply:**

- Draw wheels as separate open circles, and fork / swingarm / shock / exhaust /
  front fender as their own elements. Only the bodywork is the big closed path.
  See [[morphing-svg-silhouettes]] for keeping them all tweenable.
- Derive the shock procedurally from its two mounting points (unit vector +
  normal) rather than storing a path per bike — then the coil, rails and eyes
  can never drift out of sync with the tween, and a hotspot pin placed at the
  shock's midpoint is provably on it (assert point-to-segment distance, not
  eyeball it).
- Type-specific cues the owner asked for by name: underbone = low and long, a
  step-through backbone that dips sharply between the legs, no tall tank,
  upswept exhaust, rear shock angled ~60°, low bars behind a small flyscreen.
  Scooter = flat open footboard, tall front apron with the headlight in it,
  bulky rear body enclosing the CVT, wide flat bar, 13–14" fat tyres. ADV
  scooter = the same but taller, raised beak-style front mudguard, tall screen,
  more ground clearance.
- Keep the screen a small fin on top of a blunt handlebar cowl. Letting the
  screen be the tallest point of a tapering front section produces a "shark fin"
  that reads as nothing.
- Render a PNG and actually look at it after every geometry change; this took
  several passes and each one was obvious on sight and invisible in the numbers.

Related: [[morphing-svg-silhouettes]], [[previewing-ui-locally]]
