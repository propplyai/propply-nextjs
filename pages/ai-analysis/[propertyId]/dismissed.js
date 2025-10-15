import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { authHelpers, supabase } from '@/lib/supabase';
import {
  ArrowLeft, AlertTriangle, CheckCircle, ThumbsUp, ThumbsDown,
  Loader2, X, Clock, DollarSign, ExternalLink, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DismissedItemsPage() {
  const router = useRouter();
  const { propertyId } = router.query;

  const [user, setUser] = useState(null);
  const [property, setProperty] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dismissedInsights, setDismissedInsights] = useState([]);
  const [dismissedRecommendations, setDismissedRecommendations] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [recommendationFeedback, setRecommendationFeedback] = useState({});

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
        loadDismissedItems(currentUser.id)
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

  const loadDismissedItems = async (userId) => {
    try {
      // Load dismissed insights
      const { data: dismissedInsightsData, error: insightsError } = await supabase
        .from('dismissed_insights')
        .select('insight_id, dismissed_at')
        .eq('property_id', propertyId)
        .eq('user_id', userId)
        .order('dismissed_at', { ascending: false });

      if (!insightsError && dismissedInsightsData) {
        setDismissedInsights(dismissedInsightsData);
      }

      // Load dismissed recommendations
      const { data: dismissedRecData, error: recError } = await supabase
        .from('dismissed_recommendations')
        .select('recommendation_id, dismissed_at')
        .eq('property_id', propertyId)
        .eq('user_id', userId)
        .order('dismissed_at', { ascending: false });

      if (!recError && dismissedRecData) {
        setDismissedRecommendations(dismissedRecData);
      }

      // Load feedback for insights
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('insight_feedback')
        .select('insight_id, feedback_type')
        .eq('property_id', propertyId)
        .eq('user_id', userId);

      if (!feedbackError && feedbackData) {
        const feedbackMap = {};
        feedbackData.forEach(item => {
          feedbackMap[item.insight_id] = item.feedback_type;
        });
        setFeedback(feedbackMap);
      }

      // Load feedback for recommendations
      const { data: recFeedbackData, error: recFeedbackError } = await supabase
        .from('recommendation_feedback')
        .select('recommendation_id, feedback_type')
        .eq('property_id', propertyId)
        .eq('user_id', userId);

      if (!recFeedbackError && recFeedbackData) {
        const recFeedbackMap = {};
        recFeedbackData.forEach(item => {
          recFeedbackMap[item.recommendation_id] = item.feedback_type;
        });
        setRecommendationFeedback(recFeedbackMap);
      }
    } catch (err) {
      console.error('Error loading dismissed items:', err);
    }
  };

  const handleRestoreInsight = async (insightId) => {
    try {
      const { error } = await supabase
        .from('dismissed_insights')
        .delete()
        .eq('insight_id', insightId)
        .eq('property_id', propertyId)
        .eq('user_id', user.id);

      if (error) throw error;

      setDismissedInsights(prev => prev.filter(item => item.insight_id !== insightId));
    } catch (err) {
      console.error('Error restoring insight:', err);
    }
  };

  const handleRestoreRecommendation = async (recommendationId) => {
    try {
      const { error } = await supabase
        .from('dismissed_recommendations')
        .delete()
        .eq('recommendation_id', recommendationId)
        .eq('property_id', propertyId)
        .eq('user_id', user.id);

      if (error) throw error;

      setDismissedRecommendations(prev => prev.filter(item => item.recommendation_id !== recommendationId));
    } catch (err) {
      console.error('Error restoring recommendation:', err);
    }
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    router.push('/');
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'critical') return <AlertTriangle className="w-5 h-5 text-ruby-400" />;
    if (severity === 'high') return <AlertTriangle className="w-5 h-5 text-orange-400" />;
    if (severity === 'medium') return <AlertTriangle className="w-5 h-5 text-gold-400" />;
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
              <AlertTriangle className="w-6 h-6 text-ruby-400 flex-shrink-0 mt-1" />
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

  const dismissedInsightsData = dismissedInsights.map(item => {
    const insight = analysis?.analysis_data?.insights?.find(insight => 
      (insight.id || analysis.analysis_data.insights.indexOf(insight)) === item.insight_id
    );
    return { ...item, insight };
  }).filter(item => item.insight);

  const dismissedRecommendationsData = dismissedRecommendations.map(item => {
    const recommendation = analysis?.analysis_data?.recommendations?.find(rec => 
      (rec.id || analysis.analysis_data.recommendations.indexOf(rec)) === item.recommendation_id
    );
    return { ...item, recommendation };
  }).filter(item => item.recommendation);

  // Debug logging
  console.log('Dismissed page debug:', {
    dismissedInsights,
    dismissedRecommendations,
    analysis: analysis?.analysis_data,
    dismissedInsightsData,
    dismissedRecommendationsData
  });

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        {/* Header */}
        <Link
          href={`/ai-analysis/${propertyId}`}
          className="inline-flex items-center space-x-2 text-corporate-400 hover:text-corporate-300 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to AI Analysis</span>
        </Link>

        {/* Property Info Header */}
        <div className="card mb-6">
          <div>
            <h1 className="text-2xl font-bold gradient-text mb-2">
              🗑️ Dismissed Items
            </h1>
            <p className="text-lg text-white">{property?.address}</p>
            <p className="text-sm text-slate-400 mt-1">
              {property?.city || 'NYC'} • {property?.property_type || 'Residential'}
            </p>
          </div>
        </div>

        {/* Dismissed Insights */}
        {dismissedInsightsData.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              <h2 className="text-xl font-bold text-white">Dismissed Insights</h2>
              <span className="badge badge-error">{dismissedInsightsData.length}</span>
            </div>

            <div className="space-y-4">
              {dismissedInsightsData.map((item, index) => {
                const insight = item.insight;
                const insightId = insight.id || index;
                const currentFeedback = feedback[item.insight_id];
                
                return (
                  <div
                    key={item.insight_id}
                    className="p-4 bg-slate-900/30 border border-slate-600 rounded-lg opacity-75"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {getSeverityIcon(insight.severity)}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {insight.title}
                          </h3>
                          <button
                            onClick={() => handleRestoreInsight(item.insight_id)}
                            className="btn-secondary text-sm flex items-center gap-1"
                            title="Restore insight"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Restore
                          </button>
                        </div>
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

                        {/* Feedback Display */}
                        {currentFeedback && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500">Your feedback:</span>
                            <div className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded text-xs",
                              currentFeedback === 'positive'
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-ruby-500/20 text-ruby-400"
                            )}>
                              {currentFeedback === 'positive' ? (
                                <ThumbsUp className="w-3 h-3" />
                              ) : (
                                <ThumbsDown className="w-3 h-3" />
                              )}
                              <span>{currentFeedback === 'positive' ? 'Helpful' : 'Not Helpful'}</span>
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-slate-500 mt-2">
                          Dismissed: {new Date(item.dismissed_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dismissed Recommendations */}
        {dismissedRecommendationsData.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Dismissed Recommendations</h2>
              <span className="badge badge-success">{dismissedRecommendationsData.length}</span>
            </div>

            <div className="space-y-3">
              {dismissedRecommendationsData.map((item, index) => {
                const recommendation = item.recommendation;
                const recommendationId = recommendation.id || index;
                const currentFeedback = recommendationFeedback[item.recommendation_id];
                
                return (
                  <div
                    key={item.recommendation_id}
                    className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-lg opacity-75"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-sm font-bold">
                          {recommendation.priority || index + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-white">{recommendation.action}</h3>
                      </div>
                      <button
                        onClick={() => handleRestoreRecommendation(item.recommendation_id)}
                        className="btn-secondary text-sm flex items-center gap-1"
                        title="Restore recommendation"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore
                      </button>
                    </div>
                    <p className="text-slate-300 mb-3 ml-8">{recommendation.reason}</p>
                    {recommendation.cost && (
                      <div className="text-sm text-slate-400 ml-8 mb-3">
                        Estimated cost: {recommendation.cost}
                      </div>
                    )}

                    {/* Feedback Display */}
                    {currentFeedback && (
                      <div className="flex items-center gap-2 text-sm ml-8 mb-3">
                        <span className="text-slate-500">Your feedback:</span>
                        <div className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded text-xs",
                          currentFeedback === 'positive'
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-ruby-500/20 text-ruby-400"
                        )}>
                          {currentFeedback === 'positive' ? (
                            <ThumbsUp className="w-3 h-3" />
                          ) : (
                            <ThumbsDown className="w-3 h-3" />
                          )}
                          <span>{currentFeedback === 'positive' ? 'Helpful' : 'Not Helpful'}</span>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-slate-500 ml-8">
                      Dismissed: {new Date(item.dismissed_at).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {dismissedInsightsData.length === 0 && dismissedRecommendationsData.length === 0 && (
          <div className="card text-center py-20">
            <X className="w-20 h-20 text-slate-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">
              No Dismissed Items
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              You haven't dismissed any insights or recommendations yet. 
              Dismissed items will appear here for easy restoration.
            </p>
            <Link
              href={`/ai-analysis/${propertyId}`}
              className="btn-primary inline-flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to AI Analysis
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
