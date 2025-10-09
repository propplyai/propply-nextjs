// Proxy API that calls the Python compliance service on Render
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address, propertyId, city } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    console.log(`[Compliance API] Requesting ${city || 'auto-detect'} report for: ${address}`);

    // Call Python service (will be deployed separately on Render)
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';
    const apiUrl = `${pythonServiceUrl}/api/compliance/generate`;

    console.log(`[Compliance API] Calling Python service at: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address,
        city // Pass city to Python service for explicit routing
      }),
      timeout: 120000 // 2 minute timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Compliance API] Python service error:', errorData);
      return res.status(response.status).json(errorData);
    }

    const reportData = await response.json();
    
    console.log(`[Compliance API] Report received - Score: ${reportData.scores?.overall_score}%`);
    
    return res.status(200).json(reportData);

  } catch (error) {
    console.error('[Compliance API] Error:', error);
    return res.status(500).json({
      error: 'Failed to generate compliance report',
      message: error.message || 'Unknown error',
      details: error.toString()
    });
  }
}
