import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { authHelpers, supabase } from '@/lib/supabase';
import {
  Building2, MapPin, Calendar, Users, Ruler, AlertTriangle,
  CheckCircle, FileText, Edit, Trash2, ArrowLeft, RefreshCw,
  ChevronDown, ChevronUp
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
  const [latestReport, setLatestReport] = useState(null);
  const [propertyInfoExpanded, setPropertyInfoExpanded] = useState(true);

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
      
      // Load the latest compliance report for this property
      const { data: reports } = await supabase
        .from('nyc_compliance_reports')
        .select('id, generated_at')
        .eq('property_id', propertyId)
        .order('generated_at', { ascending: false })
        .limit(1);
      
      if (reports && reports.length > 0) {
        setLatestReport(reports[0]);
      }
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

      // The result IS the compliance data (has success, scores, data, property, etc.)
      const complianceData = result;
      
      // Save the full report to database
      const { data: savedReport, error: saveError } = await supabase
        .from('nyc_compliance_reports')
        .insert([{
          property_id: property.id,
          user_id: user.id,
          bin: complianceData.property.bin,
          bbl: complianceData.property.bbl,
          address: complianceData.property.address,
          borough: complianceData.property.borough,
          overall_score: complianceData.scores.overall_score,
          hpd_score: complianceData.scores.hpd_score,
          dob_score: complianceData.scores.dob_score,
          hpd_violations_total: complianceData.scores.hpd_violations_active,
          hpd_violations_active: complianceData.scores.hpd_violations_active,
          dob_violations_total: complianceData.scores.dob_violations_active,
          dob_violations_active: complianceData.scores.dob_violations_active,
          elevator_devices: complianceData.scores.elevator_devices || 0,
          boiler_devices: complianceData.scores.boiler_devices || 0,
          electrical_permits: complianceData.scores.electrical_permits || 0,
          report_data: complianceData
        }])
        .select()
        .single();
      
      if (saveError) {
        console.error('Error saving report:', saveError);
      }
      
      // Update property summary
      await supabase
        .from('properties')
        .update({
          compliance_score: complianceData.scores.overall_score,
          active_violations: complianceData.scores.hpd_violations_active + complianceData.scores.dob_violations_active
        })
        .eq('id', property.id);

      // Reload property data
      await loadProperty(id, user.id);
      
      // Redirect to detailed report page
      if (savedReport) {
        router.push(`/compliance/${savedReport.id}`);
        return;
      }
      
      const scores = complianceData.scores;
      alert(`✅ Compliance Report Generated Successfully!\n\n📊 Overall Score: ${scores.overall_score}%\n\n🏗️ Violations:\n  • HPD: ${scores.hpd_violations_active}\n  • DOB: ${scores.dob_violations_active}\n\n🏢 Equipment:\n  • Elevators: ${scores.elevator_devices || 0}\n  • Boilers: ${scores.boiler_devices || 0}\n  • Electrical Permits: ${scores.electrical_permits || 0}`);
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

        {/* Property Header Card */}
        <div className="card mb-8 cursor-pointer" onClick={() => setPropertyInfoExpanded(!propertyInfoExpanded)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {property.address?.split(',')[0] || property.address}
                </h1>
                <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {property.city}
                  </span>
                  <span className="flex items-center">
                    <Building2 className="w-3 h-3 mr-1" />
                    {property.property_type}
                  </span>
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
              {propertyInfoExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>
          
          {propertyInfoExpanded && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {property.bin_number && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">BIN:</div>
                    <div className="text-white font-semibold font-mono">{property.bin_number}</div>
                  </div>
                )}
                {latestReport?.report_data?.property?.bbl && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">BBL:</div>
                    <div className="text-white font-semibold font-mono">{latestReport.report_data.property.bbl}</div>
                  </div>
                )}
                {latestReport?.report_data?.property?.borough && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">BOROUGH:</div>
                    <div className="text-white font-semibold">{latestReport.report_data.property.borough}</div>
                  </div>
                )}
                {latestReport?.report_data?.property?.block && latestReport?.report_data?.property?.lot && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">BLOCK/LOT:</div>
                    <div className="text-white font-semibold font-mono">
                      {latestReport.report_data.property.block}/{latestReport.report_data.property.lot}
                    </div>
                  </div>
                )}
                {property.zip_code && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">ZIP CODE:</div>
                    <div className="text-white font-semibold">{property.zip_code}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Details */}
            <div className="card">
              <h2 className="text-2xl font-bold text-white mb-6">Property Details</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Property Type</div>
                  <div className="text-white font-semibold flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-slate-500" />
                    {property.property_type || 'Not specified'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Location</div>
                  <div className="text-white font-semibold flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                    {property.city}, {property.state}
                  </div>
                </div>
                {property.bin_number && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">BIN Number</div>
                    <div className="text-white font-semibold font-mono">{property.bin_number}</div>
                  </div>
                )}
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
                {property.units && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Units</div>
                    <div className="text-white font-semibold">{property.units}</div>
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
                  {latestReport ? (
                    <Link
                      href={`/compliance/${latestReport.id}`}
                      className="btn-primary w-full flex items-center justify-center"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      View Full Compliance Report
                    </Link>
                  ) : (
                    <button
                      onClick={handleGenerateReport}
                      disabled={generating}
                      className="btn-primary w-full flex items-center justify-center"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Generate Compliance Report
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">All Clear!</h3>
                  <p className="text-emerald-300 mb-4">
                    No active violations detected for this property.
                  </p>
                  {latestReport ? (
                    <Link
                      href={`/compliance/${latestReport.id}`}
                      className="btn-secondary inline-flex items-center"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      View Full Report
                    </Link>
                  ) : (
                    <button
                      onClick={handleGenerateReport}
                      disabled={generating}
                      className="btn-secondary inline-flex items-center"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Generate Report
                    </button>
                  )}
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
                {latestReport && (
                  <Link
                    href={`/compliance/${latestReport.id}`}
                    className="btn-secondary w-full flex items-center justify-center"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    View Compliance Report
                  </Link>
                )}
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
