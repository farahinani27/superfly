# Return & Refund — superfly.durianbikers.com

The page: <https://superfly.durianbikers.com/return-refund/> — page **11**,
published, on the **`page-full-width`** template.

The slug is `return-refund`, **not** `return-refund-policy`. The FAQ's help
rail and several of the revamp concepts link `/return-refund/`; a rename
breaks all of them.

It must stay on `page-full-width`, the same template privacy, terms and the
FAQ use. The default template renders the page title above the content, which
gives the page two headings — a serif "Returns & Refunds Policy" from the
template and the block's own "RETURN & REFUND POLICY".

**Setting `template` over the REST API silently reverted `status` to `draft`**
on the FAQ page. Send both fields in the same request, and read `status` back
after any write:

```bash
curl -u "$WP_API_USER:$WP_APP_PASSWORD" -X POST "$WP_BASE_URL/wp-json/wp/v2/pages/11" \
  -H 'Content-Type: application/json' \
  --data-binary '{"status":"publish","template":"page-full-width"}'
```

## Where the pieces live

| Piece | File | Deployed by |
|---|---|---|
| Styling | `twentytwentyfour-child/assets/css/return-refund.css` | the theme |
| Enqueue | `twentytwentyfour-child/functions.php` (`superfly_return_refund_assets`) | the theme |
| Body class | `twentytwentyfour-child/functions.php` (`superfly_return_refund_body_class`) | the theme |
| Markup | `wordpress/return-refund/return-refund.html` | the page's Elementor HTML widget |
| Preview | `wordpress/return-refund/preview.html` | nowhere — links the other two |

Same per-page convention as `faq.css`, `privacy.css` and `terms.css`. The CSS
is **not** in the page and must not be pasted back into the block.

The markup is an **Elementor HTML widget**, like the terms page — *not* a
`wp:html` block. `_elementor_edit_mode` is `builder` here, so `post_content` is
not what renders: a REST write to `content` returns 200, updates `modified`,
and changes nothing a visitor sees.

The markup lives at `_elementor_data[0].elements[0].settings.html`, which is
exposed over REST as post meta:

```
GET  /wp-json/wp/v2/pages/11?context=edit   -> meta._elementor_data (a JSON string)
POST /wp-json/wp/v2/pages/11                -> { "meta": { "_elementor_data": "<json>" } }
```

Keep the existing container and widget ids when rewriting it, and assert on the
*parsed* shape afterwards (`elType`, `widgetType`, top-level count) rather than
on substrings. **Never build that JSON with PowerShell's `ConvertTo-Json`** — on
5.1 it serialises the outer array as `{"value":[...],"Count":1}`, which passes
every obvious check and which Elementor cannot parse. See the root `CLAUDE.md`.

**Elementor also caches the rendered widget**, and a REST write does not
invalidate it — `_elementor_element_cache` is unregistered meta and is silently
dropped over REST. Clear it with wp-cli over SSH:

```bash
ssh -i ~/.ssh/durianbikers_vps -p 8288 durianbi@103.233.1.74
cd /var/www/vhosts/durianbikers.com/superfly.durianbikers.com
PHP=/opt/plesk/php/8.5/bin/php
WP=$(command -v wp)
"$PHP" "$WP" post meta delete 11 _elementor_element_cache
"$PHP" "$WP" elementor flush-css
"$PHP" "$WP" cache flush
```

## Preview it locally

`preview.html` links the theme's real stylesheet and `fetch`es
`return-refund.html`, so it holds no copy of either. It needs a server rooted
at the repo root — a `file://` path will not work.

```bash
node revamp/tools/serve.js 8773 .
```

```powershell
node revamp/tools/serve.js 8773 .
```

Then <http://localhost:8773/wordpress/return-refund/preview.html>.

## The design

Three passes over the same policy, each longer than the last:

1. **Four numbered steps** — pack it, ship it back, we check it, refund in 15
   days. The rule on top of step 01 is magenta and the others are not, so the
   eye is told where the sequence starts without a "start here" label.
2. **Refundable / not refundable** — the conditions sorted into two columns.
3. **The policy in full** — the binding paragraph, set apart by a magenta rule
   and a wash of the same colour so it reads as quoted.
4. **The return address** and the email.

The masthead is the **contact and FAQ** title — upright, two stacked lines
with the second in magenta — not the italic-and-square masthead terms and
privacy use. A customer arrives here mid-problem the way they arrive on the
FAQ, so the page opens like the FAQ rather than like a legal document.

Green (`--superfly-return-ok`) appears here and nowhere else on the site. The
two lists are only tellable apart at a glance if they are different colours,
and magenta is already the "no refund" side. The tick and the cross carry the
same meaning, so colour is never the only signal.

Nothing folds. No `<details>`, no JavaScript at all: a policy is read through
once rather than looked up a line at a time, and an open page stays searchable
by the browser's own find and prints correctly.

## The text is the live store's, verbatim

The paragraph under "The policy in full" is the Unicart store's wording,
carried over unedited — including its grammar ("customer will received", "has
been used"). It is the binding text. Do not tidy it without the operator.

**The step strip and the two lists are a reading aid, not the policy.** They
restate that paragraph, and nothing enforces that they agree with it. If the
paragraph ever changes, re-check them against it line by line.

## Two things the policy does not say

Neither is invented on the page. Both need the operator before launch:

- **Who pays return shipping.**
- **Whether there is a deadline to start a return.** The 15 days is the refund
  *after* confirmation — it is not a window to send the goods back in.

## What changed on 2026-09-29

This page used to share `privacy.css` and `privacy.js` with the privacy
policy: the same two-column grid of neumorphic cards that opened one at a
time. It now has its own stylesheet and its own design.

Three things moved with it, and all three are in this repo:

- `superfly_return_refund_assets()` enqueues `return-refund.css` instead of
  `privacy.css`, and no longer enqueues `privacy.js` — there is nothing left
  on the page to expand.
- `superfly_return_refund_body_class()` is new. It adds `superfly-return-page`,
  which `return-refund.css` hangs the carbon-weave background off.
- `privacy.css` lost its `body.page-id-11` selector. That selector existed
  only because this page was dressed by that file and never gets WordPress's
  `privacy-policy` body class. It can no longer fire, because `privacy.css`
  no longer loads here.

`privacy.css` must not be edited on this page's behalf again — the two pages
are no longer the same design.

## Deploying

Not deployed yet. Two separate steps, and they can be done in either order —
the page renders unstyled but readable in between:

1. **The theme** — `return-refund.css` and the two `functions.php` changes go
   to the child theme on the host. `privacy.css` changed too; ship it in the
   same pass or the privacy page is unaffected either way, but the repo and
   the server drift.
2. **The markup** — write `return-refund.html` into the Elementor HTML widget
   in `_elementor_data` (see above), keeping the existing ids, then clear the
   render cache with wp-cli. Writing `content` does nothing on this page.

Back up the current `content` of page 11 before overwriting it — the existing
markup is the only copy of the old card layout, and it is not in this repo.
