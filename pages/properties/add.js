import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { authHelpers, supabase } from '@/lib/supabase';
import { Building2, MapPin, Mail, Phone, User, Loader2, CheckCircle } from 'lucide-react';

export default function AddPropertyPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    address: '',
    city: 'NYC',
    property_type: 'Residential',
    units: '',
    year_built: '',
    square_footage: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
  });

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
            property_type: formData.property_type,
            units: formData.units ? parseInt(formData.units) : null,
            year_built: formData.year_built ? parseInt(formData.year_built) : null,
            square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
            contact_name: formData.contact_name,
            contact_email: formData.contact_email,
            contact_phone: formData.contact_phone,
            status: 'Active',
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
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main St, New York, NY 10001"
                    required
                    className="input-modern pl-11"
                  />
                </div>
              </div>

              {/* City and Property Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Property Type *
                  </label>
                  <select
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleChange}
                    required
                    className="input-modern"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Mixed-Use">Mixed-Use</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>
              </div>

              {/* Units, Year Built, Square Footage */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Units
                  </label>
                  <input
                    type="number"
                    name="units"
                    value={formData.units}
                    onChange={handleChange}
                    placeholder="10"
                    min="1"
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Year Built
                  </label>
                  <input
                    type="number"
                    name="year_built"
                    value={formData.year_built}
                    onChange={handleChange}
                    placeholder="1990"
                    min="1800"
                    max={new Date().getFullYear()}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Square Footage
                  </label>
                  <input
                    type="number"
                    name="square_footage"
                    value={formData.square_footage}
                    onChange={handleChange}
                    placeholder="5000"
                    min="1"
                    className="input-modern"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <User className="w-6 h-6 mr-2 text-corporate-400" />
              Contact Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contact Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="input-modern pl-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleChange}
                      placeholder="contact@example.com"
                      className="input-modern pl-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleChange}
                      placeholder="(555) 123-4567"
                      className="input-modern pl-11"
                    />
                  </div>
                </div>
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
  );
}
