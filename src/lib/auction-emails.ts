/**
 * Auction email templates — all transactional auction emails sent via Resend.
 * Every function is fire-and-forget safe (returns Promise, caller can .catch()).
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = 'Breck Yacht Group Auctions <auctions@breckyachtgroup.com>'
const SITE   = 'https://www.breckyachtgroup.com'

function fmt(n: number) { return '$' + n.toLocaleString() }
function fmtDate(ts: string) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: 'America/New_York',
  })
}

function base(body: string) {
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;max-width:600px;">
        <!-- Header -->
        <tr><td style="background:#0c1f3f;padding:28px 40px;">
          <p style="margin:0;color:#c9a84c;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;">Breck Yacht Group</p>
          <p style="margin:4px 0 0;color:#fff;font-size:20px;font-weight:bold;letter-spacing:0.05em;">Auction House</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">${body}</td></tr>
        <!-- Footer -->
        <tr><td style="background:#0c1f3f;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">
            © ${new Date().getFullYear()} Breck Yacht Group · Palm Beach, FL
          </p>
          <p style="margin:8px 0 0;font-size:11px;">
            <a href="${SITE}/auctions/terms" style="color:#c9a84c;">Auction Terms</a>
            &nbsp;·&nbsp;
            <a href="${SITE}/privacy-policy" style="color:rgba(255,255,255,0.4);">Privacy Policy</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function goldBtn(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;padding:14px 32px;background:#c9a84c;color:#0c1f3f;font-size:13px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">${label}</a>`
}

// ── 1. Outbid notification ────────────────────────────────────────────────────
export async function sendOutbidEmail({
  to, bidderName, auctionTitle, auctionSlug, newBid, minNextBid, endsAt,
}: {
  to: string; bidderName: string; auctionTitle: string; auctionSlug: string
  newBid: number; minNextBid: number; endsAt: string
}) {
  return resend.emails.send({
    from: FROM, to,
    subject: `You've been outbid on ${auctionTitle}`,
    html: base(`
      <p style="margin:0 0 8px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;">Outbid Alert</p>
      <h2 style="margin:0 0 24px;color:#0c1f3f;font-size:22px;">${auctionTitle}</h2>
      <p style="color:#333;line-height:1.7;">Hi ${bidderName},</p>
      <p style="color:#333;line-height:1.7;">Someone just outbid you. Here's where things stand:</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <tr><td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Current High Bid</td>
            <td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#c9a84c;font-size:20px;font-weight:bold;">${fmt(newBid)}</td></tr>
        <tr><td style="padding:12px 16px;border:1px solid #e8e8e0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Your Next Bid (min)</td>
            <td style="padding:12px 16px;border:1px solid #e8e8e0;color:#333;font-size:16px;font-weight:bold;">${fmt(minNextBid)}</td></tr>
        <tr><td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Auction Ends</td>
            <td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#333;">${fmtDate(endsAt)}</td></tr>
      </table>
      ${goldBtn(`${SITE}/auctions/${auctionSlug}`, 'Bid Now →')}
      <p style="margin-top:32px;color:#999;font-size:12px;line-height:1.7;">All bids are binding. Bids placed in the final 3 minutes reset the timer back to 3 minutes.</p>
    `),
  })
}

// ── 2. Auction won (buyer) ────────────────────────────────────────────────────
export async function sendWinnerEmail({
  to, winnerName, auctionTitle, auctionSlug, winningBid,
}: {
  to: string; winnerName: string; auctionTitle: string; auctionSlug: string; winningBid: number
}) {
  return resend.emails.send({
    from: FROM, to,
    subject: `Congratulations — you won ${auctionTitle}`,
    html: base(`
      <p style="margin:0 0 8px;color:#c9a84c;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;">Auction Won</p>
      <h2 style="margin:0 0 24px;color:#0c1f3f;font-size:22px;">${auctionTitle}</h2>
      <p style="color:#333;line-height:1.7;">Congratulations ${winnerName}!</p>
      <p style="color:#333;line-height:1.7;">Your bid of <strong style="color:#c9a84c;">${fmt(winningBid)}</strong> won the auction. Our team will be in touch within 24 hours to discuss next steps and coordinate the transaction.</p>
      <p style="color:#333;line-height:1.7;">Questions in the meantime? Reply to this email or call us at <a href="tel:5617235636" style="color:#0c1f3f;">(561) 723-5636</a>.</p>
      ${goldBtn(`${SITE}/auctions/${auctionSlug}`, 'View Auction')}
      <p style="margin-top:32px;color:#999;font-size:12px;line-height:1.7;">As a reminder, all bids are binding per our <a href="${SITE}/auctions/terms" style="color:#999;">auction terms</a>.</p>
    `),
  })
}

// ── 3. Auction ended — seller notification ────────────────────────────────────
export async function sendSellerEndEmail({
  auctionTitle, auctionSlug, winningBid, winnerName, winnerEmail, reserveMet,
}: {
  auctionTitle: string; auctionSlug: string
  winningBid: number | null; winnerName: string | null; winnerEmail: string | null
  reserveMet: boolean
}) {
  const subject = winningBid
    ? `Your auction ended — ${auctionTitle} sold for ${fmt(winningBid)}`
    : `Your auction ended — ${auctionTitle} (reserve not met)`

  const body = winningBid && reserveMet ? `
    <p style="color:#333;line-height:1.7;">Your auction has ended with a winning bid of <strong style="color:#c9a84c;">${fmt(winningBid)}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:24px 0;">
      <tr><td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Winning Bid</td>
          <td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#c9a84c;font-size:20px;font-weight:bold;">${fmt(winningBid)}</td></tr>
      <tr><td style="padding:12px 16px;border:1px solid #e8e8e0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Buyer</td>
          <td style="padding:12px 16px;border:1px solid #e8e8e0;color:#333;">${winnerName ?? '—'} &lt;${winnerEmail ?? '—'}&gt;</td></tr>
    </table>
    <p style="color:#333;line-height:1.7;">We will contact the buyer within 24 hours to coordinate the transaction.</p>
  ` : `
    <p style="color:#333;line-height:1.7;">Your auction for <strong>${auctionTitle}</strong> has ended. ${
      winningBid
        ? `The highest bid was ${fmt(winningBid)} but did not meet the reserve price.`
        : 'No bids were received.'
    }</p>
    <p style="color:#333;line-height:1.7;">Please contact us to discuss relisting options or a price adjustment.</p>
  `

  return resend.emails.send({
    from: FROM,
    to: 'austin@breckyachtgroup.com',
    subject,
    html: base(`
      <p style="margin:0 0 8px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;">Auction Ended</p>
      <h2 style="margin:0 0 24px;color:#0c1f3f;font-size:22px;">${auctionTitle}</h2>
      ${body}
      ${goldBtn(`${SITE}/auctions/${auctionSlug}`, 'View Auction')}
    `),
  })
}

// ── 4. Watchlist alert (24hr or 1hr) ─────────────────────────────────────────
export async function sendWatchlistAlert({
  to, auctionTitle, auctionSlug, currentBid, endsAt, alertType,
}: {
  to: string; auctionTitle: string; auctionSlug: string
  currentBid: number; endsAt: string; alertType: '24h' | '1h'
}) {
  const label    = alertType === '24h' ? '24 Hours' : '1 Hour'
  const urgency  = alertType === '1h'  ? '⏱ ' : ''
  return resend.emails.send({
    from: FROM, to,
    subject: `${urgency}${label} left — ${auctionTitle}`,
    html: base(`
      <p style="margin:0 0 8px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;">Watchlist Alert · ${label} Remaining</p>
      <h2 style="margin:0 0 24px;color:#0c1f3f;font-size:22px;">${auctionTitle}</h2>
      <p style="color:#333;line-height:1.7;">An auction on your watchlist is ending soon.</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <tr><td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Current Bid</td>
            <td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#c9a84c;font-size:20px;font-weight:bold;">${fmt(currentBid)}</td></tr>
        <tr><td style="padding:12px 16px;border:1px solid #e8e8e0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Ends</td>
            <td style="padding:12px 16px;border:1px solid #e8e8e0;color:#333;">${fmtDate(endsAt)}</td></tr>
      </table>
      ${goldBtn(`${SITE}/auctions/${auctionSlug}`, 'View Auction →')}
    `),
  })
}

// ── 5. Comment flag admin alert ───────────────────────────────────────────────
export async function sendFlagAlertEmail({
  auctionTitle, auctionSlug, commentAuthor, commentBody, flaggedBy, flagCount,
}: {
  auctionTitle: string; auctionSlug: string
  commentAuthor: string; commentBody: string
  flaggedBy: string; flagCount: number
}) {
  return resend.emails.send({
    from: FROM,
    to:   'austin@breckyachtgroup.com',
    subject: `⚑ Comment flagged on "${auctionTitle}" (${flagCount} flag${flagCount !== 1 ? 's' : ''})`,
    html: base(`
      <p style="margin:0 0 8px;color:#c0392b;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;">Comment Flagged as Not Constructive</p>
      <h2 style="margin:0 0 24px;color:#0c1f3f;font-size:22px;">${auctionTitle}</h2>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr><td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;width:140px;">Author</td>
            <td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#333;">${commentAuthor}</td></tr>
        <tr><td style="padding:12px 16px;border:1px solid #e8e8e0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Comment</td>
            <td style="padding:12px 16px;border:1px solid #e8e8e0;color:#333;font-style:italic;">"${commentBody}"</td></tr>
        <tr><td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Flagged by</td>
            <td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#333;">${flaggedBy}</td></tr>
        <tr><td style="padding:12px 16px;border:1px solid #e8e8e0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Total Flags</td>
            <td style="padding:12px 16px;border:1px solid #e8e8e0;color:#c0392b;font-weight:bold;">${flagCount}</td></tr>
      </table>
      <p style="color:#555;font-size:14px;line-height:1.7;">Review the comment and delete it from the auction page if it violates community standards.</p>
      ${goldBtn(`${SITE}/auctions/${auctionSlug}`, 'Review Auction →')}
    `),
  })
}

// ── 6. Seller intake — admin alert ───────────────────────────────────────────
export async function sendIntakeAlertEmail({
  sellerName, sellerEmail, sellerPhone, year, make, model, lengthFt,
  reservePrice, currentLocation, intakeId,
}: {
  sellerName: string; sellerEmail: string; sellerPhone: string
  year: number; make: string; model: string; lengthFt: number
  reservePrice: number | null; currentLocation: string; intakeId: string
}) {
  return resend.emails.send({
    from: FROM,
    to:   'austin@breckyachtgroup.com',
    subject: `New auction intake: ${year} ${make} ${model} — ${sellerName}`,
    html: base(`
      <p style="margin:0 0 8px;color:#c9a84c;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;">New Seller Intake Submission</p>
      <h2 style="margin:0 0 24px;color:#0c1f3f;font-size:22px;">${year} ${make} ${model}${lengthFt ? ` · ${lengthFt}ft` : ''}</h2>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr><td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;width:160px;">Seller</td>
            <td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#333;">${sellerName}</td></tr>
        <tr><td style="padding:12px 16px;border:1px solid #e8e8e0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Email</td>
            <td style="padding:12px 16px;border:1px solid #e8e8e0;"><a href="mailto:${sellerEmail}" style="color:#0c1f3f;">${sellerEmail}</a></td></tr>
        <tr><td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Phone</td>
            <td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#333;">${sellerPhone || '—'}</td></tr>
        <tr><td style="padding:12px 16px;border:1px solid #e8e8e0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Location</td>
            <td style="padding:12px 16px;border:1px solid #e8e8e0;color:#333;">${currentLocation || '—'}</td></tr>
        <tr><td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Reserve Price</td>
            <td style="padding:12px 16px;background:#f9f9f6;border:1px solid #e8e8e0;color:#c9a84c;font-size:18px;font-weight:bold;">${reservePrice ? fmt(reservePrice) : 'Not specified'}</td></tr>
      </table>
      <p style="color:#555;font-size:14px;line-height:1.7;">A draft listing has been created. Review the full submission in the admin panel.</p>
      ${goldBtn(`${SITE}/auctions/admin`, 'Review in Admin →')}
    `),
  })
}

// ── 7. Seller intake — confirmation to seller ─────────────────────────────────
export async function sendIntakeConfirmationEmail({
  to, sellerName, year, make, model,
}: {
  to: string; sellerName: string; year: number; make: string; model: string
}) {
  return resend.emails.send({
    from: FROM, to,
    subject: `We received your listing request — ${year} ${make} ${model}`,
    html: base(`
      <p style="margin:0 0 8px;color:#c9a84c;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;">Listing Request Received</p>
      <h2 style="margin:0 0 24px;color:#0c1f3f;font-size:22px;">We've got your submission.</h2>
      <p style="color:#333;line-height:1.7;">Hi ${sellerName},</p>
      <p style="color:#333;line-height:1.7;">Thank you for submitting your <strong>${year} ${make} ${model}</strong> for auction consideration. We've received your information and will be in touch within 1–2 business days to schedule the pre-auction survey and confirm your listing dates.</p>
      <p style="color:#333;font-size:13px;line-height:1.7;margin-top:24px;padding:20px;background:#f9f9f6;border-left:3px solid #c9a84c;">
        <strong style="display:block;margin-bottom:8px;color:#0c1f3f;">What happens next:</strong>
        1. Our team reviews your submission and confirms eligibility.<br/>
        2. We schedule an independent pre-auction survey at your boat's location.<br/>
        3. Once the survey is complete, your 7-day auction goes live.<br/>
        4. You pay $0 in seller commission if your boat sells at auction.
      </p>
      <p style="color:#333;line-height:1.7;margin-top:24px;">Questions? Call or text us at <a href="tel:5617235636" style="color:#0c1f3f;">(561) 723-5636</a> or reply to this email.</p>
      ${goldBtn(`${SITE}/auctions`, 'Browse Live Auctions')}
    `),
  })
}

// ── 8. Newsletter welcome ─────────────────────────────────────────────────────
export async function sendNewsletterWelcome({ to }: { to: string }) {
  return resend.emails.send({
    from: FROM, to,
    subject: 'Welcome to the Breck Yacht Group list',
    html: base(`
      <p style="margin:0 0 8px;color:#c9a84c;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;">You're on the list</p>
      <h2 style="margin:0 0 24px;color:#0c1f3f;font-size:22px;">Welcome aboard.</h2>
      <p style="color:#333;line-height:1.7;">You'll be the first to know about new auction listings, featured brokerage inventory, and exclusive market insights from the Breck Yacht Group team.</p>
      <p style="color:#333;line-height:1.7;">In the meantime, browse our current inventory and get a free AI-powered valuation on any vessel.</p>
      ${goldBtn(`${SITE}/auctions`, 'Browse Auctions')}
      <p style="margin-top:32px;color:#999;font-size:12px;">You're receiving this because you signed up at breckyachtgroup.com. <a href="${SITE}" style="color:#999;">Unsubscribe</a></p>
    `),
  })
}
