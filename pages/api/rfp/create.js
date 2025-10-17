/**
 * API Route: /api/rfp/create
 * 
 * Create a new RFP project
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

    const {
      property_id,
      compliance_report_id,
      project_title,
      project_description,
      project_type,
      scope_of_work,
      technical_requirements,
      materials_specifications,
      quality_standards,
      project_timeline_days,
      deadline_date,
      budget_range_min,
      budget_range_max,
      urgency_level,
      compliance_issues,
      regulatory_requirements,
      permit_requirements,
      inspection_requirements,
      generate_from_compliance = false
    } = req.body;

    // Validate required fields
    if (!property_id || !project_title || !project_description) {
      return res.status(400).json({
        error: 'Missing required fields: property_id, project_title, project_description'
      });
    }

    // Verify property ownership
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id, user_id')
      .eq('id', property_id)
      .eq('user_id', user.id)
      .single();

    if (propError || !property) {
      return res.status(403).json({ error: 'Property not found or access denied' });
    }

    let rfpData;

    if (generate_from_compliance) {
      // Generate RFP from compliance issues
      const rfpGenerator = new RFPGenerator(supabase);
      rfpData = await rfpGenerator.generateRFPFromCompliance(
        property_id,
        compliance_issues || [],
        project_type
      );
    } else {
      // Create manual RFP
      const { data: rfp, error: rfpError } = await supabase
        .from('rfp_projects')
        .insert({
          user_id: user.id,
          property_id,
          compliance_report_id,
          project_title,
          project_description,
          project_type,
          scope_of_work,
          technical_requirements,
          materials_specifications,
          quality_standards,
          project_timeline_days,
          deadline_date,
          budget_range_min,
          budget_range_max,
          urgency_level: urgency_level || 'normal',
          compliance_issues,
          regulatory_requirements,
          permit_requirements,
          inspection_requirements,
          status: 'draft'
        })
        .select()
        .single();

      if (rfpError) throw rfpError;
      rfpData = rfp;
    }

    console.log(`[API /rfp/create] RFP created: ${rfpData.id}`);

    return res.status(201).json({
      success: true,
      message: 'RFP project created successfully',
      rfp: rfpData
    });

  } catch (error) {
    console.error('[API /rfp/create] Error:', error);
    return res.status(500).json({
      error: 'Failed to create RFP project',
      message: error.message
    });
  }
}
