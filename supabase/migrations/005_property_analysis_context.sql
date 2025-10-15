-- Create property_analysis_context table
-- This table consolidates all property data needed for AI analysis in a single JSONB field

CREATE TABLE IF NOT EXISTS property_analysis_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES ai_property_analyses(id) ON DELETE CASCADE,
  
  -- Complete context data in one JSONB
  -- Contains: property, violations, equipment, compliance_summary, manual_entries, etc.
  context_data JSONB NOT NULL,
  
  -- Metadata
  data_version TEXT DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each property can have multiple analysis contexts (historical)
  -- But each analysis_id should only have one context
  CONSTRAINT unique_analysis_context UNIQUE (analysis_id)
);

-- Indexes for fast lookup
CREATE INDEX idx_property_analysis_context_property ON property_analysis_context(property_id);
CREATE INDEX idx_property_analysis_context_analysis ON property_analysis_context(analysis_id);
CREATE INDEX idx_property_analysis_context_created ON property_analysis_context(created_at DESC);

-- GIN index for JSONB queries
CREATE INDEX idx_property_analysis_context_data ON property_analysis_context USING GIN (context_data);

-- Enable RLS
ALTER TABLE property_analysis_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access context for their own properties
CREATE POLICY "Users can view their own property analysis context"
  ON property_analysis_context
  FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  );

-- Users can insert context for their own properties
CREATE POLICY "Users can insert context for their own properties"
  ON property_analysis_context
  FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  );

-- Service role can do everything (for n8n webhook)
CREATE POLICY "Service role has full access"
  ON property_analysis_context
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add comment
COMMENT ON TABLE property_analysis_context IS 'Consolidated property data context for AI analysis - all relevant data in one JSONB for easy agent access';
COMMENT ON COLUMN property_analysis_context.context_data IS 'Complete property context including violations, equipment, compliance data, manual entries - everything AI needs in one JSON';


