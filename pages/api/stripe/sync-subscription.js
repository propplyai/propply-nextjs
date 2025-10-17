import { createServerSupabaseClient } from '@/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const supabase = createServerSupabaseClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user profile with subscription data
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_id, customer_id, subscription_status, subscription_tier')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    // If no subscription ID, return current data
    if (!profile.subscription_id || !profile.customer_id) {
      return res.status(200).json({ 
        message: 'No active subscription found',
        profile: {
          subscription_tier: profile.subscription_tier,
          subscription_status: profile.subscription_status,
          current_period_start: null,
          current_period_end: null
        }
      });
    }

    try {
      // Fetch subscription data from Stripe
      const subscription = await stripe.subscriptions.retrieve(profile.subscription_id);
      
      // Update user profile with current subscription data
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          subscription_status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating subscription data:', updateError);
        return res.status(500).json({ error: 'Failed to update subscription data' });
      }

      return res.status(200).json({
        message: 'Subscription data synced successfully',
        profile: {
          subscription_tier: updatedProfile.subscription_tier,
          subscription_status: updatedProfile.subscription_status,
          current_period_start: updatedProfile.current_period_start,
          current_period_end: updatedProfile.current_period_end
        }
      });

    } catch (stripeError) {
      console.error('Error fetching subscription from Stripe:', stripeError);
      
      // If subscription doesn't exist in Stripe, mark as cancelled
      if (stripeError.code === 'resource_missing') {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({
            subscription_status: 'cancelled',
            current_period_start: null,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating cancelled subscription:', updateError);
          return res.status(500).json({ error: 'Failed to update subscription status' });
        }

        return res.status(200).json({
          message: 'Subscription not found in Stripe, marked as cancelled',
          profile: {
            subscription_tier: updatedProfile.subscription_tier,
            subscription_status: updatedProfile.subscription_status,
            current_period_start: null,
            current_period_end: null
          }
        });
      }

      return res.status(500).json({ 
        error: 'Failed to sync subscription data from Stripe',
        details: stripeError.message 
      });
    }

  } catch (error) {
    console.error('Error in sync-subscription:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
