import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import PropertyLimitModal from '@/components/PropertyLimitModal';
import { authHelpers, supabase } from '@/lib/supabase';
import { Building2, Plus, Search, Filter, MapPin, AlertTriangle } from 'lucide-react';
import { cn, getComplianceScoreBadge } from '@/lib/utils';

export default function PropertiesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [searchQuery, cityFilter, properties]);

  const checkAuth = async () => {
    const { user: currentUser } = await authHelpers.getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    await Promise.all([
      loadProperties(currentUser.id),
      loadProfile(currentUser.id)
    ]);
  };

  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('subscription_tier, subscription_status')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadProperties = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
      setFilteredProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = [...properties];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // City filter
    if (cityFilter !== 'all') {
      filtered = filtered.filter(p => p.city === cityFilter);
    }

    setFilteredProperties(filtered);
  };

  const handleAddProperty = async (e) => {
    e.preventDefault();
    
    // Check property limit before navigating
    const tier = profile?.subscription_tier || 'free';
    if (tier === 'free' || tier === 'single-one-time') {
      if (properties.length >= 1) {
        setShowLimitModal(true);
        return;
      }
    }
    
    router.push('/properties/add');
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="container-modern py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corporate-500"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Properties</h1>
            <p className="text-slate-400">Manage your property portfolio</p>
          </div>
          <button onClick={handleAddProperty} className="btn-primary mt-4 md:mt-0">
            <Plus className="w-5 h-5 mr-2 inline" />
            Add Property
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-modern pl-11"
              />
            </div>

            {/* City Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="input-modern pl-11"
              >
                <option value="all">All Cities</option>
                <option value="NYC">New York City</option>
                <option value="Philadelphia">Philadelphia</option>
              </select>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <div className="card text-center py-20">
            <Building2 className="w-20 h-20 text-slate-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">
              {properties.length === 0 ? 'No properties yet' : 'No properties found'}
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              {properties.length === 0
                ? 'Get started by adding your first property to track compliance'
                : 'Try adjusting your search or filter criteria'}
            </p>
            {properties.length === 0 && (
              <Link href="/properties/add" className="btn-primary inline-flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Property
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="card group cursor-pointer hover:scale-[1.02] transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-xl flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-white" />
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

                  {/* Address */}
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-corporate-400 transition-colors line-clamp-2">
                    {property.address}
                  </h3>

                  {/* Details */}
                  <div className="space-y-2 text-sm text-slate-400 mb-4">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                      <span>{property.city || 'NYC'}</span>
                    </div>
                    {property.property_type && (
                      <div className="flex items-center justify-between">
                        <span>Type:</span>
                        <span className="text-slate-300">{property.property_type}</span>
                      </div>
                    )}
                    {property.units && (
                      <div className="flex items-center justify-between">
                        <span>Units:</span>
                        <span className="text-slate-300">{property.units}</span>
                      </div>
                    )}
                  </div>

                  {/* Violations Alert */}
                  {property.active_violations > 0 && (
                    <div className="pt-4 border-t border-slate-700 flex items-center text-ruby-400 text-sm">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      <span className="font-medium">
                        {property.active_violations} active violation{property.active_violations !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Results Count */}
            <div className="mt-8 text-center text-slate-400">
              Showing {filteredProperties.length} of {properties.length} properties
            </div>
          </>
        )}

        {/* Property Limit Modal */}
        <PropertyLimitModal 
          isOpen={showLimitModal} 
          onClose={() => setShowLimitModal(false)} 
        />
      </div>
    </Layout>
  );
}
