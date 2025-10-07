import Stripe from 'stripe';
import { buffer } from 'micro';
import {
  createOrGetStripeCustomer,
  updateUserSubscription,
  recordPayment,
  getUserByStripeCustomerId,
  cancelUserSubscription,
} from '@/lib/stripe-helpers';

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
        
        // Get full session details with customer email
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['customer', 'line_items'],
        });

        const customerId = fullSession.customer;
        const customerEmail = fullSession.customer_details?.email || fullSession.customer_email;
        const planId = session.metadata?.planId;
        
        // For subscription mode
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          
          // Find user by email (you might need to adjust this based on your auth setup)
          const { data: userProfile } = await getUserByStripeCustomerId(customerId);
          
          if (userProfile) {
            // Update user subscription
            await updateUserSubscription(userProfile.user_id, {
              planId,
              subscriptionId: subscription.id,
              customerId,
              status: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            });

            // Record payment
            await recordPayment({
              userId: userProfile.user_id,
              stripePaymentId: session.payment_intent,
              stripeSessionId: session.id,
              amount: session.amount_total,
              currency: session.currency,
              status: 'succeeded',
              paymentType: 'subscription',
              subscriptionTier: planId,
              metadata: { subscription_id: subscription.id },
            });
          }
        }
        
        // For one-time payment mode
        if (session.mode === 'payment') {
          const { data: userProfile } = await getUserByStripeCustomerId(customerId);
          
          if (userProfile) {
            // Update user profile with one-time purchase
            await updateUserSubscription(userProfile.user_id, {
              planId,
              subscriptionId: null,
              customerId,
              status: 'active',
              currentPeriodStart: new Date().toISOString(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            });

            // Record one-time payment
            await recordPayment({
              userId: userProfile.user_id,
              stripePaymentId: session.payment_intent,
              stripeSessionId: session.id,
              amount: session.amount_total,
              currency: session.currency,
              status: 'succeeded',
              paymentType: 'one_time',
              subscriptionTier: planId,
            });
          }
        }
        
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription);
        
        const { data: userProfile } = await getUserByStripeCustomerId(subscription.customer);
        
        if (userProfile) {
          await updateUserSubscription(userProfile.user_id, {
            planId: subscription.metadata?.planId || 'unknown',
            subscriptionId: subscription.id,
            customerId: subscription.customer,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          });
        }
        
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription cancelled:', subscription);
        
        const { data: userProfile } = await getUserByStripeCustomerId(subscription.customer);
        
        if (userProfile) {
          await cancelUserSubscription(userProfile.user_id);
        }
        
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('Payment succeeded:', invoice);
        
        const { data: userProfile } = await getUserByStripeCustomerId(invoice.customer);
        
        if (userProfile && invoice.subscription) {
          // Record recurring payment
          await recordPayment({
            userId: userProfile.user_id,
            stripePaymentId: invoice.payment_intent,
            stripeSessionId: null,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'succeeded',
            paymentType: 'subscription_renewal',
            subscriptionTier: invoice.lines?.data[0]?.price?.metadata?.planId,
            metadata: { subscription_id: invoice.subscription, invoice_id: invoice.id },
          });
        }
        
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Payment failed:', invoice);
        
        const { data: userProfile } = await getUserByStripeCustomerId(invoice.customer);
        
        if (userProfile) {
          // Update subscription status to past_due
          await updateUserSubscription(userProfile.user_id, {
            planId: invoice.lines?.data[0]?.price?.metadata?.planId || 'unknown',
            subscriptionId: invoice.subscription,
            customerId: invoice.customer,
            status: 'past_due',
            currentPeriodStart: new Date(invoice.period_start * 1000).toISOString(),
            currentPeriodEnd: new Date(invoice.period_end * 1000).toISOString(),
          });

          // Record failed payment
          await recordPayment({
            userId: userProfile.user_id,
            stripePaymentId: invoice.payment_intent,
            stripeSessionId: null,
            amount: invoice.amount_due,
            currency: invoice.currency,
            status: 'failed',
            paymentType: 'subscription_renewal',
            subscriptionTier: invoice.lines?.data[0]?.price?.metadata?.planId,
            metadata: { subscription_id: invoice.subscription, invoice_id: invoice.id },
          });
        }
        
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
