-- Property Vendor Searches Table
-- Created: 2025-10-08
-- Purpose: Store vendor search results associated with properties

-- =====================================================
-- Table: property_vendor_searches
-- Purpose: Link vendor search results to specific properties
-- =====================================================
CREATE TABLE IF NOT EXISTS property_vendor_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES compliance_reports(id) ON DELETE SET NULL,

  -- Search parameters
  search_address TEXT NOT NULL,
  search_categories TEXT[] NOT NULL,
  search_radius INTEGER DEFAULT 5000,

  -- Search results (stores full vendor data)
  vendors_data JSONB NOT NULL,
  total_vendors INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Only one active search per property
  UNIQUE(property_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_property_vendor_searches_property
  ON property_vendor_searches(property_id);
CREATE INDEX IF NOT EXISTS idx_property_vendor_searches_user
  ON property_vendor_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_property_vendor_searches_created
  ON property_vendor_searches(created_at DESC);

-- Enable Row Level Security
ALTER TABLE property_vendor_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own property vendor searches"
  ON property_vendor_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own property vendor searches"
  ON property_vendor_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own property vendor searches"
  ON property_vendor_searches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own property vendor searches"
  ON property_vendor_searches FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Function: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_property_vendor_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER property_vendor_searches_updated_at_trigger
  BEFORE UPDATE ON property_vendor_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_property_vendor_searches_updated_at();

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE property_vendor_searches IS 'Stores vendor search results for each property for quick access';
COMMENT ON COLUMN property_vendor_searches.vendors_data IS 'JSONB object containing all vendor results grouped by category';
COMMENT ON COLUMN property_vendor_searches.total_vendors IS 'Total number of vendors found in the search';
COMMENT ON COLUMN property_vendor_searches.updated_at IS 'Last time the search was refreshed (re-run)';
