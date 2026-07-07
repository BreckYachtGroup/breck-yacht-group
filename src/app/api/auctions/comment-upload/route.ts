/**
 * POST /api/auctions/comment-upload
 * Authenticated users only — uploads a comment image to Supabase Storage.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { randomUUID } from 'crypto'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES     = 8 * 1024 * 1024 // 8 MB

export async function POST(req: NextRequest) {
  // Auth check
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData().catch(() => null)
  const file = form?.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or GIF allowed' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  if (bytes.byteLength > MAX_BYTES)
    return NextResponse.json({ error: 'Image must be under 8 MB' }, { status: 400 })

  const ext  = file.type.split('/')[1].replace('jpeg', 'jpg')
  const path = `comments/${randomUUID()}.${ext}`

  const { error: uploadErr } = await supabaseAdmin.storage
    .from('auction-images')
    .upload(path, bytes, { contentType: file.type, upsert: false })

  if (uploadErr)
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('auction-images')
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl }, { status: 201 })
}
