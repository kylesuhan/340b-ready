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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // Immediately sync subscription when checkout completes — avoids timing gap
        // before customer.subscription.created fires
        const subscriptionId = session.subscription
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId as string)
          // Ensure the subscriptions row has the user_id linked before upserting
          const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
          if (customerId) {
            await ensureCustomerLinked(serviceClient, customerId, session.client_reference_id)
          }
          await upsertSubscription(serviceClient, sub)
        }
        break
      }

      case 'customer.subscription.created': {
        // New subscription — always write (this is a fresh checkout)
        const sub = event.data.object as Stripe.Subscription
        await upsertSubscription(serviceClient, sub)
        break
      }

      case 'customer.subscription.updated': {
        // Status/period change on an existing subscription — only apply if it matches
        // the subscription ID we have on record. Prevents old duplicate subscriptions
        // from overwriting the current one's status.
        const sub = event.data.object as Stripe.Subscription
        await syncSubscriptionIfCurrent(serviceClient, sub)
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
          await syncSubscriptionIfCurrent(serviceClient, sub)
        }
        break
      }

      case 'invoice.payment_failed': {
        // Already scoped to a specific subscription_id — safe as-is
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

// Links a Stripe customer ID to a user if the row doesn't exist yet.
// client_reference_id is the Supabase user_id we pass into the Checkout session.
async function ensureCustomerLinked(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: any,
  customerId: string,
  userId: string | null | undefined
) {
  if (!userId) return

  const { data: existing } = await serviceClient
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!existing?.user_id) {
    // Create the row so upsertSubscription can find it
    await serviceClient
      .from('subscriptions')
      .upsert({ user_id: userId, stripe_customer_id: customerId }, { onConflict: 'user_id' })
  }
}

/**
 * Only syncs subscription status/period if the incoming subscription ID matches
 * what is already stored for the user. This prevents old duplicate subscriptions
 * from overwriting the current one when they fire status update events.
 */
async function syncSubscriptionIfCurrent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: any,
  sub: Stripe.Subscription
) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

  const { data: existing } = await serviceClient
    .from('subscriptions')
    .select('user_id, stripe_subscription_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (!existing) return // No row for this customer — nothing to update

  if (existing.stripe_subscription_id && existing.stripe_subscription_id !== sub.id) {
    console.warn(
      `Skipping status update from old subscription ${sub.id} — current stored sub is ${existing.stripe_subscription_id}`
    )
    return
  }

  // Safe to update — subscription ID matches (or row has no sub ID yet)
  await upsertSubscription(serviceClient, sub)
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

  let userId = existing?.user_id

  if (!userId) {
    // Row wasn't pre-created — fall back to Stripe customer metadata
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) {
      console.warn(`Customer ${customerId} deleted, skipping`)
      return
    }
    userId = (customer as Stripe.Customer).metadata?.supabase_user_id
    if (!userId) {
      console.warn(`No supabase_user_id metadata on customer ${customerId}`)
      return
    }
    // Seed the row so future lookups work
    await serviceClient
      .from('subscriptions')
      .upsert({ user_id: userId, stripe_customer_id: customerId }, { onConflict: 'user_id' })
  }

  const item = sub.items.data[0]
  // current_period_start/end moved in newer Stripe API versions — use type cast
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subAny = sub as any

  await serviceClient
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
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
