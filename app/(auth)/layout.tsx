import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-cyan flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image src="/logo.jpeg" alt="340B Ready Trainer" width={160} height={54} style={{ height: '54px', width: 'auto' }} className="object-contain mx-auto" />
          </Link>
          <p className="text-sm text-brand-navy mt-2 font-medium">Certification Prep Companion</p>
        </div>
        {children}
        <p className="text-center text-xs text-brand-navy/60 mt-8 leading-relaxed px-4">
          340B Ready is a study companion for educational purposes only. Not legal advice.
          Not official HRSA guidance. Not a substitute for formal training.
        </p>
      </div>
    </div>
  )
}
