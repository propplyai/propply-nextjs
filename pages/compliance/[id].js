import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import SwipeableCard from '@/components/SwipeableCard';
import { authHelpers, supabase } from '@/lib/supabase';
import {
  Building2, ArrowLeft, AlertTriangle, CheckCircle, ChevronDown, ChevronRight,
  Flame, Zap, TrendingUp, ShoppingBag, Eye, Plus, FileText, Shield, Calendar
} from 'lucide-react';
import { cn, formatDate, authenticatedFetch } from '@/lib/utils';
import AddManualRecordModal from '@/components/AddManualRecordModal';

export default function ComplianceReportPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedDescription, setExpandedDescription] = useState(null);
  const [hpdVisibleCount, setHpdVisibleCount] = useState(10);
  const [dobVisibleCount, setDobVisibleCount] = useState(10);
  const [dismissedSections, setDismissedSections] = useState([]);
  const [manualEntries, setManualEntries] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingManualEntries, setLoadingManualEntries] = useState(false);

  useEffect(() => {
    console.log('[Compliance Page] useEffect triggered');
    console.log('[Compliance Page] - id:', id);
    console.log('[Compliance Page] - router.isReady:', router.isReady);
    console.log('[Compliance Page] - router.pathname:', router.pathname);
    console.log('[Compliance Page] - router.asPath:', router.asPath);
    
    // Wait for router to be ready and id to be available
    if (router.isReady && id) {
      console.log('[Compliance Page] Router is ready with ID, starting auth check');
      checkAuth();
    } else if (router.isReady && !id) {
      console.error('[Compliance Page] Router is ready but no ID provided');
      setLoading(false);
    } else {
      console.log('[Compliance Page] Waiting for router to be ready...');
    }
  }, [id, router.isReady]);

  const checkAuth = async () => {
    console.log('[Compliance Page] Checking authentication...');
    try {
      const { user: currentUser, error: authError } = await authHelpers.getUser();
      console.log('[Compliance Page] Auth result:', { 
        hasUser: !!currentUser, 
        userId: currentUser?.id,
        authError: authError?.message
      });
      
      // If there's an auth error or no user, redirect to login with return URL
      if (authError || !currentUser) {
        console.log('[Compliance Page] Auth failed or no user found, redirecting to login');
        console.log('[Compliance Page] Error details:', authError);
        
        // Preserve the current URL to return after login
        const returnUrl = router.asPath;
        console.log('[Compliance Page] Saving return URL:', returnUrl);
        
        // Give a moment for any cleanup, then redirect
        setTimeout(() => {
          router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
        }, 100);
        return;
      }
      
      console.log('[Compliance Page] User authenticated:', currentUser.id);
      setUser(currentUser);
      await loadReport(id, currentUser.id);
      await loadDismissedSections(id);
    } catch (error) {
      console.error('[Compliance Page] Unexpected error during auth check:', error);
      setLoading(false);
      // On unexpected error, also redirect to login with return URL
      const returnUrl = router.asPath;
      setTimeout(() => {
        router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      }, 100);
    }
  };

  const loadReport = async (reportId, userId, retryCount = 0) => {
    try {
      console.log('[Compliance Page] Loading report:', reportId, 'for user:', userId);
      
      // Verify we have a valid session before querying
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[Compliance Page] Session error:', sessionError);
        throw new Error('Session validation failed');
      }
      
      if (!session) {
        console.error('[Compliance Page] No valid session, cannot load report');
        throw new Error('No valid session');
      }
      
      console.log('[Compliance Page] Session valid, expires at:', new Date(session.expires_at * 1000).toISOString());
      
      // Check if session is about to expire (within 5 minutes)
      const expiresAt = session.expires_at * 1000;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (expiresAt - now < fiveMinutes) {
        console.log('[Compliance Page] Session expiring soon, refreshing...');
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('[Compliance Page] Proactive session refresh failed:', refreshError);
        } else if (newSession) {
          console.log('[Compliance Page] Session refreshed proactively');
        }
      }
      
      // First, try to get the report with explicit user filtering
      // This works around potential RLS issues
      const { data, error } = await supabase
        .from('compliance_reports')
        .select('*')
        .eq('id', reportId)
        .eq('user_id', userId)
        .single();

      console.log('[Compliance Page] Query result:', { 
        hasData: !!data, 
        error: error ? {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: error.status
        } : null 
      });

      // If no data found, let's check if the report exists at all
      if (!data && !error) {
        console.log('[Compliance Page] No data returned, checking if report exists for any user...');
        const { data: anyReport, error: anyError } = await supabase
          .from('compliance_reports')
          .select('id, user_id, created_at')
          .eq('id', reportId)
          .single();
        
        if (anyReport) {
          console.log('[Compliance Page] Report exists but belongs to different user:', anyReport.user_id);
        } else {
          console.log('[Compliance Page] Report does not exist in database at all');
        }
      }

      if (error) {
        console.error('[Compliance Page] Database error:', error);
        console.error('[Compliance Page] Error code:', error.code);
        console.error('[Compliance Page] Error message:', error.message);
        console.error('[Compliance Page] Error details:', error.details);
        console.error('[Compliance Page] Error hint:', error.hint);
        console.error('[Compliance Page] HTTP status:', error.status);
        
        // If it's a 406 error, it's likely an auth/header issue
        if (error.status === 406) {
          console.error('[Compliance Page] 406 Not Acceptable - this indicates an auth or header issue');
          console.error('[Compliance Page] Session state:', session ? 'exists' : 'missing');
          
          // Try to refresh the session once
          if (retryCount === 0) {
            console.log('[Compliance Page] Attempting to refresh session...');
            const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (!refreshError && newSession) {
              console.log('[Compliance Page] Session refreshed, retrying query...');
              // Wait a moment for the new session to propagate
              await new Promise(resolve => setTimeout(resolve, 500));
              return loadReport(reportId, userId, retryCount + 1);
            }
          }
          
          throw new Error('Authentication issue - please try logging in again');
        }
        
        // If it's a PGRST116 error (no rows), show not found message
        if (error.code === 'PGRST116') {
          console.error('[Compliance Page] No rows returned - report not found or access denied');
        }
        
        throw error;
      }
      
      if (!data) {
        console.error('[Compliance Page] No report found - data is null/undefined');
        throw new Error('Report not found');
      }
      
      console.log('[Compliance Page] Report loaded successfully:', {
        id: data.id,
        address: data.address,
        score: data.overall_score,
        generated_at: data.generated_at
      });
      setReport(data);
      await loadManualEntries(data.property_id);
    } catch (error) {
      console.error('[Compliance Page] Error loading report:', error);
      console.error('[Compliance Page] Full error object:', error);
      console.error('[Compliance Page] Error name:', error?.name);
      console.error('[Compliance Page] Error message:', error?.message);
      console.error('[Compliance Page] Error stack:', error?.stack);
      console.error('[Compliance Page] Error code:', error?.code);
      console.error('[Compliance Page] Error status:', error?.status);
      
      // Don't redirect, show error on page
      setReport(null);
    } finally {
      console.log('[Compliance Page] Loading complete, setting loading to false');
      console.log('[Compliance Page] Final report state:', report ? 'has report' : 'no report');
      setLoading(false);
    }
  };

  const loadManualEntries = async (propertyId) => {
    if (!propertyId) return;
    
    try {
      setLoadingManualEntries(true);
      const response = await authenticatedFetch(`/api/compliance/manual-entries?property_id=${propertyId}`);
      const data = await response.json();
      
      if (response.ok) {
        setManualEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Error loading manual entries:', error);
    } finally {
      setLoadingManualEntries(false);
    }
  };

  const loadDismissedSections = async (reportId) => {
    try {
      const response = await authenticatedFetch(`/api/compliance/dismissed?report_id=${reportId}`);
      const result = await response.json();
      
      if (result.success) {
        setDismissedSections(result.data.map(d => d.section_type));
      }
    } catch (error) {
      console.error('Error loading dismissed sections:', error);
    }
  };

  const handleDismiss = async (sectionType) => {
    try {
      const response = await authenticatedFetch('/api/compliance/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: id,
          section_type: sectionType
        })
      });

      const result = await response.json();
      if (result.success) {
        setDismissedSections([...dismissedSections, sectionType]);
      }
    } catch (error) {
      console.error('Error dismissing section:', error);
    }
  };

  const isSectionDismissed = (sectionType) => {
    return dismissedSections.includes(sectionType);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleDescription = (id) => {
    setExpandedDescription(expandedDescription === id ? null : id);
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

  if (!report && !loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="container-modern py-8">
          <div className="card text-center py-20">
            <AlertTriangle className="w-16 h-16 text-ruby-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Report not found</h2>
            <p className="text-slate-400 mb-6">
              This compliance report doesn't exist or you don't have permission to view it.
            </p>
            <div className="mb-6 p-4 bg-slate-800/50 rounded-lg text-left max-w-2xl mx-auto">
              <p className="text-xs text-slate-500 mb-2">
                <span className="font-semibold text-slate-400">Report ID:</span> {id}
              </p>
              <p className="text-xs text-slate-500 mb-2">
                <span className="font-semibold text-slate-400">User ID:</span> {user?.id || 'Not available'}
              </p>
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-400">Possible causes:</span>
              </p>
              <ul className="text-xs text-slate-500 list-disc list-inside ml-4 mt-2">
                <li>The report was created by a different user</li>
                <li>The report ID is incorrect or the report was deleted</li>
                <li>Database permissions (RLS) are blocking access</li>
                <li>The report has not finished generating yet</li>
              </ul>
            </div>
            <div className="text-xs text-slate-400 mb-6">
              Check the browser console for detailed error logs
            </div>
            <Link href="/properties" className="btn-primary inline-flex items-center mt-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Properties
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const reportData = report.report_data || {};
  const scores = reportData.scores || {};
  const data = reportData.data || {};

  // Detect city - support multiple formats
  const isPhilly = report.city === 'Philadelphia' || report.city === 'Philly';
  const isNYC = !isPhilly; // Default to NYC for backward compatibility

  // Calculate violations based on city
  const totalViolations = isPhilly
    ? (scores.li_violations_total || report.li_violations_total || 0)
    : ((report.hpd_violations_total || 0) + (report.dob_violations_total || 0));

  const activeViolations = isPhilly
    ? (scores.li_violations_active || report.li_violations_active || 0)
    : ((report.hpd_violations_active || 0) + (report.dob_violations_active || 0));

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        {/* Header */}
        <Link
          href="/compliance"
          className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Compliance
        </Link>

        {/* Compact Property Header - Morphs based on city */}
        <div className="card mb-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-corporate-500/20">
          {/* Top Section: Address and Stats */}
          <div className="flex items-start justify-between gap-6 mb-6">
            {/* Left: Property Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-white mb-3">{report.address}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                {/* NYC Property Identifiers */}
                {isNYC && (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="text-slate-500">BIN:</span>
                      <span className="text-slate-300 font-medium">{report.bin}</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1">
                      <span className="text-slate-500">BBL:</span>
                      <span className="text-slate-300 font-medium">{report.bbl}</span>
                    </span>
                  </>
                )}

                {/* Philadelphia Property Identifiers */}
                {isPhilly && (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="text-slate-500">City:</span>
                      <span className="text-slate-300 font-medium">Philadelphia</span>
                    </span>
                    {report.opa_account && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="flex items-center gap-1">
                          <span className="text-slate-500">OPA:</span>
                          <span className="text-slate-300 font-medium">{report.opa_account}</span>
                        </span>
                      </>
                    )}
                    {report.parcel_id && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="flex items-center gap-1">
                          <span className="text-slate-500">Parcel:</span>
                          <span className="text-slate-300 font-medium">{report.parcel_id}</span>
                        </span>
                      </>
                    )}
                  </>
                )}

                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1">
                  <span className="text-slate-500">Updated:</span>
                  <span className="text-slate-300">{formatDate(report.generated_at)}</span>
                </span>
              </div>
            </div>

            {/* Right: Stats Grid - Morphs based on city */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Total Violations */}
              <div className="text-center px-5 py-3 bg-slate-700/40 rounded-xl border border-slate-600/40 min-w-[110px]">
                <div className="text-3xl font-bold text-white mb-0.5">{totalViolations}</div>
                <div className="text-xs text-slate-400 font-medium">Total Violations</div>
              </div>

              {/* Active Violations */}
              <div className="text-center px-5 py-3 bg-ruby-500/15 rounded-xl border border-ruby-500/40 min-w-[110px]">
                <div className="text-3xl font-bold text-ruby-400 mb-0.5">{activeViolations}</div>
                <div className="text-xs text-slate-400 font-medium">Active Violations</div>
              </div>

              {/* Compliance Score */}
              <div className="text-center px-6 py-3 bg-corporate-500/15 rounded-xl border border-corporate-500/40 min-w-[120px]">
                <div className="text-4xl font-bold text-corporate-400 mb-0.5">{report.overall_score}%</div>
                <div className="text-xs text-slate-400 font-medium">Compliance Score</div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Records Header */}
          <div className="pt-5 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-corporate-400" />
                <h2 className="text-lg font-semibold text-white">
                  {isPhilly ? 'Philadelphia L&I Records' : 'Detailed Property Records'}
                </h2>
                <span className="text-sm text-slate-500 ml-1">Click any category to expand</span>
              </div>
              {dismissedSections.length > 0 && (
                <Link
                  href={`/compliance/${id}/dismissed`}
                  className="flex items-center space-x-2 text-sm text-corporate-400 hover:text-corporate-300 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Dismissed ({dismissedSections.length})</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* NYC Compliance Display - Original Layout */}
        {(!report.city || report.city === 'NYC' || report.city === 'New York') && (
          <div className="space-y-4 mb-8">
          {/* Elevator Equipment */}
          {!isSectionDismissed('elevators') && (
          <SwipeableCard onDismiss={() => handleDismiss('elevators')}>
          <div className="card cursor-pointer" onClick={() => toggleSection('elevators')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-corporate-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-corporate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Elevator Equipment</h3>
                  <p className="text-sm text-slate-400">
                    {data.elevator_data && data.elevator_data.length > 0 
                      ? (() => {
                          const uniqueElevators = new Set(data.elevator_data.map(e => e.device_number)).size;
                          const activeElevators = data.elevator_data.filter(e => e.device_status === 'Active').length;
                          return `${uniqueElevators} elevator${uniqueElevators !== 1 ? 's' : ''} · ${activeElevators} active · ${data.elevator_data.length} inspection record${data.elevator_data.length !== 1 ? 's' : ''}`;
                        })()
                      : `${report.elevator_devices} elevator${report.elevator_devices !== 1 ? 's' : ''}`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-slate-400 text-sm">Elevator inspection records</span>
                {expandedSection === 'elevators' ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>
            
            {expandedSection === 'elevators' && data.elevator_data && data.elevator_data.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Device Number</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Last Inspection</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Next Due</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Inspector</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.elevator_data]
                        .sort((a, b) => {
                          const dateA = new Date(a.status_date || a.lastperiodicinspectiondate || 0);
                          const dateB = new Date(b.status_date || b.lastperiodicinspectiondate || 0);
                          return dateB - dateA; // Newest first
                        })
                        .slice(0, 10)
                        .map((elevator, index) => {
                          const lastInspection = elevator.status_date || elevator.lastperiodicinspectiondate;
                          const nextDue = elevator.nextinspectiondate || elevator.next_inspection_date;
                          const isOverdue = nextDue && new Date(nextDue) < new Date();
                          
                          return (
                            <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                              <td className="py-3 px-4 text-white font-mono text-sm">{elevator.device_number}</td>
                              <td className="py-3 px-4 text-slate-300">{elevator.device_type || elevator.device_category || 'N/A'}</td>
                              <td className="py-3 px-4">
                                <span className={cn(
                                  'px-2 py-1 rounded text-xs font-semibold',
                                  elevator.device_status === 'Active'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-slate-500/10 text-slate-400'
                                )}>
                                  {elevator.device_status || 'Unknown'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-300">{formatDate(lastInspection)}</td>
                              <td className="py-3 px-4">
                                {nextDue ? (
                                  <span className={cn(
                                    'text-xs',
                                    isOverdue ? 'text-ruby-400 font-semibold' : 'text-slate-300'
                                  )}>
                                    {formatDate(nextDue)}
                                    {isOverdue && ' (OVERDUE)'}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-xs">N/A</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-300 text-xs">{elevator.inspector_name || elevator.inspector || 'N/A'}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          </SwipeableCard>
          )}

          {/* Boiler Equipment */}
          {!isSectionDismissed('boilers') && (
          <SwipeableCard onDismiss={() => handleDismiss('boilers')}>
          <div className="card cursor-pointer" onClick={() => toggleSection('boilers')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-ruby-500/10 rounded-xl flex items-center justify-center">
                  <Flame className="w-6 h-6 text-ruby-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Boiler Equipment</h3>
                  <p className="text-sm text-slate-400">
                    {data.boiler_data && data.boiler_data.length > 0 
                      ? (() => {
                          const uniqueBoilers = new Set(data.boiler_data.map(b => b.boiler_id)).size;
                          return `${uniqueBoilers} boiler${uniqueBoilers !== 1 ? 's' : ''} · ${data.boiler_data.length} inspection record${data.boiler_data.length !== 1 ? 's' : ''}`;
                        })()
                      : `${report.boiler_devices} boiler${report.boiler_devices !== 1 ? 's' : ''}`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-slate-400 text-sm">Boiler inspection records</span>
                {expandedSection === 'boilers' ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>
            
            {expandedSection === 'boilers' && data.boiler_data && data.boiler_data.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Boiler ID</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Make/Model</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Defects</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Inspection Date</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Next Due</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Inspector</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.boiler_data]
                        .sort((a, b) => {
                          const dateA = new Date(a.inspection_date || 0);
                          const dateB = new Date(b.inspection_date || 0);
                          return dateB - dateA; // Newest first
                        })
                        .slice(0, 10)
                        .map((boiler, index) => {
                          const nextDue = boiler.nextinspectiondate || boiler.next_inspection_date;
                          const isOverdue = nextDue && new Date(nextDue) < new Date();
                          const hasDefects = boiler.defects_exist === 'Yes' || boiler.defects_exist === 'Y';
                          
                          return (
                            <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                              <td className="py-3 px-4 text-white font-mono text-xs">{boiler.boiler_id}</td>
                              <td className="py-3 px-4 text-slate-300">
                                <div className="text-sm">
                                  <div className="font-medium">{boiler.boiler_make || 'Unknown'}</div>
                                  <div className="text-xs text-slate-500">{boiler.boiler_model || 'N/A'}</div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={cn(
                                  'px-2 py-1 rounded text-xs font-semibold',
                                  hasDefects
                                    ? 'bg-ruby-500/10 text-ruby-400'
                                    : 'bg-emerald-500/10 text-emerald-400'
                                )}>
                                  {hasDefects ? 'YES' : 'NO'}
                                </span>
                                {boiler.defect_description && (
                                  <div className="text-xs text-slate-500 mt-1 max-w-xs truncate">
                                    {boiler.defect_description}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-300">{formatDate(boiler.inspection_date)}</td>
                              <td className="py-3 px-4">
                                <span className={cn(
                                  'px-2 py-1 rounded text-xs font-semibold',
                                  boiler.report_status === 'Passed' || boiler.report_status === 'PASS'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : boiler.report_status === 'Failed' || boiler.report_status === 'FAIL'
                                    ? 'bg-ruby-500/10 text-ruby-400'
                                    : 'bg-slate-500/10 text-slate-400'
                                )}>
                                  {boiler.report_status || 'N/A'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {nextDue ? (
                                  <span className={cn(
                                    'text-xs',
                                    isOverdue ? 'text-ruby-400 font-semibold' : 'text-slate-300'
                                  )}>
                                    {formatDate(nextDue)}
                                    {isOverdue && ' (OVERDUE)'}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-xs">N/A</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-300 text-xs">{boiler.inspector_name || boiler.inspector || 'N/A'}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          </SwipeableCard>
          )}

          {/* Electrical Permits */}
          {!isSectionDismissed('electrical') && (
          <SwipeableCard onDismiss={() => handleDismiss('electrical')}>
          <div className="card cursor-pointer" onClick={() => toggleSection('electrical')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gold-500/10 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-gold-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Electrical Permits</h3>
                  <p className="text-sm text-slate-400">
                    {report.electrical_permits} permits, 0 active
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-slate-400 text-sm">Electrical work permits and inspections</span>
                {expandedSection === 'electrical' ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>
            
            {expandedSection === 'electrical' && data.electrical_permits && data.electrical_permits.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Filing Number</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Filing Date</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Job Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.electrical_permits.slice(0, 10).map((permit, index) => (
                        <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="py-3 px-4 text-white font-mono text-xs">{permit.filing_number}</td>
                          <td className="py-3 px-4 text-slate-300">{formatDate(permit.filing_date)}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-corporate-500/10 text-corporate-400">
                              {permit.filing_status || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{permit.job_description || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          </SwipeableCard>
          )}

          {/* HPD Violations */}
          {!isSectionDismissed('hpd') && (
          <SwipeableCard onDismiss={() => handleDismiss('hpd')}>
          <div className="card cursor-pointer bg-ruby-500/5" onClick={() => toggleSection('hpd')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-ruby-500/10 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-ruby-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">HPD Violations</h3>
                  <p className="text-sm text-slate-400">
                    {report.hpd_violations_total} total, {report.hpd_violations_active} active
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href={`/marketplace?report_id=${report.id}&category=hpd`}
                  className="btn-sm btn-secondary flex items-center space-x-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Find Contractors</span>
                </Link>
                <span className="text-slate-400 text-sm">Housing Preservation & Development violations</span>
                {expandedSection === 'hpd' ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>
            
            {expandedSection === 'hpd' && data.hpd_violations && data.hpd_violations.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Violation ID</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Class</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Description</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Inspection Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.hpd_violations]
                        .sort((a, b) => {
                          // Try multiple date fields to match what's displayed
                          const dateA = new Date(a.novissueddate || a.inspectiondate || a.currentstatus_date || a.certifieddate || 0);
                          const dateB = new Date(b.novissueddate || b.inspectiondate || b.currentstatus_date || b.certifieddate || 0);
                          return dateB - dateA; // Newest first
                        })
                        .slice(0, hpdVisibleCount)
                        .map((violation, index) => (
                        <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="py-3 px-4 text-white font-mono text-xs">{violation.violationid}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-ruby-500/10 text-ruby-400">
                              Class {violation.class}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <div 
                              className="cursor-pointer hover:text-white transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDescription(`hpd-${violation.violationid}`);
                              }}
                            >
                              {expandedDescription === `hpd-${violation.violationid}` ? (
                                <span>{violation.novdescription}</span>
                              ) : (
                                <span className="max-w-xs truncate block">{violation.novdescription}</span>
                              )}
                              <span className="text-xs text-slate-500 mt-1 block">
                                {expandedDescription === `hpd-${violation.violationid}` ? '(click to collapse)' : '(click to expand)'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{violation.violationstatus}</td>
                          <td className="py-3 px-4 text-slate-300">
                            {formatDate(violation.novissueddate || violation.inspectiondate || violation.currentstatus_date || violation.certifieddate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {hpdVisibleCount < data.hpd_violations.length && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHpdVisibleCount(prev => prev + 10);
                      }}
                      className="btn-secondary"
                    >
                      Show More ({data.hpd_violations.length - hpdVisibleCount} remaining)
                    </button>
                  </div>
                )}
                {hpdVisibleCount >= data.hpd_violations.length && data.hpd_violations.length > 10 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHpdVisibleCount(10);
                      }}
                      className="btn-secondary"
                    >
                      Show Less
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          </SwipeableCard>
          )}

          {/* DOB Violations */}
          {!isSectionDismissed('dob') && (
          <SwipeableCard onDismiss={() => handleDismiss('dob')}>
          <div className="card cursor-pointer bg-ruby-500/5" onClick={() => toggleSection('dob')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-ruby-500/10 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-ruby-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">DOB Violations</h3>
                  <p className="text-sm text-slate-400">
                    {report.dob_violations_total} total, {report.dob_violations_active} active
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href={`/marketplace?report_id=${report.id}&category=dob`}
                  className="btn-sm btn-secondary flex items-center space-x-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Find Contractors</span>
                </Link>
                <span className="text-slate-400 text-sm">Department of Buildings violations</span>
                {expandedSection === 'dob' ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>
            
            {expandedSection === 'dob' && data.dob_violations && data.dob_violations.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Violation Number</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Description</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Issue Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const violations = [...data.dob_violations];
                        // Debug: log first violation to see available fields
                        if (violations.length > 0) {
                          console.log('[DOB Violation Fields]', Object.keys(violations[0]));
                          console.log('[DOB Violation Sample]', violations[0]);
                        }
                        return violations
                          .sort((a, b) => {
                            // Try multiple date fields to match what's displayed
                            const dateA = new Date(a.issue_date || a.issuedate || a.issueddate || a.violation_date || a.certify_date || 0);
                            const dateB = new Date(b.issue_date || b.issuedate || b.issueddate || b.violation_date || b.certify_date || 0);
                            return dateB - dateA; // Newest first
                          })
                          .slice(0, dobVisibleCount)
                          .map((violation, index) => {
                            // Get the best available description
                            const description = violation.violation_description || 
                                               violation.description || 
                                               violation.violation_type_code || 
                                               'No description available';
                            // Try multiple date fields (same order as sorting)
                            const displayDate = violation.issue_date || violation.issuedate || violation.issueddate || violation.violation_date || violation.certify_date;
                            
                            // Debug: Log the first few violations to see what fields we have
                            if (index < 3) {
                              console.log(`[DOB Violation ${index}] Available fields:`, Object.keys(violation));
                              console.log(`[DOB Violation ${index}] issue_date value:`, violation.issue_date);
                              console.log(`[DOB Violation ${index}] displayDate:`, displayDate);
                              console.log(`[DOB Violation ${index}] formatted:`, formatDate(displayDate));
                            }
                            
                            return (
                        <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="py-3 px-4 text-white font-mono text-xs">{violation.isn_dob_bis_viol}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-ruby-500/10 text-ruby-400">
                              {violation.violation_type || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <div 
                              className="cursor-pointer hover:text-white transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDescription(`dob-${violation.isn_dob_bis_viol}`);
                              }}
                            >
                              {expandedDescription === `dob-${violation.isn_dob_bis_viol}` ? (
                                <span>{description}</span>
                              ) : (
                                <span className="max-w-xs truncate block">{description}</span>
                              )}
                              <span className="text-xs text-slate-500 mt-1 block">
                                {expandedDescription === `dob-${violation.isn_dob_bis_viol}` ? '(click to collapse)' : '(click to expand)'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{formatDate(displayDate)}</td>
                        </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
                {dobVisibleCount < data.dob_violations.length && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDobVisibleCount(prev => prev + 10);
                      }}
                      className="btn-secondary"
                    >
                      Show More ({data.dob_violations.length - dobVisibleCount} remaining)
                    </button>
                  </div>
                )}
                {dobVisibleCount >= data.dob_violations.length && data.dob_violations.length > 10 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDobVisibleCount(10);
                      }}
                      className="btn-secondary"
                    >
                      Show Less
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          </SwipeableCard>
          )}
        </div>
        )}

        {/* Philadelphia Compliance Display */}
        {(report.city === 'Philadelphia' || report.city === 'Philly') && (
          <div className="space-y-4 mb-8">
            {/* L&I Permits */}
            <div className="card cursor-pointer" onClick={() => toggleSection('li_permits')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-corporate-500/10 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-corporate-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">L&I Building Permits</h3>
                    <p className="text-sm text-slate-400">
                      {scores.li_permits_total || 0} total permits, {scores.li_permits_recent || 0} recent
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-slate-400 text-sm">Building and zoning permits</span>
                  {expandedSection === 'li_permits' ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {expandedSection === 'li_permits' && data.li_permits && data.li_permits.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Permit Number</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Issue Date</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Contractor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.li_permits.slice(0, 10).map((permit, index) => (
                          <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                            <td className="py-3 px-4 text-white font-mono text-xs">{permit.permitnumber}</td>
                            <td className="py-3 px-4 text-slate-300">{permit.permittype || 'N/A'}</td>
                            <td className="py-3 px-4 text-slate-300">{formatDate(permit.permitissuedate)}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-corporate-500/10 text-corporate-400">
                                {permit.status || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-300 text-xs">{permit.contractor || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* L&I Violations */}
            <div className="card cursor-pointer bg-ruby-500/5" onClick={() => toggleSection('li_violations')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-ruby-500/10 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-ruby-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">L&I Code Violations</h3>
                    <p className="text-sm text-slate-400">
                      {scores.li_violations_total || 0} total, {scores.li_violations_active || 0} active
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Link
                    href={`/marketplace?report_id=${report.id}&category=li_violations`}
                    className="btn-sm btn-secondary flex items-center space-x-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Find Contractors</span>
                  </Link>
                  <span className="text-slate-400 text-sm">Licenses & Inspections violations</span>
                  {expandedSection === 'li_violations' ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {expandedSection === 'li_violations' && data.li_violations && data.li_violations.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Violation ID</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Code</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Inspector</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.li_violations.slice(0, 10).map((violation, index) => (
                          <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                            <td className="py-3 px-4 text-white font-mono text-xs">{violation.violationid}</td>
                            <td className="py-3 px-4 text-slate-300">{violation.violationtype || 'N/A'}</td>
                            <td className="py-3 px-4 text-slate-300 text-xs">{violation.violationdescription || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <span className={cn(
                                'px-2 py-1 rounded text-xs font-semibold',
                                violation.status && violation.status.toUpperCase() === 'COMPLIED'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-ruby-500/10 text-ruby-400'
                              )}>
                                {violation.status || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-300">{formatDate(violation.violationdate)}</td>
                            <td className="py-3 px-4 text-slate-300 text-xs">{violation.inspector || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* L&I Investigations */}
            <div className="card cursor-pointer" onClick={() => toggleSection('li_investigations')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gold-500/10 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-gold-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">L&I Case Investigations</h3>
                    <p className="text-sm text-slate-400">
                      {scores.li_investigations_total || 0} inspection records
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-slate-400 text-sm">Property inspection history</span>
                  {expandedSection === 'li_investigations' ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {expandedSection === 'li_investigations' && data.li_investigations && data.li_investigations.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Case ID</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Outcome</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Completed</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Inspector</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.li_investigations.slice(0, 10).map((investigation, index) => (
                          <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                            <td className="py-3 px-4 text-white font-mono text-xs">{investigation.caseid}</td>
                            <td className="py-3 px-4 text-slate-300">{investigation.investigationtype || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-500/10 text-slate-400">
                                {investigation.outcome || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-300">{formatDate(investigation.investigationcompleted)}</td>
                            <td className="py-3 px-4 text-slate-300 text-xs">{investigation.inspector || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* L&I Certifications (if available) */}
            {data.li_certifications && data.li_certifications.length > 0 && (
              <div className="card cursor-pointer" onClick={() => toggleSection('li_certifications')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">L&I Building Certifications</h3>
                      <p className="text-sm text-slate-400">
                        {scores.li_certifications_active || 0} active, {scores.li_certifications_expired || 0} expired
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-400 text-sm">Required safety certifications</span>
                    {expandedSection === 'li_certifications' ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {expandedSection === 'li_certifications' && (
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Certification Type</th>
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Issue Date</th>
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Expiration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.li_certifications.slice(0, 10).map((cert, index) => (
                            <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                              <td className="py-3 px-4 text-slate-300">{cert.cert_type || cert.certification_type || 'N/A'}</td>
                              <td className="py-3 px-4">
                                <span className={cn(
                                  'px-2 py-1 rounded text-xs font-semibold',
                                  cert.status && cert.status.toUpperCase() === 'ACTIVE'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-ruby-500/10 text-ruby-400'
                                )}>
                                  {cert.status || 'N/A'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-300">{formatDate(cert.issue_date)}</td>
                              <td className="py-3 px-4 text-slate-300">{formatDate(cert.expiration_date)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual Records Section */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-corporate-500/10 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-corporate-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Manual Records</h3>
                <p className="text-sm text-slate-400">
                  {manualEntries.length} record{manualEntries.length !== 1 ? 's' : ''} added manually
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
          </div>

          {loadingManualEntries ? (
            <div className="card text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-corporate-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Loading manual records...</p>
            </div>
          ) : manualEntries.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">No Manual Records Yet</h4>
              <p className="text-slate-400 mb-6">
                Add permits, inspections, certifications, or violations manually
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary"
              >
                Add Your First Record
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {manualEntries.map((entry) => {
                const getTypeIcon = (type) => {
                  switch (type) {
                    case 'permit': return FileText;
                    case 'inspection': return CheckCircle;
                    case 'certification': return Shield;
                    case 'violation': return AlertTriangle;
                    default: return FileText;
                  }
                };

                const getStatusColor = (status) => {
                  switch (status) {
                    case 'active': return 'text-green-400 bg-green-500/10';
                    case 'expired': return 'text-red-400 bg-red-500/10';
                    case 'pending': return 'text-yellow-400 bg-yellow-500/10';
                    case 'completed': return 'text-blue-400 bg-blue-500/10';
                    default: return 'text-slate-400 bg-slate-500/10';
                  }
                };

                const TypeIcon = getTypeIcon(entry.type);
                const statusColor = getStatusColor(entry.status);

                return (
                  <div key={entry.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <TypeIcon className="w-5 h-5 text-corporate-400" />
                        <span className="text-sm font-medium text-slate-400 capitalize">
                          {entry.type}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                        {entry.status}
                      </span>
                    </div>

                    <h4 className="text-lg font-semibold text-white mb-2">{entry.title}</h4>
                    <p className="text-sm text-slate-400 mb-3">{entry.category}</p>

                    {entry.description && (
                      <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                        {entry.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(entry.date)}</span>
                      </div>
                      {entry.expiration_date && (
                        <div className="flex items-center space-x-2 text-sm text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span>Expires: {formatDate(entry.expiration_date)}</span>
                        </div>
                      )}
                    </div>

                    {entry.notes && (
                      <div className="text-xs text-slate-500 italic">
                        Note: {entry.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Manual Record Modal */}
      {showAddModal && (
        <AddManualRecordModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          propertyId={report?.property_id}
          onRecordAdded={(newEntry) => {
            setManualEntries(prev => [newEntry, ...prev]);
          }}
        />
      )}
    </Layout>
  );
}
