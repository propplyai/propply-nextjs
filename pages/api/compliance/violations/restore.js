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

    const { report_id, violation_type, violation_id } = req.body;

    if (!report_id || !violation_type || !violation_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: report_id, violation_type, violation_id' 
      });
    }

    // Delete the dismissed violation record
    const { error: deleteError } = await supabase
      .from('dismissed_violations')
      .delete()
      .eq('report_id', report_id)
      .eq('violation_type', violation_type)
      .eq('violation_id', violation_id);

    if (deleteError) {
      throw deleteError;
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
      updated_scores: updatedReport || null
    });
  } catch (error) {
    console.error('Error restoring violation:', error);
    return res.status(500).json({ error: error.message });
  }
}
