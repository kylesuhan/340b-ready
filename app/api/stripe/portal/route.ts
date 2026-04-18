import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'

export async function POST(_req: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = await createServiceClient()
  const { data: sub } = await serviceClient
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${siteUrl}/account/billing`,
  })

  return NextResponse.json({ url: session.url })
}
