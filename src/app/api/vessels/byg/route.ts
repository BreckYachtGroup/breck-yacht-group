import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('vessels')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ listings: data ?? [] })
  } catch (err) {
    console.error('BYG vessels error:', err)
    return NextResponse.json({ listings: [] })
  }
}
