import { type Metadata } from 'next'
import ProfileForm from '@/components/settings/ProfileForm'

export const metadata: Metadata = { title: 'Settings — Vegan Tracker' }

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>
      <ProfileForm />
    </main>
  )
}
