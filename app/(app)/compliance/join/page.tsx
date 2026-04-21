'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

function JoinContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid invite link.')
      return
    }

    fetch('/api/compliance/team/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) {
          setStatus('success')
          setTimeout(() => router.push('/compliance'), 2000)
        } else {
          setStatus('error')
          setMessage(data.error ?? 'Failed to join team.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      })
  }, [token, router])

  return (
    <div className="max-w-md mx-auto text-center space-y-4 pt-12">
      <div className="text-4xl">⚕</div>
      {status === 'loading' && (
        <>
          <h1 className="text-xl font-semibold text-slate-900">Joining compliance team…</h1>
          <p className="text-slate-500 text-sm">Please wait.</p>
        </>
      )}
      {status === 'success' && (
        <>
          <h1 className="text-xl font-semibold text-slate-900">You&apos;ve joined the team!</h1>
          <p className="text-slate-500 text-sm">Redirecting you to the Compliance Monitor…</p>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className="text-xl font-semibold text-slate-900">Unable to join</h1>
          <p className="text-slate-500 text-sm">{message}</p>
          <Link href="/compliance" className="text-sm text-brand-teal hover:underline">
            Go to Compliance Monitor
          </Link>
        </>
      )}
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinContent />
    </Suspense>
  )
}
