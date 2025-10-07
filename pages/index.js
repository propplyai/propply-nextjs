import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Building2, Shield, BarChart3, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import Pricing from '@/components/Pricing';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkAuth();
  }, [router]);

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
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-xl flex items-center justify-center shadow-enterprise">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Propply AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="btn-secondary text-sm">
                Sign In
              </Link>
              <Link href="/login?signup=true" className="btn-primary text-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="container-modern">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
              <span className="gradient-text">Intelligent Property</span>
              <br />
              <span className="text-white">Compliance Management</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Streamline property compliance for NYC and Philadelphia with AI-powered insights,
              automated reporting, and real-time monitoring.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/login?signup=true" className="btn-primary text-lg group">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 inline group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/demo" className="btn-outline text-lg">
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20">
        <div className="container-modern">
          <h2 className="text-4xl font-bold text-center mb-16 gradient-text">
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
      <section className="relative z-10 py-20 bg-slate-800/30 backdrop-blur-sm">
        <div className="container-modern">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                <span className="gradient-text">Simplify Compliance</span>
                <br />
                <span className="text-white">Save Time & Money</span>
              </h2>
              <p className="text-lg text-slate-300 mb-8">
                Stop juggling spreadsheets and endless paperwork. Propply AI brings all your
                compliance data into one intuitive platform.
              </p>
              <ul className="space-y-4">
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

      {/* Pricing Section */}
      <Pricing />

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="container-modern">
          <div className="card text-center max-w-3xl mx-auto bg-gradient-to-r from-corporate-500/10 to-emerald-500/10 border-corporate-500/30">
            <h2 className="text-4xl font-bold mb-4 gradient-text">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-slate-300 mb-8">
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
        <div className="container-modern py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold gradient-text">Propply AI</span>
              </div>
              <p className="text-slate-400 text-sm">
                Intelligent property compliance management for modern property managers.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-slate-400 hover:text-white text-sm transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-slate-400 hover:text-white text-sm transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="text-slate-400 hover:text-white text-sm transition-colors">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-slate-400 hover:text-white text-sm transition-colors">About</Link></li>
                <li><Link href="/blog" className="text-slate-400 hover:text-white text-sm transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="text-slate-400 hover:text-white text-sm transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-slate-400 hover:text-white text-sm transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="text-slate-400 hover:text-white text-sm transition-colors">Contact</Link></li>
                <li><Link href="/status" className="text-slate-400 hover:text-white text-sm transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700/50 mt-8 pt-8 text-center">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} Propply AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
