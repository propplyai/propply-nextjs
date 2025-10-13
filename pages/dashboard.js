import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { authHelpers, supabase } from '@/lib/supabase';
import { Building2, AlertTriangle, CheckCircle, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { cn, getComplianceScoreBadge } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    avgComplianceScore: 0,
    activeViolations: 0,
    upcomingInspections: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { user: currentUser } = await authHelpers.getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    await loadDashboardData(currentUser.id);
  };

  const loadDashboardData = async (userId) => {
    try {
      // Load properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;

      setProperties(propertiesData || []);

      // Calculate stats
      const totalProperties = propertiesData?.length || 0;
      const avgScore = totalProperties > 0
        ? propertiesData.reduce((sum, p) => sum + (p.compliance_score || 0), 0) / totalProperties
        : 0;

      setStats({
        totalProperties,
        avgComplianceScore: Math.round(avgScore),
        activeViolations: propertiesData?.reduce((sum, p) => sum + (p.active_violations || 0), 0) || 0,
        upcomingInspections: 0, // TODO: Calculate from inspections table
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-enterprise animate-glow">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Dashboard</h1>
            <p className="text-slate-400">Welcome back! Here's your property overview.</p>
          </div>
          <Link href="/properties/add" className="btn-primary">
            <Plus className="w-5 h-5 mr-2 inline" />
            Add Property
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-corporate-500/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-corporate-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalProperties}</div>
            <div className="text-sm text-slate-400">Total Properties</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.avgComplianceScore}%</div>
            <div className="text-sm text-slate-400">Avg. Compliance Score</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-ruby-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-ruby-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.activeViolations}</div>
            <div className="text-sm text-slate-400">Active Violations</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gold-500/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-gold-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.upcomingInspections}</div>
            <div className="text-sm text-slate-400">Upcoming Inspections</div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text">Your Properties</h2>
            <Link href="/properties" className="text-corporate-400 hover:text-corporate-300 font-medium flex items-center">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {properties.length === 0 ? (
            <div className="card text-center py-12">
              <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No properties yet</h3>
              <p className="text-slate-400 mb-6">Get started by adding your first property</p>
              <Link href="/properties/add" className="btn-primary inline-flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Property
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.slice(0, 6).map((property) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="card group cursor-pointer hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold border',
                        getComplianceScoreBadge(property.compliance_score || 0)
                      )}
                    >
                      {property.compliance_score || 0}%
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-corporate-400 transition-colors">
                    {property.address}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>{property.city || 'NYC'}</span>
                    <span>{property.property_type || 'Residential'}</span>
                  </div>
                  {property.active_violations > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700 flex items-center text-ruby-400 text-sm">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      {property.active_violations} active violation{property.active_violations !== 1 ? 's' : ''}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card bg-gradient-to-r from-corporate-500/10 to-emerald-500/10 border-corporate-500/30">
          <h2 className="text-2xl font-bold gradient-text mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/properties/add"
              className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-corporate-500 transition-all group"
            >
              <Plus className="w-8 h-8 text-corporate-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-white mb-1">Add Property</h3>
              <p className="text-sm text-slate-400">Add a new property to your portfolio</p>
            </Link>
            <Link
              href="/compliance"
              className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-corporate-500 transition-all group"
            >
              <CheckCircle className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-white mb-1">Check Compliance</h3>
              <p className="text-sm text-slate-400">View compliance reports and scores</p>
            </Link>
            <Link
              href="/marketplace"
              className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-corporate-500 transition-all group"
            >
              <Building2 className="w-8 h-8 text-gold-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-white mb-1">Find Vendors</h3>
              <p className="text-sm text-slate-400">Connect with certified vendors</p>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
