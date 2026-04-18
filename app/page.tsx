import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const MODULES_OVERVIEW = [
  {
    num: 1,
    title: 'Foundations',
    difficulty: 'Easy',
    desc: 'Program origins, covered entities, HRSA oversight, OPAIS basics.',
    color: 'bg-green-100 text-green-800',
    free: true,
  },
  {
    num: 2,
    title: 'Patient Eligibility & Prohibited Practices',
    difficulty: 'Moderate',
    desc: 'Patient definition, eligible drugs, drug diversion, duplicate discounts.',
    color: 'bg-blue-100 text-blue-800',
    free: false,
  },
  {
    num: 3,
    title: 'OPAIS, Audits & Manufacturer Compliance',
    difficulty: 'Intermediate',
    desc: 'Registration obligations, HRSA audits, ceiling price calculations, ADR.',
    color: 'bg-yellow-100 text-yellow-800',
    free: false,
  },
  {
    num: 4,
    title: 'Contract Pharmacies & ADR',
    difficulty: 'Advanced',
    desc: 'Contract pharmacy framework, TPAs, replenishment model, manufacturer restrictions.',
    color: 'bg-orange-100 text-orange-800',
    free: false,
  },
  {
    num: 5,
    title: 'Exam Preparation',
    difficulty: 'Expert',
    desc: 'Complex scenarios, recent HRSA guidance, enforcement trends, exam strategy.',
    color: 'bg-red-100 text-red-800',
    free: false,
  },
]

export default async function HomePage() {
  // Redirect authenticated users to dashboard
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.jpeg" alt="340B Ready Trainer" width={120} height={40} style={{ height: '38px', width: 'auto' }} className="object-contain" />
            <span className="text-xs text-slate-500 hidden sm:inline">Certification Prep</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-brand-navy hover:bg-brand-navy-dark text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block bg-brand-cyan text-brand-navy text-xs font-semibold px-3 py-1 rounded-full mb-6 border border-brand-cyan-dark">
          ⚕ 340B Drug Pricing Program — Certification Prep
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-5">
          Study smarter for your
          <br />
          340B certification
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          Five progressive learning modules — easy to expert — built around current HRSA
          standards, OPAIS requirements, and real exam topics. Quiz gating keeps you honest.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="bg-brand-navy hover:bg-brand-navy-dark text-white font-semibold px-7 py-3 rounded-lg transition-colors text-sm"
          >
            Start free — 3-day trial
          </Link>
          <Link
            href="/login"
            className="border border-brand-teal text-brand-navy hover:bg-brand-cyan font-semibold px-7 py-3 rounded-lg transition-colors text-sm"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Module 1 always free. Modules 2–5 require a subscription.
        </p>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-12 border-t border-slate-100">
        <h2 className="text-xl font-semibold text-slate-900 mb-8 text-center">
          <span className="text-brand-teal mr-2">⚕</span>A focused, progression-based approach
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="text-center p-5">
            <div className="w-10 h-10 bg-brand-cyan text-brand-navy rounded-xl flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
            <h3 className="font-semibold text-slate-900 mb-1">Read each lesson</h3>
            <p className="text-sm text-slate-600">Concise, structured content aligned to real certification topics and HRSA standards.</p>
          </div>
          <div className="text-center p-5">
            <div className="w-10 h-10 bg-brand-cyan text-brand-navy rounded-xl flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
            <h3 className="font-semibold text-slate-900 mb-1">Pass the module quiz</h3>
            <p className="text-sm text-slate-600">Each module ends with a quiz. Score 80%+ to unlock the next. Failed attempts regenerate with fresh questions.</p>
          </div>
          <div className="text-center p-5">
            <div className="w-10 h-10 bg-brand-cyan text-brand-navy rounded-xl flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
            <h3 className="font-semibold text-slate-900 mb-1">Progress to expert level</h3>
            <p className="text-sm text-slate-600">Five modules from foundational to exam-ready, ensuring real absorption — not just memorization.</p>
          </div>
        </div>
      </section>

      {/* Modules overview */}
      <section className="max-w-5xl mx-auto px-6 py-12 border-t border-slate-100">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">5 modules. Easy to expert.</h2>
        <p className="text-slate-500 text-sm mb-6">Each module must be completed before the next unlocks.</p>
        <div className="space-y-3">
          {MODULES_OVERVIEW.map((m) => (
            <div
              key={m.num}
              className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-brand-pale"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-sm font-bold text-slate-700">
                {m.num}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-medium text-slate-900 text-sm">{m.title}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.color}`}>
                    {m.difficulty}
                  </span>
                  {m.free && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      Free
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-12 border-t border-slate-100 text-center">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">
          Ready to start preparing?
        </h2>
        <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
          Create a free account. Module 1 is always free. Start your 3-day trial to unlock
          all five modules.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-brand-navy hover:bg-brand-navy-dark text-white font-semibold px-8 py-3 rounded-lg transition-colors text-sm"
        >
          Create free account
        </Link>
      </section>

      {/* Footer / Disclaimer */}
      <footer className="border-t border-slate-200 bg-brand-pale mt-8">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 mb-2">340B Ready</p>
            <p className="text-xs text-slate-500 max-w-2xl mx-auto leading-relaxed">
              <strong>Disclaimer:</strong> 340B Ready is a certification prep study companion for educational purposes only.
              It is not legal advice, official HRSA guidance, or a substitute for formal training or professional counsel.
              Content may not reflect the most recent regulatory changes. Always verify critical information against current{' '}
              <a
                href="https://www.hrsa.gov/opa/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-700"
              >
                HRSA source materials
              </a>{' '}
              and qualified compliance professionals.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
