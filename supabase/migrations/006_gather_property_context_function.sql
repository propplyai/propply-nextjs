-- Function to gather all property data into a consolidated JSON
-- This function collects data from multiple tables and returns it as a single JSONB object

CREATE OR REPLACE FUNCTION gather_property_context(p_property_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_context JSONB;
  v_property JSONB;
  v_nyc_property JSONB;
  v_compliance_summary JSONB;
  v_violations JSONB;
  v_equipment JSONB;
  v_manual_entries JSONB;
  v_latest_report JSONB;
BEGIN
  -- Get basic property info
  SELECT to_jsonb(p.*) INTO v_property
  FROM properties p
  WHERE p.id = p_property_id;
  
  IF v_property IS NULL THEN
    RAISE EXCEPTION 'Property not found: %', p_property_id;
  END IF;
  
  -- Get NYC property identifiers (if exists)
  SELECT jsonb_build_object(
    'bin', np.bin,
    'bbl', np.bbl,
    'borough', np.borough,
    'block', np.block,
    'lot', np.lot
  ) INTO v_nyc_property
  FROM nyc_properties np
  WHERE np.property_id = p_property_id;
  
  -- Get compliance summary (if exists)
  SELECT to_jsonb(ncs.*) INTO v_compliance_summary
  FROM nyc_compliance_summary ncs
  WHERE ncs.nyc_property_id = (
    SELECT id FROM nyc_properties WHERE property_id = p_property_id
  );
  
  -- Get violations (HPD and DOB)
  SELECT jsonb_build_object(
    'hpd', COALESCE(
      (SELECT jsonb_agg(to_jsonb(hpd.*))
       FROM nyc_hpd_violations hpd
       WHERE hpd.nyc_property_id = (
         SELECT id FROM nyc_properties WHERE property_id = p_property_id
       )
       AND hpd.violation_status = 'Open'
       LIMIT 50), '[]'::jsonb
    ),
    'dob', COALESCE(
      (SELECT jsonb_agg(to_jsonb(dob.*))
       FROM nyc_dob_violations dob
       WHERE dob.nyc_property_id = (
         SELECT id FROM nyc_properties WHERE property_id = p_property_id
       )
       AND dob.violation_status = 'Open'
       LIMIT 50), '[]'::jsonb
    )
  ) INTO v_violations;
  
  -- Get equipment data (elevators, boilers, electrical)
  SELECT jsonb_build_object(
    'elevators', COALESCE(
      (SELECT jsonb_agg(to_jsonb(elev.*))
       FROM nyc_elevator_inspections elev
       WHERE elev.nyc_property_id = (
         SELECT id FROM nyc_properties WHERE property_id = p_property_id
       )
       LIMIT 20), '[]'::jsonb
    ),
    'boilers', COALESCE(
      (SELECT jsonb_agg(to_jsonb(boil.*))
       FROM nyc_boiler_inspections boil
       WHERE boil.nyc_property_id = (
         SELECT id FROM nyc_properties WHERE property_id = p_property_id
       )
       LIMIT 20), '[]'::jsonb
    ),
    'electrical', COALESCE(
      (SELECT jsonb_agg(to_jsonb(elec.*))
       FROM nyc_electrical_permits elec
       WHERE elec.nyc_property_id = (
         SELECT id FROM nyc_properties WHERE property_id = p_property_id
       )
       LIMIT 20), '[]'::jsonb
    )
  ) INTO v_equipment;
  
  -- Get manual compliance entries
  SELECT COALESCE(jsonb_agg(to_jsonb(mce.*)), '[]'::jsonb) INTO v_manual_entries
  FROM manual_compliance_entries mce
  WHERE mce.property_id = p_property_id;
  
  -- Get latest compliance report
  SELECT to_jsonb(cr.*) INTO v_latest_report
  FROM compliance_reports cr
  WHERE cr.property_id = p_property_id
  ORDER BY cr.generated_at DESC
  LIMIT 1;
  
  -- Build the complete context
  v_context := jsonb_build_object(
    'property_id', p_property_id,
    'gathered_at', NOW(),
    'property', v_property,
    'nyc_identifiers', COALESCE(v_nyc_property, '{}'::jsonb),
    'compliance_summary', COALESCE(v_compliance_summary, '{}'::jsonb),
    'violations', COALESCE(v_violations, '{}'::jsonb),
    'equipment', COALESCE(v_equipment, '{}'::jsonb),
    'manual_entries', COALESCE(v_manual_entries, '[]'::jsonb),
    'latest_compliance_report', COALESCE(v_latest_report, '{}'::jsonb)
  );
  
  RETURN v_context;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION gather_property_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION gather_property_context(UUID) TO service_role;

-- Add comment
COMMENT ON FUNCTION gather_property_context(UUID) IS 'Gathers all property data from multiple tables into a single consolidated JSONB object for AI analysis';

