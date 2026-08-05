import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { escapeHtml } from '@/lib/html-escape'

const resend = new Resend(process.env.RESEND_API_KEY)

// Verify Turnstile token with Cloudflare
async function verifyTurnstile(token: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  })
  const data = await res.json()
  return data.success === true
}

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, year, make, model, length, hours, engines, location, notes, turnstileToken, website } = await req.json()

    // Honeypot — real users never fill this hidden field; bots that
    // auto-fill every input will. Pretend success so the bot doesn't adapt.
    if (website) {
      return NextResponse.json({ success: true })
    }

    // Block submission if Turnstile verification fails
    if (!turnstileToken || !(await verifyTurnstile(turnstileToken))) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'Breck Yacht Group <leads@breckyachtgroup.com>',
      to: 'austin@breckyachtgroup.com',
      replyTo: email, // hitting reply goes straight to the lead
      subject: `New Valuation Lead — ${escapeHtml(firstName)} ${escapeHtml(lastName)} | ${escapeHtml(year)} ${escapeHtml(make)} ${escapeHtml(model)}`,
      html: `
        <h2>Vessel Valuation Request</h2>
        <p><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <hr />
        <h3>Vessel Details</h3>
        <p><strong>Year:</strong> ${escapeHtml(year)}</p>
        <p><strong>Make:</strong> ${escapeHtml(make)}</p>
        <p><strong>Model:</strong> ${escapeHtml(model)}</p>
        <p><strong>Length:</strong> ${escapeHtml(length)} ft</p>
        <p><strong>Engine Hours:</strong> ${escapeHtml(hours)}</p>
        <p><strong>Engine Configuration:</strong> ${escapeHtml(engines)}</p>
        <p><strong>Location:</strong> ${escapeHtml(location)}</p>
        <p><strong>Notes:</strong> ${escapeHtml(notes)}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Valuation form error:', error)
    return NextResponse.json({ error: 'Failed to send valuation request' }, { status: 500 })
  }
}
