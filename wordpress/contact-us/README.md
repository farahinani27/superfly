# Contact Us — superfly.durianbikers.com

The page: <https://superfly.durianbikers.com/contact-us/> — page **162**, published.

This also clears the `/contact-us` 404 that `parts/footer.html` and the FAQ's
CTA were both pointing at.

## Where the pieces live

| Piece | File | Deployed by |
|---|---|---|
| Styling | `twentytwentyfour-child/assets/css/contact.css` | the theme |
| Enqueue | `twentytwentyfour-child/functions.php` (`superfly_contact_assets`) | the theme |
| Body class | `twentytwentyfour-child/functions.php` (`superfly_contact_body_class`) | the theme |
| Markup | `wordpress/contact-us/contact.html` | the page's own `wp:html` block |
| Preview | `wordpress/contact-us/preview.html` | nowhere — links the other two |

Same per-page convention as `faq.css`, `privacy.css` and `terms.css`. The CSS
is **not** in the page, and must not be pasted into the block.

The markup is a **`wp:html` block**, like privacy and FAQ — not an Elementor
widget like terms. `_elementor_edit_mode` is deliberately not set: leave it
that way, or Elementor takes over the page and `post_content` stops rendering.

It must stay on the **`page-full-width`** template, like the other information
pages. The default template prints the page title above the content, giving
the page two headings.

**Setting `template` over REST silently reverts `status` to `draft`.** Send
both fields in the same request, and read `status` back after any write:

```bash
curl -u "$WP_API_USER:$WP_APP_PASSWORD" -X POST "$WP_BASE_URL/wp-json/wp/v2/pages/162" \
  -H 'Content-Type: application/json' \
  --data-binary '{"status":"publish","template":"page-full-width"}'
```

## Preview it locally

`preview.html` links the theme's real stylesheet and `fetch`es `contact.html`,
so it holds no copy of either. It needs a server rooted at the repo root — a
`file://` path will not work.

```bash
node revamp/tools/serve.js 8773 .
```

Then <http://localhost:8773/wordpress/contact-us/preview.html>.

## Why the page is shaped like this

It is modelled on how manufacturers in this sector actually do it, not on a
generic contact template.

Brembo's corporate contact page segments by **who is asking** — Road Products,
Racing Products, Brembo Group — three routes that each go somewhere different,
with the registered address and VAT number stated plainly and no catch-all
form. So this page leads with three audiences:

```
01  Riders & customers      product, orders, delivery, returns, warranty
02  Dealers & distributors  trade accounts, wholesale, stock
03  Media & partnerships    press, samples, racing, sponsorship
```

then states the company formally beside the map, and puts the general enquiry
form **last**, as the fallback it is. A single form with a Subject dropdown is
a shop's contact page; this is a manufacturer's. Earlier drafts of this page
all used the shop pattern and none of them read as corporate.

The layout is **full width** — no centred max-width container. Running prose
is still capped by `max-width` on the individual paragraphs: a structural grid
is better full-bleed, a 200-character line of body copy is not, at any width.

## Naming

Every class is scoped under `.superfly-contact`, so nothing in `contact.css`
can affect the rest of the site. Names are plain and spelled out — no `sf-`
shorthand, no BEM `__` separators.

| Class | What it is |
|---|---|
| `.superfly-contact` | the whole block |
| `.superfly-contact-wrap` | the full-width gutter |
| `.superfly-contact-head` / `-eyebrow` / `-title` / `-sub` | the masthead |
| `.superfly-contact-title-end` | keeps the last word and the magenta square together |
| `.superfly-contact-bar` / `-bar-name` / `-bar-count` | a section rule |
| `.superfly-contact-routes` / `-route` | the three route cards |
| `.superfly-contact-route-number` / `-name` / `-text` / `-action` | inside one card |
| `.superfly-contact-company` / `-company-info` / `-company-map` | the company band |
| `.superfly-contact-detail` / `-detail-key` / `-detail-value` | one company-details row |
| `.superfly-contact-form` / `-form-row` / `-form-row-four` / `-field` / `-hint` | the form |
| `.superfly-contact-form-foot` / `-privacy` / `-submit` / `-submit-label` | the closing row |

Custom properties follow the same rule: `--superfly-contact-accent`,
`--superfly-contact-font-title`, and so on.

### No shorthand properties

`contact.css` sets every property longhand, the same rule `faq.css` follows.
**Keep it that way** — a shorthand slipped into this file will reset siblings
that the rest of the file sets explicitly.

## Things in the CSS that are load-bearing

- **Never put `clip-path` on an ancestor of the map iframe.** It stops Google
  Maps rendering its tiles at all — the frame loads, Google's own place card
  draws, and the map stays flat grey. Verified during design: setting
  `clip-path: none` at runtime brings the tiles straight back.
- **`.superfly-contact-submit` carries `margin-right: 3px`.** That is not a
  fudge. `skewX` leans the button without changing its layout box, so its
  bottom-right corner sits about `h/2 × tan(8°)` — roughly 3.3px at this
  height — further right than the box. Uncorrected, the button's visible edge
  overhangs the right edge of the fields above it on the right-aligned row.
  Every skewed button on the site has this property; it only becomes visible
  when something is right-aligned against a shared edge.
- **`.superfly-contact-form-foot` uses `flex-wrap: wrap-reverse`** so the
  button comes first when the row wraps on a narrow screen, rather than the
  action ending up underneath the small print.

## Deployed 2026-09-28

`contact.css` and `functions.php` uploaded over SSH
(`durianbi@103.233.1.74:8288`). Previous `functions.php` backed up to
`sf-theme-backups/20260928-162203-pre-contact/`.

`functions.php` was uploaded to a staging name and run through `php -l`
**before** being moved into place — a syntax error there white-screens the
whole site:

```bash
/opt/plesk/php/8.5/bin/php -l functions.php.incoming
```

**Diff the server copy against the repo before deploying this theme again.**
The two have drifted once already (`superfly_return_refund_assets()` existed
only on the server and would have been deleted):

```bash
ssh -i ~/.ssh/durianbikers_vps -p 8288 durianbi@103.233.1.74 \
  'cat /var/www/vhosts/durianbikers.com/superfly.durianbikers.com/wp-content/themes/twentytwentyfour-child/functions.php' \
  | diff - twentytwentyfour-child/functions.php
```

Verified live after deploy: `/contact-us/` 200, `contact.css` enqueued, body
class applied, three route cards, no duplicate title, map present; and
`/faq/`, `/terms-conditions/`, `/return-refund/`, `/privacy-policy/` all still
200 with their stylesheets serving.

---

## Still to do

### 1. The form has no backend

`action="#"` is a placeholder. **The form does not submit anywhere.** No form
handler is installed on this site — Elementor *free* has no Form widget (that
is Pro), and none of the other active plugins (ShopEngine, Essential Addons,
CURCY, LiteSpeed Cache, Image Optimization, WooCommerce, WP Mail SMTP) handle
submissions.

Options:

- install a forms plugin, or
- reuse the Google Apps Script pattern already proven by the warranty form
  (`warranty/form/SETUP.md`), which needs no plugin at all.

WP Mail SMTP being installed suggests outbound mail is already configured,
which helps either way.

**Until this is resolved, a visitor who fills the form in gets nothing and we
lose the enquiry silently.** That is worse than no form.

### 2. The routes are not really separate yet

The page presents dealer and media as distinct channels. They are not — all
three land in the same Gmail inbox, because `superflymotos.com.my` has **no MX
records**, so there are no mailboxes to route to.

This used to be admitted on the page itself with a `†` note under the dealer
and media addresses, but that is an internal to-do, not something a customer
needs; it now lives only in the HTML comment beside route 02. A
contact page whose three routes are the same address is still theatre, and a
distributor will notice. Email on the company's own domain (`sales@`,
`trade@`, `media@`) is what makes this design honest. That is a DNS and
hosting job, not a design one.

### 3. Values the operator has to supply

None of these appear on the page. They were previously rendered as `†
To be confirmed` placeholder rows, which read to a customer as an unfinished
site; the rows are now omitted entirely. Add the row back to `contact.html`
when the real value exists:

- **Telephone.** The `03-456 7554` in the live theme's header bar is a demo
  placeholder — `03` is Kuala Lumpur, the company is in Johor.
- **Company registration number.**
- **Opening hours.**

### 4. The address disagrees with Google's own listing

The page says *Taman Mount Austin*; the Google listing on the pin this page
embeds says *Kawasan Perindustrian Tiong Nam*. Same street, number and
postcode. One of them is stale, and the map is what customers navigate by.

### 5. The live Unicart contact page

It still shows a heading reading "SCAN QR CODE BELOW" with no QR image under
it. Not this page's problem, but worth fixing while it is still the live
store.
