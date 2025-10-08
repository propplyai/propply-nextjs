-- Vendor Search Cache Table
-- Created: 2025-10-08
-- Purpose: Cache Google Places API search results to reduce API calls

-- =====================================================
-- Table: vendor_search_cache
-- Purpose: Store vendor search results for properties
-- =====================================================
CREATE TABLE IF NOT EXISTS vendor_search_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Search parameters (used as cache key)
  search_address TEXT NOT NULL,
  search_lat NUMERIC(10, 7),
  search_lng NUMERIC(10, 7),
  search_categories TEXT[] NOT NULL,
  search_radius INTEGER DEFAULT 5000,

  -- Cached vendor data
  vendors_data JSONB NOT NULL,
  total_vendors INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_count INTEGER DEFAULT 1,

  -- Index for faster lookups
  UNIQUE(search_address, search_categories)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_cache_address
  ON vendor_search_cache(search_address);
CREATE INDEX IF NOT EXISTS idx_vendor_cache_expires
  ON vendor_search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_vendor_cache_created
  ON vendor_search_cache(created_at DESC);

-- =====================================================
-- Function: Update last_accessed_at on read
-- =====================================================
CREATE OR REPLACE FUNCTION update_vendor_cache_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at = NOW();
  NEW.access_count = OLD.access_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating access tracking
CREATE TRIGGER vendor_cache_access_trigger
  BEFORE UPDATE ON vendor_search_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_cache_access();

-- =====================================================
-- Function: Cleanup expired cache entries
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_vendor_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM vendor_search_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE vendor_search_cache IS 'Caches Google Places API vendor search results to reduce API calls and improve performance';
COMMENT ON COLUMN vendor_search_cache.search_address IS 'Normalized address used for search';
COMMENT ON COLUMN vendor_search_cache.search_categories IS 'Array of categories searched (hpd, dob, elevator, etc.)';
COMMENT ON COLUMN vendor_search_cache.vendors_data IS 'JSON object containing all vendor results grouped by category';
COMMENT ON COLUMN vendor_search_cache.expires_at IS 'Cache expiration date (default 30 days from creation)';
COMMENT ON COLUMN vendor_search_cache.access_count IS 'Number of times this cache entry has been accessed';

-- Note: No RLS needed as this is public cache data
-- The cache doesn't contain user-specific information
