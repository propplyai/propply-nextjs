/**
 * API Route: /api/marketplace/restore-search
 *
 * Restore saved search results for a property
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

    const { property_id } = req.query;

    if (!property_id) {
      return res.status(400).json({ error: 'property_id is required' });
    }

    // Fetch saved search results for this property
    const { data: searchResult, error: searchError } = await supabase
      .from('property_vendor_searches')
      .select('*')
      .eq('property_id', property_id)
      .eq('user_id', user.id)
      .single();

    if (searchError || !searchResult) {
      return res.status(404).json({ error: 'No saved search found for this property' });
    }

    // Check which vendors are bookmarked by this user
    const allVendors = Object.values(searchResult.vendors_data || {}).flat();
    const placeIds = allVendors.map(v => v.place_id);

    const { data: bookmarks } = await supabase
      .from('marketplace_bookmarks')
      .select('vendor_place_id')
      .eq('user_id', user.id)
      .in('vendor_place_id', placeIds);

    const bookmarkedPlaceIds = new Set((bookmarks || []).map(b => b.vendor_place_id));

    // Add bookmark status to vendors
    const enhancedVendors = searchResult.vendors_data || {};
    for (const [category, vendors] of Object.entries(enhancedVendors)) {
      enhancedVendors[category] = vendors.map(vendor => ({
        ...vendor,
        is_bookmarked: bookmarkedPlaceIds.has(vendor.place_id)
      }));
    }

    return res.status(200).json({
      success: true,
      address: searchResult.search_address,
      categories: searchResult.search_categories,
      radius_meters: searchResult.search_radius,
      vendors: enhancedVendors,
      total_vendors: searchResult.total_vendors,
      saved_at: searchResult.created_at,
      updated_at: searchResult.updated_at
    });

  } catch (error) {
    console.error('[API /marketplace/restore-search] Error:', error);
    return res.status(500).json({
      error: 'Failed to restore search results',
      message: error.message
    });
  }
}
