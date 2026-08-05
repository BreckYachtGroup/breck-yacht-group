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
    const { name, email, phone, message, vesselName, turnstileToken, website } = await req.json()

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
      replyTo: email,
      subject: `New Inquiry — ${escapeHtml(name)} | ${escapeHtml(vesselName)}`,
      html: `
        <h2>New Vessel Inquiry</h2>
        <p><strong>Vessel:</strong> ${escapeHtml(vesselName)}</p>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message)}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Inquiry form error:', error)
    return NextResponse.json({ error: 'Failed to send inquiry' }, { status: 500 })
  }
}
