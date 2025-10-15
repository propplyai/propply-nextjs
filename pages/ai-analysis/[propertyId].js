import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { authHelpers, supabase } from '@/lib/supabase';
import {
  ArrowLeft, Sparkles, AlertTriangle, CheckCircle, TrendingUp,
  Loader2, Crown, Zap, Clock, DollarSign, ExternalLink, ThumbsUp, ThumbsDown,
  FileText, Building2, AlertCircle, RefreshCw, X
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
  const [feedback, setFeedback] = useState({});
  const [dismissedInsights, setDismissedInsights] = useState(new Set());
  const [swipeStart, setSwipeStart] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

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
        
        // Load existing feedback and dismissed insights
        await loadUserFeedback();
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
    }
  };

  const loadUserFeedback = async () => {
    if (!user) return;
    
    try {
      // Load feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('insight_feedback')
        .select('insight_id, feedback_type')
        .eq('property_id', propertyId)
        .eq('user_id', user.id);

      if (!feedbackError && feedbackData) {
        const feedbackMap = {};
        feedbackData.forEach(item => {
          feedbackMap[item.insight_id] = item.feedback_type;
        });
        setFeedback(feedbackMap);
      }

      // Load dismissed insights
      const { data: dismissedData, error: dismissedError } = await supabase
        .from('dismissed_insights')
        .select('insight_id')
        .eq('property_id', propertyId)
        .eq('user_id', user.id);

      if (!dismissedError && dismissedData) {
        const dismissedSet = new Set(dismissedData.map(item => item.insight_id));
        setDismissedInsights(dismissedSet);
      }
    } catch (err) {
      console.error('Error loading user feedback:', err);
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

  const handleFeedback = async (insightId, feedbackType) => {
    try {
      // Update local state immediately for responsive UI
      setFeedback(prev => ({
        ...prev,
        [insightId]: feedbackType
      }));

      // Save to database using upsert with proper conflict resolution
      const { error } = await supabase
        .from('insight_feedback')
        .upsert({
          insight_id: insightId,
          property_id: propertyId,
          user_id: user.id,
          feedback_type: feedbackType,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'insight_id,property_id,user_id'
        });

      if (error) {
        console.error('Error saving feedback:', error);
        // Revert local state on error
        setFeedback(prev => {
          const newFeedback = { ...prev };
          delete newFeedback[insightId];
          return newFeedback;
        });
      }
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  const handleDismissInsight = (insightId) => {
    setDismissedInsights(prev => new Set([...prev, insightId]));
    
    // Save dismissal to database
    supabase
      .from('dismissed_insights')
      .upsert({
        insight_id: insightId,
        property_id: propertyId,
        user_id: user.id,
        dismissed_at: new Date().toISOString()
      })
      .catch(err => console.error('Error saving dismissal:', err));
  };

  const handleTouchStart = (e, insightId) => {
    const touch = e.touches[0];
    setSwipeStart({
      x: touch.clientX,
      y: touch.clientY,
      insightId
    });
    setSwipeOffset(0);
  };

  const handleTouchMove = (e, insightId) => {
    if (!swipeStart || swipeStart.insightId !== insightId) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeStart.x;
    
    // Only allow left swipe (negative deltaX)
    if (deltaX < 0) {
      setSwipeOffset(Math.max(-150, deltaX));
    }
  };

  const handleTouchEnd = (e, insightId) => {
    if (!swipeStart || swipeStart.insightId !== insightId) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeStart.x;
    
    // If swiped left far enough, dismiss the insight
    if (deltaX < -100) {
      handleDismissInsight(insightId);
    }
    
    setSwipeStart(null);
    setSwipeOffset(0);
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
            <div>
              <h1 className="text-2xl font-bold gradient-text mb-2">
                🤖 AI Property Analysis
              </h1>
              <p className="text-lg text-white">{property?.address}</p>
              <p className="text-sm text-slate-400 mt-1">
                {property?.city || 'NYC'} • {property?.property_type || 'Residential'}
              </p>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <div className="text-sm text-slate-400 mb-1">Risk Level</div>
                  <div className={cn(
                    "inline-flex px-3 py-1 rounded-full text-sm font-semibold border",
                    getRiskLevelStyle(analysis.risk_level)
                  )}>
                    {analysis.risk_level?.toUpperCase() || 'N/A'}
                  </div>
                </div>

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
                  {analysis.analysis_data.insights
                    .filter((insight, index) => !dismissedInsights.has(insight.id || index))
                    .map((insight, index) => {
                      const insightId = insight.id || index;
                      const currentFeedback = feedback[insightId];
                      
                      return (
                        <div
                          key={insightId}
                          className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-all duration-200 group relative overflow-hidden"
                          onTouchStart={(e) => handleTouchStart(e, insightId)}
                          onTouchMove={(e) => handleTouchMove(e, insightId)}
                          onTouchEnd={(e) => handleTouchEnd(e, insightId)}
                          style={{
                            transform: swipeStart?.insightId === insightId 
                              ? `translateX(${swipeOffset}px)` 
                              : 'translateX(0)',
                            opacity: swipeStart?.insightId === insightId 
                              ? Math.max(0.3, 1 + swipeOffset / 200)
                              : 1
                          }}
                        >
                          {/* Swipe indicator */}
                          {swipeStart?.insightId === insightId && swipeOffset < -50 && (
                            <div className="absolute inset-0 bg-ruby-500/20 flex items-center justify-center text-ruby-400 font-semibold">
                              <X className="w-6 h-6 mr-2" />
                              Swipe to dismiss
                            </div>
                          )}
                          {/* Dismiss Button */}
                          <button
                            onClick={() => handleDismissInsight(insightId)}
                            className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Dismiss insight"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          <div className="flex items-start gap-3 mb-3">
                            {getSeverityIcon(insight.severity)}
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-2">
                                {insight.title}
                              </h3>
                              <p className="text-slate-300 mb-4">
                                {insight.description}
                              </p>

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

                              {/* Feedback Buttons */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleFeedback(insightId, 'positive')}
                                  className={cn(
                                    "flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors",
                                    currentFeedback === 'positive'
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                      : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                                  )}
                                >
                                  <ThumbsUp className="w-4 h-4" />
                                  <span>Helpful</span>
                                </button>
                                <button
                                  onClick={() => handleFeedback(insightId, 'negative')}
                                  className={cn(
                                    "flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors",
                                    currentFeedback === 'negative'
                                      ? "bg-ruby-500/20 text-ruby-400 border border-ruby-500/30"
                                      : "text-slate-400 hover:text-ruby-400 hover:bg-ruby-500/10"
                                  )}
                                >
                                  <ThumbsDown className="w-4 h-4" />
                                  <span>Not Helpful</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                      <p className="text-slate-300 mb-3 ml-8">{rec.reason}</p>
                      {rec.cost && (
                        <div className="text-sm text-slate-400 ml-8">
                          Estimated cost: {rec.cost}
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

            {/* Analysis Metadata */}
            <div className="text-center text-sm text-slate-500">
              <p>
                Analysis generated: {new Date(analysis.created_at).toLocaleString()}
              </p>
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
