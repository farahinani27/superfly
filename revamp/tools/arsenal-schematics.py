#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SUPERFLY revamp - generator for "THE ARSENAL" section.

WHAT IT EMITS
    The COMPLETE partial: partials/arsenal.html, start to finish. That is the
    intro block, the pinned stage and its head bar, and all six product panels
    with their copy, spec chips and inline SVG schematics. It is not a helper
    that emits SVG fragments for pasting - it writes the whole file.

    partials/arsenal.html is OUTPUT. Regenerate it; do not hand-edit it. It
    holds ~360 SVG paths whose coordinates are computed here (rim spokes, coil
    helix, wavy rotor edge, drill-hole rings, 45-degree section hatching,
    dimension lines with arrowheads), and hand-editing that path data is how
    you silently break a drawing.

HOW TO RUN
    From anywhere - the output path is derived from this file's location:

        python3 tools/arsenal-schematics.py          (macOS / Linux, zsh)
        python tools\arsenal-schematics.py           (Windows, PowerShell)

    No dependencies beyond the Python 3 standard library. No build step.
    It overwrites partials/arsenal.html in place; re-run it after any change
    and check the diff.

WHAT IT DOES NOT TOUCH
    css/arsenal.css and js/arsenal.js are hand-written and are not generated.
    The class contract between them and this file is load-bearing:
      .ars-draw   geometry the JS animates via stroke-dasharray/dashoffset
                  (must stay a path/circle/ellipse/line/polyline/polygon/rect,
                  so getTotalLength() works)
      .ars-fade   labels, dashed construction lines, fills - faded in, not drawn
      .ars-in     copy elements the JS slides in
    Renaming any of those here means renaming them in js/arsenal.js too.

LAYOUT RULES BAKED IN
    Every schematic uses a 620 x 460 viewBox and reserves the band below
    y = TB_RULE_Y (424) for the drawing title block, so nothing collides with
    the part-code strip. Callout <text> is authored at font-size 12 user units;
    css/arsenal.css counter-sizes it per breakpoint up to a ceiling of 15px -
    past that the longer callouts run off the right edge of the viewBox.
"""
import math
import os

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# =====================================================================
# PART 1 - geometry + SVG helpers
# =====================================================================
DIA   = '&#8960;'   # diameter sign
TIMES = '&#215;'    # multiplication sign
MDASH = '&#8212;'
DEG   = '&#176;'

def f(v):
    r = round(float(v), 2)
    if abs(r - round(r)) < 1e-9:
        return str(int(round(r)))
    return ('%.2f' % r).rstrip('0').rstrip('.')

# ---------- shell ----------
def defs(pid):
    return (
        '<defs>'
        '<pattern id="ars-grid-%s" width="26" height="26" patternUnits="userSpaceOnUse">'
        '<path class="s-gridline" d="M26 0 H0 V26" fill="none"/></pattern>'
        '<marker id="ars-ah-%s" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="9" markerHeight="9" '
        'markerUnits="userSpaceOnUse" orient="auto-start-reverse">'
        '<path class="s-ah" d="M0 0 L12 6 L0 12 Z"/></marker>'
        '</defs>' % (pid, pid)
    )

def svg_open(pid, title, desc, w=620, h=460):
    return (
        '<svg class="ars-svg" viewBox="0 0 %d %d" preserveAspectRatio="xMidYMid meet" '
        'role="img" aria-labelledby="svgt-%s svgd-%s">'
        '<title id="svgt-%s">%s</title><desc id="svgd-%s">%s</desc>'
        '%s'
        '<rect class="s-grid" x="0" y="0" width="%d" height="%d" fill="url(#ars-grid-%s)"/>'
        % (w, h, pid, pid, pid, title, pid, desc, defs(pid), w, h, pid)
    )

def svg_close():
    return '</svg>'

# ---------- primitives ----------
def p(cls, d, extra=''):
    """Animated (drawn) path."""
    return '<path class="%s ars-draw" d="%s"%s/>' % (cls, d, extra)

def pf(cls, d, extra=''):
    """Static path (faded in, not drawn)."""
    return '<path class="%s ars-fade" d="%s"%s/>' % (cls, d, extra)

def circ(cls, cx, cy, r, extra='', draw=True):
    return '<circle class="%s %s" cx="%s" cy="%s" r="%s"%s/>' % (
        cls, 'ars-draw' if draw else 'ars-fade', f(cx), f(cy), f(r), extra)

def txt(x, y, s, anchor='start', cls='s-lab', extra=''):
    return '<text class="%s ars-fade" x="%s" y="%s" text-anchor="%s"%s>%s</text>' % (
        cls, f(x), f(y), anchor, extra, s)

def line(cls, x1, y1, x2, y2, extra=''):
    return p(cls, 'M%s %s L%s %s' % (f(x1), f(y1), f(x2), f(y2)), extra)

def centreline(x1, y1, x2, y2):
    return pf('s-cl', 'M%s %s L%s %s' % (f(x1), f(y1), f(x2), f(y2)))

# ---------- dimensions ----------
def dim_h(pid, x1, x2, y, label, ext_from=None, ext_to=None, below=False):
    """Horizontal dimension line with arrowheads + optional extension lines."""
    out = []
    if ext_from is not None:
        out.append(p('s-ext', 'M%s %s V%s' % (f(x1), f(ext_from), f(y + (8 if below else -8)))))
    if ext_to is not None:
        out.append(p('s-ext', 'M%s %s V%s' % (f(x2), f(ext_to), f(y + (8 if below else -8)))))
    out.append(p('s-dim', 'M%s %s H%s' % (f(x1), f(y), f(x2)),
                 ' marker-start="url(#ars-ah-%s)" marker-end="url(#ars-ah-%s)"' % (pid, pid)))
    out.append(txt((x1 + x2) / 2.0, y + (16 if below else -8), label, 'middle'))
    return ''.join(out)

def dim_v(pid, y1, y2, x, label, ext_from=None, ext_to=None, left=True):
    out = []
    if ext_from is not None:
        out.append(p('s-ext', 'M%s %s H%s' % (f(ext_from), f(y1), f(x + (-8 if left else 8)))))
    if ext_to is not None:
        out.append(p('s-ext', 'M%s %s H%s' % (f(ext_to), f(y2), f(x + (-8 if left else 8)))))
    out.append(p('s-dim', 'M%s %s V%s' % (f(x), f(y1), f(y2)),
                 ' marker-start="url(#ars-ah-%s)" marker-end="url(#ars-ah-%s)"' % (pid, pid)))
    ty = (y1 + y2) / 2.0
    out.append('<text class="s-lab ars-fade" transform="translate(%s %s) rotate(-90)" '
               'text-anchor="middle" y="%s">%s</text>' % (f(x), f(ty), '-6' if left else '12', label))
    return ''.join(out)

def leader(x, y, tx, ty, label, anchor='start', tail=28, cls='s-lab'):
    ex = tx + (tail if anchor == 'start' else -tail)
    d = 'M%s %s L%s %s L%s %s' % (f(x), f(y), f(tx), f(ty), f(ex), f(ty))
    return (circ('s-dot', x, y, 2.4, ' fill="currentColor"', draw=False)
            + p('s-lead', d)
            + txt(ex + (7 if anchor == 'start' else -7), ty + 3.5, label, anchor, cls))

# ---------- hatching ----------
def hatch_rect(x0, y0, x1, y1, step=12, cls='s-hatch'):
    """45-degree section hatching clipped to an axis-aligned rect."""
    out = []
    c = x0 + y0
    cmax = x1 + y1
    while c <= cmax:
        pts = []
        for px, py in ((x0, c - x0), (x1, c - x1)):
            if y0 - 0.001 <= py <= y1 + 0.001:
                pts.append((px, py))
        for py, px in ((y0, c - y0), (y1, c - y1)):
            if x0 - 0.001 <= px <= x1 + 0.001:
                pts.append((px, py))
        uniq = []
        for q in pts:
            if not any(abs(q[0] - u[0]) < 0.01 and abs(q[1] - u[1]) < 0.01 for u in uniq):
                uniq.append(q)
        if len(uniq) >= 2:
            a, b = uniq[0], uniq[-1]
            if math.hypot(a[0] - b[0], a[1] - b[1]) > 2:
                out.append(line(cls, a[0], a[1], b[0], b[1]))
        c += step
    return ''.join(out)

# ---------- geometry ----------
def ring(cls, cx, cy, r, n, hole_r, start_deg=0.0, draw=True):
    out = []
    for i in range(n):
        a = math.radians(start_deg + i * 360.0 / n)
        out.append(circ(cls, cx + r * math.cos(a), cy + r * math.sin(a), hole_r, draw=draw))
    return ''.join(out)

def wavy_circle(cx, cy, r, lobes, amp, steps=480):
    """Closed wavy rotor edge as a smooth polygonal path."""
    pts = []
    for i in range(steps):
        t = 2 * math.pi * i / steps
        rr = r + amp * math.sin(lobes * t)
        pts.append((cx + rr * math.cos(t), cy + rr * math.sin(t)))
    d = 'M' + ' L'.join('%s %s' % (f(x), f(y)) for x, y in pts) + ' Z'
    return d

def helix(cx, y0, y1, w, turns, samples=28):
    """Side view of a coil spring -> list of (is_front, 'M.. L..') polyline path data."""
    segs = []
    total = turns * 2 * math.pi
    span = y1 - y0
    cur = []
    cur_front = None
    n = int(turns * samples)
    for i in range(n + 1):
        t = total * i / n
        x = cx + w * math.sin(t)
        y = y0 + span * (t / total)
        front = math.cos(t) <= 0  # nearest the viewer on the downswing
        if cur_front is None:
            cur_front = front
        if front != cur_front:
            cur.append((x, y))
            segs.append((cur_front, cur))
            cur = [(x, y)]
            cur_front = front
        else:
            cur.append((x, y))
    if len(cur) > 1:
        segs.append((cur_front, cur))
    out = []
    for front, pts in segs:
        d = 'M' + ' L'.join('%s %s' % (f(x), f(y)) for x, y in pts)
        out.append((front, d))
    return out

def zig_spring(x0, x1, y, coils, amp):
    """Flat zig-zag return spring (compression spring, side view)."""
    pts = [(x0, y)]
    n = coils * 2
    step = (x1 - x0) / float(n)
    for i in range(1, n):
        pts.append((x0 + i * step, y + (amp if i % 2 else -amp)))
    pts.append((x1, y))
    return 'M' + ' L'.join('%s %s' % (f(a), f(b)) for a, b in pts)

def tick_dial(cx, cy, r_in, r_out, n, start_deg=-120.0, sweep=240.0, cls='s-aux'):
    out = []
    for i in range(n):
        a = math.radians(start_deg + sweep * i / float(n - 1))
        out.append(line(cls,
                        cx + r_in * math.cos(a), cy + r_in * math.sin(a),
                        cx + r_out * math.cos(a), cy + r_out * math.sin(a)))
    return ''.join(out)

def knurl(x0, x1, y0, y1, step=7, cls='s-aux'):
    out = []
    x = x0
    while x <= x1:
        out.append(line(cls, x, y0, x, y1))
        x += step
    return ''.join(out)


# ---------- drawing title block ----------
TB_RULE_Y = 424          # nothing in the artwork may sit below this
TB_TEXT_Y = 446

def title_block(pid, left, right):
    """Engineering-drawing title strip along the bottom of every schematic."""
    return (
        pf('s-tb', 'M16 %s H604' % f(TB_RULE_Y))
        + txt(20, TB_TEXT_Y, left, 'start', 's-lab s-lab--dim')
        + txt(604, TB_TEXT_Y, right, 'end', 's-lab s-lab--dim')
    )


# =====================================================================
# PART 2 - the six technical schematics
# =====================================================================
# =====================================================================
# 01 - PROJECT X : exploded 4-spoke rim, face view + rim section A-A
# =====================================================================
def schem_x():
    pid = 'x'
    o = [svg_open(pid, 'Project X wheel schematic',
                  'Blueprint drawing of a four-spoke cast motorcycle wheel: face view with hub, '
                  'spokes and bolt circle, plus a rim cross-section marked A-A.')]
    cx, cy = 212, 228
    # construction centrelines
    o.append(centreline(cx - 196, cy, cx + 196, cy))
    o.append(centreline(cx, cy - 196, cx, cy + 196))
    # rim bands
    o.append(circ('s-main', cx, cy, 172))
    o.append(circ('s-aux',  cx, cy, 162))
    o.append(circ('s-aux',  cx, cy, 148))
    o.append(circ('s-ghost', cx, cy, 138))
    # hub
    o.append(circ('s-main', cx, cy, 52))
    o.append(circ('s-aux',  cx, cy, 40))
    o.append(circ('s-main', cx, cy, 20))
    o.append(circ('s-ghost', cx, cy, 30, ' stroke-dasharray="3 4"', draw=False))
    o.append(ring('s-aux', cx, cy, 40, 5, 5.5, start_deg=-90))
    # four spokes (single profile, rotated about the hub)
    spoke = ('M%s %s L%s %s Q%s %s %s %s L%s %s Q%s %s %s %s Z' % (
        f(cx - 18), f(cy - 48),   f(cx - 30), f(cy - 138),
        f(cx),      f(cy - 152),  f(cx + 30), f(cy - 138),
        f(cx + 18), f(cy - 48),   f(cx),      f(cy - 38),
        f(cx - 18), f(cy - 48)))
    slot = ('M%s %s L%s %s Q%s %s %s %s L%s %s Q%s %s %s %s Z' % (
        f(cx - 9),  f(cy - 60),   f(cx - 16), f(cy - 126),
        f(cx),      f(cy - 136),  f(cx + 16), f(cy - 126),
        f(cx + 9),  f(cy - 60),   f(cx),      f(cy - 54),
        f(cx - 9),  f(cy - 60)))
    for a in (45, 135, 225, 315):
        tr = ' transform="rotate(%d %s %s)"' % (a, f(cx), f(cy))
        o.append(p('s-main', spoke, tr))
        o.append(p('s-aux',  slot,  tr))
    # valve stem
    va = math.radians(-20)
    o.append(line('s-aux', cx + 148 * math.cos(va), cy + 148 * math.sin(va),
                           cx + 168 * math.cos(va), cy + 168 * math.sin(va)))
    o.append(circ('s-aux', cx + 158 * math.cos(va), cy + 158 * math.sin(va), 4))
    # diameter dimension
    o.append(dim_v(pid, cy - 172, cy + 172, 26, '%s 17 IN' % DIA, ext_from=cx - 172, ext_to=cx - 172))
    # section A-A cut line through the rim
    o.append(pf('s-cut', 'M%s %s H%s' % (f(cx + 88), f(cy + 150), f(cx + 212))))
    o.append(txt(cx + 150, cy + 170, 'A %s A' % MDASH, 'middle', 's-lab s-lab--hi'))
    # ---- rim section A-A (right) ----
    sx, sy = 486, 268          # section origin (centre of the rim well)
    prof = ('M%s %s V%s Q%s %s %s %s L%s %s L%s %s L%s %s L%s %s L%s %s L%s %s L%s %s Q%s %s %s %s V%s'
            % (f(sx - 58), f(sy + 74), f(sy + 28),
               f(sx - 58), f(sy + 12), f(sx - 44), f(sy + 6),
               f(sx - 38), f(sy + 6),
               f(sx - 38), f(sy - 8),
               f(sx - 30), f(sy - 16),
               f(sx + 30), f(sy - 16),
               f(sx + 38), f(sy - 8),
               f(sx + 38), f(sy + 6),
               f(sx + 44), f(sy + 6), f(sx + 58), f(sy + 12), f(sx + 58), f(sy + 28),
               f(sy + 74)))
    o.append(p('s-main', prof))
    o.append(p('s-aux', 'M%s %s L%s %s' % (f(sx - 58), f(sy + 74), f(sx + 58), f(sy + 74))))
    o.append(hatch_rect(sx - 58, sy + 42, sx + 58, sy + 74, step=13))
    o.append(hatch_rect(sx - 30, sy - 16, sx + 30, sy - 4, step=13))
    o.append(centreline(sx, sy - 40, sx, sy + 96))
    o.append(dim_h(pid, sx - 58, sx + 58, sy + 96, '3.50 IN', ext_from=sy + 78, ext_to=sy + 78, below=True))
    o.append(txt(sx, sy - 62, 'SECTION A%sA' % MDASH, 'middle', 's-lab s-lab--hi'))
    # callouts
    o.append(leader(cx + 96, cy - 96, 398, 54, '4-SPOKE GRAVITY CAST', 'start'))
    o.append(leader(cx + 40, cy + 12, 398, 88, 'FORGED ALLOY HUB', 'start'))
    o.append(leader(cx + 152, cy + 84, 398, 122, 'CHAMELEON FLIP COAT', 'start'))
    o.append(leader(sx - 38, sy + 2, 398, 336, 'BEAD SEAT', 'start'))
    o.append(title_block(pid, 'SF-PX / 17 %s 3.50 / DRY 3.1 KG' % TIMES, 'SHEET 01 OF 06'))
    o.append(svg_close())
    return ''.join(o)

# =====================================================================
# 02 - PROJECT RA : coil-over shock, cutaway + damping curve
# =====================================================================
def schem_ra():
    pid = 'ra'
    o = [svg_open(pid, 'Project RA Super Shocks schematic',
                  'Blueprint drawing of an adjustable coil-over motorcycle shock absorber: '
                  'eyelets, damper body, coil spring, preload collar and a damping force curve.')]
    cx = 158
    o.append(centreline(cx, 12, cx, 414))
    # top eyelet + clevis
    o.append(circ('s-main', cx, 44, 26))
    o.append(circ('s-aux',  cx, 44, 16))
    o.append(circ('s-main', cx, 44, 8))
    o.append(p('s-main', 'M%s %s L%s %s L%s %s L%s %s' % (
        f(cx - 26), f(48), f(cx - 23), f(90), f(cx + 23), f(90), f(cx + 26), f(48))))
    # top cap / preload collar
    o.append(p('s-main', 'M%s %s H%s V%s H%s Z' % (f(cx - 46), f(90), f(cx + 46), f(112), f(cx - 46))))
    o.append(p('s-main', 'M%s %s H%s V%s H%s Z' % (f(cx - 54), f(112), f(cx + 54), f(132), f(cx - 54))))
    o.append(knurl(cx - 50, cx + 50, 116, 128, step=8))
    # damper body (filled so the rear coils read as hidden behind it)
    o.append('<rect class="s-fillbody ars-fade" x="%s" y="132" width="%s" height="160"/>' % (f(cx - 26), f(52)))
    # rear coils, then body outline, then front coils
    coils = helix(cx, 138, 294, 60, 7)
    o.append(''.join(p('s-aux', d) for front, d in coils if not front))
    o.append(p('s-main', 'M%s %s V%s' % (f(cx - 26), f(132), f(292))))
    o.append(p('s-main', 'M%s %s V%s' % (f(cx + 26), f(132), f(292))))
    o.append(p('s-aux', 'M%s %s H%s' % (f(cx - 26), f(200), f(cx + 26))))
    o.append(''.join(p('s-main', d) for front, d in coils if front))
    # lower perch, shaft, adjuster, bottom eyelet
    o.append(p('s-main', 'M%s %s H%s V%s H%s Z' % (f(cx - 50), f(292), f(cx + 50), f(312), f(cx - 50))))
    o.append(p('s-main', 'M%s %s V%s' % (f(cx - 11), f(312), f(342))))
    o.append(p('s-main', 'M%s %s V%s' % (f(cx + 11), f(312), f(342))))
    o.append(p('s-main', 'M%s %s H%s V%s H%s Z' % (f(cx - 30), f(342), f(cx + 30), f(368), f(cx - 30))))
    o.append(tick_dial(cx, 355, 20, 28, 9, start_deg=-160, sweep=140))
    o.append(circ('s-main', cx, 392, 22))
    o.append(circ('s-aux',  cx, 392, 13))
    o.append(circ('s-main', cx, 392, 7))
    # stroke + free length dimensions
    o.append(dim_v(pid, 138, 294, 62, 'STROKE 62', ext_from=cx - 60, ext_to=cx - 60))
    o.append(dim_v(pid, 44, 392, 28, 'EYE %s EYE 335' % MDASH, ext_from=cx - 30, ext_to=cx - 30))
    # ---- damping curve (right) ----
    gx0, gy0, gx1, gy1 = 320, 88, 584, 252
    o.append(p('s-ghost', 'M%s %s V%s H%s' % (f(gx0), f(gy0), f(gy1), f(gx1))))
    for i in range(1, 4):
        yy = gy0 + (gy1 - gy0) * i / 4.0
        o.append(pf('s-gridline2', 'M%s %s H%s' % (f(gx0), f(yy), f(gx1))))
    o.append(p('s-main', 'M%s %s C%s %s %s %s %s %s' % (
        f(gx0 + 6), f(gy1 - 12), f(gx0 + 70), f(gy1 - 30), f(gx0 + 110), f(gy0 + 62), f(gx1 - 8), f(gy0 + 16))))
    o.append(p('s-aux', 'M%s %s C%s %s %s %s %s %s' % (
        f(gx0 + 6), f(gy1 - 12), f(gx0 + 86), f(gy1 - 18), f(gx0 + 150), f(gy0 + 96), f(gx1 - 8), f(gy0 + 60))))
    o.append(txt(gx1, gy0 + 8, 'REBOUND', 'end', 's-lab s-lab--hi'))
    o.append(txt(gx1, gy0 + 56, 'COMPRESSION', 'end'))
    o.append(txt(gx0 - 6, gy0 + 4, 'FORCE', 'end', 's-lab s-lab--dim'))
    o.append(txt(gx1, gy1 + 16, 'SHAFT VELOCITY', 'end', 's-lab s-lab--dim'))
    # ---- 30-click adjuster detail ----
    dx, dy = 404, 366
    o.append(circ('s-main', dx, dy, 40))
    o.append(circ('s-aux',  dx, dy, 28))
    o.append(tick_dial(dx, dy, 30, 40, 16, start_deg=-210, sweep=240))
    o.append(line('s-main', dx, dy, dx + 26 * math.cos(math.radians(-60)), dy + 26 * math.sin(math.radians(-60))))
    o.append(txt(dx + 58, dy + 4, '30-CLICK REBOUND', 'start', 's-lab s-lab--hi'))
    o.append(leader(cx + 50, 122, 258, 118, 'THREADED PRELOAD', 'start', tail=18))
    o.append(leader(cx + 26, 222, 258, 200, 'TWIN-TUBE DAMPER', 'start', tail=18))
    o.append(title_block(pid, 'SF-RA / SUPER SHOCKS / RM358', 'SHEET 02 OF 06'))
    o.append(svg_close())
    return ''.join(o)

# =====================================================================
# 03 - PROJECT RP : radial master cylinder, bore cutaway
# =====================================================================
def schem_rp():
    pid = 'rp'
    o = [svg_open(pid, 'Project RP radial master pump schematic',
                  'Blueprint cutaway of a radial brake master cylinder showing the bore, piston, '
                  'seals, return spring, reservoir and the 14, 16 and 19 millimetre bore options.')]
    by0, by1 = 168, 240        # bore inner walls
    bx0, bx1 = 132, 392        # bore extents
    o.append(centreline(96, (by0 + by1) / 2.0, 470, (by0 + by1) / 2.0))
    # body outline
    body = ('M%s %s L%s %s L%s %s Q%s %s %s %s L%s %s L%s %s L%s %s L%s %s Q%s %s %s %s L%s %s Z'
            % (f(112), f(150),
               f(300), f(150),
               f(330), f(150), f(348), f(150), f(356), f(134),
               f(372), f(134),
               f(418), f(150),
               f(418), f(258),
               f(372), f(274), f(348), f(258), f(330), f(258),
               f(112), f(258)))
    o.append(p('s-main', body))
    o.append(hatch_rect(120, 150, 392, 166, step=14))
    o.append(hatch_rect(120, 242, 392, 258, step=14))
    # bore
    o.append(p('s-aux', 'M%s %s H%s' % (f(bx0), f(by0), f(bx1))))
    o.append(p('s-aux', 'M%s %s H%s' % (f(bx0), f(by1), f(bx1))))
    o.append(p('s-main', 'M%s %s V%s' % (f(bx0), f(by0), f(by1))))
    # outlet banjo (left)
    o.append(p('s-main', 'M%s %s L%s %s L%s %s L%s %s L%s %s L%s %s Z' % (
        f(112), f(176), f(86), f(176), f(72), f(186), f(72), f(222), f(86), f(232), f(112), f(232))))
    o.append(circ('s-aux', 88, 204, 11))
    o.append(knurl(76, 108, 180, 228, step=8))
    # return spring + piston assembly
    o.append(p('s-aux', zig_spring(bx0 + 6, 212, 204, 7, 26)))
    px = 218
    o.append(p('s-main', 'M%s %s H%s V%s H%s Z' % (f(px), f(by0 + 4), f(px + 74), f(by1 - 4), f(px))))
    for sxp in (px + 6, px + 60):
        o.append('<rect class="s-main ars-draw" x="%s" y="%s" width="9" height="%s"/>' % (
            f(sxp), f(by0 + 4), f(by1 - by0 - 8)))
        o.append(hatch_rect(sxp, by0 + 4, sxp + 9, by1 - 4, step=9))
    # push-rod + clevis + lever
    o.append(p('s-main', 'M%s %s H%s' % (f(px + 74), f(198), f(404))))
    o.append(p('s-main', 'M%s %s H%s' % (f(px + 74), f(210), f(404))))
    o.append(circ('s-main', 418, 204, 15))
    o.append(circ('s-aux',  418, 204, 7))
    o.append(p('s-main', 'M%s %s L%s %s L%s %s L%s %s' % (
        f(430), f(196), f(520), f(150), f(566), f(136), f(574), f(150))))
    o.append(p('s-main', 'M%s %s L%s %s L%s %s' % (f(430), f(214), f(524), f(170), f(574), f(150))))
    o.append(circ('s-main', 470, 176, 9))
    o.append(tick_dial(470, 176, 11, 16, 6, start_deg=0, sweep=300))
    # reservoir + hose
    o.append(p('s-main', 'M%s %s H%s Q%s %s %s %s V%s Q%s %s %s %s H%s Q%s %s %s %s V%s Q%s %s %s %s Z' % (
        f(452), f(34), f(560), f(576), f(34), f(576), f(50), f(86),
        f(576), f(102), f(560), f(102), f(452), f(436), f(102), f(436), f(86), f(50),
        f(436), f(34), f(452), f(34))))
    o.append(p('s-aux', 'M%s %s H%s' % (f(440), f(52), f(572))))
    o.append(circ('s-main', 506, 34, 16))
    o.append(circ('s-aux',  506, 34, 9))
    o.append(p('s-main', 'M%s %s C%s %s %s %s %s %s' % (
        f(436), f(94), f(404), f(104), f(392), f(112), f(372), f(134))))
    o.append(p('s-main', 'M%s %s C%s %s %s %s %s %s' % (
        f(436), f(76), f(390), f(84), f(368), f(100), f(356), f(134))))
    # ports
    o.append(circ('s-main', 340, 166, 4))
    o.append(circ('s-main', 362, 166, 4))
    # bore options
    opts = [(404, 14, False), (474, 16, False), (552, 19, True)]
    for ox, mm, hi in opts:
        r = mm * 1.9
        oy = 376
        o.append(circ('s-main' if hi else 's-aux', ox, oy, r))
        if hi:
            o.append(circ('s-aux', ox, oy, r - 6))
        o.append(centreline(ox - r - 10, oy, ox + r + 10, oy))
        o.append(centreline(ox, oy - r - 10, ox, oy + r + 10))
        o.append(txt(ox, 316, '%s %d MM' % (DIA, mm), 'middle',
                     's-lab s-lab--hi' if hi else 's-lab'))
    o.append(txt(404, 292, 'BORE OPTIONS', 'start', 's-lab s-lab--dim'))
    o.append(dim_v(pid, by0, by1, 118, '%s 19.0' % DIA, ext_from=bx0, ext_to=bx0))
    o.append(leader(266, 204, 216, 330, 'PISTON + SEAL PACK', 'start', tail=0))
    o.append(leader(351, 166, 250, 84, 'COMPENSATING PORTS', 'end', tail=0))
    o.append(leader(88, 204, 62, 286, 'M10 %s 1.25 BANJO' % TIMES, 'start', tail=0))
    o.append(leader(452, 60, 392, 44, 'RESERVOIR 18 CC', 'end', tail=0))
    o.append(title_block(pid, 'SF-RP / RADIAL MASTER PUMP', 'SHEET 03 OF 06'))
    o.append(svg_close())
    return ''.join(o)

# =====================================================================
# 04 - BRAKE SYSTEM : wavy floating rotor + radial 4-piston caliper
# =====================================================================
def schem_brake():
    pid = 'bs'
    o = [svg_open(pid, 'SUPERFLY brake system schematic',
                  'Blueprint drawing of a drilled wavy floating brake rotor with its carrier and '
                  'bobbins, a radial four-piston caliper, and a rotor edge section.')]
    cx, cy = 238, 228
    o.append(centreline(cx - 208, cy, cx + 208, cy))
    o.append(centreline(cx, cy - 192, cx, cy + 192))
    # wavy outer edge + friction band
    o.append(p('s-main', wavy_circle(cx, cy, 176, 12, 8)))
    o.append(circ('s-aux', cx, cy, 122))
    o.append(circ('s-ghost', cx, cy, 150, ' stroke-dasharray="4 5"', draw=False))
    # drilled holes
    o.append(ring('s-aux', cx, cy, 158, 18, 5.5, start_deg=10))
    o.append(ring('s-aux', cx, cy, 136, 14, 5.5, start_deg=0))
    # floating bobbins + carrier
    o.append(ring('s-main', cx, cy, 112, 10, 8, start_deg=18))
    o.append(circ('s-main', cx, cy, 98))
    o.append(circ('s-aux',  cx, cy, 62))
    o.append(circ('s-main', cx, cy, 46))
    o.append(ring('s-aux', cx, cy, 78, 6, 6, start_deg=-90))
    for i in range(5):
        a0 = math.radians(-90 + i * 72)
        o.append(p('s-aux', 'M%s %s L%s %s' % (
            f(cx + 46 * math.cos(a0)), f(cy + 46 * math.sin(a0)),
            f(cx + 98 * math.cos(a0)), f(cy + 98 * math.sin(a0)))))
    # radial caliper straddling the rotor, upper left
    kx, ky = 158, 48
    cal = ('M%s %s H%s L%s %s V%s L%s %s H%s L%s %s V%s Z' % (
        f(kx - 92), f(ky), f(kx + 92), f(kx + 108), f(ky + 18), f(ky + 96),
        f(kx + 92), f(ky + 118), f(kx - 92), f(kx - 108), f(ky + 96), f(ky + 18)))
    o.append(p('s-main', cal))
    o.append(p('s-aux', 'M%s %s H%s' % (f(kx - 96), f(ky + 60), f(kx + 96))))
    for ox in (-54, -18, 18, 54):
        o.append(circ('s-aux', kx + ox, ky + 38, 14))
        o.append(circ('s-aux', kx + ox, ky + 38, 8))
    o.append(circ('s-main', kx - 74, ky + 90, 7))
    o.append(circ('s-main', kx + 74, ky + 90, 7))
    o.append(p('s-main', 'M%s %s L%s %s L%s %s' % (
        f(kx + 108), f(ky + 30), f(kx + 134), f(ky + 18), f(kx + 150), f(ky + 24))))
    o.append(circ('s-aux', kx + 158, ky + 27, 7))
    # pads straddling the disc
    o.append(p('s-aux', 'M%s %s H%s V%s H%s Z' % (
        f(kx - 60), f(ky + 104), f(kx + 60), f(ky + 118), f(kx - 60))))
    # dimensions
    o.append(dim_v(pid, cy - 176, cy + 176, 28, '%s 320 MM' % DIA,
                   ext_from=cx - 176, ext_to=cx - 176))
    # edge section (right)
    ex, ey = 556, 236
    o.append(p('s-main', 'M%s %s H%s V%s H%s Z' % (f(ex - 13), f(ey), f(ex + 13), f(ey + 120), f(ex - 13))))
    o.append(hatch_rect(ex - 13, ey, ex + 13, ey + 120, step=13))
    o.append(dim_h(pid, ex - 13, ex + 13, ey - 22, 't 5.0', ext_from=ey, ext_to=ey))
    o.append(txt(ex, ey + 140, 'EDGE SECTION', 'middle', 's-lab s-lab--dim'))
    o.append(leader(cx + 124, cy - 118, 452, 62, '4-POT RADIAL', 'start', tail=12))
    o.append(leader(cx + 108, cy + 40, 452, 100, 'FLOATING CARRIER', 'start', tail=12))
    o.append(leader(cx + 158, cy + 62, 452, 138, 'DRILLED + VENTED', 'start', tail=12))
    o.append(title_block(pid, 'SF-BS / WAVE ROTOR + CALIPER', 'SHEET 04 OF 06'))
    o.append(svg_close())
    return ''.join(o)

# =====================================================================
# 05 - QUICKSHIFTER : sensor rod + ignition-cut trace
# =====================================================================
def schem_qs():
    pid = 'qs'
    o = [svg_open(pid, 'SUPERFLY quickshifter schematic',
                  'Blueprint drawing of a strain-gauge quickshifter shift rod with rod ends, '
                  'inline sensor and connector, above an ignition-cut timing trace.')]
    ry = 132
    o.append(centreline(36, ry, 596, ry))
    # rod ends
    for ex, flip in ((92, -1), (500, 1)):
        o.append(circ('s-main', ex, ry, 28))
        o.append(circ('s-aux',  ex, ry, 18))
        o.append(circ('s-main', ex, ry, 10))
        o.append(p('s-main', 'M%s %s L%s %s L%s %s L%s %s' % (
            f(ex + flip * 26), f(ry - 14), f(ex + flip * 52), f(ry - 10),
            f(ex + flip * 52), f(ry + 10), f(ex + flip * 26), f(ry + 14))))
    # rod + threads
    o.append(p('s-main', 'M%s %s H%s' % (f(144), f(ry - 10), f(448))))
    o.append(p('s-main', 'M%s %s H%s' % (f(144), f(ry + 10), f(448))))
    o.append(knurl(150, 198, ry - 10, ry + 10, step=7))
    o.append(knurl(394, 442, ry - 10, ry + 10, step=7))
    # lock nuts
    for nx in (206, 386):
        o.append(p('s-main', 'M%s %s H%s V%s H%s Z' % (f(nx), f(ry - 18), f(nx + 14), f(ry + 18), f(nx))))
    # inline sensor body
    o.append(p('s-main', 'M%s %s H%s V%s H%s Z' % (f(248), f(ry - 30), f(344), f(ry + 30), f(248))))
    o.append(p('s-aux', 'M%s %s H%s' % (f(248), f(ry - 16), f(344))))
    o.append(p('s-aux', 'M%s %s H%s' % (f(248), f(ry + 16), f(344))))
    o.append(knurl(256, 336, ry - 14, ry + 14, step=8))
    # cable to connector
    o.append(p('s-main', 'M%s %s C%s %s %s %s %s %s' % (
        f(330), f(ry - 30), f(352), f(72), f(404), f(56), f(456), f(52))))
    o.append(p('s-aux', 'M%s %s C%s %s %s %s %s %s' % (
        f(322), f(ry - 30), f(344), f(80), f(400), f(64), f(456), f(60))))
    o.append(p('s-main', 'M%s %s H%s V%s H%s Z' % (f(456), f(40), f(516), f(72), f(456))))
    o.append(p('s-aux', 'M%s %s V%s' % (f(486), f(40), f(72))))
    o.append(circ('s-aux', 471, 56, 5))
    o.append(circ('s-aux', 501, 56, 5))
    o.append(txt(526, 60, '2-PIN LOOM', 'start'))
    o.append(dim_h(pid, 92, 500, 208, 'ADJ. 232 %s 248 MM' % MDASH,
                   ext_from=ry + 28, ext_to=ry + 28, below=True))
    # ---- ignition cut trace ----
    tx0, tx1 = 76, 560
    base, top = 396, 316
    o.append(p('s-ghost', 'M%s %s V%s H%s' % (f(tx0), f(288), f(base + 12), f(tx1))))
    cut0, cut1 = 268, 336
    o.append(p('s-main', 'M%s %s H%s V%s H%s V%s H%s' % (
        f(tx0 + 8), f(top), f(cut0), f(base), f(cut1), f(top), f(tx1 - 8))))
    o.append(pf('s-cl', 'M%s %s V%s' % (f(cut0), f(288), f(base + 12))))
    o.append(pf('s-cl', 'M%s %s V%s' % (f(cut1), f(288), f(base + 12))))
    o.append(dim_h(pid, cut0, cut1, 304, 'CUT 55 MS', below=False))
    o.append(txt(tx0 + 12, top - 10, 'IGNITION', 'start', 's-lab s-lab--hi'))
    # load trace + threshold
    o.append(p('s-aux', 'M%s %s C%s %s %s %s %s %s C%s %s %s %s %s %s' % (
        f(tx0 + 8), f(base - 6), f(180), f(base - 8), f(240), f(330), f(cut0), f(322),
        f(300), f(316), f(360), f(base - 10), f(tx1 - 8), f(base - 6))))
    o.append(pf('s-thresh', 'M%s %s H%s' % (f(tx0 + 8), f(336), f(tx1 - 8))))
    o.append(txt(tx1 - 8, 328, 'TRIGGER 38 N', 'end', 's-lab s-lab--dim'))
    o.append(leader(296, ry - 30, 276, 56, 'STRAIN-GAUGE CELL', 'end', tail=0))
    o.append(leader(92, ry - 28, 56, 96, 'ROD END M8', 'start', tail=0))
    o.append(title_block(pid, 'SF-QS / CLUTCHLESS UPSHIFT', 'SHEET 05 OF 06'))
    o.append(svg_close())
    return ''.join(o)

# =====================================================================
# 06 - PROJECT H : rainsuit pattern pieces
# =====================================================================
def schem_h():
    pid = 'h'
    o = [svg_open(pid, 'Project H rainsuit pattern schematic',
                  'Blueprint garment pattern for a two-piece rainsuit: jacket front panel, '
                  'sleeve piece and trouser leg piece with seam allowances and grain lines.')]
    # ---- jacket front panel ----
    jacket = ('M146 62 Q178 78 210 62 L258 90 C240 116 242 148 268 170 L274 356 '
              'Q178 376 82 356 L88 170 C114 148 116 116 98 90 Z')
    o.append(p('s-main', jacket))
    o.append('<path class="s-seam ars-fade" d="%s" transform="translate(178 210) scale(.93) translate(-178 -210)"/>' % jacket)
    o.append(centreline(178, 50, 178, 372))
    o.append(pf('s-stitch', 'M172 70 V360'))
    o.append(pf('s-stitch', 'M184 70 V360'))
    # zip teeth
    for i in range(24):
        yy = 76 + i * 12
        o.append(line('s-aux', 172, yy, 184, yy) if i % 2 == 0 else '')
    # pockets + storm flap + hem drawcord
    o.append(p('s-aux', 'M108 250 H156 V284 H108 Z'))
    o.append(p('s-aux', 'M200 250 H248 V284 H200 Z'))
    o.append(p('s-aux', 'M96 330 H260'))
    o.append(pf('s-stitch', 'M92 176 C118 152 120 120 102 96'))
    o.append(pf('s-stitch', 'M264 176 C238 152 236 120 254 96'))
    # notches
    for nx, ny in ((98, 90), (258, 90), (88, 170), (268, 170), (178, 62)):
        o.append(line('s-aux', nx, ny, nx, ny + 9))
    # grain line arrow
    o.append(p('s-dim', 'M132 130 V320', ' marker-start="url(#ars-ah-h)" marker-end="url(#ars-ah-h)"'))
    o.append('<text class="s-lab ars-fade" transform="translate(126 225) rotate(-90)" text-anchor="middle">GRAIN</text>')
    o.append(dim_h(pid, 82, 274, 392, 'CHEST 104 CM', ext_from=366, ext_to=366, below=True))
    o.append(txt(178, 40, 'FRONT PANEL / 01', 'middle', 's-lab s-lab--hi'))
    # ---- sleeve piece ----
    sleeve = ('M330 118 C348 78 396 62 436 62 C476 62 510 84 522 118 '
              'L512 320 Q426 338 340 320 Z')
    o.append(p('s-main', sleeve))
    o.append('<path class="s-seam ars-fade" d="%s" transform="translate(426 196) scale(.93) translate(-426 -196)"/>' % sleeve)
    o.append(centreline(426, 54, 426, 336))
    o.append(p('s-aux', 'M336 288 Q426 306 516 288'))
    o.append(pf('s-stitch', 'M340 292 Q426 310 512 292'))
    for nx, ny in ((330, 118), (522, 118), (426, 62)):
        o.append(line('s-aux', nx, ny, nx, ny + 9))
    o.append(txt(426, 40, 'SLEEVE / 02', 'middle', 's-lab s-lab--hi'))
    o.append(dim_v(pid, 62, 328, 300, 'SLEEVE 64', ext_from=330, ext_to=340, left=True))
    # ---- trouser leg ----
    leg = 'M534 70 L606 70 L610 236 L604 396 L540 396 L536 236 Z'
    o.append(p('s-main', leg))
    o.append('<path class="s-seam ars-fade" d="%s" transform="translate(572 232) scale(.9) translate(-572 -232)"/>' % leg)
    o.append(centreline(572, 62, 572, 404))
    o.append(p('s-aux', 'M538 300 H608'))
    o.append(pf('s-stitch', 'M542 306 H604'))
    o.append(txt(572, 50, 'LEG / 03', 'middle', 's-lab s-lab--hi'))
    # callouts
    o.append(leader(426, 300, 366, 366, 'TAPED SEAMS 20 MM', 'start', tail=0))
    o.append(title_block(pid, 'SF-PH / 3-LAYER PU / 10,000 MM HH', 'SHEET 06 OF 06'))
    o.append(svg_close())
    return ''.join(o)

SCHEMATICS = {
    'x': schem_x, 'ra': schem_ra, 'rp': schem_rp,
    'bs': schem_brake, 'qs': schem_qs, 'h': schem_h,
}


# =====================================================================
# PART 3 - panel copy and partial assembly
# =====================================================================
OUT = os.path.join(REPO_ROOT, 'partials', 'arsenal.html')
ARR = '&#8594;'

PANELS = [
    dict(n='01', pid='x', slug='project-x', kicker='Line 01 / Wheels',
         title='Project <em>X</em>',
         lede='Four-spoke gravity-cast alloy, heat-treated and then CNC-finished on the bead seat. '
              'Seven colourways, including the Chameleon flip that swings magenta to violet as the '
              'light rakes across the face.',
         chips=['17 %s 3.50 / 4.50' % TIMES, 'GRAVITY CAST', '3.1 KG', '7 COLOURWAYS'],
         cap='Fig. 01 %s Face view + rim section A%sA' % (MDASH, MDASH),
         photo=None),
    dict(n='02', pid='ra', slug='project-ra', kicker='Line 02 / Suspension',
         title='Project <em>RA</em>',
         lede='Super Shocks. A twin-tube coil-over with thirty clicks of rebound and a threaded '
              'preload collar, valved around Malaysian road camber and a pillion you actually carry.',
         chips=['RM358', '30-CLICK REBOUND', '62 MM STROKE', 'THREADED PRELOAD'],
         cap='Fig. 02 %s Cutaway + damping curve' % MDASH,
         photo=dict(src='assets/products/shock-studio.png',
                    alt='SUPERFLY Project RA Super Shocks coil-over shock absorber, studio photograph')),
    dict(n='03', pid='rp', slug='project-rp', kicker='Line 03 / Controls',
         title='Project <em>RP</em>',
         lede='Radial master pump, machined from billet, in 14, 16 and 19 mm bores so lever feel can '
              'be matched to the caliper you actually run. Reach adjuster on the blade.',
         chips=['14 / 16 / 19 MM', 'BILLET 6061-T6', 'REACH ADJUSTER', '18 CC RESERVOIR'],
         cap='Fig. 03 %s Bore cutaway, 19 mm shown' % MDASH,
         photo=None),
    dict(n='04', pid='bs', slug='brake-system', kicker='Line 04 / Braking',
         title='Brake <em>System</em>',
         lede='Drilled wave rotors riding on ten floating bobbins, paired with radial four-piston '
              'calipers. Sintered HH pads as standard, so the first lever pull feels like the fiftieth.',
         chips=['%s 320 MM' % DIA, '4-POT RADIAL', '10 BOBBINS', 'SINTERED HH'],
         cap='Fig. 04 %s Rotor + caliper assembly' % MDASH,
         photo=None),
    dict(n='05', pid='qs', slug='quickshifter', kicker='Line 05 / Electronics',
         title='Quick<em>shifter</em>',
         lede='A strain-gauge shift rod that reads lever load rather than travel, then cuts ignition '
              'for 55 milliseconds. Plug-and-play loom, no ECU flash, no clutch.',
         chips=['55 MS CUT', 'STRAIN GAUGE', 'PLUG + PLAY', 'M8 ROD ENDS'],
         cap='Fig. 05 %s Sensor rod + cut trace' % MDASH,
         photo=None),
    dict(n='06', pid='h', slug='project-h', kicker='Line 06 / Apparel',
         title='Project <em>H</em>',
         lede='A three-layer rainsuit cut for a riding position instead of a standing one. Taped '
              'seams throughout, 10,000 mm hydrostatic head, packs into its own pocket.',
         chips=['3-LAYER PU', '10,000 MM HH', 'TAPED SEAMS', 'S %s XXL' % MDASH],
         cap='Fig. 06 %s Pattern pieces 01%s03' % (MDASH, MDASH),
         photo=None),
]


def panel_html(p, i):
    pid = p['pid']
    tid = 'ars-title-%s' % pid
    chips = ''.join('<li class="sf-chip">%s</li>' % c for c in p['chips'])

    media_inner = SCHEMATICS[pid]()
    if p['photo']:
        photo = (
            '<div class="ars-plate">'
            '<img class="ars-plate__img" src="%s" alt="%s" loading="lazy" decoding="async" '
            'width="675" height="1164">'
            '<span class="ars-plate__tag">Ref. photo</span>'
            '</div>' % (p['photo']['src'], p['photo']['alt'])
        )
        media = ('<div class="ars-mediarow">%s<div class="ars-schem ars-in">%s</div></div>'
                 % (photo, media_inner))
        media_cls = ''
    else:
        media = '<div class="ars-schem ars-in">%s</div>' % media_inner
        media_cls = ''

    price_note = ''
    if pid == 'ra':
        price_note = ('\n      <!-- Prototype copy only: RM358 is hard-coded here. In the WordPress '
                      'build this price must come from WooCommerce (wc_price() / $product->get_price_html()) '
                      'so MYR formatting and tax display stay correct. -->')

    return (
        '\n  <article class="ars-panel" id="ars-panel-%s" data-ars-panel="%s" aria-labelledby="%s">'
        '\n    <div class="ars-panel__inner">'
        '\n      <span class="ars-panel__index" aria-hidden="true">%s</span>'
        '\n      <div class="ars-panel__copy">'
        '%s'
        '\n        <p class="sf-eyebrow ars-in">%s</p>'
        '\n        <h3 class="sf-h2 ars-panel__title ars-in" id="%s">%s</h3>'
        '\n        <p class="sf-lede ars-panel__lede ars-in">%s</p>'
        '\n        <ul class="ars-specs ars-in">%s</ul>'
        '\n        <p class="ars-cta ars-in"><a class="ars-cta__link" href="#%s">View the line '
        '<span aria-hidden="true">%s</span></a></p>'
        '\n      </div>'
        '\n      <figure class="ars-panel__media%s">'
        '\n        %s'
        '\n        <figcaption class="ars-panel__cap ars-in">%s</figcaption>'
        '\n      </figure>'
        '\n    </div>'
        '\n  </article>'
        % (pid, p['n'], tid, p['n'], price_note, p['kicker'], tid, p['title'], p['lede'],
           chips, p['slug'], ARR, media_cls, media, p['cap'])
    )


def build():
    panels = ''.join(panel_html(p, i) for i, p in enumerate(PANELS))
    head = (
        '<section id="arsenal" aria-labelledby="ars-heading">\n'
        '  <div class="ars-intro sf-wrap">\n'
        '    <p class="sf-eyebrow">The Arsenal</p>\n'
        '    <h2 class="sf-h2" id="ars-heading">Six lines.<br><em>One standard.</em></h2>\n'
        '    <p class="sf-lede">Every SUPERFLY part starts life as a drawing. Here is the '
        'whole catalogue &#8212; each line redrawn as you reach it.</p>\n'
        '    <p class="ars-intro__meta"><span>06 product lines</span><span>Ride. Race. Research.</span>'
        '<span class="ars-intro__hint">Scroll <i aria-hidden="true">&#8594;</i></span></p>\n'
        '  </div>\n\n'
        '  <div class="ars-stage" data-ars-stage>\n'
        '    <div class="ars-stagehead" aria-hidden="true">\n'
        '      <span class="ars-stagehead__id">The Arsenal / Index</span>\n'
        '      <span class="ars-progress"><i class="ars-progress__bar" data-ars-bar></i></span>\n'
        '      <span class="ars-stagehead__count"><b data-ars-count>01</b> / 06</span>\n'
        '    </div>\n\n'
        '    <div class="ars-track" data-ars-track>'
    )
    tail = '\n    </div>\n  </div>\n</section>\n'
    return head + panels + tail


if __name__ == '__main__':
    html = build()
    with open(OUT, 'w') as fh:
        fh.write(html)
    print('wrote %s  (%d bytes, %d drawable elements)'
          % (OUT, len(html), html.count('ars-draw')))
