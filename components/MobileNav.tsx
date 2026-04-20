'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  hasCompliance: boolean
  hasAccess: boolean
  userLabel: string
}

export function MobileNav({ hasCompliance, hasAccess, userLabel }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/modules', label: 'Modules' },
    {
      href: hasCompliance ? '/compliance' : '/compliance-upgrade',
      label: '⚕ Compliance',
      highlight: !hasCompliance,
    },
    { href: '/account', label: 'Account' },
    { href: '/account/billing', label: 'Billing' },
  ]

  if (!hasAccess) {
    navItems.push({ href: '/upgrade', label: 'Upgrade', highlight: true } as typeof navItems[0])
  }

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-lg text-slate-600 hover:text-brand-navy hover:bg-brand-cyan transition-colors"
        aria-label="Toggle menu"
        aria-expanded={open}
      >
        {open ? (
          // X icon
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        ) : (
          // Hamburger icon
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="17" y2="6" />
            <line x1="3" y1="10" x2="17" y2="10" />
            <line x1="3" y1="14" x2="17" y2="14" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full bg-white border-b border-slate-200 shadow-md z-20 px-4 py-3 flex flex-col gap-1">
          <p className="text-xs text-slate-400 px-3 py-1 font-medium">{userLabel}</p>
          {navItems.map(({ href, label, highlight }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'text-sm font-medium px-3 py-2 rounded-lg transition-colors',
                  active
                    ? 'bg-brand-cyan text-brand-navy font-semibold'
                    : highlight
                    ? 'text-brand-teal hover:bg-brand-cyan'
                    : 'text-slate-700 hover:bg-brand-cyan hover:text-brand-navy'
                )}
              >
                {label}
              </Link>
            )
          })}
          <div className="border-t border-slate-100 mt-2 pt-2">
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-brand-cyan hover:text-brand-navy rounded-lg transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
