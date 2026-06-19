import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, year, make, model, length, hours, engines, location, notes } = await req.json()

    await resend.emails.send({
      from: 'Breck Yacht Group <onboarding@resend.dev>',
      to: 'austin@breckyachtgroup.com',
      subject: `Valuation Request — ${year} ${make} ${model}`,
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
