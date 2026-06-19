import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// TypeScript type for a vessel listing
export type Vessel = {
  id: string
  created_at: string
  name: string
  make: string
  model: string
  year: number
  length_ft: number
  price: number
  status: 'available' | 'sold' | 'under_contract'
  location: string
  description: string
  engine_details: string
  hours: number
  fuel_type: string
  beam_ft: number
  images: string[]
  featured: boolean
  slug: string
}
