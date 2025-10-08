/**
 * API Route: /api/marketplace/details
 *
 * Get detailed information about a specific vendor from Google Places
 */

import vendorMatcher from '@/lib/services/vendorMatcher';
import { authHelpers, supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const { user, error: authError } = await authHelpers.getUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { place_id } = req.query;

    if (!place_id) {
      return res.status(400).json({ error: 'place_id is required' });
    }

    console.log(`[API /marketplace/details] Fetching details for place_id: ${place_id}`);

    // Get detailed vendor information from Google Places
    const vendorDetails = await vendorMatcher.getVendorDetailsWithReviews(place_id);

    // Check if this vendor is bookmarked by the user
    const { data: bookmark } = await supabase
      .from('marketplace_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('vendor_place_id', place_id)
      .single();

    // Check if user has requested quotes from this vendor
    const { data: requests } = await supabase
      .from('marketplace_requests')
      .select('id, status, created_at, notes, property_id, properties(address)')
      .eq('user_id', user.id)
      .eq('vendor_place_id', place_id)
      .order('created_at', { ascending: false });

    return res.status(200).json({
      success: true,
      vendor: {
        ...vendorDetails,
        is_bookmarked: !!bookmark,
        user_requests: requests || []
      }
    });

  } catch (error) {
    console.error('[API /marketplace/details] Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch vendor details',
      message: error.message
    });
  }
}
