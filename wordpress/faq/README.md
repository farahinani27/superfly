# FAQ — superfly.durianbikers.com

The page: <https://superfly.durianbikers.com/faq/> — page **158**, published.

It must be assigned the **`page-full-width`** template, the same one the
privacy, terms and return-refund pages use. The default template renders the
page title above the content, which gives the page two headings — a serif
"FAQ" from the template and the block's own "FREQUENTLY ASKED QUESTIONS".

**Setting `template` over the REST API silently reverted `status` to
`draft`.** Send both fields in the same request:

```bash
curl -u "$WP_API_USER:$WP_APP_PASSWORD" -X POST "$WP_BASE_URL/wp-json/wp/v2/pages/158" \
  -H 'Content-Type: application/json' \
  --data-binary '{"status":"publish","template":"page-full-width"}'
```

Always read `status` back after any write to this page.

## Where the pieces live

| Piece | File | Deployed by |
|---|---|---|
| Styling | `twentytwentyfour-child/assets/css/faq.css` | the theme |
| Enqueue | `twentytwentyfour-child/functions.php` (`superfly_faq_assets`) | the theme |
| Body class | `twentytwentyfour-child/functions.php` (`superfly_faq_body_class`) | the theme |
| Markup | `wordpress/faq/faq.html` | the page's own `wp:html` block |
| Preview | `wordpress/faq/preview.html` | nowhere — links the other two |

Same per-page convention as `privacy.css` and `terms.css`. The CSS is **not**
in the page, and must not be pasted back into the block.

The markup is a **`wp:html` block**, like the privacy page — not an Elementor
HTML widget like terms. Page 158 was created fresh, so there was no reason to
take on Elementor's render cache and the manual-Update step it forces on every
edit. `_elementor_edit_mode` is deliberately not set: leave it that way, or
Elementor takes over the page and `post_content` stops rendering.

## Preview it locally

`preview.html` links the theme's real stylesheet and `fetch`es `faq.html`, so
it holds no copy of either. It needs a server rooted at the repo root — a
`file://` path will not work.

```bash
node revamp/tools/serve.js 8773 .
```

```powershell
node revamp/tools/serve.js 8773 .
```

Then <http://localhost:8773/wordpress/faq/preview.html>.

## The design

One column of hard-edged panels. Each question is a `<details>`, with its
number riding the top edge on a skewed magenta tab — the same device the terms
page uses for its clauses, so the two pages read as one family.

Question 01 is the only one marked `open`, so a visitor lands on one worked
example plus a clean index of the rest.

**There is no JavaScript on this page.** The folding is native
`<details>`/`<summary>`, which means it survives scripts being blocked, prints
correctly (the print rules force every answer open), and stays findable by the
browser's own in-page search — modern browsers expand a closed `<details>` to
reveal a match.

Unlike terms, the answers *do* fold. An FAQ is looked up one question at a time
rather than read through, and the binding-text argument that keeps the terms
page open does not apply here.

## Naming

Every class is scoped under `.superfly-faq`, so nothing in `faq.css` can affect
the rest of the site. Names are plain and spelled out — no `sf-` shorthand, no
BEM `__` separators.

| Class | What it is |
|---|---|
| `.superfly-faq` | the whole block |
| `.superfly-faq-eyebrow` | the magenta dash + "SUPERFLY MOTOS · CUSTOMER SERVICE" |
| `.superfly-faq-title` | the skewed headline |
| `.superfly-faq-word` | one line of the headline |
| `.superfly-faq-word-accent` | the line carrying the magenta bar |
| `.superfly-faq-intro` | the paragraph under the headline |
| `.superfly-faq-bar` | the "INDEX / 08 QUESTIONS" strip |
| `.superfly-faq-label` / `-count` | the two halves of that strip |
| `.superfly-faq-list` | the stack of panels |
| `.superfly-faq-item` | one question — a `<details>` |
| `.superfly-faq-question` | its `<summary>` |
| `.superfly-faq-sign` | the drawn +/− indicator |
| `.superfly-faq-answer` | the answer body |
| `.superfly-faq-steps` | a numbered procedure inside an answer |
| `.superfly-faq-note` | the magenta-ruled "read this bit" callout |
| `.superfly-faq-tail` / `-tail-heading` / `-tail-text` | the closing panel |
| `.superfly-faq-button` / `-button-label` | the CTA and its un-skewed label |
| `.superfly-faq-footer` | the closing line |

Custom properties follow the same rule: `--superfly-faq-accent`,
`--superfly-faq-font-title`, and so on.

The number on each panel comes from `data-number` on the `<details>`, read back
by CSS with `content: attr(data-number)`. It is positional decoration, not
content, so keeping it out of the text means a screen reader announces the
question rather than "01".

### No shorthand properties

`faq.css` sets every property longhand — `margin-top` rather than `margin`,
`border-bottom-width`/`-style`/`-color` rather than `border-bottom`,
`transition-property`/`-duration`/`-timing-function` rather than `transition`.

It is a longer file, but it can be skimmed and edited a line at a time without
having to work out which of four values a shorthand is quietly also resetting.
**Keep it that way** — a shorthand slipped into this file will reset siblings
that the rest of the file sets explicitly.

## Deploying the CSS

It ships with the theme — deploy `twentytwentyfour-child/` however the rest of
the theme gets there. `functions.php` enqueues it with `filemtime()` as the
version, so the cache busts on its own once the file lands.

It is matched on `is_page( 'faq' )` — **the slug**, not a page id. The
carbon-weave background hangs off a `superfly-faq-page` body class that
`superfly_faq_body_class()` adds on the same condition. So unlike the terms
page there is nothing to update if this page is ever deleted and recreated,
as long as the slug stays `faq`.

## Deploying the markup

Because it is a `wp:html` block and not Elementor, a REST write is the whole
job — there is no render cache and no manual Update click.

The `_elementor_data` PowerShell warning in `CLAUDE.md` does not apply here
(nothing is building a JSON array), but the general rule still does: build the
payload with a real JSON encoder, never by hand.

```bash
set -a; . ./.env; set +a
node -e '
  const fs = require("fs");
  const html = fs.readFileSync("wordpress/faq/faq.html", "utf8");
  const content = "<!-- wp:html -->\n" + html + "\n<!-- /wp:html -->";
  fs.writeFileSync("payload.json", JSON.stringify({ content }));
'
curl -u "$WP_API_USER:$WP_APP_PASSWORD" \
  -X POST "$WP_BASE_URL/wp-json/wp/v2/pages/158" \
  -H 'Content-Type: application/json' \
  --data-binary @payload.json
```

Then verify by reading it back, rather than trusting the 200 — compare the
stored markup against the file, not its length:

```bash
curl -s -u "$WP_API_USER:$WP_APP_PASSWORD" \
  "$WP_BASE_URL/wp-json/wp/v2/pages/158?context=edit" > read.json
node -e '
  const j = JSON.parse(require("fs").readFileSync("read.json", "utf8"));
  const stored = j.content.raw.replace(/<!-- \/?wp:html -->/g, "").trim();
  const local  = require("fs").readFileSync("wordpress/faq/faq.html", "utf8").trim();
  console.log("identical:", stored === local);
'
```

Once the page is published, the same check works against the front end:

```bash
curl -s https://superfly.durianbikers.com/faq/ | grep -c 'superfly-faq'
```

## Deployed 2026-09-28

`faq.css`, `terms.css` and `functions.php` were uploaded over SSH
(`durianbi@103.233.1.74:8288`, theme at
`/var/www/vhosts/durianbikers.com/superfly.durianbikers.com/wp-content/themes/twentytwentyfour-child`).
The previous `functions.php` is backed up at
`sf-theme-backups/20260928-143456-pre-faq/`.

`terms.css` had never been deployed either, so `/terms-conditions/` was live
but unstyled until this same upload. It is styled now.

### The server had a function the repo did not

The deployed `functions.php` contained `superfly_return_refund_assets()`,
added directly on the server and never committed. Overwriting the file with
the repo copy would have deleted it and unstyled `/return-refund/`.

It has been recovered into `twentytwentyfour-child/functions.php`. **Diff the
server copy against the repo before deploying this theme again** — the two had
drifted once and may drift again:

```bash
ssh -i ~/.ssh/durianbikers_vps -p 8288 durianbi@103.233.1.74 \
  'cat /var/www/vhosts/durianbikers.com/superfly.durianbikers.com/wp-content/themes/twentytwentyfour-child/functions.php' \
  | diff - twentytwentyfour-child/functions.php
```

Upload `functions.php` to a staging name and run `php -l` on it *before*
moving it into place — a syntax error there white-screens the whole site:

```bash
/opt/plesk/php/8.5/bin/php -l functions.php.incoming
```

## Still to do

1. **Add FAQ to the footer.** `parts/footer.html` lists the other information
   pages; the live Unicart footer has an FAQ link and this one does not yet.
2. **Sign off the two `CONTENT REVIEW` answers** — see below.
3. **Commit this work**, including the recovered `superfly_return_refund_assets()`.

## Two things the operator still needs to decide

Both are marked `CONTENT REVIEW` in `faq.html`.

- **Question 01, the ordering steps.** The live Unicart page describes that
  platform's multi-page checkout — a separate "Shipping Address" page, "next"
  buttons — which will not exist here. Rewritten for the WooCommerce checkout,
  but it should be walked through against the real checkout before launch.
- **Question 02, payment methods.** The live page names **PayPal** and
  **iPay88**, the Unicart gateways. `CLAUDE.md` records Stripe as planned and
  not live. The wording here is deliberately gateway-neutral ("handled by our
  payment provider at checkout") so it is not wrong either way, but it should
  name the real providers once they are decided.

Two further notes on what was *not* carried over from the live page:

- The live FAQ prints literal `<<Bank Name>>`, `<<bank account number>>` and
  `<<your account name>>` placeholders to customers. Those are dropped here
  rather than reproduced. If bank-transfer details should be shown on the page,
  the operator needs to supply the real ones.
- There is **no warranty question**, because the live FAQ has none. Given the
  warranty form and the QR cards going to print, this is probably the most
  valuable question to add — but the wording is the operator's to write.
