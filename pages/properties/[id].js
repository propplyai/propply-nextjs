import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Script from 'next/script';
import Layout from '@/components/Layout';
import { authHelpers, supabase } from '@/lib/supabase';
import {
  Building2, MapPin, Calendar, Users, Ruler, AlertTriangle,
  CheckCircle, FileText, Edit, Trash2, ArrowLeft, RefreshCw,
  ChevronDown, ChevronUp, ShoppingBag
} from 'lucide-react';
import { cn, getComplianceScoreBadge, formatDate } from '@/lib/utils';

export default function PropertyDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  console.log('[Property Detail] Component rendered. Router query id:', id, 'isReady:', router.isReady);
  const [user, setUser] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportError, setReportError] = useState('');
  const [latestReport, setLatestReport] = useState(null);
  const [propertyInfoExpanded, setPropertyInfoExpanded] = useState(true);
  const [vendorSearch, setVendorSearch] = useState(null);
  const [loadingVendors, setLoadingVendors] = useState(false);

  useEffect(() => {
    console.log('[Property Detail] useEffect triggered. ID from router.query:', id, 'Router is ready:', router.isReady, 'Pathname:', router.pathname);
    // Only run if we're actually on the property detail page
    // This prevents the effect from running when navigating away to another dynamic route
    if (id && router.isReady && router.pathname === '/properties/[id]') {
      console.log('[Property Detail] Starting auth check for property ID:', id);
      checkAuth();
    }
  }, [id, router.isReady, router.pathname]);

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
      
      // Ensure we're using the ID from the URL, not from any other source
      const propertyId = router.query.id;
      console.log('[Property Detail] About to load property with ID from router:', propertyId);
      await loadProperty(propertyId, currentUser.id);
    } catch (error) {
      console.error('[Property Detail] Unexpected error during auth:', error);
      setTimeout(() => {
        router.push('/login');
      }, 100);
    }
  };

  const loadProperty = async (propertyId, userId, retryCount = 0) => {
    try {
      console.log('[Property Detail] Loading property:', propertyId, 'for user:', userId);
      
      // Verify we have a valid session before querying
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[Property Detail] Session error:', sessionError);
        throw new Error('Session validation failed - please log in again');
      }
      
      if (!session) {
        console.error('[Property Detail] No valid session, cannot load property');
        throw new Error('No active session - please log in');
      }
      
      console.log('[Property Detail] Session valid, querying database...');
      console.log('[Property Detail] Session expires at:', new Date(session.expires_at * 1000).toISOString());
      
      // Check if session is about to expire (within 5 minutes)
      const expiresAt = session.expires_at * 1000;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (expiresAt - now < fiveMinutes) {
        console.log('[Property Detail] Session expiring soon, refreshing...');
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('[Property Detail] Proactive session refresh failed:', refreshError);
        } else if (newSession) {
          console.log('[Property Detail] Session refreshed proactively');
        }
      }
      
      console.log(`[Property Detail] Executing Supabase query with propertyId: ${propertyId} and userId: ${userId}`);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('user_id', userId)
        .single();

      console.log('[Property Detail] Query result:', { 
        hasData: !!data, 
        error: error?.message,
        status: error?.status,
        code: error?.code
      });

      if (error) {
        console.error('[Property Detail] Database error:', error);
        
        // Handle 406 Not Acceptable - typically an auth/header issue
        if (error.code === 'PGRST106' || error.status === 406) {
          console.error('[Property Detail] 406 Not Acceptable error detected');
          console.error('[Property Detail] This usually means JWT token is invalid or expired');
          
          // Try to refresh the session once
          if (retryCount === 0) {
            console.log('[Property Detail] Attempting to refresh session...');
            const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (!refreshError && newSession) {
              console.log('[Property Detail] Session refreshed, retrying query...');
              // Wait a moment for the new session to propagate
              await new Promise(resolve => setTimeout(resolve, 500));
              return loadProperty(propertyId, userId, retryCount + 1);
            }
          }
          
          // If refresh failed or this is a retry, clear session and redirect
          console.error('[Property Detail] Session refresh failed, clearing auth state');
          await supabase.auth.signOut();
          throw new Error('Authentication expired - please log in again');
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

      // Load vendor search if it exists
      const { data: vendorSearchData } = await supabase
        .from('property_vendor_searches')
        .select('*')
        .eq('property_id', propertyId)
        .single();

      if (vendorSearchData) {
        console.log('[Property Detail] Vendor search found:', vendorSearchData);
        setVendorSearch(vendorSearchData);
      }
    } catch (error) {
      console.error('[Property Detail] Error loading property:', error);
      console.error('[Property Detail] Error details:', {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        hint: error?.hint
      });
      
      // If it's an auth error, redirect to login
      if (error?.message?.includes('log in') || error?.message?.includes('Authentication')) {
        console.warn('[Property Detail] Auth error, redirecting to login');
        setTimeout(() => router.push('/login?error=session_expired'), 100);
      } else {
        console.warn('[Property Detail] Redirecting to properties list');
        router.push('/properties');
      }
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
          propertyId: property.id,
          city: property.city // Pass city explicitly
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate report');
      }

      // The result IS the compliance data (has success, scores, data, property, etc.)
      const complianceData = result;
      const city = complianceData.city || property.city || 'NYC';

      // Build city-specific insert data
      let insertData = {
        property_id: property.id,
        user_id: user.id,
        city: city,
        overall_score: complianceData.scores.overall_score,
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

      // Save the full report to database
      const { data: savedReport, error: saveError } = await supabase
        .from('compliance_reports')
        .insert([insertData])
        .select()
        .single();

      if (saveError) {
        console.error('Error saving report:', saveError);
        throw new Error(`Failed to save report: ${saveError.message}`);
      }

      // Calculate total active violations (city-specific)
      let activeViolations = 0;
      if (city === 'Philadelphia') {
        activeViolations = complianceData.scores.li_violations_active || 0;
      } else {
        activeViolations = (complianceData.scores.hpd_violations_active || 0) +
                          (complianceData.scores.dob_violations_active || 0);
      }

      // Update property summary
      await supabase
        .from('properties')
        .update({
          compliance_score: complianceData.scores.overall_score,
          active_violations: activeViolations
        })
        .eq('id', property.id);

      // Reload property data
      await loadProperty(id, user.id);

      // Redirect to detailed report page
      if (savedReport) {
        router.push(`/compliance/${savedReport.id}`);
        return;
      }

      // Show success message (city-specific)
      const scores = complianceData.scores;
      if (city === 'Philadelphia') {
        alert(`✅ Property Data Retrieved Successfully!\n\n📊 Compliance Score: ${scores.overall_score}%\n\n🏗️ L&I Data Found:\n  • Active Violations: ${scores.li_violations_active}\n  • Total Permits: ${scores.li_permits_total}\n  • Active Certifications: ${scores.li_certifications_active}\n  • Investigations: ${scores.li_investigations_total}`);
      } else {
        alert(`✅ Property Data Retrieved Successfully!\n\n📊 Compliance Score: ${scores.overall_score}%\n\n🏗️ Violations Found:\n  • HPD: ${scores.hpd_violations_active}\n  • DOB: ${scores.dob_violations_active}\n\n🏢 Equipment Data:\n  • Elevators: ${scores.elevator_devices || 0}\n  • Boilers: ${scores.boiler_devices || 0}\n  • Electrical Permits: ${scores.electrical_permits || 0}`);
      }
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

        {/* Property Data Overview */}
        <div className="card mb-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
          <h2 className="text-xl font-bold text-white mb-6">Property Data Overview</h2>
          
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
                  Data last updated: {latestReport ? formatDate(latestReport.generated_at) : 'Not yet fetched'}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Data & Compliance */}
            <div className="card">
              <h2 className="text-2xl font-bold text-white mb-6">Property Data & Compliance</h2>
              {property.active_violations > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-ruby-500/10 border border-ruby-500/30 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <AlertTriangle className="w-6 h-6 text-ruby-400" />
                      <h3 className="text-lg font-semibold text-white">Active Violations Detected</h3>
                    </div>
                    <p className="text-ruby-300">
                      Our data shows {property.active_violations} active violation
                      {property.active_violations !== 1 ? 's' : ''} for this property.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {latestReport ? (
                      <Link
                        href={`/compliance/${latestReport.id}`}
                        className="btn-primary w-full flex items-center justify-center"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        View All Property Data
                      </Link>
                    ) : (
                      <button
                        onClick={handleGenerateReport}
                        disabled={generating}
                        className="btn-primary w-full flex items-center justify-center"
                      >
                        <RefreshCw className={`w-5 h-5 mr-2 ${generating ? 'animate-spin' : ''}`} />
                        Fetch Property Data
                    </button>
                  )}
                    <Link
                      href={`/marketplace?property_id=${property.id}`}
                      className="btn-secondary w-full flex items-center justify-center"
                    >
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Find Contractors for These Violations
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">All Clear!</h3>
                  <p className="text-emerald-300 mb-4">
                    {latestReport ? 'No active violations found in our property data.' : 'Fetch data to view compliance status.'}
                  </p>
                  {latestReport ? (
                    <Link
                      href={`/compliance/${latestReport.id}`}
                      className="btn-secondary inline-flex items-center"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      View All Property Data
                    </Link>
                  ) : (
                    <button
                      onClick={handleGenerateReport}
                      disabled={generating}
                      className="btn-secondary inline-flex items-center"
                    >
                      <RefreshCw className={`w-5 h-5 mr-2 ${generating ? 'animate-spin' : ''}`} />
                      Fetch Property Data
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Vendor List Section */}
            {vendorSearch && (
              <div className="card mt-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Contractor List</h2>
                    <p className="text-sm text-slate-400">
                      Last updated: {new Date(vendorSearch.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    href={`/marketplace?property_id=${property.id}`}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Re-run Search</span>
                  </Link>
                </div>

                <div className="p-4 bg-corporate-500/10 border border-corporate-500/30 rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">{vendorSearch.total_vendors}</div>
                      <div className="text-sm text-slate-400">Contractors found</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-300">
                        {vendorSearch.search_categories?.length} categories
                      </div>
                      <div className="text-xs text-slate-500">
                        {vendorSearch.search_categories?.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/marketplace?property_id=${property.id}`}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  View All Contractors
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Actions</h3>
              <div className="space-y-3">
                {latestReport && (
                  <Link
                    href={`/compliance/${latestReport.id}`}
                    className="btn-primary w-full flex items-center justify-center"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    View Compliance Data
                  </Link>
                )}
                <Link
                  href={`/properties/${property.id}/edit-compliance`}
                  className="btn-secondary w-full flex items-center justify-center"
                >
                  <Edit className="w-5 h-5 mr-2" />
                  Add Manual Entry
                </Link>
                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="btn-secondary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-5 h-5 mr-2 ${generating ? 'animate-spin' : ''}`} />
                  {generating ? 'Refreshing...' : 'Refresh Data'}
                </button>
                {reportError && (
                  <div className="text-sm text-ruby-400 bg-ruby-500/10 p-2 rounded border border-ruby-500/30">
                    {reportError}
                  </div>
                )}
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
