/**
 * Cache Statistics Page - View vendor search cache performance
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { authHelpers } from '@/lib/supabase';
import {
  ArrowLeft, Database, TrendingUp, Clock, MapPin,
  RefreshCw, Loader2, CheckCircle, XCircle
} from 'lucide-react';
import { cn, authenticatedFetch } from '@/lib/utils';

export default function CacheStatsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cacheData, setCacheData] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { user: currentUser, error: authError } = await authHelpers.getUser();

      if (authError || !currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      await loadCacheStats();
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    }
  };

  const loadCacheStats = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/marketplace/check-cache');
      const data = await response.json();

      if (response.ok) {
        setCacheData(data);
      }
    } catch (error) {
      console.error('Error loading cache stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-corporate-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        {/* Header */}
        <Link
          href="/marketplace"
          className="inline-flex items-center space-x-2 text-corporate-400 hover:text-corporate-300 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Marketplace</span>
        </Link>

        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Vendor Search Cache</h1>
              <p className="text-slate-400">Monitor caching performance and reduce API costs</p>
            </div>
          </div>
        </div>

        {cacheData && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Total Cached Searches</span>
                  <Database className="w-5 h-5 text-corporate-400" />
                </div>
                <div className="text-3xl font-bold text-white">{cacheData.stats.total_entries}</div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Active Entries</span>
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-white">{cacheData.stats.active_entries}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {cacheData.stats.expired_entries} expired
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Total Cache Hits</span>
                  <TrendingUp className="w-5 h-5 text-gold-400" />
                </div>
                <div className="text-3xl font-bold text-white">{cacheData.stats.total_accesses}</div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Vendors Cached</span>
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-white">{cacheData.stats.total_vendors_cached}</div>
              </div>
            </div>

            {/* Most Accessed */}
            {cacheData.stats.most_accessed && (
              <div className="card mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Most Popular Search</h2>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg text-white font-semibold mb-2">
                      {cacheData.stats.most_accessed.search_address}
                    </div>
                    <div className="text-sm text-slate-400 mb-2">
                      Categories: {cacheData.stats.most_accessed.search_categories?.join(', ')}
                    </div>
                    <div className="text-sm text-emerald-400">
                      Accessed {cacheData.stats.most_accessed.access_count} times
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {cacheData.stats.most_accessed.total_vendors}
                    </div>
                    <div className="text-xs text-slate-500">vendors cached</div>
                  </div>
                </div>
              </div>
            )}

            {/* Cache Entries Table */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Cached Searches</h2>
                <button
                  onClick={loadCacheStats}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>

              {cacheData.entries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Address</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Categories</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-300">Vendors</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-300">Hits</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-300">Expiry</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cacheData.entries.map((entry, index) => (
                        <tr key={entry.id} className={cn(
                          'border-b border-slate-800',
                          index % 2 === 0 ? 'bg-slate-900/30' : ''
                        )}>
                          <td className="py-3 px-4 text-white">{entry.address}</td>
                          <td className="py-3 px-4 text-slate-300 text-sm">
                            {entry.categories?.slice(0, 3).join(', ')}
                            {entry.categories?.length > 3 && ` +${entry.categories.length - 3}`}
                          </td>
                          <td className="py-3 px-4 text-center text-white">{entry.total_vendors}</td>
                          <td className="py-3 px-4 text-center text-emerald-400 font-semibold">
                            {entry.access_count}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-400 text-sm">
                            {entry.is_expired ? (
                              <span className="text-ruby-400">Expired</span>
                            ) : (
                              `${entry.days_until_expiry} days`
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {entry.is_expired ? (
                              <XCircle className="w-5 h-5 text-ruby-400 mx-auto" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Database className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Cache Entries Yet</h3>
                  <p className="text-slate-400">
                    Search for contractors to start building the cache
                  </p>
                </div>
              )}
            </div>

            {/* Cost Savings Info */}
            <div className="card mt-6 bg-emerald-500/10 border-emerald-500/30">
              <h3 className="text-lg font-semibold text-emerald-400 mb-2">💰 Estimated Cost Savings</h3>
              <p className="text-slate-300">
                Cache hits: <span className="font-bold text-white">{cacheData.stats.total_accesses}</span> searches
              </p>
              <p className="text-slate-300">
                API calls saved: <span className="font-bold text-white">{cacheData.stats.total_accesses - cacheData.stats.total_entries}</span>
              </p>
              <p className="text-emerald-300 font-semibold mt-2">
                Estimated savings: ${((cacheData.stats.total_accesses - cacheData.stats.total_entries) * 0.30).toFixed(2)}
              </p>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
