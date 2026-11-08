import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 px-4">
      <div className="mx-auto mt-24 w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        {children}
      </div>
    </div>
  )
}
