import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes properly
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format date
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  // Convert string to string type if needed
  const dateStr = String(dateString).trim();
  
  // Check if date is in YYYYMMDD format (8 digits)
  if (/^\d{8}$/.test(dateStr)) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    // Create ISO format date string
    const isoDate = `${year}-${month}-${day}`;
    const date = new Date(isoDate);
    
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  }
  
  // Try to parse the date normally
  const date = new Date(dateStr);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'N/A';
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format currency
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Calculate compliance score color
export function getComplianceScoreColor(score) {
  if (score >= 90) return 'text-emerald-500';
  if (score >= 70) return 'text-gold-500';
  if (score >= 50) return 'text-orange-500';
  return 'text-ruby-500';
}

// Get compliance score badge
export function getComplianceScoreBadge(score) {
  if (score >= 90) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
  if (score >= 70) return 'bg-gold-500/10 text-gold-500 border-gold-500/30';
  if (score >= 50) return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
  return 'bg-ruby-500/10 text-ruby-500 border-ruby-500/30';
}

// Truncate text
export function truncate(str, length = 50) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

// Sleep utility
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Parse city from address
export function parseCityFromAddress(address) {
  if (!address) return 'NYC';
  const lowerAddress = address.toLowerCase();
  if (lowerAddress.includes('philadelphia') || lowerAddress.includes('philly') || lowerAddress.includes(', pa')) {
    return 'Philadelphia';
  }
  return 'NYC';
}

// Generate random ID
export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Get subscription tier display name
export function getSubscriptionTierName(tier) {
  const tierNames = {
    'single-one-time': 'Single Report',
    'single-monthly': 'Monthly Plan',
    'multiple-ongoing': 'Enterprise',
    'free': 'Free'
  };
  return tierNames[tier] || tier || 'Free';
}

// Get subscription tier badge styling
export function getSubscriptionTierBadge(tier) {
  switch (tier) {
    case 'multiple-ongoing':
      return 'bg-gold-500/10 text-gold-400 border-gold-500/30';
    case 'single-monthly':
      return 'bg-corporate-500/10 text-corporate-400 border-corporate-500/30';
    case 'single-one-time':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'free':
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
}

// Get subscription tier icon
export function getSubscriptionTierIcon(tier) {
  switch (tier) {
    case 'multiple-ongoing':
      return '👑'; // Crown for enterprise
    case 'single-monthly':
      return '🔄'; // Refresh for monthly
    case 'single-one-time':
      return '📄'; // Document for single report
    case 'free':
    default:
      return '🆓'; // Free icon
  }
}

// Authenticated fetch helper for API calls
export async function authenticatedFetch(url, options = {}) {
  // Import supabase dynamically to avoid circular dependencies
  const { supabase } = await import('@/lib/supabase');

  // Get current session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  // Merge headers with auth token
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers
  };

  return fetch(url, {
    ...options,
    headers
  });
}
