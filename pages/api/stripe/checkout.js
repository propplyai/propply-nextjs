import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/lib/supabase';
import { createOrGetStripeCustomer } from '@/lib/stripe-helpers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Define your pricing plans
const pricingPlans = {
  'single-one-time': {
    name: 'Single Location – 1 Time Report',
    price: 1999, // $19.99 in cents
    mode: 'payment',
    description: 'One comprehensive compliance report for a single property',
  },
  'single-monthly': {
    name: 'Single Location – Monthly Report',
    price: 4999, // $49.99 in cents
    mode: 'subscription',
    interval: 'month',
    description: 'Monthly compliance monitoring for one property',
  },
  'multiple-ongoing': {
    name: 'Multiple Locations – Ongoing',
    price: 29999, // $299.99 in cents
    mode: 'subscription',
    interval: 'month',
    description: 'Complete portfolio monitoring solution',
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, promoCode } = req.body;

    if (!planId || !pricingPlans[planId]) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    const plan = pricingPlans[planId];
    const origin = req.headers.origin || 'http://localhost:3000';

    // Handle promo code
    let couponId = null;
    if (promoCode && promoCode.trim().toUpperCase() === 'INIT101') {
      // Create or get the 100% off coupon for init101
      try {
        // Try to retrieve existing coupon
        try {
          const existingCoupon = await stripe.coupons.retrieve('INIT101');
          couponId = existingCoupon.id;
        } catch (retrieveError) {
          // Coupon doesn't exist, create it
          const coupon = await stripe.coupons.create({
            id: 'INIT101',
            percent_off: 100,
            duration: 'once',
            name: 'Init101 - 100% Off',
          });
          couponId = coupon.id;
        }
      } catch (couponError) {
        console.error('Error handling promo code:', couponError);
        // Continue without coupon if there's an error
      }
    }

    // Get authenticated user
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized. Please log in to continue.' });
    }

    // Get or create Stripe customer
    let stripeCustomerId;
    
    try {
      // Check if user already has a Stripe customer
      const { data: existingCustomer } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single();

      if (existingCustomer) {
        stripeCustomerId = existingCustomer.stripe_customer_id;
      } else {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
          },
        });

        stripeCustomerId = customer.id;

        // Save to database
        await createOrGetStripeCustomer(user.id, customer.id, user.email, user.user_metadata?.full_name);
      }
    } catch (customerError) {
      console.error('Error creating Stripe customer:', customerError);
      // Continue anyway - Stripe will create customer during checkout
    }

    // Create Stripe checkout session
    const sessionConfig = {
      mode: plan.mode,
      payment_method_types: ['card'],
      customer: stripeCustomerId, // Link to existing customer
      customer_email: !stripeCustomerId ? user.email : undefined, // Fallback if no customer
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.price,
            ...(plan.mode === 'subscription' && {
              recurring: {
                interval: plan.interval,
              },
            }),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
      metadata: {
        planId,
        supabase_user_id: user.id,
        promo_code: promoCode || '',
      },
    };

    // Apply coupon if valid promo code was provided
    if (couponId) {
      sessionConfig.discounts = [{ coupon: couponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: error.message });
  }
}
