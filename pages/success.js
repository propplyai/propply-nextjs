import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, ArrowRight, Building2 } from 'lucide-react';

export default function Success() {
  const router = useRouter();
  const { session_id } = router.query;
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session_id) {
      // In production, you would fetch session details from your backend
      // For now, we'll just show a success message
      setLoading(false);
    }
  }, [session_id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-corporate-500"></div>
          <p className="text-white mt-4">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-corporate-500/20 to-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-emerald-500/20 to-corporate-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 backdrop-blur-xl bg-slate-900/50 border-b border-slate-700/50">
        <div className="container-modern">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <Image src="/logo.svg" alt="Propply AI" width={64} height={64} className="w-16 h-16" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Success Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-64px)] py-20">
        <div className="container-modern">
          <div className="max-w-2xl mx-auto">
            <div className="card text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>

              <h1 className="text-4xl font-bold mb-4">
                <span className="gradient-text">Payment Successful!</span>
              </h1>

              <p className="text-xl text-slate-300 mb-8">
                Thank you for your purchase. Your payment has been processed successfully.
              </p>

              <div className="bg-slate-800/50 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-white mb-2">What's Next?</h2>
                <ul className="space-y-3 text-left">
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">You'll receive a confirmation email shortly</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Access your dashboard to start managing properties</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Your first report will be generated within 24 hours</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/dashboard" className="btn-primary inline-flex items-center group">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/" className="btn-outline">
                  Back to Home
                </Link>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-700">
                <p className="text-sm text-slate-400">
                  Need help? Contact us at{' '}
                  <a href="mailto:support@propply.ai" className="text-corporate-400 hover:text-corporate-300">
                    support@propply.ai
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
