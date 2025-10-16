import { createServerSupabaseClient } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    const { report_id } = req.query;

    let query = supabase
      .from('dismissed_compliance_sections')
      .select('*')
      .eq('user_id', user.id);

    // If report_id is provided, filter by it
    if (report_id) {
      query = query.eq('report_id', report_id);
    }

    const { data, error } = await query.order('dismissed_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching dismissed sections:', error);
    return res.status(500).json({ error: error.message });
  }
}

