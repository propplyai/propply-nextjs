import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { property_id } = req.body;

  if (!property_id) {
    return res.status(400).json({ error: 'property_id is required' });
  }

  try {
    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify property exists and get details
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, user_id, address, city, bin_number, opa_account')
      .eq('id', property_id)
      .single();

    if (propertyError || !property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if there's already a processing analysis
    const { data: existingAnalysis } = await supabase
      .from('ai_property_analyses')
      .select('id, status')
      .eq('property_id', property_id)
      .eq('status', 'processing')
      .single();

    if (existingAnalysis) {
      return res.status(409).json({ 
        error: 'Analysis already in progress',
        analysis_id: existingAnalysis.id,
        status: 'processing'
      });
    }

    // Create placeholder analysis record with "processing" status
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
      console.error('Error creating analysis record:', insertError);
      return res.status(500).json({ error: 'Failed to create analysis record' });
    }

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

