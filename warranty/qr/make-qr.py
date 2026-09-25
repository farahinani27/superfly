#!/usr/bin/env python3
"""
Builds the printable warranty QR artwork — one set of files per product.

Each card carries the QR *and* the product code printed underneath. The code
is the whole point: two bare QR codes are indistinguishable to a human, so a
supplier or a warehouse can put the wrong sticker on the wrong box and nothing
looks wrong until the warranty data is already corrupt.

Emits three files per product:

    warranty-<CODE>.svg    vector, for layout
    warranty-<CODE>.eps    vector, THIS is what the printer gets (30 mm wide)
    warranty-<CODE>.png    raster, for previewing and sending to people

The encoded URL is never edited by hand here — it is built from BASE_URL and
the product code, and re-verified after generation by re-encoding the same
string and comparing the module matrix. Printed cards cannot be recalled.

Needs `qrencode` on PATH (brew install qrencode). No other dependencies.

    python3 make-qr.py
"""

import os
import struct
import subprocess
import sys
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
FORM = os.path.join(os.path.dirname(HERE), "form")

# The URL the printed code resolves to. Changing this orphans every card
# already printed — see the warranty QR contract in CLAUDE.md.
BASE_URL = "https://superflymotos.com.my/warranty"

# Error correction Q (25%). Stickers get scuffed inside a product box.
ECC = "Q"

# Physical width of the EPS, in millimetres. Minimum readable is about 25 mm.
PRINT_MM = 30.0

# --- layout, in QR module units -------------------------------------------
QUIET = 4          # quiet zone, in modules. Never reduce this.
GAP = 3.0          # clear space between the quiet zone and the code text
CODE_SIZE = 7.0    # cap height of the product code
SUB_GAP = 1.6      # between the code and the description
SUB_MAX = 3.2      # cap height of the description, before auto-fitting
BOTTOM = 2.5       # margin under the last line


def products():
    """The product list from build-forms.py, so codes cannot drift apart."""
    sys.path.insert(0, FORM)
    try:
        import build_forms  # noqa: F401
    except ImportError:
        # build-forms.py is hyphenated, so import it by path
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "build_forms", os.path.join(FORM, "build-forms.py"))
        build_forms = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(build_forms)
    return build_forms.PRODUCTS


def matrix(data):
    """The QR module grid for `data`, quiet zone stripped."""
    out = subprocess.run(["qrencode", "-t", "ASCII", "-l", ECC, "--", data],
                         capture_output=True, text=True)
    if out.returncode != 0:
        sys.exit("qrencode failed: " + out.stderr.strip())
    rows = [[0 if c == " " else 1 for c in line[::2]]
            for line in out.stdout.split("\n") if line.strip()]
    while rows and not any(rows[0]):
        rows.pop(0)
    while rows and not any(rows[-1]):
        rows.pop()
    left = 0
    while all(r[left] == 0 for r in rows):
        left += 1
    right = len(rows[0]) - 1
    while all(r[right] == 0 for r in rows):
        right -= 1
    return [r[left:right + 1] for r in rows]


# --- a 5x7 bitmap font, for the PNG only ----------------------------------
# The SVG and EPS use real outline fonts; this exists because rasterising
# text without a font library would otherwise be impossible.
GLYPHS = {
    "A": ".###.|#...#|#...#|#####|#...#|#...#|#...#",
    "B": "####.|#...#|#...#|####.|#...#|#...#|####.",
    "C": ".###.|#...#|#....|#....|#....|#...#|.###.",
    "D": "####.|#...#|#...#|#...#|#...#|#...#|####.",
    "E": "#####|#....|#....|####.|#....|#....|#####",
    "F": "#####|#....|#....|####.|#....|#....|#....",
    "G": ".###.|#...#|#....|#.###|#...#|#...#|.###.",
    "H": "#...#|#...#|#...#|#####|#...#|#...#|#...#",
    "I": "#####|..#..|..#..|..#..|..#..|..#..|#####",
    "J": "..###|...#.|...#.|...#.|...#.|#..#.|.##..",
    "K": "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#",
    "L": "#....|#....|#....|#....|#....|#....|#####",
    "M": "#...#|##.##|#.#.#|#...#|#...#|#...#|#...#",
    "N": "#...#|##..#|#.#.#|#..##|#...#|#...#|#...#",
    "O": ".###.|#...#|#...#|#...#|#...#|#...#|.###.",
    "P": "####.|#...#|#...#|####.|#....|#....|#....",
    "Q": ".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#",
    "R": "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
    "S": ".####|#....|#....|.###.|....#|....#|####.",
    "T": "#####|..#..|..#..|..#..|..#..|..#..|..#..",
    "U": "#...#|#...#|#...#|#...#|#...#|#...#|.###.",
    "V": "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..",
    "W": "#...#|#...#|#...#|#...#|#.#.#|##.##|#...#",
    "X": "#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
    "Y": "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..",
    "Z": "#####|....#|...#.|..#..|.#...|#....|#####",
    "0": ".###.|#...#|#..##|#.#.#|##..#|#...#|.###.",
    "1": "..#..|.##..|..#..|..#..|..#..|..#..|.###.",
    "2": ".###.|#...#|....#|...#.|..#..|.#...|#####",
    "3": "#####|...#.|..#..|...#.|....#|#...#|.###.",
    "4": "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.",
    "5": "#####|#....|####.|....#|....#|#...#|.###.",
    "6": "..##.|.#...|#....|####.|#...#|#...#|.###.",
    "7": "#####|....#|...#.|..#..|.#...|.#...|.#...",
    "8": ".###.|#...#|#...#|.###.|#...#|#...#|.###.",
    "9": ".###.|#...#|#...#|.####|....#|...#.|.##..",
    " ": ".....|.....|.....|.....|.....|.....|.....",
    "/": "....#|....#|...#.|..#..|.#...|#....|#....",
    "-": ".....|.....|.....|#####|.....|.....|.....",
    ".": ".....|.....|.....|.....|.....|.##..|.##..",
}
GLYPH_W, GLYPH_H, TRACK = 5, 7, 1  # cell is 6 wide including tracking


def advance(size):
    """Horizontal advance per character, in module units, for a cap height."""
    return (GLYPH_W + TRACK) * size / GLYPH_H


def fit(text, size, width):
    """Shrink `size` until `text` fits inside `width` module units."""
    while size > 0.4 and len(text) * advance(size) > width:
        size -= 0.05
    return size


def layout(n):
    """Canvas geometry for an n-module code. Returns (w, h, baselines)."""
    w = n + 2 * QUIET
    code_base = w + GAP + CODE_SIZE
    sub_base = code_base + SUB_GAP + SUB_MAX
    return w, sub_base + BOTTOM, code_base, sub_base


def build_svg(grid, code, sub):
    n = len(grid)
    w, h, code_base, sub_base = layout(n)
    sub_size = fit(sub, SUB_MAX, w - 2)
    out = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<!-- Generated by make-qr.py. Do not hand-edit. -->',
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %g %g" '
        'width="%gmm" height="%gmm" shape-rendering="crispEdges">'
        % (w, h, PRINT_MM, PRINT_MM * h / w),
        '<rect x="0" y="0" width="%g" height="%g" fill="#ffffff"/>' % (w, h),
        '<g id="Pattern" transform="translate(%d,%d)" fill="#000000">' % (QUIET, QUIET),
    ]
    for y, row in enumerate(grid):
        x = 0
        while x < n:
            if row[x]:
                run = 1
                while x + run < n and row[x + run]:
                    run += 1
                out.append('<rect x="%d" y="%d" width="%d" height="1"/>' % (x, y, run))
                x += run
            else:
                x += 1
    out.append('</g>')
    out.append(
        '<text x="%g" y="%g" text-anchor="middle" fill="#000000" '
        'font-family="Helvetica,Arial,sans-serif" font-weight="bold" '
        'font-size="%g" letter-spacing="0.4">%s</text>'
        % (w / 2.0, code_base, CODE_SIZE, code))
    out.append(
        '<text x="%g" y="%g" text-anchor="middle" fill="#000000" '
        'font-family="Helvetica,Arial,sans-serif" font-size="%g">%s</text>'
        % (w / 2.0, sub_base, sub_size, sub))
    out.append('</svg>')
    return "\n".join(out) + "\n"


def build_eps(grid, code, sub):
    n = len(grid)
    w, h, code_base, sub_base = layout(n)
    sub_size = fit(sub, SUB_MAX, w - 2)
    p = (PRINT_MM / 25.4 * 72.0) / w          # points per module unit
    wp, hp = w * p, h * p
    out = [
        "%!PS-Adobe-3.0 EPSF-3.0",
        "%%%%BoundingBox: 0 0 %d %d" % (int(wp + 0.999), int(hp + 0.999)),
        "%%%%HiResBoundingBox: 0 0 %.4f %.4f" % (wp, hp),
        "%%Creator: make-qr.py",
        "%%EndComments",
        "/DeviceGray setcolorspace",
        "1 setgray 0 0 %.4f %.4f rectfill" % (wp, hp),
        "0 setgray",
        "gsave",
        "0 %.4f translate %.6f %.6f scale" % (hp, p, -p),   # flip to y-down
        "%d %d translate" % (QUIET, QUIET),
    ]
    for y, row in enumerate(grid):
        x = 0
        while x < n:
            if row[x]:
                run = 1
                while x + run < n and row[x + run]:
                    run += 1
                out.append("%d %d %d 1 rectfill" % (x, y, run))
                x += run
            else:
                x += 1
    out.append("grestore")

    def centred(text, size_units, baseline_units):
        size = size_units * p
        y = hp - baseline_units * p
        return [
            "/Helvetica-Bold findfont %.4f scalefont setfont" % size,
            "(%s) dup stringwidth pop 2 div %.4f exch sub %.4f moveto show"
            % (text.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)"),
               wp / 2.0, y),
        ]

    out += centred(code, CODE_SIZE, code_base)
    out.append("/Helvetica findfont %.4f scalefont setfont" % (sub_size * p))
    out.append("(%s) dup stringwidth pop 2 div %.4f exch sub %.4f moveto show"
               % (sub.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)"),
                  wp / 2.0, hp - sub_base * p))
    out.append("showpage")
    out.append("%%EOF")
    return "\n".join(out) + "\n"


def draw_text(px, width, height, text, size_units, baseline_units, scale):
    """Stamp `text` into the pixel buffer using the 5x7 font."""
    size = size_units * scale                      # cap height in pixels
    cell = size / GLYPH_H                          # pixels per font pixel
    adv = advance(size_units) * scale
    total = len(text) * adv
    x0 = (width - total) / 2.0
    top = baseline_units * scale - size            # baseline is the cap bottom
    for i, ch in enumerate(text.upper()):
        rows = GLYPHS.get(ch, GLYPHS[" "]).split("|")
        for gy, row in enumerate(rows):
            for gx, bit in enumerate(row):
                if bit != "#":
                    continue
                px0 = int(round(x0 + i * adv + gx * cell))
                py0 = int(round(top + gy * cell))
                for yy in range(py0, int(round(py0 + cell))):
                    if not (0 <= yy < height):
                        continue
                    base = yy * width
                    for xx in range(px0, int(round(px0 + cell))):
                        if 0 <= xx < width:
                            px[base + xx] = 0


def build_png(grid, code, sub, scale=14):
    n = len(grid)
    w, h, code_base, sub_base = layout(n)
    sub_size = fit(sub, SUB_MAX, w - 2)
    width, height = int(w * scale), int(round(h * scale))
    px = bytearray([255]) * (width * height)

    for y, row in enumerate(grid):
        for x, bit in enumerate(row):
            if not bit:
                continue
            for yy in range((y + QUIET) * scale, (y + QUIET + 1) * scale):
                base = yy * width
                for xx in range((x + QUIET) * scale, (x + QUIET + 1) * scale):
                    px[base + xx] = 0

    draw_text(px, width, height, code, CODE_SIZE, code_base, scale)
    draw_text(px, width, height, sub, sub_size, sub_base, scale)

    raw = bytearray()
    for y in range(height):
        raw.append(0)                               # filter: none
        raw += px[y * width:(y + 1) * width]

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)

    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 0, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
            + chunk(b"IEND", b""))


def main():
    ok = True
    for p in products():
        code, sub = p["code"], p["colour"]
        url = "%s?v=%s" % (BASE_URL, code)
        grid = matrix(url)
        n = len(grid)

        stem = os.path.join(HERE, "warranty-%s" % code)
        open(stem + ".svg", "w").write(build_svg(grid, code, sub))
        open(stem + ".eps", "w").write(build_eps(grid, code, sub))
        open(stem + ".png", "wb").write(build_png(grid, code, sub))

        # Re-encode and compare, rather than trusting that nothing shifted.
        assert matrix(url) == grid
        print("%-8s %s" % (code, url))
        print("         %d x %d modules (version %d, ECC %s), label %r / %r"
              % (n, n, (n - 17) // 4, ECC, code, sub))
        print("         %.0f mm wide -> module %.2f mm"
              % (PRINT_MM, PRINT_MM / (n + 2 * QUIET)))
        if PRINT_MM / (n + 2 * QUIET) < 0.4:
            print("         WARNING: modules below 0.4 mm scan unreliably")
            ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
