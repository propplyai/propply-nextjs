import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { authHelpers, supabase } from '@/lib/supabase';
import { 
  FileText, Building2, Calendar, TrendingUp, AlertTriangle, 
  CheckCircle, ExternalLink, Sparkles, BarChart3, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function ComplianceIndexPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);

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
    await loadReports(currentUser.id);
  };

  const loadReports = async (userId) => {
    try {
      const { data, error} = await supabase
        .from('compliance_reports')
        .select(`
          *,
          properties (
            address
          )
        `)
        .eq('user_id', userId)
        .order('generated_at', { ascending: false });

      if (error) {
        console.error('Error loading reports:', error);
        throw error;
      }

      // Flatten the address from the joined properties table, with fallback to report data
      const reportsWithAddress = (data || []).map(report => ({
        ...report,
        address: report.properties?.address || 
                 report.report_data?.property?.address || 
                 null
      }));

      setReports(reportsWithAddress);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (reportId) => {
    setExpandedCard(expandedCard === reportId ? null : reportId);
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    router.push('/');
  };

  const getScoreBadge = (score) => {
    if (score >= 70) {
      return { color: 'text-emerald-400 bg-emerald-500/10', label: 'GOOD' };
    } else if (score >= 40) {
      return { color: 'text-gold-400 bg-gold-500/10', label: 'CAUTION' };
    }
    return { color: 'text-ruby-400 bg-ruby-500/10', label: 'CRITICAL' };
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

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Property Compliance & Data</h1>
          <p className="text-slate-400">View aggregated property data and compliance insights for your portfolio</p>
        </div>

        {/* Reports Grid */}
        {reports.length === 0 ? (
          <div className="card text-center py-20">
            <FileText className="w-20 h-20 text-slate-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">
              No Property Data Yet
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Fetch property data by going to a property and clicking 
              "Fetch NYC Property Data".
            </p>
            <Link href="/dashboard" className="btn-primary inline-flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => {
              const badge = getScoreBadge(report.overall_score);
              const totalViolations = (report.hpd_violations_active || 0) + (report.dob_violations_active || 0);
              const isExpanded = expandedCard === report.id;
              
              return (
                <div 
                  key={report.id} 
                  className="card hover:shadow-xl transition-all duration-300"
                >
                  {/* Collapsible Header - Click to expand/collapse */}
                  <div 
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleCard(report.id)}
                  >
                    <div className="flex-1 flex items-start gap-6">
                      {/* Score Circle */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-full bg-slate-800/50 flex flex-col items-center justify-center border-2 border-slate-700">
                          <div className="text-2xl font-bold text-white">
                            {report.overall_score}%
                          </div>
                          <div className={cn('text-[10px] font-bold uppercase', badge.color)}>
                            {badge.label}
                          </div>
                        </div>
                      </div>

                      {/* Property Info */}
                      <div className="flex-1">
                        <Link href={`/properties/${report.property_id}`}>
                          <h3 className="text-xl font-bold text-white mb-2 hover:text-corporate-400 transition-colors">
                            {report.address || 'No Address Available'}
                          </h3>
                        </Link>
                        {!report.address && (
                          <p className="text-sm text-slate-500 italic mb-2">Property ID: {report.property_id}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-3">
                          {report.borough && <span>{report.borough}</span>}
                          {report.bin && <span>BIN: {report.bin}</span>}
                          {report.bbl && <span>BBL: {report.bbl}</span>}
                        </div>
                        
                        {/* Quick Stats */}
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-ruby-400" />
                            <span className={cn('text-sm font-semibold', totalViolations > 0 ? 'text-ruby-400' : 'text-emerald-400')}>
                              {totalViolations} Active Violations
                            </span>
                          </div>
                          <div className="text-sm text-slate-400">
                            HPD: <span className="text-white font-semibold">{report.hpd_violations_active || 0}</span>
                          </div>
                          <div className="text-sm text-slate-400">
                            DOB: <span className="text-white font-semibold">{report.dob_violations_active || 0}</span>
                          </div>
                          <div className="text-sm text-slate-400">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {formatDate(report.generated_at)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse Icon */}
                    <div className="flex-shrink-0 ml-4">
                      {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                  </div>
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-slate-700 space-y-4">
                      {/* Detailed Property Data Section */}
                      <Link 
                        href={`/compliance/${report.id}`}
                        className="block p-4 bg-gradient-to-r from-corporate-500/10 to-emerald-500/10 border border-corporate-500/30 rounded-lg hover:border-corporate-500 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-corporate-500/20 rounded-lg flex items-center justify-center">
                              <BarChart3 className="w-5 h-5 text-corporate-400" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-white group-hover:text-corporate-400 transition-colors">
                                📊 Detailed Property Records
                              </h4>
                              <p className="text-sm text-slate-400">
                                View elevators, boilers, permits, violations & more
                              </p>
                            </div>
                          </div>
                          <ExternalLink className="w-5 h-5 text-slate-500 group-hover:text-corporate-400 transition-colors" />
                        </div>
                      </Link>

                      {/* AI Analysis Section */}
                      <Link
                        href={`/ai-analysis/${report.property_id}`}
                        className="block p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg hover:border-purple-500 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                                AI Property Analysis
                              </h4>
                              <p className="text-sm text-slate-400">
                                AI-powered insights & recommendations
                              </p>
                            </div>
                          </div>
                          <ExternalLink className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
