#!/usr/bin/env python3
"""
Builds the single warranty page that covers every product.

One page, one form, one spreadsheet. The card's QR adds ?v=<code> to the
URL so the right product is preselected; the customer can still change it,
and the page works unchanged if no JavaScript runs.

To add a product:
  1. add an entry to PRODUCTS below
  2. add the same code to PRODUCTS in Code.gs
  3. run this script, paste the page, redeploy the script
  4. generate a QR for  /warranty?v=<code>

    python3 build-forms.py
"""

import base64, io, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT  = "warranty-page.html"

SCRIPT_URL = ("https://script.google.com/macros/s/"
              "AKfycbyBFBHHhdUSO9Kf94Z1JGooqXl6L2AzR5TdeCKVQSxKrm13zIgzgvefLsmayH3XbdnA/exec")

# "code" is both the QR parameter and the serial prefix.
PRODUCTS = [
    {
        "code":   "ASSCBK",
        "sku":    "SUS-AS-UNI-330-SC-BK",
        "name":   "SUPERFLY SUSPENSION PROJECT AIR SUS UNIVERSAL 330MM SILVER CHROME / BLACK",
        "colour": "SILVER CHROME / BLACK",
        "image":  "product-SUS-AS-UNI-330-SC-BK.jpg",
    },
    {
        "code":   "ASBKGD",
        "sku":    "SUS-AS-UNI-330-BK-GD",
        "name":   "SUPERFLY SUSPENSION PROJECT AIR SUS UNIVERSAL 330MM BLACK / GOLD",
        "colour": "BLACK / GOLD",
        "image":  None,          # real photo still needed
    },
]


def placeholder_image():
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="140" height="180">'
           '<rect width="100%" height="100%" fill="#e9e9e9"/>'
           '<rect x="6" y="6" width="128" height="168" fill="none" '
           'stroke="#b3001b" stroke-width="3" stroke-dasharray="8 6"/>'
           '<text x="70" y="85" text-anchor="middle" font-family="Helvetica,Arial" '
           'font-size="13" font-weight="bold" fill="#b3001b">PHOTO</text>'
           '<text x="70" y="103" text-anchor="middle" font-family="Helvetica,Arial" '
           'font-size="13" font-weight="bold" fill="#b3001b">NEEDED</text></svg>')
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()


def embed(filename):
    path = os.path.join(HERE, filename)
    if not os.path.exists(path):
        sys.exit("missing image file: " + path)
    kind = "jpeg" if path.lower().endswith((".jpg", ".jpeg")) else "png"
    with open(path, "rb") as fh:
        return "data:image/%s;base64,%s" % (kind, base64.b64encode(fh.read()).decode())


def escape(text):
    return (text.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace('"', "&quot;"))


def choice_html(p, first):
    image = embed(p["image"]) if p["image"] else placeholder_image()
    return """      <label class="sfw-choice">
        <input
          type="radio"
          name="variant"
          value="%(code)s"
          data-prefix="%(code)s"
          %(checked)srequired>
        <span class="sfw-choice-box">
          <span class="sfw-imgbox">
            <img class="sfw-img" src="%(image)s" alt="%(alt)s">
          </span>
          <span class="sfw-choice-meta">
            <span class="sfw-pname">%(name)s</span>
            <span class="sfw-sku">%(sku)s</span>
          </span>
          <span class="sfw-choice-mark">&#10003;</span>
        </span>
      </label>
""" % {
        "code":    p["code"],
        "image":   image,
        "alt":     escape(p["name"]),
        "name":    escape(p["name"]),
        "sku":     p["sku"],
        "checked": "" if not first else "",
    }


def main():
    template = io.open(os.path.join(HERE, "template.html"), encoding="utf-8").read()

    choices = "".join(choice_html(p, i == 0) for i, p in enumerate(PRODUCTS))
    html = template.replace("{{CHOICES}}", choices).replace("{{SCRIPT_URL}}", SCRIPT_URL)

    left = re.findall(r"\{\{[A-Z_]+\}\}", html)
    if left:
        sys.exit("unreplaced tokens: %s" % set(left))

    io.open(os.path.join(HERE, OUT), "w", encoding="utf-8").write(html)

    print("wrote %s" % OUT)
    for p in PRODUCTS:
        flag = "" if p["image"] else "   [PLACEHOLDER IMAGE]"
        print("  /warranty?v=%-8s %-22s serial %s-nnnn%s"
              % (p["code"], p["sku"], p["code"], flag))


if __name__ == "__main__":
    main()
