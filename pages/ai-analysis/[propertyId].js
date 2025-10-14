import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { authHelpers, supabase } from '@/lib/supabase';
import {
  ArrowLeft, Sparkles, AlertTriangle, CheckCircle, TrendingUp,
  Loader2, Crown, Zap, Clock, DollarSign, ExternalLink, ThumbsUp,
  FileText, Building2, AlertCircle, RefreshCw, ArrowRight
} from 'lucide-react';
import { cn, authenticatedFetch } from '@/lib/utils';

export default function AIAnalysisPage() {
  const router = useRouter();
  const { propertyId } = router.query;

  const [user, setUser] = useState(null);
  const [property, setProperty] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (propertyId && router.isReady) {
      checkAuth();
    }
  }, [propertyId, router.isReady]);

  const checkAuth = async () => {
    try {
      const { user: currentUser, error: authError } = await authHelpers.getUser();

      if (authError || !currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      await Promise.all([
        loadProperty(currentUser.id),
        loadAnalysis(),
        checkSubscription(currentUser.id)
      ]);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadProperty = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProperty(data);
    } catch (err) {
      console.error('Error loading property:', err);
      setError('Property not found or you do not have access.');
    }
  };

  const loadAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_property_analyses')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setAnalysis(data[0]);
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
    }
  };

  const checkSubscription = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSubscription(data);
    } catch (err) {
      console.error('Error checking subscription:', err);
    }
  };

  const handleRunAnalysis = async () => {
    // Check if user has paid subscription
    if (!subscription) {
      setShowUpgradeModal(true);
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      console.log('Triggering analysis for property:', propertyId);

      const response = await authenticatedFetch('/api/ai-analysis/trigger', {
        method: 'POST',
        body: JSON.stringify({
          property_id: propertyId
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger analysis');
      }

      // Reload analysis after completion
      await loadAnalysis();
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    router.push('/');
  };

  const getRiskLevelStyle = (level) => {
    const styles = {
      low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      medium: 'bg-gold-500/20 text-gold-400 border-gold-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      critical: 'bg-ruby-500/20 text-ruby-400 border-ruby-500/30'
    };
    return styles[level] || styles.medium;
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'critical') return <AlertTriangle className="w-5 h-5 text-ruby-400" />;
    if (severity === 'high') return <AlertTriangle className="w-5 h-5 text-orange-400" />;
    if (severity === 'medium') return <AlertCircle className="w-5 h-5 text-gold-400" />;
    return <CheckCircle className="w-5 h-5 text-emerald-400" />;
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-corporate-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error && !property) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="container-modern py-8">
          <div className="card">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-ruby-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Error Loading Property</h3>
                <p className="text-slate-300">{error}</p>
                <Link href="/compliance" className="btn-primary mt-4 inline-block">
                  <ArrowLeft className="w-5 h-5 mr-2 inline" />
                  Back to Compliance
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        {/* Header */}
        <Link
          href="/compliance"
          className="inline-flex items-center space-x-2 text-corporate-400 hover:text-corporate-300 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Compliance</span>
        </Link>

        {/* Property Info Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text mb-2">
                  AI Property Analysis
                </h1>
                <p className="text-lg text-white">{property?.address}</p>
                <p className="text-sm text-slate-400 mt-1">
                  {property?.city || 'NYC'} • {property?.property_type || 'Residential'}
                </p>
              </div>
            </div>
            {analysis && (
              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", analyzing && "animate-spin")} />
                Re-run Analysis
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="card mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-ruby-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Error</h3>
                <p className="text-ruby-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Content */}
        {!analysis && !analyzing && (
          <div className="card text-center py-20">
            <Sparkles className="w-20 h-20 text-purple-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">
              No Analysis Yet
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Run an AI analysis to get intelligent insights, recommendations, and action items
              for this property based on current regulations.
            </p>
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="btn-primary inline-flex items-center"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Property...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Run AI Analysis
                </>
              )}
            </button>
            {!subscription && (
              <p className="text-xs text-slate-500 mt-4">
                AI Analysis requires a paid subscription
              </p>
            )}
          </div>
        )}

        {analyzing && (
          <div className="card text-center py-20">
            <Loader2 className="w-20 h-20 text-purple-400 mx-auto mb-6 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-3">
              Analyzing Property...
            </h2>
            <p className="text-slate-400 mb-4">
              Our AI is reviewing your property data and comparing it against current city regulations.
            </p>
            <div className="max-w-md mx-auto space-y-2 text-sm text-slate-500">
              <p>✓ Fetching property data...</p>
              <p>✓ Analyzing violations...</p>
              <p>⏳ Matching regulations...</p>
              <p>⏳ Generating recommendations...</p>
            </div>
          </div>
        )}

        {analysis && !analyzing && (
          <div className="space-y-6">
            {/* Overall Assessment */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Overall Assessment</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <div className="text-sm text-slate-400 mb-1">Risk Level</div>
                  <div className={cn(
                    "inline-flex px-3 py-1 rounded-full text-sm font-semibold border",
                    getRiskLevelStyle(analysis.risk_level)
                  )}>
                    {analysis.risk_level?.toUpperCase() || 'N/A'}
                  </div>
                </div>

                {analysis.analysis_data?.overall_assessment?.compliance_score !== undefined && (
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Compliance Score</div>
                    <div className="text-2xl font-bold text-white">
                      {analysis.analysis_data.overall_assessment.compliance_score}%
                    </div>
                  </div>
                )}

                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <div className="text-sm text-slate-400 mb-1">Insights Found</div>
                  <div className="text-2xl font-bold text-white">{analysis.insight_count || 0}</div>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <div className="text-sm text-slate-400 mb-1">Recommendations</div>
                  <div className="text-2xl font-bold text-white">{analysis.recommendation_count || 0}</div>
                </div>
              </div>

              {analysis.analysis_data?.overall_assessment?.summary && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-slate-200 leading-relaxed">
                    {analysis.analysis_data.overall_assessment.summary}
                  </p>
                </div>
              )}
            </div>

            {/* Insights */}
            {analysis.analysis_data?.insights && analysis.analysis_data.insights.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                  <h2 className="text-xl font-bold text-white">Critical Insights</h2>
                  <span className="badge badge-error">{analysis.analysis_data.insights.length}</span>
                </div>

                <div className="space-y-4">
                  {analysis.analysis_data.insights.map((insight, index) => (
                    <div
                      key={insight.id || index}
                      className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {getSeverityIcon(insight.severity)}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {insight.title}
                          </h3>
                          <p className="text-slate-300 mb-4">
                            {insight.description || insight.note}
                          </p>
                          {insight.category && (
                            <div className="inline-block px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-400 mb-3">
                              {insight.category}
                            </div>
                          )}

                          {/* Metadata Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {insight.cost_estimate && (
                              <div className="flex items-center gap-2 text-sm text-slate-400">
                                <DollarSign className="w-4 h-4" />
                                <span>{insight.cost_estimate}</span>
                              </div>
                            )}
                            {insight.timeline && (
                              <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Clock className="w-4 h-4" />
                                <span>{insight.timeline}</span>
                              </div>
                            )}
                            {insight.severity && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className={cn(
                                  "px-2 py-1 rounded text-xs font-medium",
                                  insight.severity === 'critical' && 'bg-ruby-500/20 text-ruby-400',
                                  insight.severity === 'high' && 'bg-orange-500/20 text-orange-400',
                                  insight.severity === 'medium' && 'bg-gold-500/20 text-gold-400'
                                )}>
                                  {insight.severity}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Regulations */}
                          {insight.regulations && insight.regulations.length > 0 && (
                            <div className="p-3 bg-slate-800/50 rounded border border-slate-700 mb-3">
                              <div className="text-xs text-slate-500 mb-2">Relevant Regulations:</div>
                              {insight.regulations.map((reg, idx) => (
                                <div key={idx} className="text-sm text-slate-300 mb-1">
                                  <span className="font-mono text-corporate-400">{reg.code}</span> - {reg.title}
                                </div>
                              ))}
                            </div>
                          )}

                          <button className="btn-secondary text-sm">
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            Mark as Helpful
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.analysis_data?.recommendations && analysis.analysis_data.recommendations.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-xl font-bold text-white">Recommendations</h2>
                </div>

                <div className="space-y-3">
                  {analysis.analysis_data.recommendations.map((rec, index) => (
                    <div
                      key={rec.id || index}
                      className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-sm font-bold">
                            {rec.priority || index + 1}
                          </span>
                          <h3 className="text-lg font-semibold text-white">{rec.action}</h3>
                        </div>
                        {rec.deadline && (
                          <span className="text-xs text-slate-400">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {rec.deadline}
                          </span>
                        )}
                      </div>
                      {rec.reason && <p className="text-slate-300 mb-3 ml-8">{rec.reason}</p>}
                      {rec.cost && (
                        <div className="text-sm text-slate-400 ml-8 mb-3">
                          {rec.cost === 'calculating...' ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-corporate-400" />
                              <span className="text-slate-400">Calculating cost from marketplace vendors...</span>
                            </div>
                          ) : (
                            <span>Estimated cost: {rec.cost}</span>
                          )}
                        </div>
                      )}
                      {rec.contractor_categories && rec.contractor_categories.length > 0 && (
                        <Link
                          href={`/marketplace?property_id=${propertyId}`}
                          className="btn-primary text-sm mt-3 ml-8 inline-flex items-center"
                        >
                          Find Contractors
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment Summary */}
            {analysis.analysis_data?.equipment_summary && (
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-6 h-6 text-corporate-400" />
                  <h2 className="text-xl font-bold text-white">Equipment Status</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(analysis.analysis_data.equipment_summary).map(([key, value]) => (
                    <div key={key} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                      <h3 className="text-sm font-semibold text-corporate-400 uppercase mb-2">
                        {key.replace(/_/g, ' ')}
                      </h3>
                      {typeof value === 'object' && (
                        <>
                          {value.total !== undefined && (
                            <div className="text-sm text-slate-400 mb-1">
                              Total: <span className="text-white font-semibold">{value.total}</span>
                            </div>
                          )}
                          {value.active !== undefined && (
                            <div className="text-sm text-slate-400 mb-1">
                              Active: <span className="text-white font-semibold">{value.active}</span>
                            </div>
                          )}
                          {value.issues && value.issues.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-ruby-400 font-semibold mb-1">Issues:</div>
                              {value.issues.map((issue, idx) => (
                                <div key={idx} className="text-xs text-slate-300 mb-1">• {issue}</div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliance Status */}
            {analysis.analysis_data?.compliance_status && (
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-purple-400" />
                  <h2 className="text-xl font-bold text-white">Compliance Status</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {analysis.analysis_data.compliance_status.hpd_violations !== undefined && (
                    <div className="p-4 bg-ruby-500/10 border border-ruby-500/30 rounded-lg text-center">
                      <div className="text-3xl font-bold text-ruby-400">
                        {analysis.analysis_data.compliance_status.hpd_violations}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">HPD Violations</div>
                    </div>
                  )}
                  {analysis.analysis_data.compliance_status.dob_violations !== undefined && (
                    <div className="p-4 bg-ruby-500/10 border border-ruby-500/30 rounded-lg text-center">
                      <div className="text-3xl font-bold text-ruby-400">
                        {analysis.analysis_data.compliance_status.dob_violations}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">DOB Violations</div>
                    </div>
                  )}
                  {analysis.analysis_data.compliance_status.total_violations !== undefined && (
                    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg text-center">
                      <div className="text-3xl font-bold text-orange-400">
                        {analysis.analysis_data.compliance_status.total_violations}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Total Violations</div>
                    </div>
                  )}
                  {analysis.analysis_data.compliance_status.critical_deadlines !== undefined && (
                    <div className="p-4 bg-gold-500/10 border border-gold-500/30 rounded-lg text-center">
                      <div className="text-3xl font-bold text-gold-400">
                        {analysis.analysis_data.compliance_status.critical_deadlines}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Critical Deadlines</div>
                    </div>
                  )}
                </div>
                {analysis.analysis_data.compliance_status.status && (
                  <div className="mt-4 p-3 bg-slate-900/50 rounded-lg text-center">
                    <span className={cn(
                      "text-sm font-semibold uppercase",
                      analysis.analysis_data.compliance_status.status.toLowerCase().includes('critical') && 'text-ruby-400',
                      analysis.analysis_data.compliance_status.status.toLowerCase().includes('good') && 'text-emerald-400'
                    )}>
                      {analysis.analysis_data.compliance_status.status}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Next Steps */}
            {analysis.analysis_data?.next_steps && analysis.analysis_data.next_steps.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <ArrowRight className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-xl font-bold text-white">Next Steps</h2>
                </div>
                <div className="space-y-2">
                  {analysis.analysis_data.next_steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-slate-300 text-sm">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Metadata */}
            <div className="text-center text-sm text-slate-500">
              <p>
                Analysis generated: {new Date(analysis.created_at).toLocaleString()}
              </p>
              {analysis.model_used && (
                <p className="mt-1">Model: {analysis.model_used}</p>
              )}
            </div>
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card max-w-lg w-full">
              <div className="text-center">
                <Crown className="w-16 h-16 text-gold-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-3">
                  Upgrade to Access AI Analysis
                </h2>
                <p className="text-slate-300 mb-6">
                  AI Property Analysis is available on our Pro and Enterprise plans.
                  Get intelligent insights, recommendations, and compliance guidance.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <Zap className="w-8 h-8 text-corporate-400 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-white mb-1">Unlimited Analyses</div>
                    <div className="text-xs text-slate-400">Run as many as you need</div>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <FileText className="w-8 h-8 text-corporate-400 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-white mb-1">PDF Reports</div>
                    <div className="text-xs text-slate-400">Export & share insights</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Maybe Later
                  </button>
                  <Link href="/pricing" className="btn-primary flex-1">
                    View Plans
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
