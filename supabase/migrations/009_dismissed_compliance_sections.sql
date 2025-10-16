-- Create table to track dismissed compliance report sections
CREATE TABLE IF NOT EXISTS dismissed_compliance_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES compliance_reports(id) ON DELETE CASCADE,
  section_type VARCHAR(50) NOT NULL, -- 'elevators', 'boilers', 'electrical', 'hpd', 'dob'
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, report_id, section_type)
);

-- Create index for faster lookups
CREATE INDEX idx_dismissed_sections_user_report ON dismissed_compliance_sections(user_id, report_id);
CREATE INDEX idx_dismissed_sections_user ON dismissed_compliance_sections(user_id);

-- Enable RLS
ALTER TABLE dismissed_compliance_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own dismissed sections"
  ON dismissed_compliance_sections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can dismiss their own sections"
  ON dismissed_compliance_sections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can restore their own dismissed sections"
  ON dismissed_compliance_sections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON dismissed_compliance_sections TO authenticated;

