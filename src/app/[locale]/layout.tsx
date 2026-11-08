import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Providers from '@/components/Providers'
import { locales, type Locale } from '@/i18n'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!locales.includes(locale as Locale)) notFound()

  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  )
}
