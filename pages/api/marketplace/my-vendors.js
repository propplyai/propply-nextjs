/**
 * API Route: /api/marketplace/my-vendors
 *
 * Get user's saved vendors (bookmarks and quote requests)
 */

import { createServerSupabaseClient } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Fetch bookmarks
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('marketplace_bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (bookmarksError) {
      console.error('Error fetching bookmarks:', bookmarksError);
    }

    // Fetch quote requests with property info
    const { data: requests, error: requestsError } = await supabase
      .from('marketplace_requests')
      .select('*, properties(id, address)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
    }

    return res.status(200).json({
      success: true,
      bookmarks: bookmarks || [],
      requests: requests || []
    });

  } catch (error) {
    console.error('[API /marketplace/my-vendors] Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch saved vendors',
      message: error.message
    });
  }
}
