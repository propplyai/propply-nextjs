import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Script from 'next/script';
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
    console.log('[Property Detail] useEffect triggered, id:', id);
    if (id) {
      console.log('[Property Detail] Starting auth check for property ID:', id);
      checkAuth();
    }
  }, [id]);

  const checkAuth = async () => {
    try {
      const { user: currentUser, error: authError } = await authHelpers.getUser();
      
      if (authError || !currentUser) {
        console.log('[Property Detail] Auth failed, redirecting to login');
        setTimeout(() => {
          router.push('/login');
        }, 100);
        return;
      }
      
      setUser(currentUser);
      await loadProperty(id, currentUser.id);
    } catch (error) {
      console.error('[Property Detail] Unexpected error during auth:', error);
      setTimeout(() => {
        router.push('/login');
      }, 100);
    }
  };

  const loadProperty = async (propertyId, userId) => {
    try {
      console.log('[Property Detail] Loading property:', propertyId, 'for user:', userId);
      
      // Verify we have a valid session before querying
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[Property Detail] No valid session, cannot load property');
        throw new Error('No valid session');
      }
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('user_id', userId)
        .single();

      console.log('[Property Detail] Query result:', { 
        hasData: !!data, 
        error: error?.message,
        status: error?.status 
      });

      if (error) {
        console.error('[Property Detail] Database error:', error);
        
        // If it's a 406 error, it's likely an auth/header issue
        if (error.status === 406) {
          console.error('[Property Detail] 406 Not Acceptable - auth or header issue');
          console.error('[Property Detail] Session state:', session ? 'exists' : 'missing');
          throw new Error('Authentication issue - please try logging in again');
        }
        
        throw error;
      }
      
      if (!data) {
        console.error('[Property Detail] No property found for ID:', propertyId);
        throw new Error('Property not found');
      }
      
      console.log('[Property Detail] Property loaded successfully:', data.address);
      setProperty(data);
      
      // Load the latest compliance report for this property
      const { data: reports } = await supabase
        .from('nyc_compliance_reports')
        .select('id, generated_at')
        .eq('property_id', propertyId)
        .order('generated_at', { ascending: false })
        .limit(1);
      
      if (reports && reports.length > 0) {
        console.log('[Property Detail] Latest report found:', reports[0].id);
        setLatestReport(reports[0]);
      } else {
        console.log('[Property Detail] No compliance reports found for this property');
      }
    } catch (error) {
      console.error('[Property Detail] Error loading property:', error);
      console.error('[Property Detail] Error details:', error?.message, error?.code);
      console.warn('[Property Detail] Redirecting to properties list');
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

        {/* Property Analysis Results */}
        <div className="card mb-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
          <h2 className="text-xl font-bold text-white mb-6">Property Analysis Results</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Score Card */}
            <div className="bg-gradient-to-br from-gold-500/5 to-ruby-500/5 rounded-xl p-6 border border-slate-700">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "px-4 py-1 rounded-full text-xs font-bold uppercase mb-4",
                  property.compliance_score >= 70 ? "bg-emerald-500/20 text-emerald-400" :
                  property.compliance_score >= 40 ? "bg-gold-500/20 text-gold-400" :
                  "bg-ruby-500/20 text-ruby-400"
                )}>
                  {property.compliance_score >= 70 ? "GOOD" : property.compliance_score >= 40 ? "CAUTION" : "CRITICAL"}
                </div>
                
                {/* Circular Progress */}
                <div className="relative w-32 h-32 mb-4">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-slate-700"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - (property.compliance_score || 0) / 100)}`}
                      className={cn(
                        property.compliance_score >= 70 ? "text-emerald-400" :
                        property.compliance_score >= 40 ? "text-gold-400" :
                        "text-ruby-400"
                      )}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-corporate-400">{property.compliance_score || 0}</span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-400">
                  Report generated on: {latestReport ? formatDate(latestReport.generated_at) : 'Not yet generated'}
                </p>
              </div>
            </div>
            
            {/* Google Maps */}
            <div className="rounded-xl overflow-hidden border border-slate-700" style={{ height: '280px' }}>
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(property.address)}&zoom=18&maptype=satellite`}>
              </iframe>
            </div>
          </div>
        </div>

        {/* Property Details Card (Collapsible) */}
        <div className="card mb-8 cursor-pointer" onClick={() => setPropertyInfoExpanded(!propertyInfoExpanded)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {property.address?.split(',')[0]?.toUpperCase() || property.address}
                </h3>
              </div>
            </div>
            <div className="flex items-center space-x-3">
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
                    <div className="text-white font-semibold">{property.bin_number}</div>
                  </div>
                )}
                {latestReport?.report_data?.property?.bbl && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">BBL:</div>
                    <div className="text-white font-semibold">{latestReport.report_data.property.bbl}</div>
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
                    <div className="text-white font-semibold">
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
