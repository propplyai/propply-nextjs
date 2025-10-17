import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  console.log('🔵 AI Analysis Trigger - START');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { property_id } = req.body;

  if (!property_id) {
    console.log('❌ Missing property_id');
    return res.status(400).json({ error: 'property_id is required' });
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

    // Verify property exists and get details
    console.log('🔍 Fetching property:', property_id);
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, user_id, address, city, bin_number, opa_account')
      .eq('id', property_id)
      .single();

    if (propertyError) {
      console.error('❌ Property fetch error:', propertyError);
      return res.status(404).json({ error: `Property not found: ${propertyError.message}` });
    }

    if (!property) {
      console.error('❌ Property not found');
      return res.status(404).json({ error: 'Property not found' });
    }

    console.log('✅ Property found:', property.address);

    // Check if property data has been fetched (compliance report exists)
    console.log('🔍 Checking for existing compliance report...');
    const { data: complianceReport, error: reportError } = await supabase
      .from('compliance_reports')
      .select('id, generated_at')
      .eq('property_id', property_id)
      .order('generated_at', { ascending: false })
      .limit(1);

    if (reportError) {
      console.error('❌ Error checking compliance report:', reportError);
      return res.status(500).json({
        error: 'Failed to verify property data',
        details: reportError.message
      });
    }

    if (!complianceReport || complianceReport.length === 0) {
      console.log('❌ No compliance report found - data not fetched yet');
      return res.status(400).json({
        error: 'Property data not fetched yet. Please fetch the property data first before running AI analysis.',
        code: 'DATA_NOT_FETCHED'
      });
    }

    console.log('✅ Compliance report found:', complianceReport[0].id);

    // Check if there's already a processing analysis
    console.log('🔍 Checking for existing processing analysis...');
    const { data: existingAnalysis } = await supabase
      .from('ai_property_analyses')
      .select('id, status, created_at')
      .eq('property_id', property_id)
      .eq('status', 'processing')
      .single();

    if (existingAnalysis) {
      // Check if the existing analysis is stuck (older than 5 minutes)
      const createdAt = new Date(existingAnalysis.created_at);
      const now = new Date();
      const ageInMinutes = (now - createdAt) / (1000 * 60);

      if (ageInMinutes > 5) {
        console.log('⚠️  Found stuck analysis (age: ' + Math.round(ageInMinutes) + ' minutes), marking as failed...');

        // Mark the stuck analysis as failed
        await supabase
          .from('ai_property_analyses')
          .update({
            status: 'failed',
            error_message: 'Analysis timed out - please try again'
          })
          .eq('id', existingAnalysis.id);

        console.log('✅ Marked stuck analysis as failed, proceeding with new analysis');
      } else {
        console.log('⚠️  Analysis already in progress:', existingAnalysis.id);
        return res.status(409).json({
          error: 'Analysis already in progress',
          analysis_id: existingAnalysis.id,
          status: 'processing'
        });
      }
    }

    console.log('✅ No existing processing analysis');

    // Create placeholder analysis record with "processing" status
    console.log('📝 Creating analysis record...');
    const { data: analysis, error: insertError } = await supabase
      .from('ai_property_analyses')
      .insert({
        user_id: property.user_id,
        property_id: property_id,
        status: 'processing',
        analysis_data: {
          message: 'Analysis in progress...'
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating analysis record:', insertError);
      return res.status(500).json({
        error: 'Failed to create analysis record',
        details: insertError.message
      });
    }

    console.log('✅ Analysis record created:', analysis.id);

    console.log('Created analysis record:', analysis.id);

    // Prepare webhook payload
    const webhookPayload = {
      analysis_id: analysis.id,
      property_id: property.id,
      user_id: property.user_id,
      address: property.address,
      city: property.city,
      bin_number: property.bin_number,
      opa_account: property.opa_account,
      timestamp: new Date().toISOString()
    };

    console.log('Sending webhook to:', process.env.N8N_WEBHOOK_URL);
    console.log('Webhook payload:', webhookPayload);

    // Trigger n8n webhook (fire-and-forget)
    if (process.env.N8N_WEBHOOK_URL) {
      fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookPayload)
      })
        .then(response => {
          console.log('Webhook response status:', response.status);
          return response.text();
        })
        .then(data => {
          console.log('Webhook response:', data);
        })
        .catch(err => {
          console.error('Webhook error:', err);
          // Update analysis status to failed
          supabase
            .from('ai_property_analyses')
            .update({ 
              status: 'failed',
              error_message: `Webhook error: ${err.message}`
            })
            .eq('id', analysis.id)
            .then(() => console.log('Updated analysis to failed'));
        });
    } else {
      console.warn('N8N_WEBHOOK_URL not configured');
      return res.status(500).json({ 
        error: 'Webhook URL not configured',
        analysis_id: analysis.id 
      });
    }

    // Return immediately (don't wait for webhook)
    return res.status(200).json({
      success: true,
      analysis_id: analysis.id,
      status: 'processing',
      message: 'Analysis started. Check back in a few moments.'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}




