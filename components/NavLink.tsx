'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={cn(
        'text-sm font-medium px-3 py-1.5 rounded-lg transition-colors',
        active
          ? 'bg-brand-cyan text-brand-navy font-semibold'
          : 'text-slate-600 hover:text-brand-navy hover:bg-brand-cyan'
      )}
    >
      {children}
    </Link>
  )
}
