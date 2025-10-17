import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, Shield, BarChart3, Zap, CheckCircle, ArrowRight, Search, FileCheck, ShoppingCart, ChevronDown } from 'lucide-react';
import AnimatedCubeHero from '@/components/AnimatedCubeHero';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Only run when router is ready
    if (!router.isReady) return;
    
    // Check if user is already logged in
    // Note: We don't auto-redirect logged-in users anymore because:
    // 1. They might want to view pricing
    // 2. They might be going through the subscription flow
    // 3. Auto-redirecting interferes with the pricing component's checkout flow
    
    // If you want to redirect logged-in users, do it only on initial load
    // and only if they're not in the middle of a pricing flow
    const checkAuth = async () => {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (session && router.query.autoCheckout) {
        // User is going through pricing flow after OAuth, don't redirect
        return;
      }
      // Optionally: Uncomment below to redirect logged-in users to dashboard
      // if (session) {
      //   router.push('/dashboard');
      // }
    };
    checkAuth();
  }, [router.isReady, router.query]);

  const features = [
    {
      icon: Shield,
      title: 'Compliance Management',
      description: 'Track and manage property compliance across NYC and Philadelphia',
    },
    {
      icon: Building2,
      title: 'Property Portfolio',
      description: 'Centralized dashboard for all your properties',
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Get instant insights into compliance scores and risks',
    },
    {
      icon: Zap,
      title: 'Automated Reports',
      description: 'Generate compliance reports with a single click',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-corporate-500/20 to-gold-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 to-corporate-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-emerald-500/20 to-corporate-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 backdrop-blur-xl bg-slate-900/50 border-b border-slate-700/50">
        <div className="container-modern">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-3">
              <Image src="/logo.svg" alt="Propply AI" width={160} height={160} className="w-40 h-40" />
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/login" className="btn-secondary text-sm px-3 py-1.5">
                Sign In
              </Link>
              <Link href="/login?signup=true" className="btn-primary text-sm px-3 py-1.5">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Animated Cubes */}
      <section className="relative z-10 pt-12 pb-16">
        <div className="container-modern">
          <AnimatedCubeHero />
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-12">
        <div className="container-modern">
          <h2 className="text-3xl font-bold text-center mb-10 gradient-text">
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="card group hover:scale-105 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-xl flex items-center justify-center mb-4 group-hover:shadow-glow transition-all">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-12 bg-slate-800/30 backdrop-blur-sm">
        <div className="container-modern">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                <span className="gradient-text">Simplify Compliance</span>
                <br />
                <span className="text-white">Save Time & Money</span>
              </h2>
              <p className="text-base text-slate-300 mb-6">
                Stop juggling spreadsheets and endless paperwork. Propply AI brings all your
                compliance data into one intuitive platform.
              </p>
              <ul className="space-y-3">
                {[
                  'Automated data syncing from city databases',
                  'Real-time compliance scoring',
                  'Vendor marketplace for quick fixes',
                  'Portfolio-level insights and reporting',
                ].map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card p-8 text-center">
              <div className="text-6xl font-bold gradient-text mb-4">99.5%</div>
              <p className="text-xl text-white font-semibold mb-2">Compliance Rate</p>
              <p className="text-slate-400">Achieved by our customers on average</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-12">
        <div className="container-modern">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">
              <span className="gradient-text">See How It Works</span>
            </h2>
            <p className="text-base text-slate-400 max-w-2xl mx-auto">
              Three simple steps to streamline your property compliance management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="card text-center group hover:scale-105 transition-all duration-300">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-glow">
                  1
                </div>
                <div className="pt-8">
                  <div className="w-16 h-16 bg-corporate-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:shadow-glow transition-all">
                    <Search className="w-8 h-8 text-corporate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Connect Your Properties</h3>
                  <p className="text-slate-400">
                    Add your properties to the platform. Our AI automatically syncs with NYC and Philadelphia city databases to pull in compliance data.
                  </p>
                </div>
              </div>
              {/* Connecting Arrow */}
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-corporate-500/30">
                <ArrowRight className="w-8 h-8" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="card text-center group hover:scale-105 transition-all duration-300">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-glow">
                  2
                </div>
                <div className="pt-8">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:shadow-glow transition-all">
                    <FileCheck className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Monitor Compliance</h3>
                  <p className="text-slate-400">
                    View real-time compliance scores, track violations, and receive instant alerts when issues arise. AI-powered insights help you prioritize what matters most.
                  </p>
                </div>
              </div>
              {/* Connecting Arrow */}
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-emerald-500/30">
                <ArrowRight className="w-8 h-8" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="card text-center group hover:scale-105 transition-all duration-300">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-gold-500 to-gold-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-glow">
                3
              </div>
              <div className="pt-8">
                <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:shadow-glow transition-all">
                  <ShoppingCart className="w-8 h-8 text-gold-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Take Action</h3>
                <p className="text-slate-400">
                  Connect with verified vendors in our marketplace to resolve violations quickly. Generate reports and stay compliant with ease.
                </p>
              </div>
            </div>
          </div>

          {/* See It In Action CTA */}
          <div className="text-center">
            <Link
              href="/login?signup=true"
              className="btn-primary inline-flex items-center group"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-12 bg-slate-800/30 backdrop-blur-sm">
        <div className="container-modern">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">
              <span className="gradient-text">Frequently Asked Questions</span>
            </h2>
            <p className="text-base text-slate-400 max-w-2xl mx-auto">
              Everything you need to know about Propply AI
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {/* FAQ 1 */}
            <details className="card group cursor-pointer">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-white group-hover:text-corporate-400 transition-colors">
                  What is Propply AI?
                </h3>
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-slate-400">
                  Propply AI is an intelligent property compliance management platform designed for property managers and landlords. We automate the tracking and management of property compliance requirements across NYC and Philadelphia, helping you stay compliant while saving time and avoiding costly violations.
                </p>
              </div>
            </details>

            {/* FAQ 2 */}
            <details className="card group cursor-pointer">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-white group-hover:text-corporate-400 transition-colors">
                  Which cities does Propply AI support?
                </h3>
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-slate-400">
                  Currently, Propply AI supports property compliance management in New York City (NYC) and Philadelphia. We're continuously expanding our coverage to additional cities. If you'd like to see your city supported, please contact us to express your interest.
                </p>
              </div>
            </details>

            {/* FAQ 3 */}
            <details className="card group cursor-pointer">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-white group-hover:text-corporate-400 transition-colors">
                  How does the AI sync work?
                </h3>
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-slate-400">
                  Our AI-powered system automatically connects to city databases and pulls in compliance data for your properties. This includes violations, permits, certificates, and inspection records. The data is updated regularly to ensure you always have the most current information at your fingertips.
                </p>
              </div>
            </details>

            {/* FAQ 4 */}
            <details className="card group cursor-pointer">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-white group-hover:text-corporate-400 transition-colors">
                  What is the vendor marketplace?
                </h3>
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-slate-400">
                  Our vendor marketplace connects you with verified, qualified service providers who can help resolve compliance issues quickly. From plumbers and electricians to inspectors and contractors, find trusted professionals who understand property compliance requirements.
                </p>
              </div>
            </details>

            {/* FAQ 5 */}
            <details className="card group cursor-pointer">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-white group-hover:text-corporate-400 transition-colors">
                  Is there a free trial available?
                </h3>
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-slate-400">
                  You can add one property for free to explore the platform and see how it works. However, AI analysis features require a paid subscription. This allows you to get familiar with the interface and basic compliance tracking before committing to a plan.
                </p>
              </div>
            </details>

            {/* FAQ 6 */}
            <details className="card group cursor-pointer">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-white group-hover:text-corporate-400 transition-colors">
                  How much does Propply AI cost?
                </h3>
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-slate-400">
                  We offer flexible pricing plans to suit property managers of all sizes, from individual landlords to large portfolio managers. Visit our{' '}
                  <Link href="/pricing" className="text-corporate-400 hover:text-corporate-300 underline">
                    pricing page
                  </Link>
                  {' '}to see detailed plan comparisons and find the right fit for your needs.
                </p>
              </div>
            </details>

            {/* FAQ 7 */}
            <details className="card group cursor-pointer">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-white group-hover:text-corporate-400 transition-colors">
                  Is my data secure?
                </h3>
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-slate-400">
                  Absolutely. We take data security seriously and employ industry-standard encryption and security practices to protect your information. All data is encrypted in transit and at rest, and we never share your information with third parties without your explicit consent.
                </p>
              </div>
            </details>

            {/* FAQ 8 */}
            <details className="card group cursor-pointer">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-white group-hover:text-corporate-400 transition-colors">
                  Can I cancel anytime?
                </h3>
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-slate-400">
                  Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. If you cancel, you'll continue to have access to your account until the end of your current billing period.
                </p>
              </div>
            </details>
          </div>

          {/* Still have questions CTA */}
          <div className="text-center mt-12">
            <p className="text-slate-400 mb-4">Still have questions?</p>
            <Link href="/contact" className="btn-secondary inline-flex items-center">
              Contact Us
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-12">
        <div className="container-modern">
          <div className="card text-center max-w-3xl mx-auto bg-gradient-to-r from-corporate-500/10 to-emerald-500/10 border-corporate-500/30">
            <h2 className="text-3xl font-bold mb-3 gradient-text">
              Ready to Get Started?
            </h2>
            <p className="text-base text-slate-300 mb-6">
              Join property managers across NYC and Philadelphia who trust Propply AI.
            </p>
            <Link href="/login?signup=true" className="btn-primary text-lg inline-flex items-center group">
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="container-modern py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo and Tagline */}
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Propply AI" width={120} height={120} className="w-30 h-30" />
              <p className="text-slate-400 text-sm hidden md:block max-w-xs">
                Intelligent property compliance management for modern property managers.
              </p>
            </div>

            {/* Footer Links */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link href="/features" className="text-slate-400 hover:text-white text-sm transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="text-slate-400 hover:text-white text-sm transition-colors">
                Pricing
              </Link>
              <Link href="/terms" className="text-slate-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-slate-400 hover:text-white text-sm transition-colors">
                Privacy
              </Link>
              <Link href="/contact" className="text-slate-400 hover:text-white text-sm transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center mt-4 pt-4 border-t border-slate-700/50">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} Propply AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
