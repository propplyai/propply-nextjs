// Direct API implementation without Python dependency
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address, propertyId } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    console.log(`Generating compliance report for: ${address}`);
    
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
    const hpdViolations = await hpdResponse.json();
    
    // Fetch DOB Violations (active only)
    const dobUrl = `https://data.cityofnewyork.us/resource/3h2n-5cm9.json?bin=${bin}&$where=violation_category LIKE '%ACTIVE%'&$limit=100`;
    const dobResponse = await fetch(dobUrl, { headers });
    const dobViolations = await dobResponse.json();
    
    // Calculate scores
    const hpdActive = Array.isArray(hpdViolations) ? hpdViolations.length : 0;
    const dobActive = Array.isArray(dobViolations) ? dobViolations.length : 0;
    
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
        dob_violations_active: dobActive
      },
      data: {
        hpd_violations: hpdViolations.slice(0, 50),
        dob_violations: dobViolations.slice(0, 50)
      },
      generated_at: new Date().toISOString()
    };
    
    console.log(`Report generated - Overall Score: ${reportData.scores.overall_score}%, HPD: ${hpdActive}, DOB: ${dobActive}`);
    
    return res.status(200).json(reportData);

  } catch (error) {
    console.error('Error generating compliance report:', error);
    return res.status(500).json({
      error: 'Failed to generate compliance report',
      message: error.message,
      details: error.toString()
    });
  }
}
