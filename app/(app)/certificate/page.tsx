import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function CertificatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check all 5 modules passed
  const { data: progress } = await supabase
    .from('user_progress')
    .select('quiz_passed, module_id')
    .eq('user_id', user.id)
    .eq('quiz_passed', true)

  const passedCount = progress?.length ?? 0

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const name = profile?.full_name || user.email?.split('@')[0] || 'Learner'
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          <span className="text-brand-teal mr-2">⚕</span>Your Certificate
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {passedCount < 5
            ? `Complete all 5 modules to earn your certificate. You've passed ${passedCount} of 5.`
            : 'You\'ve completed the 340B Ready Learning Platform program.'}
        </p>
      </div>

      {passedCount < 5 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
          <div className="text-4xl">🏆</div>
          <p className="font-semibold text-slate-700">Almost there!</p>
          <div className="w-full bg-slate-100 rounded-full h-3 max-w-xs mx-auto">
            <div
              className="bg-brand-teal h-3 rounded-full transition-all"
              style={{ width: `${(passedCount / 5) * 100}%` }}
            />
          </div>
          <p className="text-sm text-slate-500">{passedCount} / 5 modules complete</p>
        </div>
      ) : (
        <>
          {/* Certificate */}
          <div
            id="certificate"
            className="bg-white border-4 border-brand-navy rounded-2xl p-10 text-center space-y-6 print:shadow-none"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-teal">Certificate of Completion</p>
              <p className="text-xs text-slate-400">340B Ready — 340B Learning Platform</p>
            </div>

            <div className="text-5xl">⚕</div>

            <div className="space-y-2">
              <p className="text-sm text-slate-500">This certifies that</p>
              <p className="text-3xl font-bold text-brand-navy">{name}</p>
              <p className="text-sm text-slate-500">has successfully completed all five modules of</p>
              <p className="text-xl font-semibold text-slate-900">340B Drug Pricing Program</p>
              <p className="text-base text-slate-600">340B Learning Platform</p>
            </div>

            <div className="flex items-center justify-center gap-8 pt-2">
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Completed</p>
                <p className="text-sm font-semibold text-slate-700">{today}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Modules</p>
                <p className="text-sm font-semibold text-slate-700">5 of 5</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-1">
              <p className="text-xs text-slate-400">Issued by 340B Ready · Soul Tribe AI, LLC</p>
              <p className="text-xs text-slate-300 italic">
                This certificate is for educational purposes only. It does not constitute official HRSA certification or licensure.
              </p>
            </div>
          </div>

          {/* Print button */}
          <div className="flex justify-center print:hidden">
            <button
              onClick={() => window.print()}
              className="bg-brand-navy hover:bg-brand-navy-dark text-white font-semibold text-sm px-8 py-3 rounded-lg transition-colors"
            >
              Print / Save as PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}
