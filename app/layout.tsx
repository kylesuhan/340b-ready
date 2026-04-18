import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '340B Ready — Certification Prep Companion',
  description:
    'A professional study companion for 340B Drug Pricing Program certification preparation. Not legal advice.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-white">{children}</body>
    </html>
  )
}
