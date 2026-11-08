'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create the QueryClient once per browser session (not on every render)
  const [queryClient] = useState(() => new QueryClient())

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
