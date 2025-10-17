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
      // Clean up numeric fields - convert empty strings to null
      const cleanedData = {
        user_id: user.id,
        property_id,
        compliance_report_id: compliance_report_id || null,
        project_title,
        project_description,
        project_type,
        scope_of_work: scope_of_work || null,
        technical_requirements: technical_requirements || null,
        materials_specifications: materials_specifications || null,
        quality_standards: quality_standards || null,
        project_timeline_days: project_timeline_days ? parseInt(project_timeline_days) : null,
        deadline_date: deadline_date || null,
        budget_range_min: budget_range_min ? parseFloat(budget_range_min) : null,
        budget_range_max: budget_range_max ? parseFloat(budget_range_max) : null,
        urgency_level: urgency_level || 'normal',
        compliance_issues: compliance_issues || null,
        regulatory_requirements: regulatory_requirements || null,
        permit_requirements: permit_requirements || null,
        inspection_requirements: inspection_requirements || null,
        status: 'draft'
      };

      const { data: rfp, error: rfpError } = await supabase
        .from('rfp_projects')
        .insert(cleanedData)
        .select()
        .single();

      if (rfpError) {
        console.error('[API /rfp/create] Database error:', rfpError);
        throw rfpError;
      }
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

    // Provide more detailed error information
    let errorMessage = error.message;
    let errorDetails = null;

    // Check if it's a Supabase error with details
    if (error.details) {
      errorDetails = error.details;
    }

    if (error.hint) {
      errorMessage += ` (Hint: ${error.hint})`;
    }

    return res.status(500).json({
      error: 'Failed to create RFP project',
      message: errorMessage,
      details: errorDetails,
      code: error.code
    });
  }
}
