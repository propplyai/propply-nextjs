/**
 * API Route: /api/marketplace/check-cache
 *
 * Check cache statistics and entries
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

    // Get all cache entries
    const { data: cacheEntries, error: cacheError } = await supabase
      .from('vendor_search_cache')
      .select('*')
      .order('created_at', { ascending: false });

    if (cacheError) {
      console.error('Error fetching cache:', cacheError);
      return res.status(500).json({ error: 'Failed to fetch cache data' });
    }

    // Calculate statistics
    const now = new Date();
    const stats = {
      total_entries: cacheEntries?.length || 0,
      active_entries: cacheEntries?.filter(e => new Date(e.expires_at) > now).length || 0,
      expired_entries: cacheEntries?.filter(e => new Date(e.expires_at) <= now).length || 0,
      total_vendors_cached: cacheEntries?.reduce((sum, e) => sum + (e.total_vendors || 0), 0) || 0,
      total_accesses: cacheEntries?.reduce((sum, e) => sum + (e.access_count || 0), 0) || 0,
      most_accessed: cacheEntries?.sort((a, b) => (b.access_count || 0) - (a.access_count || 0))[0] || null
    };

    // Format entries for display
    const formattedEntries = cacheEntries?.map(entry => ({
      id: entry.id,
      address: entry.search_address,
      categories: entry.search_categories,
      total_vendors: entry.total_vendors,
      access_count: entry.access_count,
      created_at: entry.created_at,
      expires_at: entry.expires_at,
      last_accessed_at: entry.last_accessed_at,
      is_expired: new Date(entry.expires_at) <= now,
      days_until_expiry: Math.ceil((new Date(entry.expires_at) - now) / (1000 * 60 * 60 * 24))
    })) || [];

    return res.status(200).json({
      success: true,
      stats,
      entries: formattedEntries
    });

  } catch (error) {
    console.error('[API /marketplace/check-cache] Error:', error);
    return res.status(500).json({
      error: 'Failed to check cache',
      message: error.message
    });
  }
}
