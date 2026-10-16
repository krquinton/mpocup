/**
 * MPO Cup 2026 - Email webhook (Google Apps Script)
 *
 * One Web App, three actions (sent as JSON in the POST body):
 *   "submitted"   -> acknowledgement email right after the registration form is submitted
 *   "acknowledge" -> admin "Acknowledge" button: payment instructions + team code
 *   "confirmSlot" -> admin "Send slot confirmation" button: player portal link + 6-character code
 */

const CONFIG = {
  // Must match MPO_WEBHOOK_SECRET in mpo-config.js. Stops strangers from using your script to send mail.
  SECRET: 'CHANGE-ME-to-a-long-random-text',

  FROM_NAME: 'MPO Cup 2026',
  REPLY_TO: '',            // fallback if Event Details has no contact email
  BCC: [],                 // organizer emails, e.g. ['a@gmail.com', 'b@gmail.com']

  PORTAL_URL: 'https://mindoropickleball.org/play',

  // Optional: Google Sheet ID to back up every submitted registration (leave '' to skip)
  SHEET_ID: '',

  // Shown in the "acknowledge" email. EDIT THESE.
  PAYMENT_LINES: [
    'GCash: 09XX XXX XXXX (Account name)',
    'Bank transfer: BANK NAME - Account name - 0000 0000 0000',
    'Cash: arrange with the organizers'
  ],
  PAYMENT_NOTE: 'Slots are first-paid, first-confirmed. Please send your proof of payment (screenshot or reference no.) with your team name and team code.',

  GREEN: '#0b3d2e',
  MINT: '#7ff0c0'
};

/* ------------------------------------------------------------------ */
function doGet() { return out_({ ok: true, service: 'MPO email webhook' }); }

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (CONFIG.SECRET && d.secret !== CONFIG.SECRET) return out_({ ok: false, error: 'Unauthorized (secret mismatch)' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.email || ''))) return out_({ ok: false, error: 'Invalid email address' });

    // Public form action: ignore accidental double-sends to the same address for 10 minutes
    const cache = CacheService.getScriptCache();
    const key = 'sub:' + String(d.email).toLowerCase();
    if (d.action === 'submitted' && cache.get(key)) return out_({ ok: true, skipped: 'duplicate' });

    switch (d.action) {
      case 'submitted':   sendAcknowledgement_(d); backup_(d); cache.put(key, '1', 600); break;
      case 'acknowledge': sendPaymentInstructions_(d); break;
      case 'confirmSlot': sendSlotConfirmed_(d); break;
      default: return out_({ ok: false, error: 'Unknown action: ' + d.action });
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

/* ---------------- 1) Acknowledgement on form submit ---------------- */
function sendAcknowledgement_(d) {
  const ev = d.event || {};
  const body =
    p_('Hi ' + names_(d) + ',') +
    p_('Thank you for registering for <b>MPO Cup 2026</b>! We have received your team\'s registration.') +
    box_([
      ['Team', d.team], ['Category', d.category],
      ['Player 1', d.p1], ['Player 2', d.p2], ['Contact no.', d.phone]
    ]) +
    p_('<b>What happens next</b>') +
    '<ol style="margin:0 0 14px;padding-left:20px;line-height:1.6">' +
    '<li>Our organizers will review your registration.</li>' +
    '<li>We will email you the <b>payment instructions</b>.</li>' +
    '<li>Your slot is <b>confirmed once payment is received</b> (first-paid, first-confirmed).</li></ol>' +
    p_('This is an acknowledgement only. Your slot is <b>not yet confirmed</b>.') +
    eventLines_(ev);
  send_(d.email, 'We received your MPO Cup 2026 registration', 'Registration received', body,
        'Hi ' + names_(d) + ', we received your MPO Cup 2026 registration for team ' + d.team + '. We will email payment instructions next. Your slot is not yet confirmed.', ev);
}

/* ---------------- 2) Acknowledge button: payment instructions ---------------- */
function sendPaymentInstructions_(d) {
  const ev = d.event || {};
  const body =
    p_('Hi ' + names_(d) + ',') +
    p_('Your registration for <b>MPO Cup 2026</b> has been acknowledged. Here are your payment details.') +
    box_([['Team', d.team], ['Category', d.category], ['Team code', d.code], ['Amount due', d.due ? peso_(d.due) : (ev.fee || '')]]) +
    p_('<b>Pay via</b>') +
    '<ul style="margin:0 0 14px;padding-left:20px;line-height:1.6">' +
    CONFIG.PAYMENT_LINES.map(function (l) { return '<li>' + esc_(l) + '</li>'; }).join('') + '</ul>' +
    p_(esc_(CONFIG.PAYMENT_NOTE)) +
    p_('Once we verify your payment, we will send your <b>slot confirmation</b> and player portal access.') +
    eventLines_(ev);
  send_(d.email, 'MPO Cup 2026 - payment instructions (' + d.team + ')', 'Payment instructions', body,
        'Hi ' + names_(d) + ', your MPO Cup 2026 registration is acknowledged. Team code: ' + d.code + '. Amount due: ' + (d.due ? peso_(d.due) : '') + '. Pay via: ' + CONFIG.PAYMENT_LINES.join(' | '), ev);
}

/* ---------------- 3) Confirm slot: portal link + code ---------------- */
function sendSlotConfirmed_(d) {
  const ev = d.event || {};
  const url = CONFIG.PORTAL_URL;
  const money = (d.due !== undefined && d.due !== '')
    ? [['Amount due', peso_(d.due)], ['Paid so far', peso_(d.paid)], ['Balance', d.balance > 0 ? peso_(d.balance) : 'Fully paid']] : [];
  const body =
    p_('Hi ' + names_(d) + ',') +
    p_('Great news! Your slot in <b>MPO Cup 2026</b> is <b style="color:#0a7a4f">CONFIRMED</b>. See you on the courts!') +
    box_([['Team', d.team], ['Category', d.category]].concat(money)) +
    '<div style="margin:18px 0;padding:16px;border:2px dashed ' + CONFIG.GREEN + ';border-radius:10px;text-align:center">' +
      '<div style="font-size:12px;letter-spacing:.1em;color:#555">YOUR 6-CHARACTER TEAM CODE</div>' +
      '<div style="font:700 32px/1.3 monospace;letter-spacing:.25em;color:' + CONFIG.GREEN + '">' + esc_(d.code) + '</div></div>' +
    p_('<b>How to open the Player Portal</b>') +
    '<ol style="margin:0 0 14px;padding-left:20px;line-height:1.7">' +
      '<li>Go to <a href="' + url + '" style="color:' + CONFIG.GREEN + '">' + url.replace('https://', '') + '</a></li>' +
      '<li>Enter your <b>6-character code</b> above (letters and numbers) and tap <b>Log in</b>.</li>' +
      '<li>You will see your team name, both players\' details and your payment details.</li></ol>' +
    '<p style="text-align:center;margin:18px 0"><a href="' + url + '" style="background:' + CONFIG.GREEN + ';color:' + CONFIG.MINT + ';padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:700">Open Player Portal</a></p>' +
    p_('<small>Keep your code private. It is the only key to your team\'s page. Lost it? Reply to this email.</small>') +
    eventLines_(ev);
  send_(d.email, 'Slot confirmed - MPO Cup 2026 (' + d.team + ')', 'Your slot is confirmed', body,
        'Hi ' + names_(d) + ', your slot in MPO Cup 2026 is CONFIRMED. Team: ' + d.team + '. Player Portal: ' + url + ' - log in with your 6-character code: ' + d.code, ev);
}

/* ---------------- helpers ---------------- */
function send_(to, subject, title, bodyHtml, text, ev) {
  const html =
    '<div style="background:#eef3f0;padding:20px 0;font-family:Arial,Helvetica,sans-serif;color:#222">' +
    '<table role="presentation" align="center" width="560" style="max-width:96%;background:#fff;border-radius:12px;overflow:hidden">' +
    '<tr><td style="background:' + CONFIG.GREEN + ';padding:20px 24px"><div style="color:' + CONFIG.MINT + ';font-size:12px;letter-spacing:.15em">MINDORO PICKLEBALL ORG.</div>' +
    '<div style="color:#fff;font-size:22px;font-weight:700;margin-top:4px">' + esc_(title) + '</div></td></tr>' +
    '<tr><td style="padding:22px 24px;font-size:15px;line-height:1.55">' + bodyHtml +
    '<p style="margin:18px 0 0">- MPO Cup 2026 Organizers</p></td></tr></table></div>';
  const opt = { to: to, subject: subject, body: text, htmlBody: html, name: CONFIG.FROM_NAME };
  const reply = (ev && ev.email) || CONFIG.REPLY_TO;
  if (reply) opt.replyTo = reply;
  if (CONFIG.BCC.length) opt.bcc = CONFIG.BCC.join(',');
  MailApp.sendEmail(opt);
}

function backup_(d) {
  if (!CONFIG.SHEET_ID) return;
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sh = ss.getSheetByName('Registrations');
  if (!sh) { sh = ss.insertSheet('Registrations'); sh.appendRow(['Timestamp', 'Team', 'Category', 'Player 1', 'Player 2', 'Phone', 'Email']); }
  sh.appendRow([new Date(), d.team, d.category, d.p1, d.p2, d.phone, d.email]);
}

function eventLines_(ev) {
  const rows = [['Date', ev.date], ['Venue', ev.venue], ['Questions', [ev.contact, ev.phone, ev.email].filter(String).join(' · ')]]
    .filter(function (r) { return r[1]; });
  return rows.length ? '<hr style="border:0;border-top:1px solid #e3e8e5;margin:18px 0">' + box_(rows) : '';
}
function box_(rows) {
  return '<table style="width:100%;border-collapse:collapse;margin:0 0 14px;font-size:14px">' +
    rows.filter(function (r) { return r[1] !== undefined && r[1] !== ''; }).map(function (r) {
      return '<tr><td style="padding:5px 8px;color:#666;width:34%;border-bottom:1px solid #eef1ef">' + esc_(r[0]) +
             '</td><td style="padding:5px 8px;border-bottom:1px solid #eef1ef"><b>' + esc_(r[1]) + '</b></td></tr>';
    }).join('') + '</table>';
}
function p_(h) { return '<p style="margin:0 0 14px">' + h + '</p>'; }
function names_(d) { return esc_([d.p1, d.p2].filter(String).join(' & ') || d.team || 'there'); }
function peso_(n) { return '\u20B1' + String(Math.round(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---------------- tests: run from the editor (sends to YOU) ---------------- */
function testAll() {
  const me = Session.getEffectiveUser().getEmail();
  const d = { email: me, team: 'Test Team', category: "Men's Doubles - High Intermediate", p1: 'Juan Dela Cruz', p2: 'Pedro Santos',
              phone: '0917 000 0000', code: 'A7K2QX', due: 2000, paid: 2000, balance: 0,
              event: { date: 'TBA', venue: 'TBA', contact: 'MPO', email: me } };
  sendAcknowledgement_(d); sendPaymentInstructions_(d); sendSlotConfirmed_(d);
  Logger.log('3 test emails sent to ' + me);
}
