/**
 * Marketplace Page - Main vendor search and browse interface
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import VendorCard from '@/components/marketplace/VendorCard';
import VendorDetailsModal from '@/components/marketplace/VendorDetailsModal';
import { authHelpers, supabase } from '@/lib/supabase';
import {
  Search, MapPin, Filter, AlertCircle, Loader2,
  ShoppingBag, Bookmark, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_INFO = {
  hpd: {
    name: 'General Contractors & Property Maintenance',
    description: 'For HPD violations and general property repairs'
  },
  dob: {
    name: 'Structural Engineers & Building Code',
    description: 'For DOB violations and structural issues'
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
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Auto-search if property_id or report_id is in URL
    if (user && router.isReady) {
      const { property_id, report_id } = router.query;
      if (property_id || report_id) {
        handleAutoSearch(property_id, report_id);
      }
    }
  }, [user, router.isReady, router.query]);

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

  const handleAutoSearch = async (propertyId, reportId) => {
    if (searching) return;

    try {
      setSearching(true);
      setError('');

      const params = new URLSearchParams();
      if (propertyId) params.append('property_id', propertyId);
      if (reportId) params.append('report_id', reportId);

      const response = await fetch(`/api/marketplace/search?${params.toString()}`);
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

      const response = await fetch(`/api/marketplace/search?${params.toString()}`);
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
        const response = await fetch('/api/marketplace/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

  const handleRequestQuote = async (vendor) => {
    if (!selectedProperty && userProperties.length > 0) {
      // If no property selected, prompt user to select one
      alert('Please select a property first');
      return;
    }

    try {
      const response = await fetch('/api/marketplace/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_quote',
          property_id: selectedProperty || userProperties[0]?.id,
          vendor_place_id: vendor.place_id,
          vendor_name: vendor.name,
          vendor_category: vendor.category || activeCategories[0],
          vendor_phone: vendor.phone,
          vendor_website: vendor.website,
          vendor_address: vendor.address,
          vendor_rating: vendor.rating
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save request');
      }

      alert('✅ Quote request saved! You can track it in your profile.');
    } catch (error) {
      console.error('Request quote error:', error);
      alert(`Error: ${error.message}`);
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
              <h1 className="text-3xl font-bold gradient-text">Contractor Marketplace</h1>
              <p className="text-slate-400">Find qualified contractors for your property violations</p>
            </div>
          </div>
        </div>

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
                      onRequestQuote={handleRequestQuote}
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
          onRequestQuote={handleRequestQuote}
        />
      )}
    </Layout>
  );
}
