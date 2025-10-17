/**
 * VendorCard Component
 *
 * Displays a vendor card with key information and actions
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  Star, MapPin, Phone, Globe, Bookmark, BookmarkCheck,
  ExternalLink, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VendorCard({ vendor, category, onBookmark, onRequestQuote, onInviteToBid }) {
  const [isBookmarked, setIsBookmarked] = useState(vendor.is_bookmarked || false);
  const [bookmarking, setBookmarking] = useState(false);

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();

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

  const handleRequestQuote = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRequestQuote(vendor);
  };

  const handleInviteToBid = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onInviteToBid(vendor);
  };

  // Format phone number for display
  const formatPhone = (phone) => {
    if (!phone) return 'Not available';
    return phone;
  };

  // Get rating stars display
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-gold-400 text-gold-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-gold-400/50 text-gold-400" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-slate-600" />
        );
      }
    }

    return stars;
  };

  return (
    <div className="card group hover:border-corporate-500/50 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-corporate-400 transition-colors">
            {vendor.name}
          </h3>
          <p className="text-sm text-slate-400">{category}</p>
        </div>

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          disabled={bookmarking}
          className={cn(
            'p-2 rounded-lg transition-all',
            isBookmarked
              ? 'bg-corporate-500/20 text-corporate-400 hover:bg-corporate-500/30'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-corporate-400'
          )}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark vendor'}
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-5 h-5" />
          ) : (
            <Bookmark className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Rating */}
      {vendor.rating && (
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex items-center space-x-0.5">
            {renderStars(vendor.rating)}
          </div>
          <span className="text-sm font-semibold text-white">
            {vendor.rating.toFixed(1)}
          </span>
          {vendor.user_ratings_total > 0 && (
            <span className="text-sm text-slate-400">
              ({vendor.user_ratings_total} reviews)
            </span>
          )}
        </div>
      )}

      {/* Distance */}
      {vendor.distance_miles !== null && vendor.distance_miles !== undefined && (
        <div className="flex items-center space-x-2 mb-3">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-slate-300">
            {vendor.distance_miles.toFixed(1)} mi away
          </span>
        </div>
      )}

      {/* Address */}
      {vendor.address && (
        <div className="flex items-start space-x-2 mb-3">
          <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
          <span className="text-sm text-slate-400 line-clamp-2">
            {vendor.address}
          </span>
        </div>
      )}

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {vendor.phone && vendor.phone !== 'Not available' && (
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-slate-400" />
            <a
              href={`tel:${vendor.phone}`}
              className="text-sm text-corporate-400 hover:text-corporate-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {formatPhone(vendor.phone)}
            </a>
          </div>
        )}

        {vendor.website && (
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-slate-400" />
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-corporate-400 hover:text-corporate-300 transition-colors flex items-center space-x-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="truncate">Visit website</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Business Status Badge */}
      {vendor.business_status === 'OPERATIONAL' && (
        <div className="mb-4">
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">
            ✓ Open for business
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-4 border-t border-slate-700">
        <div className="flex items-center space-x-2">
          <Link
            href={`/marketplace/${vendor.place_id}`}
            className="flex-1 btn-secondary text-sm py-2"
          >
            View Details
          </Link>
          <button
            onClick={handleRequestQuote}
            className="flex-1 btn-primary text-sm py-2"
          >
            Request Quote
          </button>
        </div>
        <button
          onClick={handleInviteToBid}
          className="w-full btn-outline text-sm py-2 flex items-center justify-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>Invite to Bid</span>
        </button>
      </div>
    </div>
  );
}
