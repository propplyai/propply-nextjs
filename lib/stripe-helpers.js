import { createServerSupabaseClient } from './supabase';

/**
 * Create or get a Stripe customer in the database
 */
export async function createOrGetStripeCustomer(userId, stripeCustomerId, email, name = null) {
  const supabase = createServerSupabaseClient();

  try {
    // Check if customer already exists
    const { data: existing, error: fetchError } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return { data: existing, error: null };
    }

    // Create new customer record
    const { data, error } = await supabase
      .from('stripe_customers')
      .insert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        email,
        name,
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return { data: null, error };
  }
}

/**
 * Update user profile with subscription data
 */
export async function updateUserSubscription(userId, subscriptionData) {
  const supabase = createServerSupabaseClient();

  const {
    planId,
    subscriptionId,
    customerId,
    status,
    currentPeriodStart,
    currentPeriodEnd,
  } = subscriptionData;

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        subscription_tier: planId,
        subscription_status: status,
        subscription_id: subscriptionId,
        customer_id: customerId,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error updating user subscription:', error);
    return { data: null, error };
  }
}

/**
 * Record a payment in the database
 */
export async function recordPayment(paymentData) {
  const supabase = createServerSupabaseClient();

  const {
    userId,
    stripePaymentId,
    stripeSessionId,
    amount,
    currency = 'USD',
    status,
    paymentType,
    subscriptionTier,
    metadata = {},
  } = paymentData;

  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        stripe_payment_id: stripePaymentId,
        stripe_session_id: stripeSessionId,
        amount: amount / 100, // Convert cents to dollars
        currency: currency.toUpperCase(),
        status,
        payment_type: paymentType,
        subscription_tier: subscriptionTier,
        metadata,
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error recording payment:', error);
    return { data: null, error };
  }
}

/**
 * Get user by Stripe customer ID
 */
export async function getUserByStripeCustomerId(stripeCustomerId) {
  const supabase = createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('stripe_customers')
      .select('user_id, email, name')
      .eq('stripe_customer_id', stripeCustomerId)
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error fetching user by Stripe customer ID:', error);
    return { data: null, error };
  }
}

/**
 * Get user subscription details
 */
export async function getUserSubscription(userId) {
  const supabase = createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('subscription_tier, subscription_status, subscription_id, customer_id, current_period_start, current_period_end')
      .eq('id', userId)
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return { data: null, error };
  }
}

/**
 * Cancel user subscription
 */
export async function cancelUserSubscription(userId) {
  const supabase = createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return { data: null, error };
  }
}
