import type { Metadata } from 'next'
import CareersClient from './_components/CareersClient'

export const metadata: Metadata = {
  title: 'Sales Careers | Breck Yacht Group',
  description: 'Join the Breck Yacht Group sales team. Earn up to 80/20 commission splits on luxury yacht and boat sales with an industry-leading structure and no earnings cap.',
}

export default function CareersPage() {
  return <CareersClient />
}
