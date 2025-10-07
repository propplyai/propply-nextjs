# Subscription Management Setup Guide

## Overview

This guide explains how to set up and use the subscription management feature, which allows users to manage their Stripe subscriptions through a secure customer portal.

## Features

✅ **Update Payment Methods** - Users can add, remove, or update credit cards  
✅ **View Invoices** - Download past invoices and receipts  
✅ **View Billing History** - See all past payments  
✅ **Cancel Subscription** - Self-service cancellation  
✅ **Update Subscription** - Upgrade or downgrade plans (optional)

## Setup Instructions

### 1. Configure Stripe Customer Portal

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Settings → Billing → Customer Portal**
3. Click **Activate** to enable the portal
4. Configure the following settings:

#### Portal Settings

**Business Information**
- Add your business name
- Upload your logo
- Set brand colors

**Customer Information**
- ✅ Allow customers to update email
- ✅ Allow customers to update billing address

**Payment Methods**
- ✅ Allow customers to update payment methods
- ✅ Allow customers to remove payment methods

**Subscriptions**
- ✅ Allow customers to cancel subscriptions
- Choose cancellation behavior:
  - **Immediately** - Subscription ends right away
  - **At period end** - Subscription continues until billing period ends (recommended)
- ✅ Allow customers to switch plans (optional)
- Configure proration settings if allowing plan switches

**Invoices**
- ✅ Allow customers to view invoice history

**Cancel Flow**
- Configure cancellation survey (optional)
- Set up retention offers (optional)

#### Branding

Customize the portal appearance:
- Upload logo (recommended: 200x50px PNG)
- Set primary color
- Set accent color
- Preview on desktop and mobile

### 2. Verify Webhook Configuration

Ensure your webhook endpoint is set up to receive subscription updates:

**Webhook URL**: `https://your-domain.com/api/stripe/webhook`

**Required Events**:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 3. Test the Integration

#### Test in Development

1. Start your local server:
   ```bash
   npm run dev
   ```

2. Use Stripe CLI to forward webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. Create a test subscription:
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout
   - Verify webhook receives events

4. Test the customer portal:
   - Go to `/profile` page
   - Click "Manage Subscription"
   - Verify redirect to Stripe portal
   - Test updating payment method
   - Test canceling subscription
   - Verify webhook updates database

#### Test in Production

1. Deploy your application
2. Configure production webhook endpoint in Stripe
3. Create a real subscription (or use test mode)
4. Test all portal features
5. Verify database updates correctly

## User Flow

### For Users Without Subscription

1. User visits `/profile` page
2. Sees "Upgrade your plan" section
3. Clicks "View Pricing Plans"
4. Redirected to pricing page
5. Selects a plan and completes checkout

### For Users With Active Subscription

1. User visits `/profile` page
2. Sees subscription details:
   - Current plan name
   - Subscription status badge
   - Billing period start date
   - Next billing date
3. Sees "Manage Your Subscription" section
4. Clicks "Manage Subscription" button
5. Redirected to Stripe Customer Portal
6. Can perform actions:
   - Update payment method
   - View invoices
   - Cancel subscription
   - Switch plans (if enabled)
7. Returns to profile page
8. Sees updated subscription information

## API Endpoints

### Create Portal Session

**Endpoint**: `POST /api/stripe/create-portal-session`

**Authentication**: Required (Supabase session)

**Request**: No body required

**Response**:
```json
{
  "url": "https://billing.stripe.com/session/live_xxx..."
}
```

**Error Responses**:
```json
// No authentication
{
  "error": "Unauthorized"
}

// No subscription
{
  "error": "No active subscription found. Please subscribe to a plan first."
}

// Server error
{
  "error": "Failed to create portal session",
  "details": "Error message"
}
```

## Database Schema

The subscription management feature requires these fields in `user_profiles`:

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  subscription_tier TEXT,
  subscription_status TEXT,
  subscription_id TEXT,
  customer_id TEXT,  -- Required for portal access
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Considerations

### Portal Session Security

- Portal sessions are **single-use** and expire after 1 hour
- Sessions are tied to a specific Stripe customer ID
- Users can only access their own subscription data
- All actions are validated by Stripe

### Authentication

- User must be authenticated via Supabase
- API verifies user session before creating portal session
- Customer ID is retrieved from database, not client

### Data Validation

- Webhook signature verification ensures events are from Stripe
- All subscription updates go through webhook handler
- Database updates are atomic and validated

## Webhook Event Handling

When users make changes in the portal, Stripe sends webhooks:

### Subscription Updated
```javascript
// Event: customer.subscription.updated
// Triggered when: User changes plan, updates billing cycle, etc.
// Handler: Updates user_profiles with new subscription data
```

### Subscription Cancelled
```javascript
// Event: customer.subscription.deleted
// Triggered when: User cancels subscription
// Handler: Sets subscription_status to 'cancelled'
```

### Payment Method Updated
```javascript
// Event: customer.updated
// Triggered when: User updates payment method
// Handler: No action needed (Stripe handles payment method storage)
```

### Invoice Paid
```javascript
// Event: invoice.payment_succeeded
// Triggered when: Subscription renews successfully
// Handler: Records payment in payments table
```

### Invoice Failed
```javascript
// Event: invoice.payment_failed
// Triggered when: Payment fails
// Handler: Updates subscription_status to 'past_due', records failed payment
```

## Troubleshooting

### "No active subscription found" Error

**Cause**: User doesn't have a `customer_id` in database

**Solution**:
1. Check if user completed checkout
2. Verify webhook processed successfully
3. Check `user_profiles.customer_id` is not null
4. If null, user needs to create a new subscription

### Portal Not Opening

**Cause**: JavaScript error or network issue

**Solution**:
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check network tab for failed requests
4. Ensure Stripe keys are configured correctly

### Changes Not Reflecting in Database

**Cause**: Webhook not processing events

**Solution**:
1. Check Stripe Dashboard → Developers → Webhooks → Events
2. Verify webhook endpoint is receiving events
3. Check webhook handler logs for errors
4. Verify webhook signing secret is correct
5. Test webhook with Stripe CLI

### User Stuck in Portal

**Cause**: Return URL not configured or broken

**Solution**:
1. Verify return URL in portal session creation
2. Check that `/profile` page is accessible
3. Ensure user can navigate back manually

## Best Practices

### User Experience

1. **Clear Communication**
   - Explain what happens when they click "Manage Subscription"
   - Show loading state while opening portal
   - Handle errors gracefully with user-friendly messages

2. **Seamless Flow**
   - Return users to profile page after portal actions
   - Refresh subscription data when they return
   - Show success messages for completed actions

3. **Transparency**
   - Display current subscription details clearly
   - Show next billing date prominently
   - Explain what each plan includes

### Technical

1. **Error Handling**
   - Catch and log all errors
   - Show user-friendly error messages
   - Provide fallback options

2. **Performance**
   - Cache subscription data appropriately
   - Use loading states for async operations
   - Minimize API calls

3. **Security**
   - Always verify user authentication
   - Never expose Stripe secret keys to client
   - Validate all webhook events

## Support

### Common User Questions

**Q: How do I cancel my subscription?**  
A: Click "Manage Subscription" on your profile page, then click "Cancel subscription" in the portal.

**Q: Will I be charged after canceling?**  
A: No, you won't be charged after your current billing period ends (if set to cancel at period end).

**Q: Can I update my payment method?**  
A: Yes, click "Manage Subscription" and select "Update payment method".

**Q: How do I view my invoices?**  
A: Click "Manage Subscription" and navigate to the "Invoices" tab.

**Q: Can I upgrade/downgrade my plan?**  
A: Yes (if enabled), click "Manage Subscription" and select "Update subscription".

## Additional Resources

- [Stripe Customer Portal Documentation](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Security Best Practices](https://stripe.com/docs/security/guide)
