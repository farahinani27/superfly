# SUPERFLY

Malaysian motorcycle performance parts **brand** — suspension, sport rims, brake
systems and related technical parts for scooters and underbones. Products are
designed at Sepang International Circuit with most manufacturing done in
Malaysia. SUPERFLY sponsors Alonso Lopez (Moto2) and Ivan Ortola (Moto3), and
the "Ride. Race. Research." racing-feedback story is the brand's core
differentiator.

**SUPERFLY is not Durian Bikers.** Durian Bikers is a retailer of other
people's brands; SUPERFLY manufactures and sells its own. Same operator, two
separate companies, two separate repos. Do not mix their products, stock,
pricing or credentials.

---

## Two sites, one domain

| | Live store | New store (under construction) |
|---|---|---|
| URL | `https://superflymotos.com.my` | `https://superfly.durianbikers.com` |
| Platform | Unicart (hosted OpenCart fork) | WooCommerce / WordPress |
| Host | LiteSpeed at `116.0.120.67` | Exabytes / Plesk — the **same hosting account as durianbikers.com** |
| Customers | **Yes — real, live** | No, test bed only |
| Warranty form | Lives here today | Not built here yet |

`superfly.durianbikers.com` is a subdomain of *durianbikers.com* used purely as
a place to build. There is **no** `staging.superflymotos.com.my` — that host does
not exist; if you see it referenced anywhere, it is stale.

**The end state:** finish the WooCommerce build, point `superflymotos.com.my` at
it, verify, and only then cancel Unicart.

### Domain facts

- Registrar: **Exabytes**, expires 2028-09-14
- DNS: **Cloudflare** (`dean`/`jessica.ns.cloudflare.com`)
- `@` and `www` A records → `116.0.120.67` (Unicart, not Cloudflare-proxied)
- **No MX records** — there is no email on this domain
- `superflymotos.com` (.com) does not exist. The domain is `.com.my`.

---

## The warranty QR contract — do not break this

The supplier prints warranty cards (300+ pieces) that are sealed inside product
boxes. **A printed QR can never be changed.** Everything below is subordinate to
that.

The production QR artwork in `warranty/qr/` encodes exactly:

```
https://superflymotos.com.my/warranty?v=ASSCBK    (SUS-AS-UNI-330-SC-BK, black/silver)
https://superflymotos.com.my/warranty?v=ASBKGD    (SUS-AS-UNI-330-BK-GD, black/gold)
```

QR version 4 (33×33 modules), error correction level **Q**. Verified by
re-encoding each candidate URL and comparing the module matrix — not by eye.

The encoded domain is `superflymotos.com.my`, which is the domain being
**kept**. Only the platform underneath changes. So printed cards survive the
Unicart → WooCommerce migration, provided all of the following stay true:

1. The WooCommerce site serves a page whose slug is **exactly `warranty`**.
   Not `warranty-registration`, not `warranty-form`. WordPress will silently
   give you a different slug and nothing will look wrong until stickers are in
   customers' hands.
2. That page reads `?v=<code>` and preselects the product. If it ignores the
   parameter the form still works — the customer just picks manually — but the
   experience degrades.
3. **HTTPS is live on the new host before DNS moves.** A scan landing on a
   certificate warning is a dead card.
4. Add a permanent redirect from `/warranty` on the new site. If the form ever
   moves again, you edit one rule instead of reprinting 300 stickers.

**Cutover order, never deviate:** build on `superfly.durianbikers.com` → point
`superflymotos.com.my` at WooCommerce → verify `/warranty?v=ASSCBK` returns 200
and preselects → *then* cancel Unicart. Cancelling Unicart first kills every
printed card.

**Never print a QR pointing at `superfly.durianbikers.com`.** That host is
temporary scaffolding.

### The artwork is generated, not hand-drawn

`warranty/qr/make-qr.py` (stdlib only, needs `qrencode` on PATH) builds all
three formats per product and re-verifies the encoded URL afterwards by
re-encoding and comparing the module matrix:

```bash
python3 warranty/qr/make-qr.py
```

It reads `PRODUCTS` from `warranty/form/build-forms.py`, so the product codes
in the artwork cannot drift from the codes the form accepts. To add a product,
add it there — never hand-edit a `.svg` or `.eps`.

Each card prints the QR with the **product code and colour underneath**
(`ASSCBK` / `SILVER CHROME / BLACK`). This is not decoration: two bare QR codes
are indistinguishable to a human, so without the label a supplier or warehouse
can put the wrong sticker on the wrong box and nothing looks wrong until the
warranty data is already corrupt.

### Before anything goes to the printer

- Send the printer the **`.eps`**. It is true vector and exactly 30 mm wide.
  The `.png` is a preview, not a print file — it will not survive scaling.
- Minimum **25 mm** square if the printer rescales. Keep the white quiet zone:
  the artwork is 41 modules wide for a 33-module code precisely because of that
  4-module border. Cropping it is the classic failure.
- **Black on white.** The brand magenta (`#FF19AB`) on near-black does not
  reliably scan.
- **`warranty/qr/obsolete/` must never be printed.** Those files encode
  `warranty.superflymotos.com.my`, a host that does not exist, left over from
  the spec's abandoned architecture. They are kept only so nobody wonders where
  they went. See the `DO-NOT-PRINT.md` in there.

### A known tension

The original spec (`docs/superpowers/specs/2026-09-24-warranty-registration-design.md`,
section 3) says the URL should carry **no query strings**, because caching
layers can strip them. The shipped QR uses `?v=<code>` anyway. It works today
(verified: 200, no redirect, correct preselect), but on WooCommerce watch that
LiteSpeed page cache varies on the query string — see the equivalent
LiteSpeed caching traps on the Durian Bikers side.

---

## Repo layout

```
superfly-web/
├── revamp/     static home-page concept — no WordPress, no build step
├── warranty/   warranty form, QR artwork, Google Apps Script backend
├── docs/       design specs
└── .claude/    launch configs + agent memory
```

### `revamp/` — home page concept

A standalone concept rebuild of the superflymotos.com.my home page. **Nothing in
here touches the live store.** Plain HTML/CSS/JS, no build step:

```bash
python3 -m http.server 8770 --directory revamp
```

or `preview_start { name: "superfly-revamp" }`.

The section contract is fixed. One section = three files: `partials/<name>.html`
(a bare `<section id="name">`, no script/link/style), `css/<name>.css`, and
`js/<name>.js` exposing exactly one global `window.init<Name>()` that does
nothing on load. `js/main.js` fetches each partial into
`<div data-slot="name">` and then calls the init functions.

- `css/tokens.css` is the shared design system (`--sf-*` vars, `.sf-eyebrow`,
  `.sf-h2`, `.sf-lede`, `.sf-section`, `.sf-wrap`, `.sf-chip`). Do not redefine
  tokens or restyle primitives — scope everything under your own section id.
- **`partials/arsenal.html` is generated, not hand-written.** Its 364 SVG paths
  come out of `tools/arsenal-schematics.py` (stdlib only). Edit the generator
  and re-run it; never hand-edit the path data.
- `./bump.sh` rewrites the `?v=` cache-buster on local css/js references. Run it
  after editing so the browser cannot serve a stale file.
- Three.js is pinned to r147 — the last version with a UMD build, which is what
  keeps this a no-build project.
- Everything honours `prefers-reduced-motion` via a `D()` duration helper.

**Read `revamp/README.md` before changing anything there** — it lists which
data is real and which is invented placeholder (fitment tables, corner
annotations, spec chips), and which product images are colour studies rather
than photographs. Invented values are marked `†` in the page itself.

### `warranty/`

An HTML block pasted into a Unicart page, posting to a Google Apps Script that
appends to a Sheet and emails the customer. `warranty/form/SETUP.md` is the
runbook.

- Google account owner: **superflymotosofficial@gmail.com** (operator has the login)
- Apps Script web app must be deployed *Execute as: Me* / *Who has access: Anyone*
- The Sheet is the staff-facing surface — there is no admin panel
- Warranty period: **6 months**, from the registration date, all products
- **No real customer registrations yet** — but the QR codes must be correct
  now, because printing is imminent

---

## Deploying

### To the live Unicart store

By hand. The operator has the Unicart login and pastes HTML into the page
editor. Unicart is not developer-friendly and there is no API, no git deploy and
no staging copy of it. Use the editor's **Source / HTML / `<>`** view — a visual
editor mangles the markup.

### To the WooCommerce build

Content and store changes go through the WordPress/WooCommerce REST API, not by
editing theme files. Credentials live in the gitignored `.env` at the repo root
(`WP_BASE_URL`, `WP_API_USER`, `WP_APP_PASSWORD` — an Application Password, i.e.
an API token, not the login password). See `.env.example`.

```bash
set -a; . ./.env; set +a
curl -u "$WP_API_USER:$WP_APP_PASSWORD" "$WP_BASE_URL/wp-json/wc/v3/products"
```

PowerShell: load the vars from `.env`, then `Invoke-RestMethod` with a Basic
auth header. Never print or commit the password.

`.env` points at `superfly.durianbikers.com` — the **test** site. That is
deliberate. If it is ever repointed at a live host, every write hits production
immediately.

---

## Current state

1. **WooCommerce build in progress** at `superfly.durianbikers.com`.
2. **Stock and pricing are not loaded yet.** A SKU reconciliation has to happen
   first. Do not bulk-import products or prices until that is done.
3. **Payments:** Stripe is planned, matching the Durian Bikers setup. Not live.
4. **Warranty:** form is live on Unicart, no real registrations yet, QR artwork
   about to go to print.
5. **Home page revamp:** concept only, not deployed anywhere.

---

## Hard rules

- **Never edit the live Unicart store directly.** Same rule as Durian Bikers:
  local or test only.
- **Never push to a remote or deploy without asking the operator first.**
- **Never commit credentials, API keys or `.env` contents.**
- **Anything that would move stock quantities or money — stop and confirm first.**
- **Never change the warranty QR URL contract** without re-reading the section
  above. Printed cards cannot be recalled.
- Never hardcode absolute paths, and never assume the shell — the operator works
  across a Windows PC (PowerShell) and a Mac mini (zsh). Use paths relative to
  the repo root, and give both shell variants where a command is shell-specific.
- Do not generate, change or infer SKUs. Ask first.

---

## Conventions

- **Currency:** MYR. SST applies where relevant.
- **Brand colours:** magenta `#FF19AB` on near-black, with T-Blue `#29ABE2`
  picked up from the Project RA colourway.
- **Language:** English only on customer-facing warranty surfaces. Malay or
  English are both fine in conversation with the operator.
- Follow the conventions already present in whichever subfolder you are in.
  Read neighbouring files before writing new ones. Do not introduce a new CSS
  methodology or file-naming scheme without asking.

---

## Team

Two developers work in this repo, both using Claude Code, both able to pull and
push. Write commits, docs and specs so the other one can pick the work up
without the conversation that produced it.
