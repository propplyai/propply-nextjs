/**
 * API Route: /api/rfp/generate-documents
 * 
 * Generate RFP documents (main RFP, vendor invitations, evaluation sheets)
 */

import { createServerSupabaseClient } from '@/lib/supabase';
import RFPGenerator from '@/lib/services/rfpGenerator';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient({ req, res });

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rfp_project_id } = req.body;

    if (!rfp_project_id) {
      return res.status(400).json({ error: 'rfp_project_id is required' });
    }

    // Verify RFP ownership
    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_projects')
      .select('id, user_id, status')
      .eq('id', rfp_project_id)
      .eq('user_id', user.id)
      .single();

    if (rfpError || !rfp) {
      return res.status(403).json({ error: 'RFP not found or access denied' });
    }

    // Generate RFP documents
    const rfpGenerator = new RFPGenerator(supabase);
    const result = await rfpGenerator.generateRFP(rfp_project_id);

    // Update RFP status to published
    const { error: updateError } = await supabase
      .from('rfp_projects')
      .update({ 
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', rfp_project_id);

    if (updateError) throw updateError;

    console.log(`[API /rfp/generate-documents] Documents generated for RFP: ${rfp_project_id}`);

    return res.status(200).json({
      success: true,
      message: 'RFP documents generated successfully',
      documents: result.documents
    });

  } catch (error) {
    console.error('[API /rfp/generate-documents] Error:', error);
    return res.status(500).json({
      error: 'Failed to generate RFP documents',
      message: error.message
    });
  }
}
