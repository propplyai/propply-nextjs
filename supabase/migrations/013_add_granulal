-- Add dismissed violations tracking for NYC compliance data
-- This allows users to dismiss individual HPD/DOB violations and tracks who dismissed them

-- Create dismissed_violations table to track dismissed NYC violations
CREATE TABLE IF NOT EXISTS dismissed_violations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES compliance_reports(id) ON DELETE CASCADE,
    violation_type TEXT NOT NULL CHECK (violation_type IN ('HPD', 'DOB')),
    violation_id TEXT NOT NULL, -- The violationid from NYC data
    violation_data JSONB NOT NULL, -- Store the full violation data for reference
    dismissed_by TEXT, -- User who dismissed it
    dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dismiss_reason TEXT, -- Optional reason for dismissal
    UNIQUE(report_id, violation_type, violation_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dismissed_violations_report 
ON dismissed_violations(report_id);

CREATE INDEX IF NOT EXISTS idx_dismissed_violations_type 
ON dismissed_violations(violation_type);

-- Add RLS policies
ALTER TABLE dismissed_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" 
ON dismissed_violations FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" 
ON dismissed_violations FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" 
ON dismissed_violations FOR DELETE USING (true);

-- Add columns to compliance_reports for dynamic calculation tracking
ALTER TABLE compliance_reports 
ADD COLUMN IF NOT EXISTS hpd_violations_dismissed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dob_violations_dismissed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_recalculated_at TIMESTAMP WITH TIME ZONE;

-- Create function to recalculate compliance scores dynamically
CREATE OR REPLACE FUNCTION recalculate_compliance_score(report_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    report_data RECORD;
    hpd_total INTEGER;
    hpd_active INTEGER;
    hpd_dismissed INTEGER;
    dob_total INTEGER;
    dob_active INTEGER;
    dob_dismissed INTEGER;
    hpd_score DECIMAL;
    dob_score DECIMAL;
    elevator_score DECIMAL;
    electrical_score DECIMAL;
    overall_score DECIMAL;
    result JSONB;
BEGIN
    -- Get current report data
    SELECT * INTO report_data 
    FROM compliance_reports 
    WHERE id = report_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report not found: %', report_uuid;
    END IF;
    
    -- Count dismissed violations
    SELECT COUNT(*) INTO hpd_dismissed
    FROM dismissed_violations
    WHERE report_id = report_uuid AND violation_type = 'HPD';
    
    SELECT COUNT(*) INTO dob_dismissed
    FROM dismissed_violations
    WHERE report_id = report_uuid AND violation_type = 'DOB';
    
    -- Calculate active violations (total - dismissed)
    hpd_total := COALESCE(report_data.hpd_violations_total, 0);
    hpd_active := GREATEST(0, hpd_total - hpd_dismissed);
    
    dob_total := COALESCE(report_data.dob_violations_total, 0);
    dob_active := GREATEST(0, dob_total - dob_dismissed);
    
    -- Calculate HPD score (same logic as Python)
    IF hpd_active = 0 THEN
        hpd_score := 100.0;
    ELSIF hpd_active <= 5 THEN
        hpd_score := 85.0;
    ELSIF hpd_active <= 15 THEN
        hpd_score := 70.0;
    ELSIF hpd_active <= 30 THEN
        hpd_score := 50.0;
    ELSE
        hpd_score := 25.0;
    END IF;
    
    -- Calculate DOB score (same logic as Python)
    IF dob_active = 0 THEN
        dob_score := 100.0;
    ELSIF dob_active <= 3 THEN
        dob_score := 85.0;
    ELSIF dob_active <= 10 THEN
        dob_score := 70.0;
    ELSIF dob_active <= 20 THEN
        dob_score := 50.0;
    ELSE
        dob_score := 25.0;
    END IF;
    
    -- Get other scores from report
    elevator_score := COALESCE(report_data.elevator_compliance_score, 100.0);
    electrical_score := COALESCE(report_data.electrical_compliance_score, 100.0);
    
    -- Calculate overall score (weighted average)
    overall_score := (hpd_score * 0.3) + (dob_score * 0.3) + (elevator_score * 0.2) + (electrical_score * 0.2);
    
    -- Update the report
    UPDATE compliance_reports SET
        hpd_violations_active = hpd_active,
        hpd_violations_dismissed = hpd_dismissed,
        hpd_compliance_score = hpd_score,
        dob_violations_active = dob_active,
        dob_violations_dismissed = dob_dismissed,
        dob_compliance_score = dob_score,
        compliance_score = ROUND(overall_score),
        last_recalculated_at = NOW()
    WHERE id = report_uuid;
    
    -- Return the new scores
    result := jsonb_build_object(
        'success', true,
        'hpd_active', hpd_active,
        'hpd_dismissed', hpd_dismissed,
        'hpd_score', hpd_score,
        'dob_active', dob_active,
        'dob_dismissed', dob_dismissed,
        'dob_score', dob_score,
        'overall_score', ROUND(overall_score)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-recalculate when violations are dismissed
CREATE OR REPLACE FUNCTION trigger_recalculate_compliance()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM recalculate_compliance_score(NEW.report_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_dismiss_violation
AFTER INSERT OR DELETE ON dismissed_violations
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_compliance();
