/**
 * API Route: /api/rfp/invite-vendors
 * 
 * Send RFP invitations to selected vendors
 */

import { createServerSupabaseClient } from '@/lib/supabase';

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

    const { rfp_project_id, vendors } = req.body;

    if (!rfp_project_id || !vendors || !Array.isArray(vendors)) {
      return res.status(400).json({ 
        error: 'rfp_project_id and vendors array are required' 
      });
    }

    // Verify RFP ownership
    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_projects')
      .select('id, user_id, project_title, status')
      .eq('id', rfp_project_id)
      .eq('user_id', user.id)
      .single();

    if (rfpError || !rfp) {
      return res.status(403).json({ error: 'RFP not found or access denied' });
    }

    if (rfp.status !== 'published') {
      return res.status(400).json({ 
        error: 'RFP must be published before inviting vendors' 
      });
    }

    // Get RFP documents
    const { data: documents, error: docError } = await supabase
      .from('rfp_documents')
      .select('*')
      .eq('rfp_project_id', rfp_project_id)
      .eq('document_type', 'vendor_invitation')
      .single();

    if (docError || !documents) {
      return res.status(400).json({ 
        error: 'RFP documents not found. Generate documents first.' 
      });
    }

    const invitationTemplate = JSON.parse(documents.document_content);
    const invitations = [];

    // Create vendor invitations
    for (const vendor of vendors) {
      const { data: invitation, error: invError } = await supabase
        .from('rfp_vendor_invitations')
        .insert({
          rfp_project_id,
          vendor_place_id: vendor.place_id,
          vendor_name: vendor.name,
          vendor_email: vendor.email,
          vendor_phone: vendor.phone,
          invitation_status: 'pending'
        })
        .select()
        .single();

      if (invError) {
        console.error(`Error creating invitation for ${vendor.name}:`, invError);
        continue;
      }

      invitations.push(invitation);

      // TODO: Send actual email invitation
      // For now, we'll just mark as sent
      await supabase
        .from('rfp_vendor_invitations')
        .update({
          invitation_status: 'sent',
          invitation_sent_at: new Date().toISOString()
        })
        .eq('id', invitation.id);
    }

    // Update RFP status to vendor_responses
    const { error: updateError } = await supabase
      .from('rfp_projects')
      .update({ status: 'vendor_responses' })
      .eq('id', rfp_project_id);

    if (updateError) throw updateError;

    console.log(`[API /rfp/invite-vendors] ${invitations.length} vendors invited to RFP: ${rfp_project_id}`);

    return res.status(200).json({
      success: true,
      message: `${invitations.length} vendors invited successfully`,
      invitations
    });

  } catch (error) {
    console.error('[API /rfp/invite-vendors] Error:', error);
    return res.status(500).json({
      error: 'Failed to invite vendors',
      message: error.message
    });
  }
}
