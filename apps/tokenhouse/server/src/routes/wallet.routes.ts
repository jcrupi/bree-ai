import Elysia, { t } from 'elysia'
import { authPlugin } from '../plugins/auth.plugin'
import {
  getOrCreateWallet,
  addTokens,
  PACKAGES,
  USD_TO_TOKENS,
} from '../services/wallet.service'
import { db } from '../db'
import { usageLog, creditPurchase } from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder')

export const walletRoutes = new Elysia({ prefix: '/api/wallet' })
  .use(authPlugin)

  // ── Get current balance and wallet info ────────────────────────────────────
  .get('/balance', async ({ user, set }) => {
    if (!user) { set.status = 401; return { error: 'Unauthorized' } }

    const w = await getOrCreateWallet(user.id, user.orgId)
    return {
      balance: w.balance,
      planTier: w.planTier,
      monthlyBudget: w.monthlyBudget,
      allowedModels: w.allowedModels,
    }
  })

  // ── Get available credit packages ─────────────────────────────────────────
  .get('/packages', () => ({ packages: PACKAGES }))

  // ── Create Stripe checkout for credit purchase ─────────────────────────────
  .post('/purchase', async ({ user, body, set }) => {
    if (!user) { set.status = 401; return { error: 'Unauthorized' } }

    const pkg = PACKAGES.find(p => p.id === body.packageId)
    if (!pkg) { set.status = 400; return { error: 'Invalid package' } }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: pkg.amountUsd,
          product_data: {
            name: `Token House Credits — ${pkg.tokens.toLocaleString()} tokens`,
            description: pkg.label,
          },
        },
        quantity: 1,
      }],
      metadata: {
        userId: user.id,
        orgId: user.orgId ?? '',
        packageId: pkg.id,
        tokensGranted: pkg.tokens.toString(),
      },
      success_url: `${process.env.BETTER_AUTH_URL?.replace(':3000', ':5173') ?? 'http://localhost:5173'}/dashboard?purchase=success`,
      cancel_url: `${process.env.BETTER_AUTH_URL?.replace(':3000', ':5173') ?? 'http://localhost:5173'}/dashboard?purchase=cancelled`,
    })

    // Record pending purchase
    await db.insert(creditPurchase).values({
      userId: user.id,
      organizationId: user.orgId,
      stripePaymentIntentId: session.payment_intent as string,
      amountUsd: pkg.amountUsd,
      tokensGranted: pkg.tokens,
      status: 'pending',
    })

    return { checkoutUrl: session.url }
  }, {
    body: t.Object({ packageId: t.String() }),
  })

  // ── Stripe webhook handler ────────────────────────────────────────────────
  .post('/webhook/stripe', async ({ request, set }) => {
    const sig = request.headers.get('stripe-signature')
    if (!sig) { set.status = 400; return { error: 'No signature' } }

    let event: Stripe.Event
    const body = await request.text()

    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '')
    } catch {
      set.status = 400
      return { error: 'Webhook signature verification failed' }
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const { userId, orgId, tokensGranted } = session.metadata ?? {}

      if (userId && tokensGranted) {
        await addTokens(userId, parseInt(tokensGranted), orgId || null)

        await db
          .update(creditPurchase)
          .set({ status: 'completed' })
          .where(eq(creditPurchase.stripePaymentIntentId, session.payment_intent as string))

        console.log(`[Stripe] Granted ${tokensGranted} tokens to user ${userId}`)
      }
    }

    return { received: true }
  })

  // ── Usage history ─────────────────────────────────────────────────────────
  .get('/usage', async ({ user, set }) => {
    if (!user) { set.status = 401; return { error: 'Unauthorized' } }

    const logs = await db
      .select()
      .from(usageLog)
      .where(eq(usageLog.userId, user.id))
      .orderBy(desc(usageLog.createdAt))
      .limit(50)

    return { usage: logs }
  })
