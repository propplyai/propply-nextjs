# Subscription Data Flow Explanation

## Why No Stripe Data is Showing

The subscription section shows "N/A" for billing dates because **no Stripe subscription has been created yet**.

### Current State
- **Current Plan**: `free`
- **Status**: `Active` (default for all users)
- **Billing Period Start**: `N/A` (not set)
- **Next Billing Date**: `N/A` (not set)

### How Subscription Data Gets Populated

The subscription data in `user_profiles` table is populated through this flow:

```
User clicks "Subscribe" 
  → Redirected to Stripe Checkout
    → User completes payment
      → Stripe sends webhook event
        → Webhook handler updates user_profiles table
          → Subscription data appears in UI
```

### Data Flow Details

1. **User Initiates Checkout** (`/pages/api/stripe/create-checkout-session.js`)
   - Creates a Stripe checkout session
   - Redirects user to Stripe payment page

2. **User Completes Payment**
   - Stripe processes the payment
   - Stripe sends `checkout.session.completed` webhook event

3. **Webhook Handler** (`/pages/api/stripe/webhook.js`)
   - Receives the webhook event
   - Calls `updateUserSubscription()` with:
     ```javascript
     {
       planId: 'single-monthly',
       subscriptionId: 'sub_xxxxx',
       customerId: 'cus_xxxxx',
       status: 'active',
       currentPeriodStart: '2025-10-07T00:00:00Z',
       currentPeriodEnd: '2025-11-07T00:00:00Z'
     }
     ```

4. **Database Update** (`lib/stripe-helpers.js`)
   - Updates `user_profiles` table:
     ```sql
     UPDATE user_profiles SET
       subscription_tier = 'single-monthly',
       subscription_status = 'active',
       subscription_id = 'sub_xxxxx',
       customer_id = 'cus_xxxxx',
       current_period_start = '2025-10-07T00:00:00Z',
       current_period_end = '2025-11-07T00:00:00Z'
     WHERE id = user_id;
     ```

5. **UI Updates** (`/pages/profile.js`)
   - Loads updated data from `user_profiles`
   - Displays billing dates

## Testing the Flow

### Option 1: Use Stripe Test Mode
1. Set up Stripe test keys in `.env.local`
2. Use test card: `4242 4242 4242 4242`
3. Complete checkout
4. Verify webhook receives event
5. Check database for updated subscription data

### Option 2: Manually Update Database (for testing only)
```sql
UPDATE user_profiles 
SET 
  subscription_tier = 'single-monthly',
  subscription_status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '30 days'
WHERE id = 'your-user-id';
```

## Required Setup

### 1. Stripe Configuration
Ensure these environment variables are set:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### 2. Webhook Endpoint
Configure Stripe webhook to point to:
```
https://your-domain.com/api/stripe/webhook
```

Events to listen for:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 3. Database Schema
The `user_profiles` table must have these columns:
- `subscription_tier` (text)
- `subscription_status` (text)
- `subscription_id` (text)
- `customer_id` (text)
- `current_period_start` (timestamp)
- `current_period_end` (timestamp)

## Managing Subscriptions

### Stripe Customer Portal

Users with active subscriptions can manage them through the Stripe Customer Portal, which allows them to:

- **Update payment methods** - Add, remove, or update credit cards
- **View invoices** - Download past invoices and receipts
- **View billing history** - See all past payments
- **Cancel subscription** - Self-service cancellation
- **Update subscription** - Upgrade or downgrade plans (if configured)

### How It Works

1. **User clicks "Manage Subscription"** on the profile page
2. **API creates portal session** (`/api/stripe/create-portal-session`)
   - Verifies user authentication
   - Retrieves user's Stripe customer ID from database
   - Creates a Stripe Customer Portal session
3. **User is redirected to Stripe** - Secure Stripe-hosted portal
4. **User makes changes** - Updates payment, cancels, etc.
5. **Stripe sends webhooks** - Updates are sent back to your app
6. **Database updates automatically** - Webhook handler processes changes
7. **User returns to profile** - Sees updated subscription info

### Implementation

**API Endpoint**: `/pages/api/stripe/create-portal-session.js`
```javascript
// Creates a secure portal session for the authenticated user
POST /api/stripe/create-portal-session
Returns: { url: 'https://billing.stripe.com/session/...' }
```

**Profile Page**: `/pages/profile.js`
- Shows "Manage Subscription" button for active subscribers
- Handles portal session creation and redirect
- Shows loading state while opening portal

### Configuration

The Stripe Customer Portal must be configured in your Stripe Dashboard:

1. Go to **Settings → Billing → Customer Portal**
2. Enable the portal
3. Configure allowed actions:
   - ✅ Update payment methods
   - ✅ View invoices
   - ✅ Cancel subscriptions
   - ✅ Update subscriptions (optional)
4. Set branding (logo, colors, etc.)
5. Configure cancellation flow (immediate vs. end of period)

### Security

- Portal sessions are **single-use** and expire after 1 hour
- Users can only access **their own** subscription data
- All changes are validated by Stripe
- Webhooks ensure database stays in sync

## Troubleshooting

### Webhook Not Receiving Events
1. Check Stripe Dashboard → Developers → Webhooks
2. Verify endpoint URL is correct
3. Check webhook signing secret matches `.env`
4. Test webhook with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   stripe trigger checkout.session.completed
   ```

### Data Not Updating
1. Check webhook logs in Stripe Dashboard
2. Check server logs for errors
3. Verify `getUserByStripeCustomerId()` finds the user
4. Ensure RLS policies allow updates to `user_profiles`

### Free Plan Showing Instead of Paid
1. Verify webhook successfully processed
2. Check `user_profiles.subscription_status` in database
3. Ensure `subscription_tier` matches a valid plan ID
4. Check for any errors in webhook handler logs
