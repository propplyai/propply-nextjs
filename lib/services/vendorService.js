/**
 * Vendor Service - Google Places API Integration
 *
 * This service translates the Python POC (vendor-service.py) into JavaScript
 * for finding contractors via Google Places API based on property violations.
 */

import { Client } from "@googlemaps/google-maps-services-js";

export class VendorService {
  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!this.apiKey) {
      console.warn('[VendorService] Warning: Google Places API key not configured');
    }
  }

  /**
   * Contractor search terms mapped to violation categories
   * Matches Python CONTRACTOR_CATEGORIES from vendor-service.py:30-73
   */
  CONTRACTOR_CATEGORIES = {
    hpd: [
      'general contractor',
      'handyman service',
      'plumber',
      'heating contractor',
      'property maintenance',
      'building repair service'
    ],
    dob: [
      'structural engineer',
      'building code compliance',
      'structural repair',
      'building inspector',
      'general contractor'
    ],
    elevator: [
      'elevator repair service',
      'elevator inspection',
      'elevator maintenance',
      'elevator company',
      'elevator contractor'
    ],
    boiler: [
      'HVAC contractor',
      'boiler repair',
      'boiler inspection',
      'heating system service',
      'mechanical contractor'
    ],
    electrical: [
      'electrician',
      'electrical contractor',
      'electrical repair',
      'electrical inspection',
      'licensed electrician'
    ],
    fire_safety: [
      'fire safety inspection',
      'fire alarm system',
      'fire protection service',
      'fire sprinkler system',
      'fire safety equipment'
    ]
  };

  /**
   * Find contractors by violation category near a property address
   * Translates: vendor-service.py find_contractors_by_category() [lines 75-132]
   *
   * @param {string} address - Property address
   * @param {string} category - Violation category (hpd, dob, elevator, etc.)
   * @param {number} radius - Search radius in meters (default: 5000)
   * @returns {Promise<Array>} List of contractors sorted by rating
   */
  async findContractorsByCategory(address, category, radius = 5000) {
    try {
      console.log(`[VendorService] Finding ${category} contractors near ${address}`);

      // Step 1: Geocode the address to get lat/lng
      const location = await this._geocodeAddress(address);
      if (!location) {
        throw new Error('Failed to geocode address');
      }

      // Step 2: Get search terms for this category
      const searchTerms = this.CONTRACTOR_CATEGORIES[category];
      if (!searchTerms || searchTerms.length === 0) {
        throw new Error(`Unknown category: ${category}`);
      }

      // Step 3: Search for contractors using each search term
      const allContractors = [];
      for (const term of searchTerms) {
        const results = await this._searchPlaces(location, term, radius);
        allContractors.push(...results);
      }

      // Step 4: Deduplicate by place_id
      const uniqueContractors = this._deduplicateByPlaceId(allContractors);

      // Step 5: Calculate distance from property
      const contractorsWithDistance = uniqueContractors.map(contractor => ({
        ...contractor,
        distance_miles: this._calculateDistance(
          location,
          contractor.geometry.location
        )
      }));

      // Step 6: Sort by rating (descending), then by distance (ascending)
      const sorted = contractorsWithDistance.sort((a, b) => {
        if (b.rating !== a.rating) {
          return (b.rating || 0) - (a.rating || 0);
        }
        return a.distance_miles - b.distance_miles;
      });

      // Step 7: Limit to top 10 per category to reduce API costs
      const limited = sorted.slice(0, 10);

      console.log(`[VendorService] Found ${sorted.length} contractors, returning top ${limited.length} for ${category}`);
      return limited;

    } catch (error) {
      console.error('[VendorService] Error finding contractors:', error);
      throw error;
    }
  }

  /**
   * Find contractors for multiple violation categories
   * Translates: vendor-service.py find_contractors_for_violations() [lines 134-160]
   *
   * @param {string} address - Property address
   * @param {Array<string>} categories - List of categories
   * @param {number} radius - Search radius in meters
   * @returns {Promise<Object>} Object with contractors grouped by category
   */
  async findContractorsForViolations(address, categories, radius = 5000) {
    try {
      console.log(`[VendorService] Finding contractors for categories: ${categories.join(', ')}`);

      const results = {};
      for (const category of categories) {
        results[category] = await this.findContractorsByCategory(address, category, radius);
      }

      return results;

    } catch (error) {
      console.error('[VendorService] Error finding contractors for violations:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific contractor
   * Translates: vendor-service.py get_contractor_details() [lines 162-209]
   *
   * @param {string} placeId - Google Places place_id
   * @returns {Promise<Object>} Detailed contractor information
   */
  async getContractorDetails(placeId) {
    try {
      console.log(`[VendorService] Fetching details for place_id: ${placeId}`);

      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          fields: [
            'name',
            'formatted_address',
            'formatted_phone_number',
            'website',
            'rating',
            'user_ratings_total',
            'reviews',
            'opening_hours',
            'geometry',
            'photos',
            'business_status',
            'types'
          ],
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Places API error: ${response.data.status}`);
      }

      const place = response.data.result;

      return {
        place_id: placeId,
        name: place.name,
        address: place.formatted_address,
        phone: place.formatted_phone_number,
        website: place.website,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        reviews: this._formatReviews(place.reviews || []),
        opening_hours: this._formatOpeningHours(place.opening_hours),
        location: place.geometry?.location,
        photos: place.photos?.map(photo => ({
          photo_reference: photo.photo_reference,
          width: photo.width,
          height: photo.height
        })) || [],
        business_status: place.business_status,
        types: place.types || []
      };

    } catch (error) {
      console.error('[VendorService] Error getting contractor details:', error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Geocode an address to get latitude/longitude
   * Translates: vendor-service.py _geocode_address() [lines 210-220]
   */
  async _geocodeAddress(address) {
    try {
      const response = await this.client.geocode({
        params: {
          address: address,
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        return response.data.results[0].geometry.location;
      }

      console.error(`[VendorService] Geocoding failed: ${response.data.status}`);
      return null;

    } catch (error) {
      console.error('[VendorService] Geocoding error:', error);
      return null;
    }
  }

  /**
   * Search for places using text search
   * Translates: vendor-service.py _search_places() [lines 222-268]
   */
  async _searchPlaces(location, query, radius) {
    try {
      const response = await this.client.textSearch({
        params: {
          query: `${query} near ${location.lat},${location.lng}`,
          location: location,
          radius: radius,
          type: 'establishment',
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK') {
        return response.data.results || [];
      }

      // Handle ZERO_RESULTS gracefully
      if (response.data.status === 'ZERO_RESULTS') {
        console.log(`[VendorService] No results for query: ${query}`);
        return [];
      }

      console.warn(`[VendorService] Search warning: ${response.data.status}`);
      return [];

    } catch (error) {
      console.error('[VendorService] Search error:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Translates: vendor-service.py _calculate_distance() [lines 270-284]
   */
  _calculateDistance(loc1, loc2) {
    const R = 3959; // Earth's radius in miles

    const lat1 = loc1.lat * Math.PI / 180;
    const lat2 = loc2.lat * Math.PI / 180;
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Deduplicate contractors by place_id
   */
  _deduplicateByPlaceId(contractors) {
    const seen = new Set();
    return contractors.filter(contractor => {
      if (seen.has(contractor.place_id)) {
        return false;
      }
      seen.add(contractor.place_id);
      return true;
    });
  }

  /**
   * Format opening hours for display
   * Translates: vendor-service.py _format_opening_hours() [lines 286-294]
   */
  _formatOpeningHours(openingHours) {
    if (!openingHours) return null;

    return {
      open_now: openingHours.open_now,
      weekday_text: openingHours.weekday_text || [],
      periods: openingHours.periods || []
    };
  }

  /**
   * Format reviews for display
   * Translates: vendor-service.py _format_reviews() [lines 296-310]
   */
  _formatReviews(reviews) {
    return reviews.slice(0, 5).map(review => ({
      author_name: review.author_name,
      rating: review.rating,
      text: review.text,
      time: review.time,
      relative_time_description: review.relative_time_description
    }));
  }

  /**
   * Generate photo URL from photo reference
   */
  getPhotoUrl(photoReference, maxWidth = 400) {
    if (!photoReference) return null;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.apiKey}`;
  }
}

// Export singleton instance
export default new VendorService();
