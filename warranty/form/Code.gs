/**
 * ============================================================================
 * SUPERFLY - WARRANTY REGISTRATION ENDPOINT
 * ============================================================================
 *
 * Receives the warranty form posted from the Unicart page, appends a row to
 * this spreadsheet, emails the customer a confirmation, and returns a styled
 * thank-you page.
 *
 * Warranty cover is 6 MONTHS from the REGISTRATION date.
 *
 * TO DEPLOY:
 *   Deploy > New deployment > Web app
 *     Execute as:      Me
 *     Who has access:  Anyone
 *   Then copy the /exec URL into the form's action attribute.
 *
 * "Anyone" is required because customers are not signed in to Google.
 * This script only ever appends rows - it exposes no way to read the sheet.
 * ============================================================================
 */


/* ---------------------------------------------------------------------------
 * SETTINGS - change these
 * ------------------------------------------------------------------------- */

/**
 * Where replies to the customer's confirmation email go.
 *
 * Leave it as the placeholder and no Reply-To is set at all - the email
 * still sends. It is NOT allowed to break sending, because a customer who
 * registered deserves their confirmation either way.
 */
var REPLY_TO = 'REPLACE_WITH_A_MAILBOX_YOU_READ';

/**
 * Staff notification. Set this to your own address to get an email every
 * time a customer registers. Leave it empty to switch notifications off.
 *
 * Example:  var NOTIFY_STAFF = 'admin@superflymotos.com.my';
 */
var NOTIFY_STAFF = '';

/** How long cover lasts, in months. */
var COVER_MONTHS = 6;

/** Tab the registrations are written to. Created automatically. */
var SHEET_NAME = 'Registrations';

/** Linked at the bottom of the thank-you page. */
var SHOP_URL = 'https://superflymotos.com.my/';

/**
 * The products this form covers.
 *
 * The card's QR carries only the short code (e.g. ASSCBK). Everything else
 * is resolved here, server-side, so the record is correct even if the
 * customer's browser ran no JavaScript at all.
 *
 * To add a product: add an entry here AND to PRODUCTS in build-forms.py,
 * then regenerate the page and a QR for /warranty?v=<code>.
 */
var PRODUCTS = {
  'ASSCBK': {
    sku:    'SUS-AS-UNI-330-SC-BK',
    name:   'SUPERFLY SUSPENSION PROJECT AIR SUS UNIVERSAL 330MM SILVER CHROME / BLACK',
    colour: 'SILVER CHROME / BLACK'
  },
  'ASBKGD': {
    sku:    'SUS-AS-UNI-330-BK-GD',
    name:   'SUPERFLY SUSPENSION PROJECT AIR SUS UNIVERSAL 330MM BLACK / GOLD',
    colour: 'BLACK / GOLD'
  }
};

/**
 * Spreadsheet column order.
 *
 * Do NOT reorder these columns in the sheet itself - the script finds
 * Serial and Phone by name against this list, and reordering would send
 * values to the wrong columns.
 */
var HEADERS = [
  'Reference',
  'Registered (MYT)',
  'Expires (MYT)',
  'SKU',
  'Colour',
  'Product',
  'Serial',
  'Name',
  'Phone',
  'Email',
  'Address',
  'Flags'
];


/* ---------------------------------------------------------------------------
 * ENTRY POINTS
 * ------------------------------------------------------------------------- */

/**
 * Someone opening the script URL in a browser. Only used to check it is live.
 */
function doGet() {
  return HtmlService.createHtmlOutput('SUPERFLY warranty endpoint is running.');
}


/**
 * The warranty form being submitted.
 */
function doPost(e) {

  try {

    var params = (e && e.parameter) ? e.parameter : {};

    // Honeypot. Real customers never see this field, so anything that
    // arrives with it filled in is a bot. Show a normal-looking page so
    // the bot cannot tell it was rejected, but save nothing.
    if (params.website) {
      return buildPage('Thank you', 'Your registration has been received.');
    }

    var name    = clean(params.name);
    var phone   = clean(params.phone);
    var address = clean(params.address);
    var email   = clean(params.email);
    // The variant code decides the product. Anything the browser sent for
    // sku / product_name is only a fallback for an older printed card.
    var variant = clean(params.variant).toUpperCase();
    var known   = PRODUCTS[variant] || null;

    var sku     = known ? known.sku    : clean(params.sku).toUpperCase();
    var product = known ? known.name   : clean(params.product_name);
    var colour  = known ? known.colour : '';

    // The serial is split in two: a prefix the product fixes (e.g. ASSCBK)
    // and the number the customer types. They are joined here rather than
    // in the browser, so the prefix is right even with no JavaScript.
    var serial = buildSerial(params, variant);

    // --- validate -----------------------------------------------------

    var missing = [];

    if (!name)    { missing.push('name');          }
    if (!phone)   { missing.push('phone');         }
    if (!address) { missing.push('address');       }
    if (!email)   { missing.push('email');         }
    if (!serial)  { missing.push('serial number'); }

    if (missing.length > 0) {
      return buildPage(
        'Something is missing',
        'Please go back and fill in: ' + missing.join(', ') + '.',
        true
      );
    }

    if (!isValidEmail(email)) {
      return buildPage(
        'Check your email address',
        'That email address does not look right. Please go back and correct it.',
        true
      );
    }

    // --- save ---------------------------------------------------------

    // Only one submission may write at a time. Without this lock, two
    // customers registering in the same second could be given the same
    // reference number.
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);

    var reference;
    var registeredOn;
    var expiresOn;

    try {

      var sheet = getSheet();
      var now   = new Date();

      registeredOn = formatDate(now);
      expiresOn    = formatDate(addMonths(now, COVER_MONTHS));
      reference    = buildReference(sheet, now);

      var flags = [];

      if (isDuplicateSerial(sheet, serial)) {
        // Flagged, never rejected. A hard reject would strand a genuine
        // customer whose serial somebody else mis-typed first.
        flags.push('duplicate_serial');
      }

      sheet.appendRow([
        reference,
        registeredOn,
        expiresOn,
        sku,
        colour,
        product,
        serial,
        name,
        phone,
        email,
        address,
        flags.join(' ')
      ]);

    } finally {
      lock.releaseLock();
    }

    // --- confirm ------------------------------------------------------

    sendConfirmation(email, name, reference, product, serial,
                     registeredOn, expiresOn);

    return buildPage(
      'Warranty registered',
      'Thank you, ' + escapeHtml(name) + '. ' +
      'Your reference is <b>' + reference + '</b>.<br><br>' +
      'Cover runs until <b>' + expiresOn + '</b>. ' +
      'A confirmation email is on its way to ' + escapeHtml(email) + '.',
      false,
      reference
    );

  } catch (err) {

    // Never show a customer a raw error. Log it for us instead.
    console.error(err);

    return buildPage(
      'We could not complete that',
      'Something went wrong on our side and your registration was not saved. ' +
      'Please try again, or contact us and we will register it for you.',
      true
    );
  }
}


/* ---------------------------------------------------------------------------
 * SPREADSHEET
 * ------------------------------------------------------------------------- */

/**
 * Returns the registrations tab, creating it and its header row if needed.
 */
function getSheet() {

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet       = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else {
    repairHeaderRow(sheet);
  }

  forceTextColumns(sheet);

  return sheet;
}


/**
 * Brings an existing sheet's header row up to date.
 *
 * When a column is added to HEADERS, a sheet created earlier still carries
 * the old header. Left alone, new rows would be wider than the headings and
 * staff would read the wrong column titles. Only the headings are touched -
 * existing data is never moved.
 */
function repairHeaderRow(sheet) {

  var width   = Math.max(sheet.getLastColumn(), HEADERS.length);
  var current = sheet.getRange(1, 1, 1, width).getValues()[0];

  var matches = true;

  for (var i = 0; i < HEADERS.length; i++) {
    if (String(current[i] || '') !== HEADERS[i]) {
      matches = false;
      break;
    }
  }

  if (matches) {
    return;
  }

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
}


/**
 * Forces Serial and Phone to plain-text format.
 *
 * Without this, Google Sheets treats an all-digit value as a number and
 * silently strips leading zeros - so a Malaysian mobile typed as
 * 0123456789 would be stored as 123456789. Every Malaysian mobile number
 * begins with 0, so this would corrupt most phone numbers collected.
 *
 * Applied on every call rather than only at creation, so sheets made
 * before this fix existed are corrected too. Setting a number format is
 * idempotent and cheap.
 */
function forceTextColumns(sheet) {

  var textColumns = ['Serial', 'Phone'];

  for (var i = 0; i < textColumns.length; i++) {

    var columnNumber = HEADERS.indexOf(textColumns[i]) + 1;

    if (columnNumber > 0) {
      sheet
        .getRange(1, columnNumber, sheet.getMaxRows(), 1)
        .setNumberFormat('@');
    }
  }
}


/**
 * Builds the next reference, e.g. SF-WR-2026-0001.
 * Numbering restarts each calendar year.
 */
function buildReference(sheet, now) {

  var prefix  = 'SF-WR-' + now.getFullYear() + '-';
  var lastRow = sheet.getLastRow();
  var highest = 0;

  if (lastRow > 1) {

    var existing = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

    for (var i = 0; i < existing.length; i++) {

      var value = String(existing[i][0] || '');

      if (value.indexOf(prefix) === 0) {
        var number = parseInt(value.substring(prefix.length), 10);
        if (number > highest) {
          highest = number;
        }
      }
    }
  }

  return prefix + padNumber(highest + 1, 4);
}


/**
 * Has this serial number already been registered?
 */
function isDuplicateSerial(sheet, serial) {

  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return false;
  }

  var column = HEADERS.indexOf('Serial') + 1;
  var values = sheet.getRange(2, column, lastRow - 1, 1).getValues();

  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').toUpperCase() === serial) {
      return true;
    }
  }

  return false;
}


/* ---------------------------------------------------------------------------
 * EMAIL
 * ------------------------------------------------------------------------- */

/**
 * Emails the customer their confirmation.
 *
 * A failure here is logged but never thrown: the row is already saved, and
 * losing a registration because an email bounced would be far worse.
 */
function sendConfirmation(email, name, reference, product, serial,
                          registeredOn, expiresOn) {

  var subject = 'SUPERFLY warranty registered - ' + reference;

  var body = [
    'Hi ' + name + ',',
    '',
    'Your warranty is registered.',
    '',
    'Reference:   ' + reference,
    'Product:     ' + product,
    'Serial:      ' + serial,
    'Registered:  ' + registeredOn,
    'Cover until: ' + expiresOn,
    '',
    'Keep this email. You will need the reference number if you make a claim.',
    '',
    'SUPERFLY',
    SHOP_URL,
    ''
  ].join('\n');

  var options = {
    to:      email,
    subject: subject,
    body:    body,
    name:    'SUPERFLY'
  };

  // Only set Reply-To if it is a real address. An unedited placeholder
  // would make MailApp throw and the customer would get nothing.
  if (isValidEmail(REPLY_TO)) {
    options.replyTo = REPLY_TO;
  }

  try {
    MailApp.sendEmail(options);
  } catch (err) {
    console.error('Customer email failed for ' + reference + ': ' + err);
  }

  notifyStaff(reference, product, serial, name, email, expiresOn);
}


/**
 * Emails staff that a new registration has arrived.
 *
 * Silent no-op when NOTIFY_STAFF is empty. Failures are logged and never
 * thrown - the registration is already saved and must not be put at risk
 * by a notification problem.
 */
function notifyStaff(reference, product, serial, name, email, expiresOn) {

  if (!isValidEmail(NOTIFY_STAFF)) {
    return;
  }

  var body = [
    'New warranty registration.',
    '',
    'Reference:   ' + reference,
    'Customer:    ' + name,
    'Email:       ' + email,
    'Product:     ' + product,
    'Serial:      ' + serial,
    'Cover until: ' + expiresOn,
    '',
    'Full details are in the Registrations tab of the spreadsheet.',
    ''
  ].join('\n');

  try {
    MailApp.sendEmail({
      to:      NOTIFY_STAFF,
      subject: 'New warranty registration - ' + reference,
      body:    body,
      name:    'SUPERFLY Warranty'
    });
  } catch (err) {
    console.error('Staff notification failed for ' + reference + ': ' + err);
  }
}


/* ---------------------------------------------------------------------------
 * THANK-YOU / ERROR PAGE
 * ------------------------------------------------------------------------- */

/**
 * Builds the page the customer sees.
 *
 * Normally this renders inside the form's hidden frame and is never seen,
 * because the page swaps in its own success panel. It becomes the visible
 * confirmation when the page's JavaScript has been stripped or blocked.
 */
function buildPage(title, message, isError, reference) {

  var accent = isError ? '#b3001b' : '#FF001A';

  // Tells the warranty page whether this actually succeeded.
  //
  // The page cannot read this frame's contents - it is served from Google's
  // domain, and the browser forbids cross-origin reads. So the result is
  // announced explicitly instead. Without this the page would have to assume
  // success merely because the frame finished loading, and would tell a
  // customer they were registered when nothing had been saved.
  var payload = JSON.stringify({
    source:    'superfly-warranty',
    ok:        !isError,
    reference: reference || ''
  });

  var announce =
    '<scr' + 'ipt>try{window.top.postMessage(' + payload + ',"*");}catch(e){}</scr' + 'ipt>';

  var styles = {
    body:    'margin:0;background:#121212;color:#e6e6e6;' +
             'font:15px/1.6 Helvetica,Arial,sans-serif;' +
             'padding:36px 18px;text-align:center',

    card:    'max-width:520px;margin:0 auto;background:#1a1a1a;' +
             'border:1px solid ' + accent + ';border-radius:10px;' +
             'padding:38px 26px',

    heading: 'margin:0 0 14px;color:#fff;text-transform:uppercase;' +
             'letter-spacing:.04em;font-size:20px',

    text:    'margin:0 0 26px;color:#b5b5b5',

    button:  'display:inline-block;background:' + accent + ';color:#fff;' +
             'text-decoration:none;padding:13px 26px;border-radius:6px;' +
             'font-weight:700;letter-spacing:.08em;' +
             'text-transform:uppercase;font-size:13px'
  };

  var html = [
    '<!doctype html>',
    '<html>',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width,initial-scale=1">',
    '  <title>' + escapeHtml(title) + '</title>',
    '</head>',
    '<body style="' + styles.body + '">',
    '  <div style="' + styles.card + '">',
    '    <h2 style="' + styles.heading + '">' + escapeHtml(title) + '</h2>',
    '    <p style="' + styles.text + '">' + message + '</p>',
    '    <a href="' + SHOP_URL + '" style="' + styles.button + '">Back to shop</a>',
    '  </div>',
    announce,
    '</body>',
    '</html>'
  ].join('\n');

  return HtmlService
    .createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/* ---------------------------------------------------------------------------
 * SMALL HELPERS
 * ------------------------------------------------------------------------- */

/**
 * Adds months to a date.
 *
 * Guards against month-end overflow: 31 August plus 6 months must land on
 * 28 February, not roll forward into March.
 */
function addMonths(date, months) {

  var dayOfMonth = date.getDate();
  var result     = new Date(date.getTime());

  result.setMonth(result.getMonth() + months);

  if (result.getDate() < dayOfMonth) {
    result.setDate(0);
  }

  return result;
}


/** Formats a date in Malaysian time, for staff and customers. */
function formatDate(date) {
  return Utilities.formatDate(date, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd HH:mm');
}


/** Pads a number with leading zeros, e.g. padNumber(7, 4) -> "0007". */
function padNumber(number, width) {

  var text = String(number);

  while (text.length < width) {
    text = '0' + text;
  }

  return text;
}


/** Trims a submitted value and collapses runs of whitespace. */
function clean(value) {

  if (value === null || value === undefined) {
    return '';
  }

  return String(value).replace(/\s+/g, ' ').trim();
}


/**
 * Assembles the serial number.
 *
 * The prefix belongs to the product, so it is derived from the variant
 * code rather than trusted from the browser. Accepts:
 *
 *   variant + serial_number     ->  "ASSCBK-01234"
 *   serial_number already whole ->  "ASSCBK-01234" (not doubled up)
 *   serial                      ->  used as-is, for older printed cards
 */
function buildSerial(params, variant) {

  var whole = clean(params.serial).toUpperCase();

  if (whole) {
    return whole;
  }

  var typed = clean(params.serial_number).toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (!typed) {
    return '';
  }

  // Prefer the prefix implied by the variant; fall back to what was posted.
  var prefix = variant && PRODUCTS[variant]
    ? variant
    : clean(params.serial_prefix).toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (!prefix) {
    return typed;
  }

  // A customer who typed the prefix as well must not get it twice.
  if (typed.indexOf(prefix) === 0) {
    var rest = typed.substring(prefix.length);
    return rest ? (prefix + '-' + rest) : prefix;
  }

  return prefix + '-' + typed;
}


/** Loose email check - catches typos, not a full RFC validation. */
function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}


/** Escapes text before putting it into the HTML page. */
function escapeHtml(text) {

  var replacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  return String(text).replace(/[&<>"']/g, function (character) {
    return replacements[character];
  });
}
