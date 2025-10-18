/**
 * Marketplace Page - Main vendor search and browse interface
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import VendorCard from '@/components/marketplace/VendorCard';
import VendorDetailsModal from '@/components/marketplace/VendorDetailsModal';
import InviteToBidModal from '@/components/marketplace/InviteToBidModal';
import { authHelpers, supabase } from '@/lib/supabase';
import {
  Search, MapPin, Filter, AlertCircle, Loader2,
  ShoppingBag, Bookmark, FileText, Star, Send
} from 'lucide-react';
import { cn, authenticatedFetch } from '@/lib/utils';

const CATEGORY_INFO = {
  hpd: {
    name: 'General Contractors & Property Maintenance',
    description: 'For code violations and general property repairs'
  },
  dob: {
    name: 'Structural Engineers & Building Code',
    description: 'For structural violations and building code issues'
  },
  elevator: {
    name: 'Elevator Services',
    description: 'For elevator repair, inspection, and maintenance'
  },
  boiler: {
    name: 'HVAC & Boiler Services',
    description: 'For boiler and heating system work'
  },
  electrical: {
    name: 'Electrical Contractors',
    description: 'For electrical system repairs and permits'
  },
  fire_safety: {
    name: 'Fire Safety & Protection',
    description: 'For fire safety inspections and equipment'
  }
};

export default function MarketplacePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Search state
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [userProperties, setUserProperties] = useState([]);

  // Results state
  const [vendors, setVendors] = useState({});
  const [searchedAddress, setSearchedAddress] = useState('');
  const [activeCategories, setActiveCategories] = useState([]);

  // UI state
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInviteToBidModal, setShowInviteToBidModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'saved'

  // Saved vendors state
  const [savedVendors, setSavedVendors] = useState({ bookmarks: [], requests: [] });
  const [loadingSaved, setLoadingSaved] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Auto-search if property_id or report_id is in URL
    if (user && router.isReady) {
      const { property_id, report_id, restore_search } = router.query;
      
      if (restore_search === 'true' && property_id) {
        // Restore saved search results
        handleRestoreSearch(property_id);
      } else if (property_id || report_id) {
        handleAutoSearch(property_id, report_id);
      }
    }
  }, [user, router.isReady, router.query]);

  useEffect(() => {
    // Load saved vendors when switching to saved tab
    if (user && activeTab === 'saved' && savedVendors.bookmarks.length === 0 && savedVendors.requests.length === 0) {
      loadSavedVendors();
    }
  }, [activeTab, user]);

  const checkAuth = async () => {
    try {
      const { user: currentUser, error: authError } = await authHelpers.getUser();

      if (authError || !currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      await loadUserProperties(currentUser.id);
      setLoading(false);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    }
  };

  const loadUserProperties = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, active_violations')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const loadSavedVendors = async () => {
    try {
      setLoadingSaved(true);
      const response = await authenticatedFetch('/api/marketplace/my-vendors');
      const data = await response.json();

      if (response.ok) {
        setSavedVendors({
          bookmarks: data.bookmarks || [],
          requests: data.requests || []
        });
      }
    } catch (error) {
      console.error('Error loading saved vendors:', error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleRestoreSearch = async (propertyId) => {
    if (searching) return;

    try {
      setSearching(true);
      setError('');

      const response = await authenticatedFetch(`/api/marketplace/restore-search?property_id=${propertyId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to restore search');
      }

      setVendors(data.vendors);
      setSearchedAddress(data.address);
      setActiveCategories(data.categories);
      
      // Set the property as selected since we're restoring its search
      setSelectedProperty(propertyId);
    } catch (err) {
      console.error('Restore search error:', err);
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleAutoSearch = async (propertyId, reportId) => {
    if (searching) return;

    try {
      setSearching(true);
      setError('');

      const params = new URLSearchParams();
      if (propertyId) params.append('property_id', propertyId);
      if (reportId) params.append('report_id', reportId);

      const response = await authenticatedFetch(`/api/marketplace/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setVendors(data.vendors);
      setSearchedAddress(data.address);
      setActiveCategories(data.categories);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchAddress && !selectedProperty) {
      setError('Please enter an address or select a property');
      return;
    }

    try {
      setSearching(true);
      setError('');

      const params = new URLSearchParams();
      if (selectedProperty) {
        params.append('property_id', selectedProperty);
      } else {
        params.append('address', searchAddress);
      }

      if (categoryFilter.length > 0) {
        params.append('categories', categoryFilter.join(','));
      }

      const response = await authenticatedFetch(`/api/marketplace/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setVendors(data.vendors);
      setSearchedAddress(data.address);
      setActiveCategories(data.categories);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleBookmark = async (vendor, shouldBookmark) => {
    try {
      if (shouldBookmark) {
        // Add bookmark
        const response = await authenticatedFetch('/api/marketplace/save', {
          method: 'POST',
          body: JSON.stringify({
            action: 'bookmark',
            vendor_place_id: vendor.place_id,
            vendor_name: vendor.name,
            vendor_category: vendor.category || activeCategories[0],
            vendor_phone: vendor.phone,
            vendor_website: vendor.website,
            vendor_address: vendor.address,
            vendor_rating: vendor.rating
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to bookmark');
        }
      } else {
        // Remove bookmark - would need bookmark ID
        // For now, we'll implement this later
        console.log('Remove bookmark not yet implemented');
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      throw error;
    }
  };

  const handleInviteToBid = async (vendor) => {
    setSelectedVendor(vendor);
    setShowInviteToBidModal(true);
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

  const allVendors = Object.values(vendors).flat();
  const filteredVendors = categoryFilter.length > 0
    ? Object.fromEntries(
        Object.entries(vendors).filter(([category]) => categoryFilter.includes(category))
      )
    : vendors;

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Compliance Marketplace</h1>
              <p className="text-slate-400">Find quality contractors for your property violations and ongoing compliance</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-700">
            <button
              onClick={() => setActiveTab('search')}
              className={cn(
                'px-4 py-2 font-medium transition-colors relative',
                activeTab === 'search'
                  ? 'text-corporate-400'
                  : 'text-slate-400 hover:text-slate-300'
              )}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Search Contractors
              {activeTab === 'search' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-corporate-400"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={cn(
                'px-4 py-2 font-medium transition-colors relative',
                activeTab === 'saved'
                  ? 'text-corporate-400'
                  : 'text-slate-400 hover:text-slate-300'
              )}
            >
              <Bookmark className="w-4 h-4 inline mr-2" />
              Saved Vendors ({savedVendors.bookmarks.length + savedVendors.requests.length})
              {activeTab === 'saved' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-corporate-400"></div>
              )}
            </button>
          </div>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <>
        {/* Search Form */}
        <div className="card mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Property Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Property
                </label>
                <select
                  value={selectedProperty || ''}
                  onChange={(e) => {
                    setSelectedProperty(e.target.value);
                    setSearchAddress('');
                  }}
                  className="input-modern w-full"
                >
                  <option value="">Choose a property...</option>
                  {userProperties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.address}
                      {property.active_violations > 0 && ` (${property.active_violations} violations)`}
                    </option>
                  ))}
                </select>
              </div>

              {/* OR Address Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Or Enter Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchAddress}
                    onChange={(e) => {
                      setSearchAddress(e.target.value);
                      setSelectedProperty(null);
                    }}
                    placeholder="123 Main St, New York, NY"
                    className="input-modern w-full pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Filter Categories */}
            <div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-sm text-corporate-400 hover:text-corporate-300"
              >
                <Filter className="w-4 h-4" />
                <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
              </button>

              {showFilters && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                    <label key={key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={categoryFilter.includes(key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCategoryFilter([...categoryFilter, key]);
                          } else {
                            setCategoryFilter(categoryFilter.filter(c => c !== key));
                          }
                        }}
                        className="rounded border-slate-600 text-corporate-500 focus:ring-corporate-500"
                      />
                      <span className="text-sm text-slate-300">{info.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={searching}
              className="btn-primary w-full md:w-auto"
            >
              {searching ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Find Contractors
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-ruby-500/10 border border-ruby-500/30 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-ruby-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-ruby-300">{error}</div>
            </div>
          )}
        </div>

        {/* Results */}
        {searchedAddress && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Contractors near {searchedAddress}
                </h2>
                <p className="text-sm text-slate-400">
                  {allVendors.length} contractor{allVendors.length !== 1 ? 's' : ''} found in {activeCategories.length} categor{activeCategories.length !== 1 ? 'ies' : 'y'}
                </p>
              </div>
            </div>

            {/* Results by Category */}
            {Object.entries(filteredVendors).map(([category, categoryVendors]) => (
              <div key={category}>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white">
                    {CATEGORY_INFO[category]?.name || category}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {CATEGORY_INFO[category]?.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryVendors.slice(0, 6).map((vendor) => (
                    <VendorCard
                      key={vendor.place_id}
                      vendor={{ ...vendor, category }}
                      category={CATEGORY_INFO[category]?.name}
                      onBookmark={handleBookmark}
                      onInviteToBid={handleInviteToBid}
                      propertyId={selectedProperty}
                      restoreSearch={true}
                    />
                  ))}
                </div>

                {categoryVendors.length > 6 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-slate-400">
                      Showing 6 of {categoryVendors.length} results
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!searchedAddress && (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Find Contractors for Your Property
            </h3>
            <p className="text-slate-400 mb-6">
              Search by property or address to find qualified contractors
            </p>
          </div>
        )}
        </>
        )}

        {/* Saved Vendors Tab */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            {loadingSaved ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-corporate-400 animate-spin" />
              </div>
            ) : (
              <>
                {/* Bookmarks Section */}
                {savedVendors.bookmarks.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                      <Bookmark className="w-5 h-5 text-corporate-400" />
                      <span>Bookmarked Vendors ({savedVendors.bookmarks.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {savedVendors.bookmarks.map((bookmark) => (
                        <div key={bookmark.id} className="card">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-bold text-white">{bookmark.vendor_name}</h3>
                            <Bookmark className="w-5 h-5 text-corporate-400 fill-corporate-400" />
                          </div>
                          {bookmark.vendor_rating && (
                            <div className="flex items-center space-x-2 mb-3">
                              <Star className="w-4 h-4 fill-gold-400 text-gold-400" />
                              <span className="text-sm font-semibold text-white">{bookmark.vendor_rating.toFixed(1)}</span>
                            </div>
                          )}
                          {bookmark.vendor_address && (
                            <p className="text-sm text-slate-400 mb-3">{bookmark.vendor_address}</p>
                          )}
                          {bookmark.vendor_phone && (
                            <p className="text-sm text-slate-300 mb-3">{bookmark.vendor_phone}</p>
                          )}
                          <p className="text-xs text-slate-500 mb-4">
                            Saved {new Date(bookmark.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/marketplace/${bookmark.vendor_place_id}`}
                              className="flex-1 btn-secondary text-sm py-2 text-center"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => handleInviteToBid(bookmark)}
                              className="flex-1 btn-primary text-sm py-2 flex items-center justify-center space-x-1"
                            >
                              <Send className="w-4 h-4" />
                              <span>Invite</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quote Requests Section */}
                {savedVendors.requests.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                      <ShoppingBag className="w-5 h-5 text-corporate-400" />
                      <span>Quote Requests ({savedVendors.requests.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {savedVendors.requests.map((request) => (
                        <div key={request.id} className="card">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-bold text-white">{request.vendor_name}</h3>
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-medium',
                              request.status === 'pending' && 'bg-slate-500/20 text-slate-400',
                              request.status === 'contacted' && 'bg-blue-500/20 text-blue-400',
                              request.status === 'hired' && 'bg-emerald-500/20 text-emerald-400',
                              request.status === 'completed' && 'bg-corporate-500/20 text-corporate-400',
                              request.status === 'rejected' && 'bg-ruby-500/20 text-ruby-400'
                            )}>
                              {request.status}
                            </span>
                          </div>
                          {request.properties?.address && (
                            <p className="text-sm text-slate-400 mb-3">
                              Property: {request.properties.address}
                            </p>
                          )}
                          {request.vendor_phone && (
                            <p className="text-sm text-slate-300 mb-3">{request.vendor_phone}</p>
                          )}
                          {request.notes && (
                            <p className="text-sm text-slate-400 mb-3 italic">"{request.notes}"</p>
                          )}
                          <p className="text-xs text-slate-500 mb-4">
                            Requested {new Date(request.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/marketplace/${request.vendor_place_id}`}
                              className="flex-1 btn-secondary text-sm py-2 text-center"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => handleInviteToBid(request)}
                              className="flex-1 btn-primary text-sm py-2 flex items-center justify-center space-x-1"
                            >
                              <Send className="w-4 h-4" />
                              <span>Invite</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {savedVendors.bookmarks.length === 0 && savedVendors.requests.length === 0 && (
                  <div className="text-center py-12">
                    <Bookmark className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Saved Vendors Yet
                    </h3>
                    <p className="text-slate-400 mb-6">
                      Bookmark vendors or request quotes to see them here
                    </p>
                    <button
                      onClick={() => setActiveTab('search')}
                      className="btn-primary"
                    >
                      Search for Contractors
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Vendor Details Modal */}
      {selectedVendor && (
        <VendorDetailsModal
          vendor={selectedVendor}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedVendor(null);
          }}
          onBookmark={handleBookmark}
        />
      )}

      {/* Invite to Bid Modal */}
      <InviteToBidModal
        vendor={selectedVendor || {}}
        isOpen={showInviteToBidModal && !!selectedVendor}
        onClose={() => {
          setShowInviteToBidModal(false);
          setSelectedVendor(null);
        }}
        propertyId={selectedProperty}
      />
    </Layout>
  );
}
