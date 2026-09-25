# superfly-web

Everything for **SUPERFLY** (superflymotos.com.my) — the motorcycle performance
parts brand. Separate from the `durianbikers-web` repo.

> Read [`CLAUDE.md`](CLAUDE.md) before making changes. It carries the site
> topology, the warranty QR contract and the hard rules.

## What's in here

| Folder | What it is |
|---|---|
| `revamp/` | Static concept rebuild of the home page. Plain HTML/CSS/JS, no build step. Touches nothing live. |
| `warranty/` | Warranty registration form, QR artwork, and the Google Apps Script backend. |
| `docs/` | Design specs. |

## Getting started

```bash
git clone <this repo>
cd superfly-web
cp .env.example .env     # then fill in your own WordPress Application Password
```

Preview the home-page concept — no dependencies, no build:

```bash
python3 -m http.server 8770 --directory revamp
```

Then open <http://localhost:8770>. After editing CSS or JS, run `./revamp/bump.sh`
so the browser can't serve a stale file.

Preview the warranty form on its own:

```bash
python3 -m http.server 8771 --directory warranty/form
```

In Claude Code both are wired up already: `preview_start { name: "superfly-revamp" }`
and `preview_start { name: "warranty-form" }`.

## The two sites

- **Live:** <https://superflymotos.com.my> — Unicart, real customers. Changes go
  in by hand through the Unicart admin. Never edit it directly without the
  operator.
- **Being built:** <https://superfly.durianbikers.com> — WooCommerce on
  Exabytes/Plesk. A subdomain of durianbikers.com used as a test bed. There is
  no `staging.superflymotos.com.my`.

The plan is to finish the WooCommerce build, repoint `superflymotos.com.my` at
it, verify, and only then cancel Unicart.

## Before you touch the warranty QR codes

The printed cards cannot be recalled — 300+ are about to be printed. Read the
**warranty QR contract** section of `CLAUDE.md` first. In short: the QR encodes
`https://superflymotos.com.my/warranty?v=<code>`, the new site must serve a page
at exactly the slug `warranty`, and HTTPS must be live before DNS moves.

## Credentials

`.env` is gitignored and holds the WooCommerce REST credentials. Never commit
it, and never paste an Application Password into a file that is tracked.
