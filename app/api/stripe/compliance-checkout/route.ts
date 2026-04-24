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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // Check if we already have a subscription for this user
  const serviceClient = await createServiceClient()
  const { data: existingSub } = await serviceClient
    .from('subscriptions')
    .select('stripe_customer_id, status, stripe_subscription_id, stripe_price_id')
    .eq('user_id', user.id)
    .single()

  // Block duplicate compliance subscriptions
  const compliancePriceId = process.env.STRIPE_COMPLIANCE_PRICE_ID!
  if (
    existingSub?.stripe_subscription_id &&
    existingSub.stripe_price_id === compliancePriceId &&
    ['active', 'trialing'].includes(existingSub.status ?? '')
  ) {
    return NextResponse.json(
      { error: 'already_subscribed', billingUrl: `${siteUrl}/account/billing` },
      { status: 409 }
    )
  }

  let customerId = existingSub?.stripe_customer_id

  if (!customerId) {
    // Fetch profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const customer = await stripe.customers.create({
      email: user.email,
      name: profile?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    // Pre-create subscriptions row so webhook upsert can find the user
    await serviceClient
      .from('subscriptions')
      .upsert(
        {
          user_id: user.id,
          stripe_customer_id: customerId,
        },
        { onConflict: 'user_id' }
      )
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: user.id,
    mode: 'subscription',
    line_items: [
      {
        price: process.env.STRIPE_COMPLIANCE_PRICE_ID!,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: 3,
    },
    success_url: `${siteUrl}/compliance?checkout=success`,
    cancel_url: `${siteUrl}/compliance-upgrade?checkout=canceled`,
  })

  return NextResponse.json({ url: session.url })
}
