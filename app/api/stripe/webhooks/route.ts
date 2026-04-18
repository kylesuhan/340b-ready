import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const serviceClient = await createServiceClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await upsertSubscription(serviceClient, sub)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await serviceClient
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      case 'invoice.payment_succeeded': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription ?? invoice.subscription_id ?? null
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId as string)
          await upsertSubscription(serviceClient, sub)
        }
        break
      }

      case 'invoice.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription ?? invoice.subscription_id ?? null
        if (subscriptionId) {
          await serviceClient
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId as string)
        }
        break
      }

      default:
        // Ignore unhandled event types
        break
    }
  } catch (err) {
    console.error(`Error handling webhook event ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function upsertSubscription(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: any,
  sub: Stripe.Subscription
) {
  // Look up supabase user_id from the customer
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

  // Find user by customer ID
  const { data: existing } = await serviceClient
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!existing?.user_id) {
    console.warn(`No user found for Stripe customer ${customerId}`)
    return
  }

  const item = sub.items.data[0]
  // current_period_start/end moved in newer Stripe API versions — use type cast
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subAny = sub as any

  await serviceClient
    .from('subscriptions')
    .upsert(
      {
        user_id: existing.user_id,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        stripe_price_id: item?.price?.id ?? null,
        status: sub.status,
        trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
        trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        current_period_start: subAny.current_period_start
          ? new Date(subAny.current_period_start * 1000).toISOString()
          : null,
        current_period_end: subAny.current_period_end
          ? new Date(subAny.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
      },
      { onConflict: 'user_id' }
    )
}
