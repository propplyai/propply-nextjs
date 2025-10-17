/**
 * Vendor Detail Page - Individual vendor information
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { authHelpers } from '@/lib/supabase';
import {
  ArrowLeft, Star, MapPin, Phone, Globe, Clock, ExternalLink,
  Bookmark, BookmarkCheck, Loader2, AlertCircle
} from 'lucide-react';
import { cn, authenticatedFetch } from '@/lib/utils';

export default function VendorDetailPage() {
  const router = useRouter();
  const { id: placeId, property_id, restore_search } = router.query;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (placeId && router.isReady) {
      checkAuth();
    }
  }, [placeId, router.isReady]);

  const checkAuth = async () => {
    try {
      const { user: currentUser, error: authError } = await authHelpers.getUser();

      if (authError || !currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      await loadVendorDetails();
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    }
  };

  const loadVendorDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await authenticatedFetch(`/api/marketplace/details?place_id=${placeId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load vendor details');
      }

      setVendor(data.vendor);
      setIsBookmarked(data.vendor.is_bookmarked);
    } catch (err) {
      console.error('Error loading vendor:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    setBookmarking(true);
    try {
      if (!isBookmarked) {
        const response = await authenticatedFetch('/api/marketplace/save', {
          method: 'POST',
          body: JSON.stringify({
            action: 'bookmark',
            vendor_place_id: vendor.place_id,
            vendor_name: vendor.name,
            vendor_category: 'general',
            vendor_phone: vendor.phone,
            vendor_website: vendor.website,
            vendor_address: vendor.address,
            vendor_rating: vendor.rating
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to bookmark');
        }

        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setBookmarking(false);
    }
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    router.push('/');
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);

    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={cn(
            'w-5 h-5',
            i < fullStars ? 'fill-gold-400 text-gold-400' : 'text-slate-600'
          )}
        />
      );
    }

    return stars;
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-corporate-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !vendor) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="container-modern py-8">
          <div className="card">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-ruby-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Error Loading Vendor</h3>
                <p className="text-slate-300">{error || 'Vendor not found'}</p>
                <Link href="/marketplace" className="btn-primary mt-4 inline-block">
                  <ArrowLeft className="w-5 h-5 mr-2 inline" />
                  Back to Marketplace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        {/* Back Button */}
        <Link
          href={property_id && restore_search === 'true' 
            ? `/marketplace?property_id=${property_id}&restore_search=true`
            : "/marketplace"
          }
          className="inline-flex items-center space-x-2 text-corporate-400 hover:text-corporate-300 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Marketplace</span>
        </Link>

        {/* Vendor Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{vendor.name}</h1>
              {vendor.rating && (
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center space-x-0.5">
                    {renderStars(vendor.rating)}
                  </div>
                  <span className="text-lg font-semibold text-white">
                    {vendor.rating.toFixed(1)}
                  </span>
                  {vendor.user_ratings_total > 0 && (
                    <span className="text-slate-400">
                      ({vendor.user_ratings_total} reviews)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Bookmark Button */}
            <button
              onClick={handleBookmark}
              disabled={bookmarking}
              className={cn(
                'p-3 rounded-lg transition-all',
                isBookmarked
                  ? 'bg-corporate-500/20 text-corporate-400 hover:bg-corporate-500/30'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-corporate-400'
              )}
              title={isBookmarked ? 'Bookmarked' : 'Bookmark vendor'}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-6 h-6" />
              ) : (
                <Bookmark className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Contact Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendor.address && (
              <div className="flex items-start space-x-3 p-4 bg-slate-900/50 rounded-lg">
                <MapPin className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500 mb-1">Address</div>
                  <div className="text-white">{vendor.address}</div>
                </div>
              </div>
            )}

            {vendor.phone && (
              <div className="flex items-start space-x-3 p-4 bg-slate-900/50 rounded-lg">
                <Phone className="w-5 h-5 text-corporate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500 mb-1">Phone</div>
                  <a
                    href={`tel:${vendor.phone}`}
                    className="text-corporate-400 hover:text-corporate-300 transition-colors"
                  >
                    {vendor.phone}
                  </a>
                </div>
              </div>
            )}

            {vendor.website && (
              <div className="flex items-start space-x-3 p-4 bg-slate-900/50 rounded-lg">
                <Globe className="w-5 h-5 text-corporate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500 mb-1">Website</div>
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-corporate-400 hover:text-corporate-300 transition-colors flex items-center space-x-1"
                  >
                    <span>Visit website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {vendor.distance_miles !== null && vendor.distance_miles !== undefined && (
              <div className="flex items-start space-x-3 p-4 bg-slate-900/50 rounded-lg">
                <MapPin className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500 mb-1">Distance</div>
                  <div className="text-white">{vendor.distance_miles.toFixed(1)} miles away</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Opening Hours */}
        {vendor.opening_hours?.weekday_text && vendor.opening_hours.weekday_text.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-corporate-400" />
              <h2 className="text-xl font-semibold text-white">Hours</h2>
              {vendor.opening_hours.open_now !== undefined && (
                <span
                  className={cn(
                    'px-3 py-1 rounded text-sm font-medium',
                    vendor.opening_hours.open_now
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-ruby-500/20 text-ruby-400'
                  )}
                >
                  {vendor.opening_hours.open_now ? 'Open now' : 'Closed'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {vendor.opening_hours.weekday_text.map((day, index) => (
                <div key={index} className="text-slate-300">
                  {day}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {vendor.reviews && vendor.reviews.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Reviews</h2>
            <div className="space-y-4">
              {vendor.reviews.map((review, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-white">{review.author_name}</div>
                      <div className="text-sm text-slate-500">
                        {review.relative_time_description || 'Recently'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-0.5">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  {review.text && (
                    <p className="text-slate-300 leading-relaxed">{review.text}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request History */}
        {vendor.user_requests && vendor.user_requests.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Your Request History</h2>
            <div className="space-y-3">
              {vendor.user_requests.map((request, index) => (
                <div
                  key={index}
                  className="p-4 bg-corporate-500/10 border border-corporate-500/30 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white capitalize">{request.status}</div>
                      {request.properties?.address && (
                        <div className="text-sm text-slate-400">{request.properties.address}</div>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {request.notes && (
                    <p className="mt-2 text-sm text-slate-300">{request.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Attribution */}
        <div className="text-center text-sm text-slate-500">
          Powered by Google Places
        </div>
      </div>
    </Layout>
  );
}
