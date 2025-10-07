import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { authHelpers, supabase } from '@/lib/supabase';
import { User, Mail, Calendar, CreditCard, CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
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
    await loadProfile(currentUser.id);
  };

  const loadProfile = async (userId) => {
    try {
      // Load user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      }

      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    router.push('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSubscriptionStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'trialing':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'past_due':
      case 'unpaid':
        return 'bg-ruby-500/10 text-ruby-400 border-ruby-500/30';
      case 'canceled':
      case 'cancelled':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default:
        return 'bg-gold-500/10 text-gold-400 border-gold-500/30';
    }
  };

  const getSubscriptionTierName = (tier) => {
    const tierNames = {
      'single-one-time': 'Single Location – 1 Time Report',
      'single-monthly': 'Single Location – Monthly Report',
      'multiple-ongoing': 'Multiple Locations – Ongoing',
    };
    return tierNames[tier] || tier || 'Free';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-enterprise animate-glow">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
          <p className="text-slate-400">Manage your account and subscription details</p>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Information Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Details */}
            <div className="card">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-corporate-500 to-emerald-500 rounded-full flex items-center justify-center mr-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Account Details</h2>
                  <p className="text-slate-400 text-sm">Your personal information</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <Mail className="w-5 h-5 text-corporate-400 mr-4" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">Email Address</p>
                    <p className="text-white font-medium">{user?.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <Calendar className="w-5 h-5 text-emerald-400 mr-4" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">Member Since</p>
                    <p className="text-white font-medium">
                      {formatDate(user?.created_at || profile?.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <Shield className="w-5 h-5 text-gold-400 mr-4" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">User ID</p>
                    <p className="text-white font-mono text-sm">{user?.id || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="card">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-gold-500 to-corporate-500 rounded-full flex items-center justify-center mr-4">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Subscription</h2>
                  <p className="text-slate-400 text-sm">Your current plan details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div className="flex-1">
                    <p className="text-sm text-slate-400 mb-2">Current Plan</p>
                    <p className="text-xl text-white font-bold">
                      {getSubscriptionTierName(profile?.subscription_tier)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-semibold border',
                      getSubscriptionStatusBadge(profile?.subscription_status)
                    )}
                  >
                    {profile?.subscription_status 
                      ? profile.subscription_status.charAt(0).toUpperCase() + profile.subscription_status.slice(1)
                      : 'Free'}
                  </span>
                </div>

                {profile?.subscription_status === 'active' && (
                  <>
                    <div className="flex items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <Clock className="w-5 h-5 text-corporate-400 mr-4" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-400">Billing Period Start</p>
                        <p className="text-white font-medium">
                          {formatDate(profile?.current_period_start)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <Calendar className="w-5 h-5 text-emerald-400 mr-4" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-400">Next Billing Date</p>
                        <p className="text-white font-medium">
                          {formatDate(profile?.current_period_end)}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {!profile?.subscription_status || profile?.subscription_status === 'free' && (
                  <div className="p-6 bg-gradient-to-r from-corporate-500/10 to-emerald-500/10 rounded-xl border border-corporate-500/30">
                    <p className="text-white font-medium mb-4">
                      🚀 Upgrade your plan to unlock premium features
                    </p>
                    <button
                      onClick={() => router.push('/#pricing')}
                      className="btn-primary"
                    >
                      View Pricing Plans
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Email Verified</span>
                  {user?.email_confirmed_at ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-ruby-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Account Active</span>
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Subscription</span>
                  {profile?.subscription_status === 'active' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-corporate-500 transition-all text-left text-white text-sm"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => router.push('/#pricing')}
                  className="w-full p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-corporate-500 transition-all text-left text-white text-sm"
                >
                  View Pricing
                </button>
                <button
                  onClick={() => router.push('/properties')}
                  className="w-full p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-corporate-500 transition-all text-left text-white text-sm"
                >
                  My Properties
                </button>
              </div>
            </div>

            {/* Need Help */}
            <div className="card bg-gradient-to-br from-corporate-500/10 to-emerald-500/10 border-corporate-500/30">
              <h3 className="text-lg font-bold text-white mb-2">Need Help?</h3>
              <p className="text-slate-300 text-sm mb-4">
                Contact our support team for assistance
              </p>
              <a
                href="mailto:support@propply.ai"
                className="text-corporate-400 hover:text-corporate-300 font-semibold text-sm"
              >
                support@propply.ai
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
