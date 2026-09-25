# SUPERFLY Warranty Registration — Design

**Date:** 2026-09-24
**Company:** SUPERFLY (not Durian Bikers)
**Store:** superflymotos.com.my — Unicart (hosted OpenCart fork), LiteSpeed origin at 116.0.120.67
**Status:** Design approved in chat; spec awaiting operator review

> **Superseded in part, 2026-09-25.** The operator built the form page inside Unicart
> instead. Sections 4 (architecture), 5 (URL) and 7 (data model) no longer describe
> what is being built: there is no Cloudflare Pages app, no subdomain and no D1 —
> the form is an HTML block on a Unicart page posting to a Google Apps Script that
> writes to the Sheet and sends the confirmation. An `address` field was added.
> Sections 3, 6, 10, 11 and the print specification still hold. See `form/SETUP.md`.

---

## 1. Purpose

A warranty card is printed by the supplier and sealed inside each product box. The
customer scans its QR code, fills in their details and serial number, and their
warranty registration is recorded. Staff read the registrations as a spreadsheet.

Success means: a customer with a card in hand can register in under a minute on a
phone, and a staff member handling a claim can find that registration by serial
number in seconds.

## 2. Decisions already made

These were settled with the operator before this spec and are not open for
re-litigation during implementation.

| Decision | Choice | Consequence |
|---|---|---|
| Serial number | Customer types it | No per-unit labels, no serial database to pre-load, one QR artwork per product model |
| Product code | The Unicart SKU | QR carries the SKU; form resolves it to name + picture |
| On submit | Record it **and** email the customer | An email field is required on the form |
| Coverage | One product first | `SUS-AS-UNI-330-SC-BK` is the pilot |
| Staff backend | A spreadsheet | Google Sheet is the staff-facing surface; no admin panel is built |
| Form host | Own domain | `warranty.superflymotos.com.my`, not a third-party form URL |
| Language | English only | No Malay variant in scope |
| Warranty period | 6 months | Single flat period, all products |
| Expiry basis | From **registration** date | No purchase-date field; see 7.1 |

## 3. The constraint that governs everything

**Printed cards cannot be recalled.** Once the supplier prints and the cards are
sealed into boxes, the URL is frozen for the life of that stock. Every design
decision below is subordinate to this:

- The QR points at a domain SUPERFLY controls, so the destination can be
  re-pointed forever without reprinting.
- The form never hard-fails on an unknown SKU. A card that dead-ends is a card
  that has to be thrown away along with the stock it is sitting in.
- The URL path is short and stable. No query strings, no campaign parameters, no
  anything that might be rewritten later.

## 4. Architecture

```
card QR  →  https://warranty.superflymotos.com.my/r/<SKU>
                          ↓
              Cloudflare Pages + Functions
                          ↓
        GET  /r/<SKU>      renders form, product resolved from catalogue
        POST /api/register validates → D1 → Google Sheet → email
                          ↓
      D1 (durable record)  +  Google Sheet (what staff actually open)
```

**Why Cloudflare Pages.** The domain's nameservers are already Cloudflare
(`dean`/`jessica.ns.cloudflare.com`). The store's A record stays exactly as it is;
the warranty subdomain is one additional DNS record. The live shop is never in the
request path and cannot be affected by anything built here.

**Why not on the store itself.** The domain is DNS-only, not proxied through
Cloudflare — verified: the A record resolves straight to 116.0.120.67 and responses
carry a LiteSpeed header with no `cf-ray`. Serving `/warranty` on the apex would
mean routing the live shop's traffic through Cloudflare's proxy. That is not an
acceptable risk for a warranty form.

**Why not a hosted form tool.** Tally/Jotform links live on someone else's domain
and can be deleted, renamed, or moved behind a paywall. With cards already in
boxes, that failure is unrecoverable.

## 5. URL and QR contract

```
https://superflymotos.com.my/warranty/
```

- **Live and verified 2026-09-25:** HTTP 200, no redirect. 38 characters, QR
  version 4 at error correction Q, 33×33 modules.
- Trailing slash included deliberately — it is what the page's own `rel=canonical`
  declares, so a scan never costs a redirect hop even if a canonical rule is added.
- The URL carries **no SKU**. This page serves exactly one product. Additional
  products need their own page and their own QR (see `form/SETUP.md`).

**Print specification** (goes to the supplier with the artwork):

- Supply the **SVG**, never the PNG. Vector only.
- Minimum printed size **25mm**, 30mm preferred.
- Preserve the built-in quiet zone. Do not crop flush to the artwork.
- Dark on light, high contrast. No inverted or coloured codes, no gloss lamination
  directly over the code.
- **Scan a physical printed proof before the full run.** Screen previews hide ink
  bleed, contrast loss and undersizing.

## 6. Product catalogue

A committed `products.json` maps SKU → display name and image.

```json
{
  "SUS-AS-UNI-330-SC-BK": {
    "name": "SUSPENSION PROJECT AIR SUS UNIVERSAL 330MM SILVER CHROME / BLACK",
    "image": "/img/sus-as-uni-330-sc-bk.jpg"
  }
}
```

Rejected alternatives: scraping the Unicart product page (fragile, depends on the
store's markup and uptime) and a Unicart API (existence unconfirmed).

**Images are copied into the project, not hot-linked** from the store's CDN. A
hot-linked image breaks silently if Unicart reorganises its media paths, and the
card that points at it is already inside a sealed box.

**Unknown SKU behaviour:** the form still renders, with the scanned code shown as
plain text, a neutral placeholder image, and a free-text product-name field. The
registration is accepted and flagged `product_unknown` for staff. A card must never
dead-end.

## 7. Data model

### D1 table `registrations` — durable record

| Column | Notes |
|---|---|
| `id` | Reference number, `SF-WR-YYYY-NNNN`, `NNNN` allocated sequentially per calendar year by D1, zero-padded; shown to the customer and emailed |
| `created_at` | UTC ISO-8601; presented to staff as Asia/Kuala_Lumpur. This is the registration date |
| `expires_at` | `created_at` + 6 months, computed on insert and stored, not derived at read time |
| `sku` | As scanned, normalised uppercase |
| `product_name` | Resolved from catalogue, or customer-entered if unknown |
| `serial` | Trimmed, uppercased, internal whitespace collapsed |
| `customer_name` / `phone` / `email` | As entered |
| `flags` | `duplicate_serial`, `product_unknown` |
| `sheet_synced` | Whether the Google Sheet mirror succeeded |
| `ip_country` | Cloudflare-provided country only, for abuse triage |

### Google Sheet — the staff surface

One row appended per registration, same fields in the order above. Staff sort and
filter it exactly as they already do with the Qbee masterlist.

**Why both.** The Sheet alone is not safe as the only copy: if the Sheets API is
down or the sheet is renamed, moved or accidentally edited, a registration the
customer has already been told is confirmed would be lost. D1 is written first and
is authoritative; the Sheet is a mirror that can be rebuilt from it at any time.
Failed mirrors are retried, and `sheet_synced` makes gaps visible.

### 7.1 Warranty period and expiry

Cover is **6 months from the registration date**. `expires_at` is computed once at
insert and stored rather than calculated on read, so a later change to the warranty
policy cannot silently retro-date registrations that were already confirmed to
customers.

Purchase date is deliberately **not collected**. The operator chose registration
date as the basis with the trade-off stated: a customer who buys in January and
registers in November is covered until the following May — roughly 16 months of
effective cover against an intended 6 — and the record carries no evidence of when
the item was actually bought. The shorter the period, the larger this gap is in
proportion. This is a known, accepted
consequence — not an oversight — and switching to a purchase-date basis later means
adding a form field and reprinting nothing, since the QR is unaffected.

The expiry date is shown on the thank-you screen and stated in the confirmation
email.

### Duplicate serials

Accepted, then flagged — never rejected. A hard reject would strand a legitimate
customer whose serial was mis-keyed by somebody else, with no way to recover. Staff
see the flag and resolve it as a human question.

## 8. Form

Fields, in order: product (read-only, from the catalogue), **serial number**,
**full name**, **contact number**, **email**, consent checkbox.

- **English only.**
- Mobile-first. Most scans are a phone held over an open box.
- Phone accepts Malaysian formats with or without `+60`, spaces and dashes;
  normalised on save.
- Serial guidance text sits next to the field, telling the customer where to find
  it on the product.
- Client-side validation is convenience only; the Worker re-validates everything.
- On success: a thank-you screen showing the reference number and what happens next.

## 9. Email confirmation

**Verified DNS state:** `superflymotos.com.my` has **no MX, no SPF and no DMARC**
records. Two consequences:

1. Adding sender authentication cannot break existing mail on this domain, because
   there is none. This is a clean slate.
2. **That domain cannot receive replies.** With no MX, a customer replying to the
   confirmation email is replying into a void. `Reply-To` must therefore be set to a
   mailbox SUPERFLY actually reads, and the body must say where to get help.

Sending is via **Resend**, chosen for a clean Workers SDK and DNS-record setup that
Cloudflare can host directly, with SPF and DKIM added
as Cloudflare DNS records for the sending subdomain only. A `DMARC` record at
`p=none` is added for visibility.

Email contains: reference number, product, serial, submitted details, **the date
cover ends**, and the contact route for questions.

## 10. Abuse and privacy

- **Cloudflare Turnstile** (free, no puzzle for the user) plus a honeypot field.
- Per-IP rate limiting on `POST /api/register`.
- Secrets — the Google service-account key and the mail API key — live as Cloudflare
  secrets. Never in the repo.

**PDPA (Malaysia).** The form collects name, phone and email. It carries a short
plain-language purpose statement and a consent checkbox before submission. PII is
never written to logs.

**Retention: 18 months from registration** — the 6-month cover plus a year of grace
for late claims and disputes. After that, rows are purged. The operator can override this
before launch.

## 11. Explicitly out of scope

Not building these, and each would roughly double the work:

- **Per-brand or per-product warranty periods.** One flat 6-month period applies.
- **Purchase-date capture.** Excluded by the expiry-basis decision in 7.1.
- A **claims workflow** — this records registrations, it does not process claims.
- **Proof-of-purchase upload** (receipt photos).
- Any **write back to Unicart**. The store is untouched, read-only, out of the path.
- Staff **admin UI** — the Google Sheet is deliberately the entire backend.

## 12. Inputs required before implementation

1. **Google Sheet** — a sheet to write into, shared with the service account.
2. **Reply-To mailbox** — a real address that a person reads, since the sending
   domain cannot receive mail.
3. **Product image** for the pilot SKU, or permission to pull it from the store.
4. **Confirmation of the 18-month retention default** in section 10, or a different
   period.

## 13. Test plan

- Unit: SKU normalisation and case-insensitive match, serial normalisation, phone
  normalisation, duplicate detection, unknown-SKU fallback.
- Integration: successful registration writes D1 and appends to the Sheet; a forced
  Sheets API failure still persists to D1, marks `sheet_synced = false`, and still
  emails the customer.
- Abuse: honeypot submission rejected; rate limit trips.
- End to end: scan the physical printed card with a real phone, on mobile data
  rather than office wifi, and complete a registration.
- Regression guard: confirm `superflymotos.com.my` itself is unchanged — the store's
  A record and its responses must be byte-for-byte unaffected.

## 14. Rollout

1. Deploy to the Cloudflare Pages preview URL and test the flow end to end.
2. Add the `warranty` DNS record. Store A record untouched.
3. Add sender SPF/DKIM/DMARC records for mail.
4. Generate the pilot QR, send the SVG to the supplier, receive a printed proof.
5. **Scan the physical proof.** Only then approve the print run.
6. Widen to further SKUs by adding catalogue entries and generating codes in bulk.

**Bulk-generation note:** macOS filenames are case-insensitive, so two SKUs
differing only by case would silently overwrite one another and ship the wrong code
in a box. The bulk generator must detect collisions and fail loudly.
