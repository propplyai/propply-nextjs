import Stripe from 'stripe';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Disable body parsing for this route (required for Stripe webhooks)
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout completed:', session);
        
        // TODO: Save order to database
        // - Get customer details from session
        // - Store subscription ID if applicable
        // - Grant access to service
        // - Send confirmation email
        
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription);
        
        // TODO: Update subscription status in database
        
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription cancelled:', subscription);
        
        // TODO: Revoke access in database
        
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('Payment succeeded:', invoice);
        
        // TODO: Send receipt email
        
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Payment failed:', invoice);
        
        // TODO: Send payment failed email
        
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}
