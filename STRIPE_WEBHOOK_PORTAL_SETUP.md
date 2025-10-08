# Stripe Webhook & Customer Portal Setup Guide

## Quick Setup Checklist

- [ ] Set up Stripe webhook endpoint
- [ ] Configure webhook events
- [ ] Test webhook with Stripe CLI
- [ ] Enable Stripe Customer Portal
- [ ] Configure portal settings
- [ ] Test end-to-end flow

---

## Part 1: Webhook Setup

### Step 1: Get Your Webhook Endpoint URL

Your webhook endpoint URL will be:
```
https://your-domain.com/api/stripe/webhook
```

**Examples:**
- Production: `https://propply.onrender.com/api/stripe/webhook`
- Development: Use Stripe CLI (see Step 5)

### Step 2: Create Webhook in Stripe Dashboard

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com
   - Log in to your account

2. **Navigate to Webhooks**
   - Click **Developers** in the left sidebar
   - Click **Webhooks** tab
   - Click **+ Add endpoint** button

3. **Configure Endpoint**
   - **Endpoint URL**: Enter your webhook URL
     ```
     https://your-domain.com/api/stripe/webhook
     ```
   - **Description**: `Propply Subscription Webhooks` (optional)
   - **Version**: Use latest API version (default)

4. **Select Events to Listen To**
   
   Click **Select events** and choose these events:

   **Checkout Events:**
   - ✅ `checkout.session.completed` - When payment succeeds
   
   **Subscription Events:**
   - ✅ `customer.subscription.created` - New subscription
   - ✅ `customer.subscription.updated` - Subscription changed
   - ✅ `customer.subscription.deleted` - Subscription cancelled
   
   **Invoice Events:**
   - ✅ `invoice.payment_succeeded` - Payment successful
   - ✅ `invoice.payment_failed` - Payment failed
   
   **Customer Events (optional):**
   - ✅ `customer.updated` - Customer info changed

5. **Add Endpoint**
   - Click **Add endpoint** button
   - Stripe will create the webhook

### Step 3: Get Webhook Signing Secret

1. **Find Your Webhook**
   - You'll see your new webhook in the list
   - Click on the webhook endpoint

2. **Reveal Signing Secret**
   - Look for **Signing secret** section
   - Click **Reveal** or **Click to reveal**
   - Copy the secret (starts with `whsec_`)

3. **Add to Environment Variables**
   
   Add to your `.env.local` file:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_here
   ```

### Step 4: Test Webhook (Production)

1. **Send Test Event**
   - In webhook details page
   - Click **Send test webhook** button
   - Select `checkout.session.completed`
   - Click **Send test webhook**

2. **Check Response**
   - Should see `200 OK` response
   - If error, check your server logs
   - Verify endpoint is accessible

### Step 5: Test Webhook (Development)

For local development, use Stripe CLI:

1. **Install Stripe CLI**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows
   # Download from: https://github.com/stripe/stripe-cli/releases
   
   # Linux
   # Download from: https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe**
   ```bash
   stripe login
   ```
   - Opens browser to authenticate
   - Grants CLI access to your account

3. **Forward Webhooks to Local Server**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   
   Output will show:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxx
   ```

4. **Copy the Signing Secret**
   - Add to `.env.local`:
     ```bash
     STRIPE_WEBHOOK_SECRET=whsec_xxxxx
     ```

5. **Test with Trigger**
   
   In a new terminal:
   ```bash
   stripe trigger checkout.session.completed
   ```
   
   You should see:
   - Event sent in CLI
   - Webhook received in your app logs
   - Database updated

---

## Part 2: Customer Portal Setup

### Step 1: Access Customer Portal Settings

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com
   - Log in to your account

2. **Navigate to Customer Portal**
   - Click **Settings** in the left sidebar
   - Click **Billing** section
   - Click **Customer portal** tab

3. **Activate Portal**
   - Click **Activate** or **Activate test link** button
   - Portal is now enabled

### Step 2: Configure Portal Settings

#### Business Information

1. **Business Name**
   - Enter: `Propply AI` (or your business name)

2. **Support Contact**
   - Email: `support@propply.ai`
   - Phone: (optional)

3. **Privacy Policy & Terms**
   - Privacy policy URL: `https://your-domain.com/privacy`
   - Terms of service URL: `https://your-domain.com/terms`

#### Branding

1. **Logo**
   - Click **Upload logo**
   - Recommended size: 200x50px PNG
   - Upload your logo file

2. **Colors**
   - **Primary color**: `#3B82F6` (corporate blue)
   - **Accent color**: `#10B981` (emerald green)
   - Preview on desktop and mobile

3. **Icon**
   - Upload favicon (optional)
   - 32x32px PNG

#### Customer Information

1. **Email Address**
   - ✅ Allow customers to update email address

2. **Billing Address**
   - ✅ Allow customers to update billing address
   - ✅ Require billing address

#### Payment Methods

1. **Update Payment Methods**
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to remove payment methods

2. **Payment Method Types**
   - ✅ Card
   - ✅ Bank account (optional)
   - ✅ Other payment methods (optional)

#### Subscriptions

1. **Cancel Subscriptions**
   - ✅ Allow customers to cancel subscriptions
   
2. **Cancellation Behavior**
   - Choose one:
     - ⭐ **Cancel at period end** (Recommended)
       - User keeps access until billing period ends
       - No refund issued
       - Better user experience
     - **Cancel immediately**
       - Access revoked right away
       - Proration may apply

3. **Cancellation Survey** (Optional)
   - ✅ Enable cancellation survey
   - Add questions:
     - "Why are you canceling?"
     - "What could we improve?"
   - Helps understand churn

4. **Pause Subscriptions** (Optional)
   - ✅ Allow customers to pause subscriptions
   - Set pause duration options

5. **Switch Plans** (Optional)
   - ✅ Allow customers to switch plans
   - Configure proration:
     - **Always invoice**: Charge/credit immediately
     - **Create prorations**: Generate invoice at period end
     - **None**: No proration

#### Invoices

1. **Invoice History**
   - ✅ Allow customers to view invoice history
   - ✅ Allow customers to download invoices

2. **Invoice Details**
   - ✅ Show payment method
   - ✅ Show billing address

### Step 3: Configure Advanced Settings

#### Return URL

- Default return URL: `https://your-domain.com/profile`
- This is where users return after portal actions
- Already configured in your code

#### Session Configuration

- Session duration: 1 hour (default)
- Single-use sessions: Enabled (default)

#### Notifications

- ✅ Send email receipts
- ✅ Send payment failure notifications
- ✅ Send subscription cancellation confirmations

### Step 4: Save Configuration

1. **Review All Settings**
   - Check business info
   - Verify branding looks good
   - Confirm allowed actions

2. **Save Changes**
   - Click **Save** button at top right
   - Settings are now live

### Step 5: Test Customer Portal

#### Test in Dashboard

1. **Get Test Portal Link**
   - In Customer Portal settings
   - Click **View test link**
   - Opens portal in new tab

2. **Test Features**
   - Update payment method
   - View invoices
   - Try canceling subscription
   - Check branding and colors

#### Test in Your App

1. **Create Test Subscription**
   ```bash
   # Use test card
   Card: 4242 4242 4242 4242
   Expiry: Any future date
   CVC: Any 3 digits
   ZIP: Any 5 digits
   ```

2. **Access Profile Page**
   - Go to: `http://localhost:3000/profile`
   - Should see "Manage Subscription" button

3. **Open Customer Portal**
   - Click "Manage Subscription"
   - Should redirect to Stripe portal
   - Verify branding and settings

4. **Test Actions**
   - Update payment method
   - View invoices
   - Cancel subscription (test mode)

5. **Verify Webhooks**
   - Check Stripe CLI output
   - Verify database updates
   - Check application logs

---

## Part 3: Environment Variables

### Required Environment Variables

Create or update `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe (Production - when ready)
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
# STRIPE_SECRET_KEY=sk_live_your_key_here
# STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret_here
```

### Get Stripe Keys

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com

2. **Get API Keys**
   - Click **Developers** → **API keys**
   - **Publishable key**: Starts with `pk_test_` or `pk_live_`
   - **Secret key**: Click **Reveal** to see, starts with `sk_test_` or `sk_live_`

3. **Copy Keys**
   - Copy publishable key to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Copy secret key to `STRIPE_SECRET_KEY`

4. **Get Webhook Secret**
   - Click **Developers** → **Webhooks**
   - Click your webhook endpoint
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Part 4: Verification Checklist

### Webhook Verification

- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] All required events selected
- [ ] Webhook signing secret added to `.env.local`
- [ ] Test webhook sent successfully (200 OK response)
- [ ] Stripe CLI forwarding works locally
- [ ] Webhook events appear in Stripe Dashboard logs
- [ ] Database updates when webhook received

### Customer Portal Verification

- [ ] Customer Portal activated
- [ ] Business information configured
- [ ] Branding (logo, colors) set up
- [ ] Payment method updates enabled
- [ ] Subscription cancellation enabled
- [ ] Invoice viewing enabled
- [ ] Test portal link works
- [ ] Portal accessible from app
- [ ] Return URL works correctly

### End-to-End Test

- [ ] Create test subscription
- [ ] Verify webhook processes checkout
- [ ] Database shows subscription data
- [ ] Profile page shows subscription details
- [ ] "Manage Subscription" button appears
- [ ] Click button opens portal
- [ ] Update payment method works
- [ ] View invoices works
- [ ] Cancel subscription works
- [ ] Webhook processes cancellation
- [ ] Database updates subscription status

---

## Troubleshooting

### Webhook Issues

**Problem**: Webhook returns 401 or 403 error

**Solution**:
- Check webhook signing secret is correct
- Verify endpoint URL is accessible
- Check server logs for authentication errors

**Problem**: Webhook returns 500 error

**Solution**:
- Check server logs for detailed error
- Verify database connection
- Check Supabase service role key is set
- Test webhook handler locally

**Problem**: Events not appearing in app

**Solution**:
- Verify webhook endpoint is correct
- Check event types are selected
- Look at Stripe Dashboard → Webhooks → Events
- Check "Failed" events for error details

### Customer Portal Issues

**Problem**: "No active subscription found" error

**Solution**:
- User needs to complete a subscription first
- Check `user_profiles.customer_id` is not null
- Verify webhook processed checkout successfully

**Problem**: Portal shows wrong branding

**Solution**:
- Clear browser cache
- Check portal settings in Stripe Dashboard
- Verify logo uploaded correctly
- Test in incognito mode

**Problem**: User can't cancel subscription

**Solution**:
- Check "Allow cancellation" is enabled
- Verify subscription is active
- Check Stripe Dashboard for subscription status

---

## Production Deployment

### Before Going Live

1. **Switch to Live Mode**
   - Toggle from Test to Live in Stripe Dashboard
   - Get live API keys
   - Create new webhook endpoint for production URL

2. **Update Environment Variables**
   - Use `pk_live_` publishable key
   - Use `sk_live_` secret key
   - Use production webhook secret

3. **Test in Production**
   - Create real subscription (small amount)
   - Test full flow
   - Verify webhooks work
   - Test customer portal

4. **Monitor**
   - Watch Stripe Dashboard for events
   - Check application logs
   - Monitor database updates
   - Set up error alerts

### Security Checklist

- [ ] Never commit `.env` files to git
- [ ] Use different keys for test and production
- [ ] Verify webhook signatures
- [ ] Use HTTPS for all endpoints
- [ ] Restrict API key permissions
- [ ] Enable Stripe Radar for fraud detection
- [ ] Set up webhook retry logic
- [ ] Monitor failed webhooks

---

## Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Webhook Guide**: https://stripe.com/docs/webhooks
- **Customer Portal**: https://stripe.com/docs/billing/subscriptions/customer-portal
- **Testing**: https://stripe.com/docs/testing
- **Stripe CLI**: https://stripe.com/docs/stripe-cli

## Need Help?

If you encounter issues:

1. Check Stripe Dashboard → Developers → Logs
2. Check Stripe Dashboard → Webhooks → Events
3. Review server logs
4. Test with Stripe CLI
5. Contact Stripe Support: https://support.stripe.com
