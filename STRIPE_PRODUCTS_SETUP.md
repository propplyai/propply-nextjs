# Stripe Products Setup Guide

This guide explains how to set up your Stripe products in the Stripe Dashboard. You need to create the products that match your pricing plans.

## Overview

You need to configure **3 pricing plans** in Stripe:

1. **Single Location – 1 Time Report** ($19.99 one-time)
2. **Single Location – Monthly Report** ($49.99/month)
3. **Multiple Locations – Ongoing** ($299.99/month)

## Option 1: Use Stripe Dashboard (Recommended for Production)

### Step 1: Access Stripe Dashboard

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Product catalog**
3. Click **+ Add product**

### Step 2: Create Product 1 - Single Location (One-Time)

**Product Information:**
- Name: `Single Location – 1 Time Report`
- Description: `One comprehensive compliance report for a single property`

**Pricing:**
- Type: **One time**
- Price: `$19.99`
- Currency: `USD`

**Advanced Options:**
- Click **Add metadata**
- Key: `planId`, Value: `single-one-time`

Click **Save product**

### Step 3: Create Product 2 - Single Location (Monthly)

**Product Information:**
- Name: `Single Location – Monthly Report`
- Description: `Monthly compliance monitoring for one property`

**Pricing:**
- Type: **Recurring**
- Billing period: **Monthly**
- Price: `$49.99`
- Currency: `USD`

**Advanced Options:**
- Click **Add metadata**
- Key: `planId`, Value: `single-monthly`

Click **Save product**

### Step 4: Create Product 3 - Multiple Locations (Monthly)

**Product Information:**
- Name: `Multiple Locations – Ongoing`
- Description: `Complete portfolio monitoring solution with unlimited properties`

**Pricing:**
- Type: **Recurring**
- Billing period: **Monthly**
- Price: `$299.99`
- Currency: `USD`

**Advanced Options:**
- Click **Add metadata**
- Key: `planId`, Value: `multiple-ongoing`

Click **Save product**

### Step 5: Get Product and Price IDs (Optional)

If you want to use pre-configured product IDs instead of dynamic pricing:

1. Go to each product page
2. Copy the **Product ID** (starts with `prod_`)
3. Copy the **Price ID** (starts with `price_`)
4. Update your code to use these IDs

## Option 2: Use Dynamic Pricing (Current Setup)

Your application is currently configured to use **dynamic pricing**, which means:

- ✅ No need to create products in Stripe Dashboard manually
- ✅ Products are created on-the-fly during checkout
- ✅ Easier to test and modify prices
- ⚠️ Product data only exists in Stripe after first purchase

This is perfect for development and testing!

## Option 3: Use Stripe CLI (Automated)

You can also create products programmatically using Stripe CLI:

```bash
# Install Stripe CLI first
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Create Product 1 - One-time
stripe products create \
  --name="Single Location – 1 Time Report" \
  --description="One comprehensive compliance report for a single property" \
  --metadata[planId]="single-one-time"

stripe prices create \
  --product=prod_YOUR_PRODUCT_ID \
  --currency=usd \
  --unit-amount=1999

# Create Product 2 - Monthly subscription
stripe products create \
  --name="Single Location – Monthly Report" \
  --description="Monthly compliance monitoring for one property" \
  --metadata[planId]="single-monthly"

stripe prices create \
  --product=prod_YOUR_PRODUCT_ID \
  --currency=usd \
  --unit-amount=4999 \
  --recurring[interval]=month

# Create Product 3 - Enterprise Monthly
stripe products create \
  --name="Multiple Locations – Ongoing" \
  --description="Complete portfolio monitoring solution with unlimited properties" \
  --metadata[planId]="multiple-ongoing"

stripe prices create \
  --product=prod_YOUR_PRODUCT_ID \
  --currency=usd \
  --unit-amount=29999 \
  --recurring[interval]=month
```

## Switching to Pre-configured Products

If you created products in the Stripe Dashboard and want to use them instead of dynamic pricing:

### 1. Get Your Price IDs

From Stripe Dashboard → Products, copy the Price IDs for each product.

### 2. Update `pages/api/stripe/checkout.js`

Replace the pricing plans object:

```javascript
const pricingPlans = {
  'single-one-time': {
    priceId: 'price_YOUR_ONE_TIME_PRICE_ID',
    mode: 'payment',
  },
  'single-monthly': {
    priceId: 'price_YOUR_MONTHLY_PRICE_ID',
    mode: 'subscription',
  },
  'multiple-ongoing': {
    priceId: 'price_YOUR_ENTERPRISE_PRICE_ID',
    mode: 'subscription',
  },
};
```

### 3. Update the Checkout Session Creation

Replace the `line_items` section:

```javascript
line_items: [
  {
    price: plan.priceId, // Use pre-configured price ID
    quantity: 1,
  },
],
```

## Verifying Your Setup

### Test in Stripe Dashboard

1. Go to **Products** → **Product catalog**
2. Verify all 3 products are listed
3. Check each product has:
   - Correct pricing
   - Correct billing interval
   - `planId` metadata (if using dashboard products)

### Test Checkout Flow

1. Start your app: `npm run dev`
2. Start webhook listener: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. Visit: http://localhost:3000
4. Click a pricing plan
5. Use test card: `4242 4242 4242 4242`
6. Complete checkout
7. Verify in Stripe Dashboard:
   - Payment appears in **Payments**
   - Customer created in **Customers**
   - Subscription created (for monthly plans) in **Subscriptions**

## Metadata Reference

Each product should have the following metadata to work with the application:

| Metadata Key | Value | Purpose |
|--------------|-------|---------|
| `planId` | `single-one-time` | Identifies plan in database |
| `planId` | `single-monthly` | Identifies plan in database |
| `planId` | `multiple-ongoing` | Identifies plan in database |

The `planId` metadata helps link Stripe products to your database records.

## Troubleshooting

### Products not appearing in dashboard
- Make sure you're in the correct mode (Test/Live)
- Check if products were created successfully
- Try refreshing the page

### Checkout fails with "No such price"
- Verify your price IDs are correct
- Make sure you're using test mode keys with test prices
- Check if you're mixing test/live mode resources

### Subscription not created after payment
- Check webhook is receiving events
- Verify webhook secret is correct
- Review webhook logs in Stripe Dashboard

## Production Checklist

Before going live:

- [ ] Create products in **Live mode**
- [ ] Get Live mode API keys
- [ ] Update production environment variables
- [ ] Set up production webhook endpoint
- [ ] Test with real payment method (small amount)
- [ ] Enable Stripe Radar for fraud protection
- [ ] Configure email receipts in Stripe settings
- [ ] Set up billing portal for customer self-service

## Next Steps

1. ✅ Products configured in Stripe
2. ✅ Test checkout flow
3. ✅ Verify webhooks working
4. 📝 Customize success page
5. 📝 Set up email notifications
6. 📝 Create customer billing portal
7. 📝 Add subscription management UI

## Resources

- [Stripe Products Documentation](https://stripe.com/docs/products-prices/overview)
- [Stripe Metadata](https://stripe.com/docs/api/metadata)
- [Stripe Test Mode](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
