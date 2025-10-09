import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, ArrowLeft } from 'lucide-react';
import Pricing from '@/components/Pricing';
import { authHelpers } from '@/lib/supabase';

export default function PricingPage() {
  const router = useRouter();

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
            <Link href="/" className="flex items-center space-x-3">
              <Image src="/logo.svg" alt="Propply AI" width={80} height={80} className="w-20 h-20" />
            </Link>
            <Link href="/dashboard" className="btn-secondary text-sm inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <div className="relative z-10">
        <Pricing />
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-xl mt-20">
        <div className="container-modern py-12">
          <div className="text-center">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} Propply AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
