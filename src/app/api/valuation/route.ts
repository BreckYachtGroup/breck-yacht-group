import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

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
    const { firstName, lastName, email, phone, year, make, model, length, hours, engines, location, notes, turnstileToken } = await req.json()

    // Block submission if Turnstile verification fails
    if (!turnstileToken || !(await verifyTurnstile(turnstileToken))) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'Breck Yacht Group <leads@breckyachtgroup.com>',
      to: 'austin@breckyachtgroup.com',
      replyTo: email, // hitting reply goes straight to the lead
      subject: `New Valuation Lead — ${firstName} ${lastName} | ${year} ${make} ${model}`,
      html: `
        <h2>Vessel Valuation Request</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <hr />
        <h3>Vessel Details</h3>
        <p><strong>Year:</strong> ${year}</p>
        <p><strong>Make:</strong> ${make}</p>
        <p><strong>Model:</strong> ${model}</p>
        <p><strong>Length:</strong> ${length} ft</p>
        <p><strong>Engine Hours:</strong> ${hours}</p>
        <p><strong>Engine Configuration:</strong> ${engines}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Notes:</strong> ${notes}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Valuation form error:', error)
    return NextResponse.json({ error: 'Failed to send valuation request' }, { status: 500 })
  }
}
