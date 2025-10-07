import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import Layout from '@/components/Layout';
import { authHelpers, supabase } from '@/lib/supabase';
import { Building2, MapPin, Loader2, CheckCircle } from 'lucide-react';

export default function AddPropertyPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Insert property into database
      const { data, error: insertError } = await supabase
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
      setTimeout(() => {
        router.push(`/properties/${data.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error adding property:', err);
      setError(err.message || 'Failed to add property');
    } finally {
      setLoading(false);
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
          <h1 className="text-4xl font-bold text-white mb-2">Add Property</h1>
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
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
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
      </div>
    </Layout>
    </>
  );
}
