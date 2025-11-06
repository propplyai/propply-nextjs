import { createServerSupabaseClient } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the session from the request
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    // Create server Supabase client with the auth token
    const supabase = createServerSupabaseClient({ req, res });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { report_id, section_type } = req.body;

    if (!report_id || !section_type) {
      return res.status(400).json({ error: 'Missing report_id or section_type' });
    }

    // Validate section type
    const validSections = ['elevators', 'boilers', 'electrical', 'hpd', 'dob'];
    if (!validSections.includes(section_type)) {
      return res.status(400).json({ error: 'Invalid section_type' });
    }

    // Insert dismissed section (will fail if already dismissed due to UNIQUE constraint)
    const { data, error } = await supabase
      .from('dismissed_compliance_sections')
      .insert({
        user_id: user.id,
        report_id,
        section_type
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      // If it's a duplicate key error, that's okay - it's already dismissed
      if (error.code === '23505') {
        return res.status(200).json({ success: true, message: 'Already dismissed' });
      }
      throw error;
    }

    // If dismissing HPD or DOB section, also dismiss all individual violations
    if (section_type === 'hpd' || section_type === 'dob') {
      // Get the report to access violation data
      const { data: reportData, error: reportError } = await supabase
        .from('compliance_reports')
        .select('report_data')
        .eq('id', report_id)
        .single();

      if (!reportError && reportData?.report_data?.data) {
        const violationType = section_type === 'hpd' ? 'HPD' : 'DOB';
        const violationsKey = section_type === 'hpd' ? 'hpd_violations' : 'dob_violations';
        const violations = reportData.report_data.data[violationsKey] || [];

        // Dismiss all violations in this section
        const violationsToInsert = violations.map(v => ({
          report_id,
          violation_type: violationType,
          violation_id: section_type === 'hpd' ? v.violationid : v.isn_dob_bis_viol,
          violation_data: v,
          dismissed_by: user.email || user.id,
          dismiss_reason: `Dismissed via section: ${section_type}`
        }));

        if (violationsToInsert.length > 0) {
          // Use upsert to avoid duplicate key errors
          const { error: bulkError } = await supabase
            .from('dismissed_violations')
            .upsert(violationsToInsert, { 
              onConflict: 'report_id,violation_type,violation_id',
              ignoreDuplicates: true 
            });

          if (bulkError) {
            console.error('Error bulk dismissing violations:', bulkError);
          }
        }
      }
    }

    // Fetch updated scores after recalculation (trigger runs automatically)
    const { data: updatedReport, error: scoreError } = await supabase
      .from('compliance_reports')
      .select('hpd_violations_active, hpd_violations_dismissed, hpd_compliance_score, dob_violations_active, dob_violations_dismissed, dob_compliance_score, compliance_score')
      .eq('id', report_id)
      .single();

    if (scoreError) {
      console.error('Error fetching updated scores:', scoreError);
    }

    return res.status(200).json({ 
      success: true, 
      data,
      updated_scores: updatedReport || null
    });
  } catch (error) {
    console.error('Error dismissing section:', error);
    return res.status(500).json({ error: error.message });
  }
}

