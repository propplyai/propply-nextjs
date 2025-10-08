/**
 * VendorDetailsModal Component
 *
 * Modal for displaying detailed vendor information with reviews and photos
 */

import { useState } from 'react';
import {
  X, Star, MapPin, Phone, Globe, Clock, ExternalLink,
  Bookmark, BookmarkCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VendorDetailsModal({ vendor, isOpen, onClose, onBookmark, onRequestQuote }) {
  const [isBookmarked, setIsBookmarked] = useState(vendor?.is_bookmarked || false);
  const [bookmarking, setBookmarking] = useState(false);

  if (!isOpen || !vendor) return null;

  const handleBookmark = async () => {
    setBookmarking(true);
    try {
      await onBookmark(vendor, !isBookmarked);
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Bookmark error:', error);
    } finally {
      setBookmarking(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);

    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={cn(
            'w-4 h-4',
            i < fullStars ? 'fill-gold-400 text-gold-400' : 'text-slate-600'
          )}
        />
      );
    }

    return stars;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-slate-800 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-start justify-between z-10">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{vendor.name}</h2>
              {vendor.rating && (
                <div className="flex items-center space-x-2">
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

            {/* Header Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBookmark}
                disabled={bookmarking}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  isBookmarked
                    ? 'bg-corporate-500/20 text-corporate-400 hover:bg-corporate-500/30'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-corporate-400'
                )}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-5 h-5" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vendor.address && (
                <div className="flex items-start space-x-3 p-4 bg-slate-900/50 rounded-lg">
                  <MapPin className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Address</div>
                    <div className="text-white">{vendor.address}</div>
                  </div>
                </div>
              )}

              {vendor.phone && (
                <div className="flex items-start space-x-3 p-4 bg-slate-900/50 rounded-lg">
                  <Phone className="w-5 h-5 text-corporate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Phone</div>
                    <a
                      href={`tel:${vendor.phone}`}
                      className="text-corporate-400 hover:text-corporate-300"
                    >
                      {vendor.phone}
                    </a>
                  </div>
                </div>
              )}

              {vendor.website && (
                <div className="flex items-start space-x-3 p-4 bg-slate-900/50 rounded-lg">
                  <Globe className="w-5 h-5 text-corporate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Website</div>
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-corporate-400 hover:text-corporate-300 flex items-center space-x-1"
                    >
                      <span>Visit website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {vendor.distance_miles !== null && vendor.distance_miles !== undefined && (
                <div className="flex items-start space-x-3 p-4 bg-slate-900/50 rounded-lg">
                  <MapPin className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Distance</div>
                    <div className="text-white">{vendor.distance_miles.toFixed(1)} miles away</div>
                  </div>
                </div>
              )}
            </div>

            {/* Opening Hours */}
            {vendor.opening_hours?.weekday_text && vendor.opening_hours.weekday_text.length > 0 && (
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Clock className="w-5 h-5 text-corporate-400" />
                  <h3 className="text-lg font-semibold text-white">Hours</h3>
                  {vendor.opening_hours.open_now !== undefined && (
                    <span
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
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
                    <div key={index} className="text-sm text-slate-300">
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {vendor.reviews && vendor.reviews.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Recent Reviews</h3>
                <div className="space-y-4">
                  {vendor.reviews.map((review, index) => (
                    <div
                      key={index}
                      className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-white">{review.author_name}</div>
                          <div className="text-xs text-slate-500">
                            {review.relative_time_description || 'Recently'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-0.5">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      {review.text && (
                        <p className="text-sm text-slate-300 leading-relaxed">{review.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Previous Requests (if any) */}
            {vendor.user_requests && vendor.user_requests.length > 0 && (
              <div className="p-4 bg-corporate-500/10 border border-corporate-500/30 rounded-lg">
                <h3 className="text-sm font-semibold text-corporate-400 mb-2">
                  Your Request History
                </h3>
                <div className="space-y-2">
                  {vendor.user_requests.map((request, index) => (
                    <div key={index} className="text-sm text-slate-300">
                      <span className="font-medium">{request.status}</span>
                      {' • '}
                      {new Date(request.created_at).toLocaleDateString()}
                      {request.properties?.address && (
                        <span className="text-slate-500"> - {request.properties.address}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-6 flex items-center space-x-4">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Close
            </button>
            <button
              onClick={() => onRequestQuote(vendor)}
              className="flex-1 btn-primary"
            >
              Request Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
