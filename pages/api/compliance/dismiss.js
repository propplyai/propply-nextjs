import { supabase } from '@/lib/supabase';

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

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
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
      // If it's a duplicate key error, that's okay - it's already dismissed
      if (error.code === '23505') {
        return res.status(200).json({ success: true, message: 'Already dismissed' });
      }
      throw error;
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error dismissing section:', error);
    return res.status(500).json({ error: error.message });
  }
}

