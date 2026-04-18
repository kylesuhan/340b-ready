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
          ? 'bg-slate-100 text-slate-900'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
      )}
    >
      {children}
    </Link>
  )
}
