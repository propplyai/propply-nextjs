-- Add missing compliance score columns to compliance_reports table
-- These are needed by the recalculate_compliance_score() function

ALTER TABLE compliance_reports 
ADD COLUMN IF NOT EXISTS hpd_compliance_score DECIMAL DEFAULT 100.0,
ADD COLUMN IF NOT EXISTS dob_compliance_score DECIMAL DEFAULT 100.0,
ADD COLUMN IF NOT EXISTS elevator_compliance_score DECIMAL DEFAULT 100.0,
ADD COLUMN IF NOT EXISTS electrical_compliance_score DECIMAL DEFAULT 100.0;

-- Update existing reports to have default scores
UPDATE compliance_reports 
SET 
  hpd_compliance_score = COALESCE(hpd_compliance_score, 100.0),
  dob_compliance_score = COALESCE(dob_compliance_score, 100.0),
  elevator_compliance_score = COALESCE(elevator_compliance_score, 100.0),
  electrical_compliance_score = COALESCE(electrical_compliance_score, 100.0)
WHERE hpd_compliance_score IS NULL 
   OR dob_compliance_score IS NULL 
   OR elevator_compliance_score IS NULL 
   OR electrical_compliance_score IS NULL;
