-- Manual Compliance Entries Table
-- Created: 2025-10-09
-- Purpose: Store user-added compliance items (permits, inspections, certifications)

-- =====================================================
-- Table: manual_compliance_entries
-- Purpose: User-added compliance records not from public APIs
-- =====================================================
CREATE TABLE IF NOT EXISTS manual_compliance_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- City context
  city TEXT DEFAULT 'NYC',

  -- Entry details
  type TEXT NOT NULL CHECK (type IN ('permit', 'inspection', 'certification', 'violation')),
  category TEXT NOT NULL, -- e.g., 'Boiler', 'Fire Safety', 'Electrical'
  title TEXT NOT NULL,
  description TEXT,

  -- Dates
  date DATE NOT NULL, -- When permit issued / inspection done / violation occurred
  expiration_date DATE, -- When permit/cert expires

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending', 'completed')),

  -- Additional info
  notes TEXT, -- Internal notes

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_manual_compliance_property
  ON manual_compliance_entries(property_id);

CREATE INDEX IF NOT EXISTS idx_manual_compliance_user
  ON manual_compliance_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_manual_compliance_type
  ON manual_compliance_entries(type);

CREATE INDEX IF NOT EXISTS idx_manual_compliance_status
  ON manual_compliance_entries(status);

CREATE INDEX IF NOT EXISTS idx_manual_compliance_created
  ON manual_compliance_entries(created_at DESC);

-- Enable Row Level Security
ALTER TABLE manual_compliance_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own manual compliance entries"
  ON manual_compliance_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own manual compliance entries"
  ON manual_compliance_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own manual compliance entries"
  ON manual_compliance_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own manual compliance entries"
  ON manual_compliance_entries FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Function: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_manual_compliance_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER manual_compliance_entries_updated_at_trigger
  BEFORE UPDATE ON manual_compliance_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_manual_compliance_entries_updated_at();

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE manual_compliance_entries IS 'User-added compliance records (permits, inspections, certifications) not from public APIs';
COMMENT ON COLUMN manual_compliance_entries.type IS 'Type of entry: permit, inspection, certification, or violation';
COMMENT ON COLUMN manual_compliance_entries.category IS 'Category like Boiler, Fire Safety, Electrical, etc.';
COMMENT ON COLUMN manual_compliance_entries.status IS 'Current status: active, expired, pending, or completed';
COMMENT ON COLUMN manual_compliance_entries.notes IS 'Internal notes for property owner';
