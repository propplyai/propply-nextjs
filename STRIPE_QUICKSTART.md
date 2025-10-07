# Stripe Quick Start Guide

## What Was Created

✅ **Pricing Component** (`components/Pricing.js`)
- Beautiful, modern pricing cards with three plans
- Hover effects and animations
- "Most Popular" badge for the monthly plan
- Integrated checkout flow

✅ **Updated Landing Page** (`pages/index.js`)
- Added Pricing section between Benefits and CTA
- Smooth scroll to pricing on cancel redirect

✅ **Stripe Checkout API** (`pages/api/stripe/checkout.js`)
- Handles both one-time and subscription payments
- Three pricing plans configured:
  - Single Location – 1 Time Report: $19.99
  - Single Location – Monthly Report: $49.99/month
  - Multiple Locations – Ongoing: $299.99/month

✅ **Webhook Handler** (`pages/api/stripe/webhook.js`)
- Processes Stripe events securely
- Handles subscription updates and cancellations
- Tracks payment success/failure

✅ **Success Page** (`pages/success.js`)
- Beautiful confirmation screen after payment
- Next steps guidance
- Links to dashboard and home

## Quick Start (5 minutes)

### 1. Get Stripe Test Keys

Visit: https://dashboard.stripe.com/test/apikeys

Copy both keys and add to `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

### 2. Install Stripe CLI (for webhooks)

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Other systems:** Download from https://github.com/stripe/stripe-cli/releases

### 3. Start Development

Terminal 1 - Start Next.js:
```bash
npm run dev
```

Terminal 2 - Start Stripe webhook listener:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook secret (whsec_xxxxx) and add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 4. Test Payment

1. Open http://localhost:3000
2. Scroll to pricing section
3. Click any "Get Report" or "Start Monitoring" button
4. Use test card: **4242 4242 4242 4242**
5. Any future date, any CVC
6. Complete checkout

## Test Cards

| Card Number         | Scenario |
|---------------------|----------|
| 4242 4242 4242 4242 | Success  |
| 4000 0000 0000 0002 | Decline  |
| 4000 0000 0000 9995 | Insufficient funds |

**Full list:** https://stripe.com/docs/testing#cards

## View Results

- **Payments:** https://dashboard.stripe.com/test/payments
- **Customers:** https://dashboard.stripe.com/test/customers
- **Subscriptions:** https://dashboard.stripe.com/test/subscriptions
- **Events:** https://dashboard.stripe.com/test/events

## Next Steps

1. ✅ Test all three pricing plans
2. ✅ Test subscription cancellation flow
3. ✅ Verify webhook events are received
4. 📝 Customize success page messaging
5. 📝 Add email confirmation (e.g., with Supabase Edge Functions)
6. 📝 Store customer data in Supabase
7. 📝 Create customer portal for subscription management

## Need Help?

- Full guide: See `STRIPE_SETUP.md`
- Stripe Docs: https://stripe.com/docs
- Issues: Check browser console and terminal logs
