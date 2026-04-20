'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

export function UserDropdown({ label }: { label: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-slate-600 hover:text-brand-navy font-medium px-2 py-1 rounded-lg hover:bg-brand-cyan transition-colors"
      >
        {label} <span className="text-slate-400 text-xs ml-0.5">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-slate-700 hover:bg-brand-cyan hover:text-brand-navy"
          >
            Account
          </Link>
          <Link
            href="/account/billing"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-slate-700 hover:bg-brand-cyan hover:text-brand-navy"
          >
            Billing
          </Link>
          <div className="border-t border-slate-100 mt-1 pt-1">
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-brand-cyan hover:text-brand-navy"
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
