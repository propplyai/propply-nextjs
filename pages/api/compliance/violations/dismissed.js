import { createServerSupabaseClient } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    const { report_id, violation_type } = req.query;

    if (!report_id) {
      return res.status(400).json({ error: 'Missing report_id parameter' });
    }

    let query = supabase
      .from('dismissed_violations')
      .select('*')
      .eq('report_id', report_id);

    // Optionally filter by violation type
    if (violation_type) {
      query = query.eq('violation_type', violation_type);
    }

    const { data, error } = await query.order('dismissed_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.status(200).json({ 
      success: true, 
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching dismissed violations:', error);
    return res.status(500).json({ error: error.message });
  }
}
