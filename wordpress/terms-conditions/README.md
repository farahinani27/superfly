# Terms &amp; Conditions — superfly.durianbikers.com

The live page: <https://superfly.durianbikers.com/terms-conditions/> (page **128**).

## Where the pieces live

| Piece | File | Deployed by |
|---|---|---|
| Styling | `twentytwentyfour-child/assets/css/terms.css` | the theme |
| Enqueue | `twentytwentyfour-child/functions.php` (`superfly_terms_assets`) | the theme |
| Markup | `wordpress/terms-conditions/terms.html` | pasted into the page's Elementor HTML widget |
| Preview | `wordpress/terms-conditions/preview.html` | nowhere — links the other two |

This follows the theme's existing per-page convention, the same one
`assets/css/privacy.css` uses. The CSS is **not** in the page, and must not be
pasted back into the Elementor widget.

The one difference from privacy: that page's markup is a `wp:html` block,
this one's is an **Elementor HTML widget**, which brings a render cache — see
*Deploying the markup* below.

## Preview it locally

`preview.html` links the theme's real stylesheet and `fetch`es `terms.html`,
so it holds no copy of either. It needs a server rooted at the repo root — a
`file://` path will not work.

```bash
node revamp/tools/serve.js 8773 .
```

Then <http://localhost:8773/wordpress/terms-conditions/preview.html>.

## Naming

Every class is scoped under `.superfly-terms`, so nothing in `terms.css` can
affect the rest of the site. Names are plain and spelled out — no `sf-`
shorthand, no BEM `__` separators.

| Class | What it is |
|---|---|
| `.superfly-terms` | the whole block |
| `.superfly-terms-eyebrow` | the magenta dash + "SUPERFLY MOTOS · LEGAL" |
| `.superfly-terms-title` | the skewed headline |
| `.superfly-terms-word` | one line of the headline |
| `.superfly-terms-word-accent` | the line carrying the magenta bar |
| `.superfly-terms-intro` | the "Welcome to Superflymotos…" paragraph |
| `.superfly-terms-bar` | the "AGREEMENT TERMS / 09 CLAUSES" strip |
| `.superfly-terms-label` / `-count` | the two halves of that strip |
| `.superfly-terms-grid` | the two-column grid |
| `.superfly-terms-clause` | one clause panel |
| `.superfly-terms-number` | the skewed magenta 01–09 tab |
| `.superfly-terms-footer` / `-updated` / `-button` | the foot, the date, the CTA |

Custom properties follow the same rule: `--superfly-terms-accent`,
`--superfly-terms-font-title`, and so on.

Note this differs from the rest of the theme, which uses `sf-` and BEM
underscores (`.sf-hero`, `.sf-cat__cta`). Chosen for legibility; if the site
is ever standardised one way, this file should follow.

## Deploying the CSS

It ships with the theme — deploy `twentytwentyfour-child/` however the rest of
the theme gets there. `functions.php` enqueues it with `filemtime()` as the
version, so the cache busts on its own once the file lands.

It is matched on `is_page( 128 )`, **not** on the slug. WordPress gives the
privacy page a `privacy-policy` body class because that page is designated in
Settings → Privacy; there is no equivalent for terms. The carbon-weave
background in `terms.css` hangs off `body.page-id-128` for the same reason.
**If page 128 is ever recreated, both of those need updating.**

## Deploying the markup

Paste `terms.html` into the page's Elementor HTML widget, or push it over the
REST API. A REST write lands in the database, but the page keeps serving
Elementor's cached render until that cache is cleared — nothing reachable over
the *API* clears it (`_elementor_element_cache` and `_elementor_css` are
unregistered meta and are silently dropped).

**Over SSH it clears without a wp-admin visit** (verified 2026-09-28):

```bash
ssh -i ~/.ssh/durianbikers_vps -p 8288 durianbi@103.233.1.74
cd /var/www/vhosts/durianbikers.com/superfly.durianbikers.com
PHP=/opt/plesk/php/8.5/bin/php; WP=$(command -v wp)
"$PHP" "$WP" post meta delete 128 _elementor_element_cache
"$PHP" "$WP" elementor flush-css
"$PHP" "$WP" cache flush
```

wp-cli writes to the database directly and is not bound by the REST meta
whitelist. Run `wp` through the Plesk PHP binary — bare `wp` fails with
`/usr/bin/env: 'php': No such file or directory`.

Without SSH, it still needs a manual **Update** click in Elementor.

**Read the PowerShell warning in `CLAUDE.md` before writing Elementor data over
the API** — `ConvertTo-Json` corrupts it silently.

```bash
set -a; . ./.env; set +a
HTML=$(jq -Rs . wordpress/terms-conditions/terms.html)
DATA=$(printf '[{"id":"7983cfb","elType":"container","settings":[],"elements":[{"id":"011393b","elType":"widget","settings":{"html":%s},"elements":[],"widgetType":"html"}],"isInner":false}]' "$HTML")
curl -u "$WP_API_USER:$WP_APP_PASSWORD" \
  -X POST "$WP_BASE_URL/wp-json/wp/v2/pages/128" \
  -H 'Content-Type: application/json' \
  -d "$(jq -n --arg d "$DATA" '{meta:{_elementor_data:$d}}')"
```

Keep the container id `7983cfb` and widget id `011393b` — they are the page's
existing elements.

Then verify against the live page rather than trusting the 200:

```bash
curl -s https://superfly.durianbikers.com/terms-conditions/ | grep -c 'superfly-terms'
```

## The clause text is verbatim

The nine clauses and the opening paragraph are the live Unicart store's
wording, character for character, including its grammar (*"may be change, move
or delete"*, *"will be remain"*, *"if you are not satisfy"*). That is
deliberate. It is the binding text and rewriting it is the operator's call,
not a developer's.

### Two things the operator still needs to decide

- The original refers to **`www.superflymotos.com`** — without the `.my` — in
  **six** places. That domain does not exist; the store is `.com.my`. The
  opening paragraph uses the correct one, the six later mentions do not.
- **"Last updated — 28 September 2026"** in the footer is a placeholder.
