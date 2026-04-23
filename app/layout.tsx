import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '340B Ready — 340B Learning Platform',
  description:
    'A professional 340B Learning Platform for the 340B Drug Pricing Program. Not legal advice.',
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
