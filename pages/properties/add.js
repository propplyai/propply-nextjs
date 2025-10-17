import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import Layout from '@/components/Layout';
import PropertyLimitModal from '@/components/PropertyLimitModal';
import { authHelpers, supabase } from '@/lib/supabase';
import { Building2, MapPin, Loader2, CheckCircle } from 'lucide-react';

export default function AddPropertyPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showLimitModal, setShowLimitModal] = useState(false);

  const [formData, setFormData] = useState({
    address: '',
    city: 'NYC',
  });
  
  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

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
  
  useEffect(() => {
    if (googleMapsLoaded && addressInputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          componentRestrictions: { country: 'us' },
          fields: ['formatted_address', 'address_components'],
        }
      );
      
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.formatted_address) {
          setFormData(prev => ({
            ...prev,
            address: place.formatted_address
          }));
        }
      });
    }
  }, [googleMapsLoaded]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const checkPropertyLimit = async () => {
    try {
      // Get current property count
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id')
        .eq('user_id', user.id);

      if (error) throw error;

      const currentCount = properties?.length || 0;
      
      // Check if user can add more properties based on subscription tier
      const tier = profile?.subscription_tier || 'free';
      
      // Free tier and single-one-time tier: limited to 1 property
      if ((tier === 'free' || tier === 'single-one-time') && currentCount >= 1) {
        setShowLimitModal(true);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking property limit:', error);
      return true; // Allow on error to avoid blocking
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check property limit first
    const canAdd = await checkPropertyLimit();
    if (!canAdd) return;

    setLoading(true);
    setError('');

    try {
      // Insert property into database
      const { data: property, error: insertError } = await supabase
        .from('properties')
        .insert([
          {
            user_id: user.id,
            address: formData.address,
            city: formData.city,
            property_type: 'Residential',
            status: 'active',
            compliance_score: 0,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess(true);

      // Auto-fetch compliance data in background
      console.log('[Add Property] Property created, auto-fetching compliance data...');

      // Don't await - let it happen in background
      fetchComplianceData(property).catch(err => {
        console.error('[Add Property] Background compliance fetch failed:', err);
        // Don't show error to user - they can manually fetch later
      });

      // Redirect to property page
      setTimeout(() => {
        router.push(`/properties/${property.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error adding property:', err);
      setError(err.message || 'Failed to add property');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceData = async (property) => {
    try {
      console.log(`[Add Property] Fetching compliance data for ${property.city}...`);

      const response = await fetch('/api/properties/generate-compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: `${property.address}, ${property.city}`,
          propertyId: property.id,
          city: property.city
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch compliance data');
      }

      const complianceData = await response.json();
      const city = complianceData.city || property.city || 'NYC';

      console.log(`[Add Property] Compliance data received - Score: ${complianceData.scores?.overall_score}%`);

      // Build city-specific insert data
      let insertData = {
        property_id: property.id,
        user_id: user.id,
        report_type: 'full_compliance', // Add required report_type field
        city: city,
        overall_score: Math.round(complianceData.scores.overall_score),
        report_data: complianceData
      };

      // Add city-specific fields
      if (city === 'Philadelphia') {
        insertData = {
          ...insertData,
          opa_account: complianceData.property?.opa_account || null,
          li_permits_total: complianceData.scores.li_permits_total || 0,
          li_violations_active: complianceData.scores.li_violations_active || 0,
          li_certifications_active: complianceData.scores.li_certifications_active || 0,
          li_certifications_expired: complianceData.scores.li_certifications_expired || 0,
          li_investigations_total: complianceData.scores.li_investigations_total || 0
        };
      } else {
        // NYC
        insertData = {
          ...insertData,
          bin: complianceData.property?.bin || null,
          bbl: complianceData.property?.bbl || null,
          hpd_violations_active: complianceData.scores.hpd_violations_active || 0,
          dob_violations_active: complianceData.scores.dob_violations_active || 0,
          elevator_devices: complianceData.scores.elevator_devices || 0,
          boiler_devices: complianceData.scores.boiler_devices || 0,
          electrical_permits: complianceData.scores.electrical_permits || 0
        };
      }

      // Save compliance report
      const { error: saveError } = await supabase
        .from('compliance_reports')
        .insert([insertData]);

      if (saveError) {
        console.error('[Add Property] Error saving compliance report:', saveError);
        throw saveError;
      }

      // Calculate total active violations (city-specific)
      let activeViolations = 0;
      if (city === 'Philadelphia') {
        activeViolations = complianceData.scores.li_violations_active || 0;
      } else {
        activeViolations = (complianceData.scores.hpd_violations_active || 0) +
                          (complianceData.scores.dob_violations_active || 0);
      }

      // Update property with compliance data
      await supabase
        .from('properties')
        .update({
          compliance_score: Math.round(complianceData.scores.overall_score),
          active_violations: activeViolations
        })
        .eq('id', property.id);

      console.log('[Add Property] Compliance data saved successfully');
    } catch (error) {
      console.error('[Add Property] Error in fetchComplianceData:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    router.push('/');
  };

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={() => setGoogleMapsLoaded(true)}
      />
      <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Add Property</h1>
          <p className="text-slate-400">Add a new property to your portfolio</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="card bg-emerald-500/10 border-emerald-500/30 mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-white font-semibold">Property added successfully!</p>
                <p className="text-sm text-slate-400">Redirecting to property details...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="card bg-ruby-500/10 border-ruby-500/30 mb-6">
            <p className="text-ruby-300">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="card">
          {/* Property Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold gradient-text mb-6 flex items-center">
              <Building2 className="w-6 h-6 mr-2 text-corporate-400" />
              Property Information
            </h2>

            <div className="space-y-4">
              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Property Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    ref={addressInputRef}
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main St, New York, NY 10001"
                    required
                    className="input-modern pl-11"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Start typing to see address suggestions</p>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  City *
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="input-modern"
                >
                  <option value="NYC">New York City</option>
                  <option value="Philadelphia">Philadelphia</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2 inline" />
                  Adding Property...
                </>
              ) : (
                'Add Property'
              )}
            </button>
          </div>
        </form>

        {/* Property Limit Modal */}
        <PropertyLimitModal 
          isOpen={showLimitModal} 
          onClose={() => setShowLimitModal(false)} 
        />
      </div>
    </Layout>
    </>
  );
}
