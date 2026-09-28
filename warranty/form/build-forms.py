#!/usr/bin/env python3
"""
Builds the single warranty page that covers every product.

One page, one form, one spreadsheet.

A warranty card carries ONE QR per product type, not per colour. The QR adds
?p=<product code> to the URL; the page then shows that product and offers only
its colours in a dropdown. The customer picks the colour themselves, because
one printed card is sealed into boxes of every colourway.

The colour they pick is the "variant" code the form submits, and it is also
the serial prefix - so a customer whose serial starts ASBKGD- will notice if
they picked SILVER CHROME. Code.gs receives the same variant codes it always
did and needs no change when this file is restructured.

An unknown or missing ?p= shows every product rather than dead-ending: a card
that leads nowhere is a card thrown away along with the stock it is sitting in.

To add a colour to an existing product:
  1. add it to that product's "variants" below
  2. add the same code to PRODUCTS in Code.gs
  3. run this script and paste the page
  (no new QR - the product's existing card already covers it)

To add a whole new product:
  1. add a PRODUCTS entry below with its own code and variants
  2. add each variant code to PRODUCTS in Code.gs
  3. run this script, paste the page, redeploy the script
  4. generate its QR:  python3 ../qr/make-qr.py

    python3 build-forms.py
"""

import base64, io, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT  = "warranty-page.html"

SCRIPT_URL = ("https://script.google.com/macros/s/"
              "AKfycbyBFBHHhdUSO9Kf94Z1JGooqXl6L2AzR5TdeCKVQSxKrm13zIgzgvefLsmayH3XbdnA/exec")

# One entry per product TYPE. "code" is what the QR carries as ?p=.
# Each variant's "code" is what the form submits and the serial prefix.
PRODUCTS = [
    {
        "code":  "SUS-AS-UNI-330",
        "name":  "SUPERFLY SUSPENSION PROJECT AIR SUS UNIVERSAL 330MM",
        "image": "product-SUS-AS-UNI-330-SC-BK.jpg",
        "variants": [
            {
                "code":   "ASSCBK",
                "sku":    "SUS-AS-UNI-330-SC-BK",
                "colour": "330MM SILVER CHROME / BLACK",
            },
            {
                "code":   "ASBKGD",
                "sku":    "SUS-AS-UNI-330-BK-GD",
                "colour": "330MM BLACK / GOLD",
            },
        ],
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


def product_html(p):
    """The panel naming the product, shown when its QR is scanned."""
    image = embed(p["image"]) if p["image"] else placeholder_image()
    skus = ", ".join(v["sku"] for v in p["variants"])
    return """      <div class="sfw-prod" data-product="%(code)s">
        <span class="sfw-imgbox">
          <img class="sfw-img" src="%(image)s" alt="%(alt)s">
        </span>
        <span class="sfw-prod-meta">
          <span class="sfw-pname">%(name)s</span>
          <span class="sfw-sku">%(skus)s</span>
        </span>
      </div>
""" % {
        "code":  p["code"],
        "image": image,
        "alt":   escape(p["name"]),
        "name":  escape(p["name"]),
        "skus":  escape(skus),
    }


def options_html(p):
    """That product's colours, as a group of <option>s."""
    rows = "".join(
        '        <option value="%s" data-prefix="%s" data-product="%s" '
        'data-sku="%s">%s</option>\n'
        % (v["code"], v["code"], p["code"], v["sku"], escape(v["colour"]))
        for v in p["variants"])
    return ('      <optgroup label="%s" data-product="%s">\n%s      </optgroup>\n'
            % (escape(p["name"]), p["code"], rows))


def main():
    template = io.open(os.path.join(HERE, "template.html"), encoding="utf-8").read()

    html = (template
            .replace("{{PRODUCTS}}", "".join(product_html(p) for p in PRODUCTS))
            .replace("{{OPTIONS}}",  "".join(options_html(p) for p in PRODUCTS))
            .replace("{{SCRIPT_URL}}", SCRIPT_URL))

    left = re.findall(r"\{\{[A-Z_]+\}\}", html)
    if left:
        sys.exit("unreplaced tokens: %s" % set(left))

    io.open(os.path.join(HERE, OUT), "w", encoding="utf-8").write(html)

    # Every variant code must be unique, or two colours collide in the sheet.
    seen = {}
    for p in PRODUCTS:
        for v in p["variants"]:
            if v["code"] in seen:
                sys.exit("duplicate variant code %s in %s and %s"
                         % (v["code"], seen[v["code"]], p["code"]))
            seen[v["code"]] = p["code"]

    print("wrote %s" % OUT)
    for p in PRODUCTS:
        flag = "" if p["image"] else "   [PLACEHOLDER IMAGE]"
        print("  /warranty?p=%s%s" % (p["code"], flag))
        for v in p["variants"]:
            print("      %-8s %-22s serial %s-nnnn"
                  % (v["code"], v["sku"], v["code"]))


if __name__ == "__main__":
    main()
