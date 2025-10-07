import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authenticated user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's Stripe customer ID from database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.customer_id) {
      return res.status(400).json({ 
        error: 'No active subscription found. Please subscribe to a plan first.' 
      });
    }

    // Create a Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.customer_id,
      return_url: `${req.headers.origin}/profile`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return res.status(500).json({ 
      error: 'Failed to create portal session',
      details: error.message 
    });
  }
}
