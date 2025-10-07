# Stripe Integration Setup Guide

This guide will help you configure Stripe payments for your Propply AI application.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Access to your Stripe dashboard

## Pricing Plans

Your application includes three pricing plans:

1. **Single Location – 1 Time Report** - $19.99 (one-time payment)
2. **Single Location – Monthly Report** - $49.99/month (subscription)
3. **Multiple Locations – Ongoing** - $299.99/month (subscription)

## Setup Steps

### 1. Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → API keys**
3. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
4. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

### 2. Configure Environment Variables

1. Create a `.env.local` file in the root directory (or copy from `.env.example`)
2. Add your Stripe keys:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
```

⚠️ **Important**: Never commit your `.env.local` file to version control!

### 3. Set Up Stripe Webhook

Webhooks allow Stripe to notify your application about events (payments, subscriptions, etc.)

#### For Local Development:

1. Install the Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows
   scoop install stripe
   
   # Linux
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. Log in to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. The CLI will display a webhook signing secret (starts with `whsec_`). Add it to your `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_here
   ```

#### For Production:

1. Go to your [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select the following events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** and add it to your production environment variables

### 4. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, run the Stripe CLI webhook forwarder:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. Visit http://localhost:3000 and scroll to the pricing section
4. Click on any plan to test checkout

5. Use Stripe test cards:
   - **Success**: `4242 4242 4242 4242`
   - **Failure**: `4000 0000 0000 0002`
   - Use any future expiry date and any 3-digit CVC

### 5. Monitor Payments

View all transactions in your [Stripe Dashboard → Payments](https://dashboard.stripe.com/payments)

## File Structure

```
pages/
├── api/
│   └── stripe/
│       ├── checkout.js     # Creates checkout sessions
│       └── webhook.js      # Handles Stripe events
├── success.js              # Payment success page
└── index.js                # Landing page with pricing

components/
└── Pricing.js              # Pricing section component
```

## Customization

### Update Pricing

Edit the `pricingPlans` object in `pages/api/stripe/checkout.js`:

```javascript
const pricingPlans = {
  'single-one-time': {
    name: 'Your Plan Name',
    price: 1999, // Amount in cents
    mode: 'payment', // or 'subscription'
    // ... other options
  },
};
```

### Modify Pricing Display

Edit the `plans` array in `components/Pricing.js` to change:
- Plan names
- Descriptions
- Feature lists
- Call-to-action buttons

### Handle Successful Payments

Edit `pages/api/stripe/webhook.js` to add custom logic:

```javascript
case 'checkout.session.completed': {
  const session = event.data.object;
  
  // Add your custom logic here:
  // - Save order to Supabase
  // - Send confirmation email
  // - Grant access to features
  // - etc.
  
  break;
}
```

## Security Best Practices

1. ✅ Always verify webhook signatures
2. ✅ Never expose your Secret Key in client-side code
3. ✅ Use environment variables for all sensitive data
4. ✅ Test with Stripe test mode before going live
5. ✅ Implement proper error handling
6. ✅ Log all webhook events for debugging

## Going Live

When ready for production:

1. Switch to **Live Mode** in your Stripe Dashboard
2. Get your live API keys (start with `pk_live_` and `sk_live_`)
3. Update your production environment variables
4. Set up production webhooks with your live domain
5. Test thoroughly with real payment methods (small amounts)
6. Enable Stripe Radar for fraud protection

## Troubleshooting

### Webhook not receiving events
- Check that Stripe CLI is running
- Verify webhook URL is correct
- Check webhook signing secret matches

### Payment not processing
- Verify API keys are correct
- Check browser console for errors
- Review Stripe Dashboard logs

### Subscription not creating
- Ensure `mode: 'subscription'` is set
- Verify `recurring` interval is specified
- Check webhook events are being received

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

## Next Steps

1. Set up email notifications for successful payments
2. Create a customer portal for subscription management
3. Implement usage-based billing if needed
4. Add promo codes and discounts
5. Integrate with Supabase to track customer subscriptions
