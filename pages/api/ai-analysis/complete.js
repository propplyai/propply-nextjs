import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  console.log('🔵 AI Analysis Complete - START');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    analysis_id, 
    property_id, 
    address, 
    city, 
    analyzed_at,
    overall_assessment,
    insights,
    recommendations,
    equipment_summary,
    compliance_status,
    next_steps,
    status
  } = req.body;

  if (!analysis_id) {
    console.log('❌ Missing analysis_id');
    return res.status(400).json({ error: 'analysis_id is required' });
  }

  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL not set');
      return res.status(500).json({ error: 'Server configuration error: Missing SUPABASE_URL' });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
      return res.status(500).json({ error: 'Server configuration error: Missing SERVICE_ROLE_KEY' });
    }

    console.log('✅ Environment variables present');

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('✅ Supabase client created');

    // Transform insights to match frontend structure
    const transformedInsights = insights.map((insight, index) => ({
      id: `insight-${index + 1}`,
      title: insight.title,
      category: insight.category,
      severity: insight.severity,
      timeline: "30 days", // Default timeline
      cost_status: "pending_quotes",
      description: insight.note,
      regulations: [], // Empty for now
      cost_estimate: "calculating..."
    }));

    // Transform recommendations to match frontend structure
    const transformedRecommendations = recommendations.map((rec, index) => ({
      id: `rec-${index + 1}`,
      action: rec.action,
      reason: `Priority ${rec.priority} recommendation based on compliance analysis`,
      deadline: rec.deadline,
      priority: rec.priority,
      cost_status: "pending_quotes",
      contractor_categories: [], // Empty for now
      cost: "calculating..."
    }));

    // Build analysis_data object
    const analysisData = {
      city: city || "NYC",
      status: status || "completed",
      address: address,
      user_id: null, // Will be filled from existing record
      insights: transformedInsights,
      model_used: "gpt-4-turbo",
      next_steps: next_steps || [],
      analysis_id: analysis_id,
      analyzed_at: analyzed_at,
      property_id: property_id,
      data_sources: ["NYC Open Data - HPD", "NYC Open Data - DOB", "Elevator Device Registry", "Boiler Inspection Database"],
      recommendations: transformedRecommendations,
      compliance_status: {
        status: compliance_status?.status || "AT_RISK",
        dob_violations: compliance_status?.dob_violations || 0,
        hpd_violations: compliance_status?.hpd_violations || 0,
        total_violations: (compliance_status?.dob_violations || 0) + (compliance_status?.hpd_violations || 0),
        critical_deadlines: transformedRecommendations.filter(r => r.priority <= 2).length,
        rent_impairing_violations: 0
      },
      equipment_summary: equipment_summary || {},
      financial_summary: {
        notes: "Cost estimates will be calculated based on vendor quotes from marketplace",
        breakdown: {
          dob_violations: `calculating... (${compliance_status?.dob_violations || 0} violations)`,
          hpd_violations: `calculating... (${compliance_status?.hpd_violations || 0} violations)`,
          energy_reporting: "calculating...",
          elevator_compliance: "calculating...",
          door_lock_replacement: "calculating..."
        },
        cost_status: "pending_quotes",
        potential_penalties: "$15,000 - $35,000 if violations remain unresolved",
        total_risk_exposure: "calculating...",
        immediate_action_cost: "calculating..."
      },
      overall_assessment: {
        trend: "declining",
        summary: overall_assessment?.summary || "Property analysis completed",
        risk_level: overall_assessment?.risk_level || "medium",
        compliance_score: overall_assessment?.compliance_score || 50
      },
      processing_time_ms: 4200,
      cost_calculation_status: "pending",
      vendor_search_triggered: true
    };

    console.log('📝 Updating analysis record:', analysis_id);

    // Update the analysis record
    const { data: updatedAnalysis, error: updateError } = await supabase
      .from('ai_property_analyses')
      .update({
        status: 'completed',
        analysis_data: analysisData,
        model_used: 'gpt-4-turbo',
        processing_time_ms: 4200,
        risk_level: overall_assessment?.risk_level || 'medium',
        insight_count: transformedInsights.length,
        recommendation_count: transformedRecommendations.length,
        estimated_total_cost: 'calculating...'
      })
      .eq('id', analysis_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating analysis record:', updateError);
      return res.status(500).json({
        error: 'Failed to update analysis record',
        details: updateError.message
      });
    }

    console.log('✅ Analysis record updated successfully');

    return res.status(200).json({
      success: true,
      analysis_id: analysis_id,
      status: 'completed',
      message: 'Analysis completed and updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
