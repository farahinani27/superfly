# Warranty form — setup

Three parts: a Google Sheet, an Apps Script that writes to it, and the HTML block
pasted into the Unicart page.

---

## 1. Create the spreadsheet

New Google Sheet, name it something like `SUPERFLY Warranty Registrations`.
Do not add headers — the script creates a `Registrations` tab and its headers on the
first submission.

## 2. Add the script

In that sheet: **Extensions → Apps Script**. Delete the placeholder code, paste all
of `Code.gs`, then change one line near the top:

```js
var REPLY_TO = 'REPLACE_WITH_A_MAILBOX_YOU_READ';
```

This is where customers land if they reply to their confirmation email. It must be a
mailbox somebody actually checks.

Save.

## 3. Deploy it

**Deploy → New deployment → Web app**

| Setting | Value |
|---|---|
| Execute as | **Me** |
| Who has access | **Anyone** |

"Anyone" is required — customers are not signed in to Google. The script only ever
appends rows; it exposes no way to read the sheet.

Google will ask you to authorise it once. It needs permission to edit the sheet and
to send email as you. Copy the **Web app URL**, which ends in `/exec`.

## 4. Put the URL in the form

Open `paste-into-unicart.html` and replace:

```
action="PASTE_YOUR_APPS_SCRIPT_URL_HERE"
```

with your `/exec` URL. That is the only edit needed.

## 5. Paste into Unicart

Paste the whole block into the warranty page's content editor. If the editor has a
**Source / HTML / `<>`** view, use it — a visual editor will mangle the markup.

## 6. Test before printing anything

Submit the form yourself and confirm all three happen:

1. A row appears in the sheet, with a reference like `SF-WR-2026-0001`.
2. The confirmation email arrives.
3. The page shows the success panel.

Then **re-test on a phone over mobile data**, not office wifi.

---

## If the success panel does not appear

The page still works — Unicart has stripped the `<script>` block. The form falls back
to posting normally and the confirmation renders as its own styled page with a "Back
to shop" button. Nothing is lost; it is just a different experience.

The row and the email are the parts that matter, and neither depends on JavaScript.

## Quotas

Apps Script sends 100 emails/day on a free Gmail account, 1,500/day on Workspace.
Well beyond warranty volume, but worth knowing the ceiling exists.

## Adding more products

Copy the block to a new page and change three things: the `<img src>`, the
`.sfw-pname` heading, and both the `sku` hidden input and the `.sfw-sku` badge.
Everything else is identical. One page per product.

The image is embedded directly in the HTML as base64, so there is nothing to upload
and no image URL that can break later.
