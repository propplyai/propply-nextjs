/**
 * API Route: /api/marketplace/search
 *
 * Search for contractors based on property address and violation categories
 */

import vendorMatcher from '@/lib/services/vendorMatcher';
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

    const {
      address,
      property_id,
      report_id,
      categories,
      radius = 5000
    } = req.query;

    let searchAddress = address;
    let violationData = null;

    // If property_id is provided, fetch property address and violation data
    if (property_id) {
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('address, active_violations')
        .eq('id', property_id)
        .eq('user_id', user.id)
        .single();

      if (propertyError || !property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      searchAddress = property.address;

      // Fetch latest compliance report for this property
      const { data: report, error: reportError } = await supabase
        .from('compliance_reports')
        .select('*')
        .eq('property_id', property_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (report && !reportError) {
        violationData = {
          hpd_violations_active: report.hpd_violations_active || 0,
          dob_violations_active: report.dob_violations_active || 0,
          elevator_devices: report.elevator_devices || 0,
          boiler_devices: report.boiler_devices || 0,
          electrical_permits: report.electrical_permits || 0
        };
      }
    }

    // If report_id is provided, fetch specific report data
    if (report_id) {
      const { data: report, error: reportError } = await supabase
        .from('compliance_reports')
        .select('*, properties!inner(address)')
        .eq('id', report_id)
        .eq('properties.user_id', user.id)
        .single();

      if (reportError || !report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      searchAddress = report.properties.address;
      violationData = {
        hpd_violations_active: report.hpd_violations_active || 0,
        dob_violations_active: report.dob_violations_active || 0,
        elevator_devices: report.elevator_devices || 0,
        boiler_devices: report.boiler_devices || 0,
        electrical_permits: report.electrical_permits || 0
      };
    }

    // Validate we have an address to search
    if (!searchAddress) {
      return res.status(400).json({
        error: 'Address is required. Provide either address, property_id, or report_id.'
      });
    }

    // If specific categories are provided, use those
    let searchCategories = categories ? categories.split(',') : null;

    // If we have violation data and no specific categories, auto-detect needed categories
    if (!searchCategories && violationData) {
      searchCategories = vendorMatcher.identifyNeededCategories(violationData);
    }

    // If still no categories, search all categories
    if (!searchCategories || searchCategories.length === 0) {
      searchCategories = ['hpd', 'dob', 'elevator', 'boiler', 'electrical', 'fire_safety'];
    }

    console.log(`[API /marketplace/search] Searching for ${searchCategories.join(', ')} near ${searchAddress}`);

    // Check cache first
    const cacheKey = searchCategories.sort().join(',');
    const { data: cachedResult } = await supabase
      .from('vendor_search_cache')
      .select('*')
      .eq('search_address', searchAddress.toLowerCase().trim())
      .eq('search_categories', searchCategories.sort())
      .gt('expires_at', new Date().toISOString())
      .single();

    let result;
    let fromCache = false;

    if (cachedResult) {
      console.log(`[API /marketplace/search] Cache HIT for ${searchAddress}`);
      result = { vendors: cachedResult.vendors_data };
      fromCache = true;

      // Update access tracking
      await supabase
        .from('vendor_search_cache')
        .update({
          last_accessed_at: new Date().toISOString(),
          access_count: (cachedResult.access_count || 0) + 1
        })
        .eq('id', cachedResult.id);
    } else {
      console.log(`[API /marketplace/search] Cache MISS - calling Google Places API`);

      // Search for vendors via Google Places API
      result = violationData
        ? await vendorMatcher.getVendorsForProperty(searchAddress, violationData, parseInt(radius))
        : await vendorMatcher.vendorService.findContractorsForViolations(
            searchAddress,
            searchCategories,
            parseInt(radius)
          );

      // Save to cache
      const allVendorsForCache = Object.values(result.vendors || result).flat();
      await supabase
        .from('vendor_search_cache')
        .insert({
          search_address: searchAddress.toLowerCase().trim(),
          search_categories: searchCategories.sort(),
          search_radius: parseInt(radius),
          vendors_data: result.vendors || result,
          total_vendors: allVendorsForCache.length
        });

      console.log(`[API /marketplace/search] Cached ${allVendorsForCache.length} vendors for future use`);
    }

    // Check which vendors are bookmarked by this user
    const allVendors = Object.values(result.vendors || result).flat();
    const placeIds = allVendors.map(v => v.place_id);

    const { data: bookmarks } = await supabase
      .from('marketplace_bookmarks')
      .select('vendor_place_id')
      .eq('user_id', user.id)
      .in('vendor_place_id', placeIds);

    const bookmarkedPlaceIds = new Set((bookmarks || []).map(b => b.vendor_place_id));

    // Add bookmark status to vendors
    const enhancedResult = result.vendors || result;
    for (const [category, vendors] of Object.entries(enhancedResult)) {
      enhancedResult[category] = vendors.map(vendor => ({
        ...vendor,
        is_bookmarked: bookmarkedPlaceIds.has(vendor.place_id)
      }));
    }

    return res.status(200).json({
      success: true,
      address: searchAddress,
      categories: searchCategories,
      radius_meters: parseInt(radius),
      vendors: enhancedResult,
      total_vendors: allVendors.length,
      violation_data: violationData,
      from_cache: fromCache
    });

  } catch (error) {
    console.error('[API /marketplace/search] Error:', error);
    return res.status(500).json({
      error: 'Failed to search for vendors',
      message: error.message
    });
  }
}
