import Stripe from 'stripe';

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
    const { planId } = req.body;

    if (!planId || !pricingPlans[planId]) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    const plan = pricingPlans[planId];
    const origin = req.headers.origin || 'http://localhost:3000';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: plan.mode,
      payment_method_types: ['card'],
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
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: error.message });
  }
}
