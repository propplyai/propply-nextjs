-- Marketplace Tables for Vendor Management System
-- Created: 2025-10-08

-- =====================================================
-- Table: marketplace_requests
-- Purpose: Track user requests for vendor quotes/services
-- =====================================================
CREATE TABLE IF NOT EXISTS marketplace_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  report_id UUID REFERENCES compliance_reports(id) ON DELETE SET NULL,

  -- Vendor information from Google Places API
  vendor_place_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_category TEXT NOT NULL,
  vendor_phone TEXT,
  vendor_website TEXT,
  vendor_address TEXT,
  vendor_rating NUMERIC(2,1),

  -- Request tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'hired', 'rejected', 'completed')),
  notes TEXT,
  contact_date TIMESTAMP WITH TIME ZONE,
  completion_date TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for marketplace_requests
CREATE INDEX IF NOT EXISTS idx_marketplace_requests_user
  ON marketplace_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_requests_property
  ON marketplace_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_requests_status
  ON marketplace_requests(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_requests_created
  ON marketplace_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE marketplace_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_requests
CREATE POLICY "Users can view their own marketplace requests"
  ON marketplace_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own marketplace requests"
  ON marketplace_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own marketplace requests"
  ON marketplace_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marketplace requests"
  ON marketplace_requests FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Table: marketplace_bookmarks
-- Purpose: Save favorite vendors for future reference
-- =====================================================
CREATE TABLE IF NOT EXISTS marketplace_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Vendor information
  vendor_place_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_category TEXT NOT NULL,
  vendor_phone TEXT,
  vendor_website TEXT,
  vendor_address TEXT,
  vendor_rating NUMERIC(2,1),

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate bookmarks
  UNIQUE(user_id, vendor_place_id)
);

-- Indexes for marketplace_bookmarks
CREATE INDEX IF NOT EXISTS idx_marketplace_bookmarks_user
  ON marketplace_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_bookmarks_created
  ON marketplace_bookmarks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE marketplace_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON marketplace_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks"
  ON marketplace_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON marketplace_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Function: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_marketplace_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER marketplace_requests_updated_at_trigger
  BEFORE UPDATE ON marketplace_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_requests_updated_at();

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE marketplace_requests IS 'Tracks user requests for vendor quotes and services from the marketplace';
COMMENT ON TABLE marketplace_bookmarks IS 'Stores user-saved favorite vendors for quick access';
COMMENT ON COLUMN marketplace_requests.vendor_place_id IS 'Google Places API place_id for the vendor';
COMMENT ON COLUMN marketplace_requests.vendor_category IS 'Category: hpd, dob, elevator, boiler, electrical, fire_safety';
COMMENT ON COLUMN marketplace_requests.status IS 'Request lifecycle: pending → contacted → hired → completed (or rejected)';
