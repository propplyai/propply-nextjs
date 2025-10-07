// Direct API implementation without Python dependency
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address, propertyId } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    console.log(`[Compliance API] Generating report for: ${address}`);
    
    // Step 1: Get property identifiers from NYC Planning GeoSearch
    const geoSearchUrl = `https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(address)}&size=1`;
    const geoResponse = await fetch(geoSearchUrl);
    const geoData = await geoResponse.json();
    
    if (!geoData.features || geoData.features.length === 0) {
      return res.status(404).json({ error: 'Property not found in NYC database' });
    }
    
    const feature = geoData.features[0];
    const properties = feature.properties || {};
    const padData = properties.addendum?.pad || {};
    
    const bin = padData.bin;
    const bbl = padData.bbl;
    
    if (!bin) {
      return res.status(404).json({ error: 'Could not find BIN for this property' });
    }
    
    console.log(`Found property - BIN: ${bin}, BBL: ${bbl}`);
    
    // Step 2: Fetch compliance data from NYC Open Data
    const appToken = process.env.NYC_APP_TOKEN || '';
    const headers = appToken ? { 'X-App-Token': appToken } : {};
    
    // Fetch HPD Violations (active only)
    const hpdUrl = `https://data.cityofnewyork.us/resource/wvxf-dwi5.json?bin=${bin}&violationstatus=Open&$limit=100`;
    const hpdResponse = await fetch(hpdUrl, { headers });
    let hpdViolations = await hpdResponse.json();
    
    // Ensure it's an array
    if (!Array.isArray(hpdViolations)) {
      console.log('[Compliance API] HPD response is not an array:', hpdViolations);
      hpdViolations = [];
    }
    
    // Fetch DOB Violations (active only)
    const dobUrl = `https://data.cityofnewyork.us/resource/3h2n-5cm9.json?bin=${bin}&$where=violation_category LIKE '%ACTIVE%'&$limit=100`;
    const dobResponse = await fetch(dobUrl, { headers });
    let dobViolations = await dobResponse.json();
    
    // Ensure it's an array
    if (!Array.isArray(dobViolations)) {
      console.log('[Compliance API] DOB response is not an array:', dobViolations);
      dobViolations = [];
    }
    
    // Fetch Elevator Inspections
    const elevatorUrl = `https://data.cityofnewyork.us/resource/e5aq-a4j2.json?bin=${bin}&$limit=100`;
    const elevatorResponse = await fetch(elevatorUrl, { headers });
    let elevatorData = await elevatorResponse.json();
    
    if (!Array.isArray(elevatorData)) {
      console.log('[Compliance API] Elevator response is not an array:', elevatorData);
      elevatorData = [];
    }
    
    // Fetch Boiler Inspections
    const boilerUrl = `https://data.cityofnewyork.us/resource/52dp-yji6.json?bin_number=${bin}&$limit=100`;
    const boilerResponse = await fetch(boilerUrl, { headers });
    let boilerData = await boilerResponse.json();
    
    if (!Array.isArray(boilerData)) {
      console.log('[Compliance API] Boiler response is not an array:', boilerData);
      boilerData = [];
    }
    
    // Fetch Electrical Permits
    const electricalUrl = `https://data.cityofnewyork.us/resource/dm9a-ab7w.json?bin=${bin}&$limit=100`;
    const electricalResponse = await fetch(electricalUrl, { headers });
    let electricalData = await electricalResponse.json();
    
    if (!Array.isArray(electricalData)) {
      console.log('[Compliance API] Electrical response is not an array:', electricalData);
      electricalData = [];
    }
    
    // Calculate scores
    const hpdActive = hpdViolations.length;
    const dobActive = dobViolations.length;
    const elevatorDevices = elevatorData.length;
    const boilerDevices = boilerData.length;
    const electricalPermits = electricalData.length;
    
    const hpdScore = Math.max(0, 100 - (hpdActive * 10));
    const dobScore = Math.max(0, 100 - (dobActive * 15));
    const overallScore = (hpdScore * 0.5) + (dobScore * 0.5);
    
    const reportData = {
      success: true,
      property: {
        bin,
        bbl,
        borough: properties.borough,
        address: `${properties.housenumber || ''} ${properties.street || ''}`.trim()
      },
      scores: {
        hpd_score: Math.round(hpdScore * 10) / 10,
        dob_score: Math.round(dobScore * 10) / 10,
        overall_score: Math.round(overallScore * 10) / 10,
        hpd_violations_active: hpdActive,
        dob_violations_active: dobActive,
        elevator_devices: elevatorDevices,
        boiler_devices: boilerDevices,
        electrical_permits: electricalPermits
      },
      data: {
        hpd_violations: hpdViolations.slice(0, 50),
        dob_violations: dobViolations.slice(0, 50),
        elevator_data: elevatorData.slice(0, 50),
        boiler_data: boilerData.slice(0, 50),
        electrical_permits: electricalData.slice(0, 50)
      },
      generated_at: new Date().toISOString()
    };
    
    console.log(`[Compliance API] Report generated - Overall Score: ${reportData.scores.overall_score}%`);
    console.log(`[Compliance API] - HPD Violations: ${hpdActive}, DOB Violations: ${dobActive}`);
    console.log(`[Compliance API] - Elevators: ${elevatorDevices}, Boilers: ${boilerDevices}, Electrical Permits: ${electricalPermits}`);
    
    return res.status(200).json(reportData);

  } catch (error) {
    console.error('[Compliance API] Error:', error);
    console.error('[Compliance API] Stack:', error.stack);
    return res.status(500).json({
      error: 'Failed to generate compliance report',
      message: error.message || 'Unknown error',
      details: error.toString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
