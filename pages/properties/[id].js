import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { authHelpers, supabase } from '@/lib/supabase';
import {
  Building2, MapPin, Calendar, Users, Ruler, AlertTriangle,
  CheckCircle, FileText, Edit, Trash2, ArrowLeft, RefreshCw
} from 'lucide-react';
import { cn, getComplianceScoreBadge, formatDate } from '@/lib/utils';

export default function PropertyDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    if (id) {
      checkAuth();
    }
  }, [id]);

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
      setProperty(data);
    } catch (error) {
      console.error('Error loading property:', error);
      router.push('/properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
      router.push('/properties');
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
      setDeleting(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    setReportError('');
    
    try {
      const response = await fetch('/api/properties/generate-compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: `${property.address}, ${property.city}`,
          propertyId: property.id
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate report');
      }

      // Update property with compliance data
      const complianceData = result.data;
      
      await supabase
        .from('properties')
        .update({
          compliance_score: complianceData.scores.overall_score,
          active_violations: complianceData.scores.hpd_violations_active + complianceData.scores.dob_violations_active
        })
        .eq('id', property.id);

      // Reload property data
      await loadProperty(id, user.id);
      
      alert(`Compliance report generated successfully!\n\nOverall Score: ${complianceData.scores.overall_score}%\nHPD Violations: ${complianceData.scores.hpd_violations_active}\nDOB Violations: ${complianceData.scores.dob_violations_active}`);
    } catch (error) {
      console.error('Error generating report:', error);
      const errorMsg = error.message || 'Unknown error occurred';
      setReportError(`${errorMsg}. Check browser console for details.`);
      console.error('Full error details:', error);
    } finally {
      setGenerating(false);
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
            <p className="text-slate-400 mb-6">The property you're looking for doesn't exist</p>
            <Link href="/properties" className="btn-primary inline-flex items-center">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Properties
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        {/* Back Button */}
        <Link
          href="/properties"
          className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Properties
        </Link>

        {/* Header */}
        <div className="card mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between">
            <div className="flex items-start space-x-4 mb-6 lg:mb-0">
              <div className="w-16 h-16 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white mb-2">{property.address}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {property.city}
                  </span>
                  <span className="flex items-center">
                    <Building2 className="w-4 h-4 mr-1" />
                    {property.property_type}
                  </span>
                  {property.units && (
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {property.units} units
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-semibold border',
                  getComplianceScoreBadge(property.compliance_score || 0)
                )}
              >
                {property.compliance_score || 0}% Compliant
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Details */}
            <div className="card">
              <h2 className="text-2xl font-bold text-white mb-6">Property Details</h2>
              <div className="grid grid-cols-2 gap-6">
                {property.year_built && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Year Built</div>
                    <div className="text-white font-semibold flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                      {property.year_built}
                    </div>
                  </div>
                )}
                {property.square_footage && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Square Footage</div>
                    <div className="text-white font-semibold flex items-center">
                      <Ruler className="w-4 h-4 mr-2 text-slate-500" />
                      {property.square_footage.toLocaleString()} sq ft
                    </div>
                  </div>
                )}
                {property.contact_name && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Contact Name</div>
                    <div className="text-white font-semibold">{property.contact_name}</div>
                  </div>
                )}
                {property.contact_email && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Contact Email</div>
                    <div className="text-white font-semibold">{property.contact_email}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance Status */}
            <div className="card">
              <h2 className="text-2xl font-bold text-white mb-6">Compliance Status</h2>
              {property.active_violations > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-ruby-500/10 border border-ruby-500/30 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <AlertTriangle className="w-6 h-6 text-ruby-400" />
                      <h3 className="text-lg font-semibold text-white">Active Violations</h3>
                    </div>
                    <p className="text-ruby-300">
                      This property has {property.active_violations} active violation
                      {property.active_violations !== 1 ? 's' : ''} that need attention.
                    </p>
                  </div>
                  <Link
                    href={`/compliance/${property.id}`}
                    className="btn-primary w-full flex items-center justify-center"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    View Full Compliance Report
                  </Link>
                </div>
              ) : (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">All Clear!</h3>
                  <p className="text-emerald-300 mb-4">
                    No active violations detected for this property.
                  </p>
                  <Link
                    href={`/compliance/${property.id}`}
                    className="btn-secondary inline-flex items-center"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    View Full Report
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleGenerateReport}
                  disabled={generating || property.city !== 'NYC'}
                  className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-5 h-5 mr-2 ${generating ? 'animate-spin' : ''}`} />
                  {generating ? 'Generating Report...' : 'Generate NYC Compliance Report'}
                </button>
                {reportError && (
                  <div className="text-sm text-ruby-400 bg-ruby-500/10 p-2 rounded border border-ruby-500/30">
                    {reportError}
                  </div>
                )}
                {property.city !== 'NYC' && (
                  <div className="text-xs text-slate-400 text-center">
                    NYC compliance reports only available for NYC properties
                  </div>
                )}
                <Link
                  href={`/compliance/${property.id}`}
                  className="btn-secondary w-full flex items-center justify-center"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  View Compliance
                </Link>
                <button className="btn-secondary w-full flex items-center justify-center">
                  <Edit className="w-5 h-5 mr-2" />
                  Edit Property
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full px-6 py-3 bg-ruby-500/10 text-ruby-400 font-semibold rounded-xl hover:bg-ruby-500/20 transition-all border border-ruby-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-5 h-5 mr-2 inline" />
                  {deleting ? 'Deleting...' : 'Delete Property'}
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="text-white font-semibold">{property.status || 'Active'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Added</span>
                  <span className="text-white font-semibold">{formatDate(property.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Updated</span>
                  <span className="text-white font-semibold">{formatDate(property.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
