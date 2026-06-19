import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, message, vesselName } = await req.json()

    await resend.emails.send({
      from: 'Breck Yacht Group <noreply@breckyachtgroup.com>',
      to: 'austin@breckyachtgroup.com',
      subject: `New Vessel Inquiry — ${vesselName}`,
      html: `
        <h2>New Vessel Inquiry</h2>
        <p><strong>Vessel:</strong> ${vesselName}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Inquiry form error:', error)
    return NextResponse.json({ error: 'Failed to send inquiry' }, { status: 500 })
  }
}
