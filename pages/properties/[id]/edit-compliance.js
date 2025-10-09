import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { authHelpers, supabase } from '@/lib/supabase';
import {
  ArrowLeft, Plus, Save, X, FileText, Flame, Zap, Calendar, AlertCircle
} from 'lucide-react';

export default function EditCompliancePage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [newEntry, setNewEntry] = useState({
    type: 'permit',
    category: '',
    title: '',
    description: '',
    date: '',
    expiration_date: '',
    status: 'active',
    notes: ''
  });

  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (router.isReady && id) {
      checkAuth();
    }
  }, [id, router.isReady]);

  const checkAuth = async () => {
    const { user: currentUser } = await authHelpers.getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    await loadProperty(id, currentUser.id);
  };

  const loadProperty = async (propertyId, userId) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (!data) {
        router.push('/properties');
        return;
      }

      setProperty(data);
      await loadEntries(propertyId);
    } catch (error) {
      console.error('Error loading property:', error);
      setError('Failed to load property');
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async (propertyId) => {
    try {
      const { data, error } = await supabase
        .from('manual_compliance_entries')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error: insertError } = await supabase
        .from('manual_compliance_entries')
        .insert([{
          property_id: property.id,
          user_id: user.id,
          city: property.city,
          ...newEntry
        }]);

      if (insertError) throw insertError;

      setSuccess('Entry added successfully!');

      // Reset form
      setNewEntry({
        type: 'permit',
        category: '',
        title: '',
        description: '',
        date: '',
        expiration_date: '',
        status: 'active',
        notes: ''
      });

      // Reload entries
      await loadEntries(property.id);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving entry:', err);
      setError(err.message || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const { error } = await supabase
        .from('manual_compliance_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      setSuccess('Entry deleted');
      await loadEntries(property.id);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting entry:', error);
      setError('Failed to delete entry');
    }
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

  if (!property) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="container-modern py-8">
          <div className="card text-center py-20">
            <h2 className="text-2xl font-bold text-white mb-2">Property not found</h2>
            <Link href="/properties" className="btn-primary inline-flex items-center mt-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Properties
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const categories = {
    permit: ['Building', 'Mechanical', 'Electrical', 'Plumbing', 'Fire Safety', 'Other'],
    inspection: ['Fire Safety', 'Elevator', 'Boiler', 'Building', 'Health', 'Other'],
    certification: ['Boiler', 'Elevator', 'Fire Alarm', 'Sprinkler', 'Generator', 'Other'],
    violation: ['Building Code', 'Fire Code', 'Health', 'Zoning', 'Other']
  };

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/properties/${property.id}`}
            className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Property
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Add Manual Compliance Entry</h1>
          <p className="text-slate-400">{property.address}, {property.city}</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="card bg-emerald-500/10 border-emerald-500/30 mb-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-emerald-400" />
              <p className="text-emerald-400 font-semibold">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="card bg-ruby-500/10 border-ruby-500/30 mb-6">
            <p className="text-ruby-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form - Left 2 columns */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="card">
              <h2 className="text-2xl font-bold text-white mb-6">New Entry</h2>

              {/* Entry Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Entry Type *
                </label>
                <select
                  value={newEntry.type}
                  onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value, category: '' })}
                  className="input w-full"
                  required
                >
                  <option value="permit">Permit</option>
                  <option value="inspection">Inspection</option>
                  <option value="certification">Certification</option>
                  <option value="violation">Violation</option>
                </select>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category *
                </label>
                <select
                  value={newEntry.category}
                  onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="">Select category...</option>
                  {categories[newEntry.type].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  placeholder="e.g., Annual Boiler Inspection"
                  className="input w-full"
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  placeholder="Additional details..."
                  rows={3}
                  className="input w-full"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={newEntry.expiration_date}
                    onChange={(e) => setNewEntry({ ...newEntry, expiration_date: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Status
                </label>
                <select
                  value={newEntry.status}
                  onChange={(e) => setNewEntry({ ...newEntry, status: e.target.value })}
                  className="input w-full"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  placeholder="Internal notes (not visible to others)..."
                  rows={2}
                  className="input w-full"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full flex items-center justify-center disabled:opacity-50"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? 'Saving...' : 'Add Entry'}
              </button>
            </form>
          </div>

          {/* Existing Entries - Right column */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">
                Manual Entries ({entries.length})
              </h3>

              {entries.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">
                  No manual entries yet.
                  <br />Add your first entry using the form.
                </p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {entries.map(entry => (
                    <div key={entry.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-white text-sm">{entry.title}</h4>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-slate-400 hover:text-ruby-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">
                          <span className="badge badge-sm mr-2">{entry.type}</span>
                          {entry.category}
                        </p>
                        {entry.description && (
                          <p className="text-xs text-slate-500">{entry.description}</p>
                        )}
                        <p className="text-xs text-slate-500">
                          Date: {new Date(entry.date).toLocaleDateString()}
                          {entry.expiration_date && (
                            <> • Expires: {new Date(entry.expiration_date).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
