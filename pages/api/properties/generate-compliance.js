import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

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
    
    // Use Python script with comprehensive logic from user's scripts
    const scriptPath = path.join(process.cwd(), 'python', 'generate_report.py');
    const command = `python3 "${scriptPath}" "${address.replace(/"/g, '\\"')}"`;
    
    console.log(`[Compliance API] Executing: ${command}`);
    
    const env = {
      ...process.env,
      NYC_APP_TOKEN: process.env.NYC_APP_TOKEN || '',
      API_KEY_SECRET: process.env.API_KEY_SECRET || ''
    };
    
    const { stdout, stderr } = await execAsync(command, {
      env,
      timeout: 120000, // 2 minute timeout
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    if (stderr) {
      console.log('[Compliance API] Python stderr:', stderr);
    }
    
    // Parse JSON output from Python script
    const reportData = JSON.parse(stdout);
    
    if (!reportData.success) {
      return res.status(404).json({ error: reportData.error || 'Failed to generate report' });
    }
    
    console.log(`[Compliance API] Report generated successfully`);
    console.log(`[Compliance API] - Overall Score: ${reportData.scores.overall_score}%`);
    console.log(`[Compliance API] - HPD: ${reportData.scores.hpd_violations_active}, DOB: ${reportData.scores.dob_violations_active}`);
    console.log(`[Compliance API] - Elevators: ${reportData.scores.elevator_devices}, Boilers: ${reportData.scores.boiler_devices}, Electrical: ${reportData.scores.electrical_permits}`);
    
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
