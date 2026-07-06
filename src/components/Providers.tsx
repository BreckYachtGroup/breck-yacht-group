'use client'

/**
 * Providers — thin client-side wrapper for all context providers.
 * Imported by the root layout (a Server Component) to avoid making
 * the entire layout a client component.
 */

import { AuthProvider } from '@/context/AuthContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
