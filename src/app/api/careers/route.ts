/**
 * POST /api/careers
 *
 * Handles sales associate application form submissions.
 * Sends the application to austin@breckyachtgroup.com via Resend.
 */

import { Resend }       from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const {
      name, email, phone,
      licensed,       // 'yes' | 'no'
      experience,     // years / background
      territory,      // where they work
      pitch,          // why they want to join
    } = await req.json()

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Name, email, and phone are required.' }, { status: 400 })
    }

    await resend.emails.send({
      from:    'Breck Yacht Group <leads@breckyachtgroup.com>',
      to:      'austin@breckyachtgroup.com',
      replyTo: email,
      subject: `New Sales Application — ${name}`,
      html: `
        <h2 style="color:#0c1f3f;">New Sales Associate Application</h2>

        <table style="width:100%;border-collapse:collapse;font-family:sans-serif;font-size:14px;">
          <tr><td style="padding:8px 0;color:#666;width:160px;">Name</td>
              <td style="padding:8px 0;font-weight:bold;">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Email</td>
              <td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#666;">Phone</td>
              <td style="padding:8px 0;">${phone}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">FL License</td>
              <td style="padding:8px 0;">${licensed === 'yes' ? '✓ Licensed' : 'Not yet licensed'}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Experience</td>
              <td style="padding:8px 0;">${experience || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Territory</td>
              <td style="padding:8px 0;">${territory || '—'}</td></tr>
        </table>

        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />

        <p style="color:#666;font-size:13px;margin-bottom:6px;">Why they want to join:</p>
        <p style="font-size:14px;line-height:1.6;">${pitch || '—'}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[careers route]', err)
    return NextResponse.json({ error: 'Failed to send application.' }, { status: 500 })
  }
}
