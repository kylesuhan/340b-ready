import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold text-slate-900">340B Ready</span>
          </Link>
          <p className="text-sm text-slate-500 mt-1">Certification Prep Companion</p>
        </div>
        {children}
        <p className="text-center text-xs text-slate-400 mt-8 leading-relaxed px-4">
          340B Ready is a study companion for educational purposes only. Not legal advice.
          Not official HRSA guidance. Not a substitute for formal training.
        </p>
      </div>
    </div>
  )
}
