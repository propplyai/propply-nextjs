import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Check, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Pricing() {
  const router = useRouter();
  const [loading, setLoading] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');

  // Handle auto-checkout after login
  useEffect(() => {
    // Only run when router is ready to avoid stale query params
    if (!router.isReady) return;

    const autoCheckout = router.query.autoCheckout;
    console.log('[Pricing] Auto-checkout check:', { autoCheckout, allQuery: router.query, isReady: router.isReady });

    if (autoCheckout) {
      console.log('[Pricing] Triggering auto-checkout for plan:', autoCheckout);

      // Wait for session to be fully established before triggering checkout
      const triggerCheckout = async () => {
        // Give the session a moment to be fully established after OAuth redirect
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify session exists before proceeding
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('[Pricing] Session confirmed, proceeding with checkout');
          handleCheckout(autoCheckout);
        } else {
          console.error('[Pricing] No session found for auto-checkout');
          // Redirect back to login if session is missing
          router.push(`/login?redirect=${encodeURIComponent('/pricing')}&plan=${autoCheckout}`);
        }
      };

      triggerCheckout();

      // Remove the query param after triggering
      setTimeout(() => {
        const { autoCheckout: _, ...restQuery } = router.query;
        router.replace({ query: restQuery }, undefined, { shallow: true });
      }, 1500);
    }
  }, [router.isReady, router.query.autoCheckout]);

  const plans = [
    {
      id: 'single-one-time',
      name: 'Single Location – 1 Time Report',
      price: 19.99,
      interval: 'one-time',
      description: 'Perfect for a single property compliance check',
      features: [
        'One comprehensive compliance report',
        'NYC & Philadelphia coverage',
        'Detailed violation analysis',
        'Downloadable PDF report',
        'Valid for 30 days',
      ],
      popular: false,
      cta: 'Get Report',
    },
    {
      id: 'single-monthly',
      name: 'Single Location – Monthly Report',
      price: 49.99,
      interval: 'month',
      description: 'Ongoing monitoring for one property',
      features: [
        'Monthly compliance reports',
        'Real-time violation alerts',
        'Compliance score tracking',
        'Email notifications',
        'Historical data access',
        'Priority support',
      ],
      popular: true,
      cta: 'Start Monitoring',
    },
    {
      id: 'multiple-ongoing',
      name: 'Multiple Locations – Ongoing',
      price: 299.99,
      interval: 'month',
      description: 'Complete solution for property portfolios',
      features: [
        'Unlimited properties',
        'Real-time monitoring',
        'Portfolio dashboard',
        'Advanced analytics',
        'Automated reporting',
        'API access',
        'Dedicated account manager',
        'Custom integrations',
      ],
      popular: false,
      cta: 'Start Enterprise',
    },
  ];

  const handleCheckout = async (planId) => {
    console.log('[Pricing] handleCheckout called with planId:', planId);
    try {
      setLoading(planId);

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[Pricing] Session check:', { hasSession: !!session, userId: session?.user?.id });

      if (!session) {
        console.log('[Pricing] No session, redirecting to login');
        // Use current path for redirect, or /pricing if we're on the landing page
        const currentPath = router.pathname === '/' ? '/pricing' : router.pathname;
        const redirectUrl = currentPath + (router.asPath.includes('#') ? router.asPath.substring(router.asPath.indexOf('#')) : '');
        router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}&plan=${planId}`);
        return;
      }

      console.log('[Pricing] Calling Stripe checkout API...');

      // Get the access token from the session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const accessToken = currentSession?.access_token;

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({ planId, promoCode: promoCode.trim() }),
      });

      const { url, error } = await response.json();
      console.log('[Pricing] Stripe API response:', { url, error });

      if (error) {
        if (error.includes('Unauthorized')) {
          // Session expired, redirect to login
          const currentPath = router.pathname === '/' ? '/pricing' : router.pathname;
          const redirectUrl = currentPath + (router.asPath.includes('#') ? router.asPath.substring(router.asPath.indexOf('#')) : '');
          router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}&plan=${planId}`);
          return;
        }
        throw new Error(error);
      }

      if (url) {
        console.log('[Pricing] Redirecting to Stripe checkout:', url);
        window.location.href = url;
      } else {
        console.error('[Pricing] No checkout URL received');
      }
    } catch (error) {
      console.error('[Pricing] Checkout error:', error);
      alert('There was an error starting checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <section id="pricing" className="relative z-10 py-20 bg-slate-800/30 backdrop-blur-sm">
      <div className="container-modern">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Simple, Transparent Pricing</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Choose the plan that fits your needs. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`card relative hover:scale-105 transition-all duration-300 ${
                plan.popular
                  ? 'border-2 border-corporate-500 shadow-2xl shadow-corporate-500/20'
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-full shadow-lg">
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-semibold">Most Popular</span>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold gradient-text">
                    ${plan.price}
                  </span>
                  {plan.interval !== 'one-time' && (
                    <span className="text-slate-400 ml-2">/{plan.interval}</span>
                  )}
                </div>
                {plan.interval === 'one-time' && (
                  <p className="text-sm text-slate-400 mt-1">One-time payment</p>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-corporate-500 to-corporate-600 text-white hover:shadow-glow'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.id ? 'Processing...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Promo Code Section */}
        <div className="mt-12 max-w-md mx-auto">
          <div className="card bg-gradient-to-r from-corporate-500/10 to-emerald-500/10 border-corporate-500/30">
            <h3 className="text-lg font-bold text-white mb-4 text-center">Have a Promo Code?</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError('');
                  setPromoApplied(false);
                }}
                placeholder="Enter promo code"
                className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-corporate-500 transition-colors"
              />
            </div>
            {promoApplied && (
              <div className="mt-3 text-center text-emerald-400 text-sm font-medium">
                ✓ Promo code will be applied at checkout
              </div>
            )}
            {promoError && (
              <div className="mt-3 text-center text-ruby-400 text-sm">
                {promoError}
              </div>
            )}
            {promoCode === 'INIT101' && !promoError && (
              <div className="mt-3 text-center text-emerald-400 text-sm font-medium">
                🎉 100% discount will be applied!
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400">
            Need a custom solution?{' '}
            <a href="mailto:sales@propply.ai" className="text-corporate-400 hover:text-corporate-300 font-semibold">
              Contact our sales team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
