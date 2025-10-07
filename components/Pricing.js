import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';

export default function Pricing() {
  const [loading, setLoading] = useState(null);

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
    try {
      setLoading(planId);
      
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
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

        <div className="mt-12 text-center">
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
