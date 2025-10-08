/**
 * Vendor Matcher Service
 *
 * This service translates the Python POC (vendor.py) into JavaScript
 * for matching property violations to appropriate contractor categories.
 */

import vendorService from './vendorService';

export class VendorMatcher {
  constructor() {
    this.vendorService = vendorService;
  }

  /**
   * Mapping of violation data fields to contractor categories
   * Matches Python VIOLATION_CATEGORY_MAP from vendor.py:30-36
   */
  VIOLATION_TO_CATEGORY = {
    hpd_violations: ['hpd'],
    dob_violations: ['dob'],
    elevator_devices: ['elevator'],
    boiler_devices: ['boiler'],
    electrical_permits: ['electrical']
  };

  /**
   * Get vendors for a property based on address and violation data
   * Translates: vendor.py get_vendors_for_property() [lines 38-90]
   *
   * @param {string} address - Property address
   * @param {Object} violationData - Compliance report data
   * @param {number} radius - Search radius in meters
   * @returns {Promise<Object>} Vendors grouped by category
   */
  async getVendorsForProperty(address, violationData, radius = 5000) {
    try {
      console.log('[VendorMatcher] Getting vendors for property:', address);

      // Step 1: Identify needed contractor categories
      const categories = this.identifyNeededCategories(violationData);
      console.log('[VendorMatcher] Needed categories:', categories);

      if (categories.length === 0) {
        return {
          categories: [],
          vendors: {},
          message: 'No violations found - no contractors needed'
        };
      }

      // Step 2: Search for contractors in each category
      const vendorsByCategory = await this.vendorService.findContractorsForViolations(
        address,
        categories,
        radius
      );

      // Step 3: Enhance top results with detailed data (limit to 5 per category to save API costs)
      const enhancedVendors = {};
      for (const [category, vendors] of Object.entries(vendorsByCategory)) {
        enhancedVendors[category] = await this._enhanceTopVendors(vendors, 5);
      }

      return {
        categories: categories,
        vendors: enhancedVendors,
        total_vendors: Object.values(enhancedVendors).reduce((sum, v) => sum + v.length, 0)
      };

    } catch (error) {
      console.error('[VendorMatcher] Error getting vendors:', error);
      throw error;
    }
  }

  /**
   * Get detailed vendor information with reviews
   * Translates: vendor.py get_vendor_details_with_reviews() [lines 92-117]
   *
   * @param {string} placeId - Google Places place_id
   * @returns {Promise<Object>} Enhanced vendor details
   */
  async getVendorDetailsWithReviews(placeId) {
    try {
      console.log('[VendorMatcher] Getting details for vendor:', placeId);

      const details = await this.vendorService.getContractorDetails(placeId);

      return {
        ...details,
        data_source: 'Google Places',
        enhanced: true
      };

    } catch (error) {
      console.error('[VendorMatcher] Error getting vendor details:', error);
      throw error;
    }
  }

  /**
   * Identify needed contractor categories based on violation data
   * Translates: vendor.py _identify_needed_categories() [lines 119-147]
   *
   * @param {Object} violationData - Report data with violation counts
   * @returns {Array<string>} List of needed contractor categories
   */
  identifyNeededCategories(violationData) {
    const categories = new Set();

    // Check HPD violations
    if (violationData.hpd_violations_active > 0) {
      categories.add('hpd');
    }

    // Check DOB violations
    if (violationData.dob_violations_active > 0) {
      categories.add('dob');
    }

    // Check elevator devices
    if (violationData.elevator_devices > 0) {
      categories.add('elevator');
    }

    // Check boiler devices
    if (violationData.boiler_devices > 0) {
      categories.add('boiler');
    }

    // Check electrical permits
    if (violationData.electrical_permits > 0) {
      categories.add('electrical');
    }

    // Always add fire safety if any violations exist
    // (Python logic: lines 144-145)
    if (categories.size > 0) {
      categories.add('fire_safety');
    }

    return Array.from(categories);
  }

  /**
   * Format vendor data for UI display
   * Translates: vendor.py format_vendor_for_ui() [lines 182-202]
   *
   * @param {Object} vendor - Raw vendor data from Google Places
   * @param {string} category - Contractor category
   * @returns {Object} Formatted vendor for frontend
   */
  formatVendorForUI(vendor, category) {
    return {
      place_id: vendor.place_id,
      name: vendor.name || 'Unknown',
      category: category,
      address: vendor.formatted_address || vendor.vicinity || 'N/A',
      phone: vendor.formatted_phone_number || 'Not available',
      website: vendor.website || null,
      rating: vendor.rating || 0,
      user_ratings_total: vendor.user_ratings_total || 0,
      distance_miles: vendor.distance_miles || null,
      business_status: vendor.business_status || 'OPERATIONAL',
      opening_hours: vendor.opening_hours || null,
      reviews: vendor.reviews || [],
      photos: vendor.photos || []
    };
  }

  /**
   * Get human-readable category name
   */
  getCategoryDisplayName(category) {
    const displayNames = {
      hpd: 'General Contractors & Property Maintenance',
      dob: 'Structural Engineers & Building Code Compliance',
      elevator: 'Elevator Repair & Maintenance',
      boiler: 'HVAC & Boiler Services',
      electrical: 'Electrical Contractors',
      fire_safety: 'Fire Safety & Protection'
    };

    return displayNames[category] || category.toUpperCase();
  }

  /**
   * Get category description for UI
   */
  getCategoryDescription(category) {
    const descriptions = {
      hpd: 'General contractors and handyman services for HPD violations',
      dob: 'Structural engineers and compliance specialists for DOB violations',
      elevator: 'Licensed elevator repair, inspection, and maintenance companies',
      boiler: 'HVAC contractors specializing in boiler repair and inspection',
      electrical: 'Licensed electricians for electrical system repairs and permits',
      fire_safety: 'Fire safety inspection and protection equipment installation'
    };

    return descriptions[category] || '';
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Enhance top vendors with detailed Google Places data
   * Translates: vendor.py _enhance_vendor_with_places_data() [lines 149-180]
   *
   * @param {Array} vendors - List of vendors
   * @param {number} limit - Number of vendors to enhance
   * @returns {Promise<Array>} Enhanced vendors
   */
  async _enhanceTopVendors(vendors, limit = 10) {
    const topVendors = vendors.slice(0, limit);
    const enhanced = [];

    for (const vendor of topVendors) {
      try {
        // Only enhance if we don't already have detailed data
        if (!vendor.formatted_phone_number && vendor.place_id) {
          const details = await this.vendorService.getContractorDetails(vendor.place_id);
          enhanced.push({
            ...vendor,
            ...details,
            enhanced: true
          });
        } else {
          enhanced.push({
            ...vendor,
            enhanced: false
          });
        }
      } catch (error) {
        console.error(`[VendorMatcher] Failed to enhance vendor ${vendor.place_id}:`, error);
        // Include vendor without enhancement
        enhanced.push({
          ...vendor,
          enhanced: false
        });
      }
    }

    return enhanced;
  }

  /**
   * Check if a vendor matches search criteria
   */
  matchesSearchCriteria(vendor, criteria) {
    const {
      minRating = 0,
      maxDistance = Infinity,
      businessStatus = ['OPERATIONAL']
    } = criteria;

    return (
      (vendor.rating || 0) >= minRating &&
      (vendor.distance_miles || 0) <= maxDistance &&
      businessStatus.includes(vendor.business_status || 'OPERATIONAL')
    );
  }

  /**
   * Sort vendors by preference (rating, then distance)
   */
  sortVendorsByPreference(vendors) {
    return vendors.sort((a, b) => {
      // Primary sort: rating (descending)
      if (b.rating !== a.rating) {
        return (b.rating || 0) - (a.rating || 0);
      }
      // Secondary sort: distance (ascending)
      return (a.distance_miles || Infinity) - (b.distance_miles || Infinity);
    });
  }

  /**
   * Get statistics about vendors by category
   */
  getVendorStatistics(vendorsByCategory) {
    const stats = {};

    for (const [category, vendors] of Object.entries(vendorsByCategory)) {
      stats[category] = {
        total: vendors.length,
        avg_rating: vendors.length > 0
          ? vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.length
          : 0,
        avg_distance: vendors.length > 0
          ? vendors.reduce((sum, v) => sum + (v.distance_miles || 0), 0) / vendors.length
          : 0,
        with_reviews: vendors.filter(v => (v.user_ratings_total || 0) > 0).length,
        with_website: vendors.filter(v => v.website).length
      };
    }

    return stats;
  }
}

// Export singleton instance
export default new VendorMatcher();
