import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { authHelpers, supabase } from '@/lib/supabase';
import {
  Building2, ArrowLeft, AlertTriangle, CheckCircle, ChevronDown, ChevronRight,
  Flame, Zap, TrendingUp
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

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

  useEffect(() => {
    console.log('[Compliance Page] useEffect triggered, id:', id, 'router.isReady:', router.isReady);
    
    // Wait for router to be ready and id to be available
    if (router.isReady && id) {
      console.log('[Compliance Page] Router is ready, starting auth check');
      checkAuth();
    } else if (router.isReady && !id) {
      console.error('[Compliance Page] Router is ready but no ID provided');
      setLoading(false);
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
      
      // If there's an auth error or no user, redirect to login
      if (authError || !currentUser) {
        console.log('[Compliance Page] Auth failed or no user found, redirecting to login');
        console.log('[Compliance Page] Error details:', authError);
        
        // Give a moment for any cleanup, then redirect
        setTimeout(() => {
          router.push('/login');
        }, 100);
        return;
      }
      
      console.log('[Compliance Page] User authenticated:', currentUser.id);
      setUser(currentUser);
      await loadReport(id, currentUser.id);
    } catch (error) {
      console.error('[Compliance Page] Unexpected error during auth check:', error);
      setLoading(false);
      // On unexpected error, also redirect to login
      setTimeout(() => {
        router.push('/login');
      }, 100);
    }
  };

  const loadReport = async (reportId, userId) => {
    try {
      console.log('[Compliance Page] Loading report:', reportId, 'for user:', userId);
      
      // Verify we have a valid session before querying
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[Compliance Page] No valid session, cannot load report');
        throw new Error('No valid session');
      }
      
      // First, try to get the report with explicit user filtering
      // This works around potential RLS issues
      const { data, error } = await supabase
        .from('nyc_compliance_reports')
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
    } catch (error) {
      console.error('[Compliance Page] Error loading report:', error);
      console.error('[Compliance Page] Full error object:', error);
      console.error('[Compliance Page] Error name:', error?.name);
      console.error('[Compliance Page] Error message:', error?.message);
      console.error('[Compliance Page] Error stack:', error?.stack);
      
      // Don't redirect, show error on page
      setReport(null);
    } finally {
      console.log('[Compliance Page] Loading complete, setting loading to false');
      setLoading(false);
    }
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

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        {/* Header */}
        <Link
          href="/properties"
          className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Properties
        </Link>

        {/* Report Header */}
        <div className="card mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{report.address}</h1>
              <div className="flex items-center space-x-4 text-sm text-slate-400">
                <span>BIN: {report.bin}</span>
                <span>BBL: {report.bbl}</span>
                <span>Generated: {formatDate(report.generated_at)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-white mb-1">{report.overall_score}%</div>
              <div className="text-sm text-slate-400">Overall Score</div>
            </div>
          </div>
        </div>

        {/* Detailed Compliance Analysis Header */}
        <div className="card bg-gradient-to-r from-corporate-500/20 to-emerald-500/20 border-corporate-500/30 mb-6">
          <h2 className="text-xl font-bold text-white mb-2">📊 Detailed Compliance Analysis</h2>
          <p className="text-slate-300">Click on any category to view detailed information</p>
        </div>

        {/* Equipment & Systems */}
        <div className="space-y-4 mb-8">
          {/* Elevator Equipment */}
          <div className="card cursor-pointer" onClick={() => toggleSection('elevators')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-corporate-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-corporate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Elevator Equipment</h3>
                  <p className="text-sm text-slate-400">
                    {report.elevator_devices} total, {report.elevator_devices} active
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
                      </tr>
                    </thead>
                    <tbody>
                      {data.elevator_data.slice(0, 10).map((elevator, index) => (
                        <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="py-3 px-4 text-white">{elevator.device_number}</td>
                          <td className="py-3 px-4 text-slate-300">{elevator.device_type || 'N/A'}</td>
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
                          <td className="py-3 px-4 text-slate-300">{elevator.status_date || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Boiler Equipment */}
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
                        .map((boiler, index) => (
                        <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="py-3 px-4 text-white font-mono text-xs">{boiler.boiler_id}</td>
                          <td className="py-3 px-4 text-slate-300">{boiler.boiler_make} {boiler.boiler_model}</td>
                          <td className="py-3 px-4">
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-semibold',
                              boiler.defects_exist === 'Yes'
                                ? 'bg-ruby-500/10 text-ruby-400'
                                : 'bg-emerald-500/10 text-emerald-400'
                            )}>
                              {boiler.defects_exist || 'No'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{formatDate(boiler.inspection_date)}</td>
                          <td className="py-3 px-4 text-slate-300">{boiler.report_status || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Electrical Permits */}
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
                          <td className="py-3 px-4 text-slate-300">{permit.filing_date || 'N/A'}</td>
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

          {/* HPD Violations */}
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
                          const dateA = new Date(a.inspectiondate || 0);
                          const dateB = new Date(b.inspectiondate || 0);
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
                          <td className="py-3 px-4 text-slate-300">{formatDate(violation.inspectiondate)}</td>
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

          {/* DOB Violations */}
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
                      {[...data.dob_violations]
                        .sort((a, b) => {
                          // Try multiple date fields
                          const dateA = new Date(a.issue_date || a.issuedate || a.violation_date || 0);
                          const dateB = new Date(b.issue_date || b.issuedate || b.violation_date || 0);
                          return dateB - dateA; // Newest first
                        })
                        .slice(0, dobVisibleCount)
                        .map((violation, index) => {
                          // Get the best available description
                          const description = violation.violation_description || 
                                             violation.description || 
                                             violation.violation_type_code || 
                                             'No description available';
                          // Try multiple date fields
                          const displayDate = violation.issue_date || violation.issuedate || violation.violation_date;
                          
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
                        })}
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
        </div>

        {/* Violation Summary */}
        <div className="card bg-slate-800/50">
          <h3 className="text-lg font-bold text-white mb-4">Violation Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-700">
              <span className="text-slate-300">TOTAL VIOLATIONS:</span>
              <span className="text-white font-bold">{report.hpd_violations_total + report.dob_violations_total}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-300">ACTIVE VIOLATIONS:</span>
              <span className="text-ruby-400 font-bold">{report.hpd_violations_active + report.dob_violations_active}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
