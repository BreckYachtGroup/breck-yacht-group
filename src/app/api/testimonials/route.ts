/**
 * /api/testimonials
 *
 * GET  â€” returns all approved testimonials (public)
 * POST â€” submits a new testimonial for review (public)
 *        Sends Austin an email notification on each new submission.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  const { data, error } = await supabase
    .from('testimonials')
    .select('id, name, title, content, approved_at')
    .eq('status', 'approved')
    .order('approved_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, title, content } = await req.json()

    if (!name?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Name and testimonial are required.' },
        { status: 400 }
      )
    }

    if (content.trim().length < 20) {
      return NextResponse.json(
        { error: 'Please write at least a sentence or two.' },
        { status: 400 }
      )
    }

    const { error: insertError } = await supabase
      .from('testimonials')
      .insert({ name: name.trim(), email: email?.trim() || null, title: title?.trim() || null, content: content.trim() })

    if (insertError) {
      console.error('Testimonial insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save testimonial.' }, { status: 500 })
    }

    await resend.emails.send({
      from: 'Breck Yacht Group <leads@breckyachtgroup.com>',
      to:   'austin@breckyachtgroup.com',
      subject: `New Testimonial Pending Review â€” ${name}`,
      html: `
        <h2 style="color:#0c1f3f;">New Testimonial Submission</h2>
        <table style="font-family:sans-serif;font-size:14px;width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#666;width:120px;">Name</td>
              <td style="padding:8px 0;font-weight:bold;">${name}</td></tr>
          ${email ? `<tr><td style="padding:8px 0;color:#666;">Email</td>
              <td style="padding:8px 0;">${email}</td></tr>` : ''}
          ${title ? `<tr><td style="padding:8px 0;color:#666;">Title</td>
              <td style="padding:8px 0;">${title}</td></tr>` : ''}
        </table>
        <div style="margin-top:16px;padding:16px;background:#f8f6f1;border-left:3px solid #c9a84c;">
          <p style="font-size:15px;line-height:1.7;margin:0;">${content}</p>
        </div>
        <p style="margin-top:24px;">
          <a href="https://www.breckyachtgroup.com/admin" style="background:#0c1f3f;color:#fff;padding:10px 20px;text-decoration:none;font-family:sans-serif;font-size:13px;">
            Review in Admin Panel
          </a>
        </p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Testimonial submit error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
