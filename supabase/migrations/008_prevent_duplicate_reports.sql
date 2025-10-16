-- Migration: Prevent duplicate compliance reports
-- This migration adds a function to clean up duplicate reports and improve the UI

-- Function to get the latest report for a property (used in the compliance page)
CREATE OR REPLACE FUNCTION get_latest_report_per_property(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  property_id UUID,
  user_id UUID,
  bin TEXT,
  bbl TEXT,
  overall_score INTEGER,
  hpd_violations_active INTEGER,
  dob_violations_active INTEGER,
  generated_at TIMESTAMPTZ,
  report_data JSONB,
  address TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_reports AS (
    SELECT 
      cr.*,
      p.address,
      ROW_NUMBER() OVER (PARTITION BY cr.property_id ORDER BY cr.generated_at DESC) as rn
    FROM compliance_reports cr
    LEFT JOIN properties p ON cr.property_id = p.id
    WHERE cr.user_id = p_user_id
  )
  SELECT 
    r.id,
    r.property_id,
    r.user_id,
    r.bin,
    r.bbl,
    r.overall_score,
    r.hpd_violations_active,
    r.dob_violations_active,
    r.generated_at,
    r.report_data,
    r.address
  FROM ranked_reports r
  WHERE r.rn = 1
  ORDER BY r.generated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a comment
COMMENT ON FUNCTION get_latest_report_per_property IS 
'Returns the most recent compliance report for each property for a given user, preventing duplicate display.';

