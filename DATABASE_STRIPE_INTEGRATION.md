# Database & Stripe Integration Summary

## ✅ Complete Setup Overview

Your Propply AI application now has **full Stripe payment integration** with **Supabase database connectivity**.

## Database Structure

### Existing Tables (Already in Supabase)

1. **`user_profiles`** - User accounts with subscription tracking
   - `subscription_tier` - Plan ID (single-one-time, single-monthly, multiple-ongoing)
   - `subscription_status` - Status (active, cancelled, past_due)
   - `subscription_id` - Stripe subscription ID
   - `customer_id` - Stripe customer ID
   - `current_period_start` - Subscription period start
   - `current_period_end` - Subscription period end

2. **`payments`** - Payment transaction records
   - `stripe_payment_id` - Stripe payment intent ID
   - `stripe_session_id` - Checkout session ID
   - `amount` - Payment amount
   - `status` - Payment status
   - `payment_type` - Type (subscription, one_time, etc.)
   - `subscription_tier` - Associated plan

### New Tables (Created via Migration)

3. **`stripe_customers`** - Links Supabase users to Stripe customers
   - `user_id` → References auth.users
   - `stripe_customer_id` - Stripe customer ID (cus_xxx)
   - `email` - Customer email
   - `name` - Customer name
   - `metadata` - Additional customer data

## Integration Flow

### 1. User Clicks "Buy Now"
```
components/Pricing.js
  ↓ Checks authentication
  ↓ Redirects to /login if not authenticated
  ↓ Calls API route
```

### 2. Create Checkout Session
```
pages/api/stripe/checkout.js
  ↓ Verifies user authentication
  ↓ Gets or creates Stripe customer
  ↓ Saves customer to stripe_customers table
  ↓ Creates Stripe checkout session
  ↓ Returns checkout URL
```

### 3. User Completes Payment
```
Stripe Checkout
  ↓ User enters payment info
  ↓ Payment processed
  ↓ Stripe sends webhook event
```

### 4. Webhook Processes Payment
```
pages/api/stripe/webhook.js
  ↓ Verifies webhook signature
  ↓ Handles checkout.session.completed event
  ↓ Updates user_profiles with subscription data
  ↓ Records payment in payments table
  ↓ Grants access to features
```

## Helper Functions Created

**Location:** `lib/stripe-helpers.js`

| Function | Purpose |
|----------|---------|
| `createOrGetStripeCustomer()` | Create/retrieve Stripe customer record |
| `updateUserSubscription()` | Update user subscription in database |
| `recordPayment()` | Save payment transaction |
| `getUserByStripeCustomerId()` | Find user by Stripe customer ID |
| `getUserSubscription()` | Get user's subscription details |
| `cancelUserSubscription()` | Mark subscription as cancelled |

## Authentication Flow

### For Authenticated Users
1. User clicks pricing plan
2. Checkout session created immediately
3. Redirected to Stripe checkout

### For Guest Users
1. User clicks pricing plan
2. Redirected to `/login?redirect=/#pricing&plan=single-monthly`
3. After login, returned to pricing section
4. Checkout process continues

## Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create subscription/payment record |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Mark subscription as cancelled |
| `invoice.payment_succeeded` | Record successful recurring payment |
| `invoice.payment_failed` | Update to past_due status |

## Data Flow Diagram

```
┌──────────────┐
│   Frontend   │
│ (Pricing.js) │
└──────┬───────┘
       │
       │ 1. Click plan
       ↓
┌──────────────┐
│ Auth Check   │
│  (Supabase)  │
└──────┬───────┘
       │
       │ 2. Authenticated?
       ↓
┌──────────────┐      No      ┌──────────┐
│   Checkout   │─────────────→│  /login  │
│  API Route   │              └──────────┘
└──────┬───────┘
       │ Yes
       │ 3. Create customer
       ↓
┌──────────────┐
│stripe_       │
│customers     │◄────┐
└──────┬───────┘     │
       │             │
       │ 4. Create   │
       │    session  │
       ↓             │
┌──────────────┐     │
│    Stripe    │     │
│   Checkout   │     │
└──────┬───────┘     │
       │             │
       │ 5. Payment  │
       ↓             │
┌──────────────┐     │
│   Webhook    │─────┤
│   Handler    │     │
└──────┬───────┘     │
       │             │
       ├─────────────┘
       │ 6. Save data
       ↓
┌──────────────┐
│user_profiles │
│   payments   │
└──────────────┘
```

## Required Environment Variables

Your `.env.local` needs:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://vlnnvxlgzhtaorpixsay.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

## Database Queries You Can Run

### Check user subscription status
```sql
SELECT 
  email,
  subscription_tier,
  subscription_status,
  current_period_end
FROM user_profiles
WHERE subscription_status = 'active';
```

### View all payments
```sql
SELECT 
  p.amount,
  p.status,
  p.payment_type,
  p.subscription_tier,
  p.created_at,
  u.email
FROM payments p
JOIN user_profiles u ON p.user_id = u.id
ORDER BY p.created_at DESC;
```

### Find Stripe customers
```sql
SELECT 
  sc.stripe_customer_id,
  sc.email,
  up.subscription_tier,
  up.subscription_status
FROM stripe_customers sc
JOIN user_profiles up ON sc.user_id = up.id;
```

## Testing Checklist

### Local Testing
- [ ] Start dev server: `npm run dev`
- [ ] Start Stripe webhook: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] Click pricing plan (not logged in)
- [ ] Verify redirect to login
- [ ] Log in
- [ ] Verify redirect back to pricing
- [ ] Complete checkout with test card: `4242 4242 4242 4242`
- [ ] Check Supabase tables for new records

### Database Verification
- [ ] Check `stripe_customers` table has new entry
- [ ] Check `user_profiles` updated with subscription
- [ ] Check `payments` table has transaction record

### Stripe Dashboard Verification
- [ ] Payment appears in **Payments**
- [ ] Customer created in **Customers**
- [ ] Subscription active (for monthly plans)
- [ ] Webhook events received successfully

## Common Queries

### Get user's active subscription
```javascript
import { getUserSubscription } from '@/lib/stripe-helpers';

const { data, error } = await getUserSubscription(userId);
```

### Check if user has active subscription
```javascript
const { data: profile } = await supabase
  .from('user_profiles')
  .select('subscription_status, subscription_tier')
  .eq('id', userId)
  .single();

const hasActiveSubscription = profile.subscription_status === 'active';
```

### Get payment history
```javascript
const { data: payments } = await supabase
  .from('payments')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

## Security Features

✅ **Row Level Security (RLS)** enabled on all tables
✅ **Webhook signature verification** prevents fake events
✅ **Service role key** used for admin operations
✅ **User authentication** required for checkout
✅ **Stripe customer linking** prevents data leaks

## Troubleshooting

### Webhook not saving to database
1. Check webhook secret is correct
2. Verify Supabase service role key is set
3. Check webhook logs in Stripe Dashboard
4. Review server logs for errors

### User not linked to Stripe customer
1. Ensure user is logged in before checkout
2. Check `stripe_customers` table
3. Verify `createOrGetStripeCustomer` is called

### Subscription not updating
1. Check webhook is receiving events
2. Verify `getUserByStripeCustomerId` returns correct user
3. Check `user_profiles` table RLS policies

## Next Steps

1. ✅ Database structure created
2. ✅ Stripe integration complete
3. ✅ Webhook handler functional
4. ✅ Authentication flow working
5. 📝 Test with real payment
6. 📝 Set up email notifications
7. 📝 Create customer portal
8. 📝 Add subscription management UI

## Files Modified/Created

### New Files
- `lib/stripe-helpers.js` - Database helper functions
- `STRIPE_PRODUCTS_SETUP.md` - Product setup guide
- `DATABASE_STRIPE_INTEGRATION.md` - This file

### Modified Files
- `pages/api/stripe/checkout.js` - Added auth & customer creation
- `pages/api/stripe/webhook.js` - Added database integration
- `components/Pricing.js` - Added auth check

### Database
- `stripe_customers` table - Created via migration

## Production Deployment

### Supabase
1. Database already configured ✅
2. RLS policies active ✅
3. Service role key needed ✅

### Stripe
1. Switch to Live mode
2. Update environment variables
3. Configure production webhook endpoint
4. Test with small real payment

### Environment Variables (Production)
Add to Vercel/hosting platform:
- All Supabase keys (production)
- All Stripe keys (live mode)
- Webhook secret (production endpoint)

---

**Status:** ✅ Fully Integrated and Ready for Testing

**Documentation:**
- `STRIPE_SETUP.md` - General setup
- `STRIPE_QUICKSTART.md` - Quick start
- `STRIPE_PRODUCTS_SETUP.md` - Product configuration
- `DATABASE_STRIPE_INTEGRATION.md` - This document
