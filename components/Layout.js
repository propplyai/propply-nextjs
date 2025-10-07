import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Building2, FileCheck, ShoppingBag, BarChart3, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout({ children, user, onLogout }) {
  const router = useRouter();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Compliance', href: '/compliance', icon: FileCheck },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
  ];

  const isActive = (href) => router.pathname === href || router.pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-corporate-500/10 to-gold-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-500/10 to-corporate-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
        <div className="container-modern">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-xl flex items-center justify-center shadow-enterprise group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Propply AI</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-corporate-500/10 text-corporate-400 border border-corporate-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Link
                href="/profile"
                className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-slate-800/50 transition-all"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-corporate-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-300 hidden lg:block">
                  {user?.email || 'User'}
                </span>
              </Link>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-ruby-400 hover:bg-slate-800/50 rounded-lg transition-all"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-xl mt-20">
        <div className="container-modern py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} Propply AI. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-slate-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-slate-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="/support" className="text-slate-400 hover:text-white text-sm transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
