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

    // Delete the dismissed section record
    const { error } = await supabase
      .from('dismissed_compliance_sections')
      .delete()
      .eq('user_id', user.id)
      .eq('report_id', report_id)
      .eq('section_type', section_type);

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error restoring section:', error);
    return res.status(500).json({ error: error.message });
  }
}

