import { createServerSupabaseClient } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const supabase = createServerSupabaseClient({ req, res });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { report_id, violation_type, violation_id, violation_data, dismiss_reason } = req.body;

    if (!report_id || !violation_type || !violation_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: report_id, violation_type, violation_id' 
      });
    }

    // Validate violation type
    if (!['HPD', 'DOB'].includes(violation_type)) {
      return res.status(400).json({ error: 'Invalid violation_type. Must be HPD or DOB' });
    }

    // Insert dismissed violation
    const { data: dismissedViolation, error: insertError } = await supabase
      .from('dismissed_violations')
      .insert({
        report_id,
        violation_type,
        violation_id,
        violation_data: violation_data || {},
        dismissed_by: user.email || user.id,
        dismiss_reason: dismiss_reason || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      // If it's a duplicate key error, that's okay - it's already dismissed
      if (insertError.code === '23505') {
        return res.status(200).json({ 
          success: true, 
          message: 'Violation already dismissed',
          already_dismissed: true
        });
      }
      throw insertError;
    }

    // The trigger will automatically recalculate scores
    // Fetch the updated scores
    const { data: updatedReport, error: reportError } = await supabase
      .from('compliance_reports')
      .select('hpd_violations_active, hpd_violations_dismissed, hpd_compliance_score, dob_violations_active, dob_violations_dismissed, dob_compliance_score, compliance_score')
      .eq('id', report_id)
      .single();

    if (reportError) {
      console.error('Error fetching updated report:', reportError);
    }

    return res.status(200).json({ 
      success: true, 
      data: dismissedViolation,
      updated_scores: updatedReport || null
    });
  } catch (error) {
    console.error('Error dismissing violation:', error);
    return res.status(500).json({ error: error.message });
  }
}
