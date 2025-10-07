import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address, propertyId } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    // Path to Python script
    const scriptPath = path.join(process.cwd(), 'python', 'generate_compliance_report.py');
    
    // Set environment variables for Python script
    const env = {
      ...process.env,
      NYC_APP_TOKEN: process.env.NYC_APP_TOKEN || '',
      API_KEY_SECRET: process.env.API_KEY_SECRET || ''
    };

    // Execute Python script
    const command = `python3 "${scriptPath}" "${address}"`;
    
    console.log(`Generating compliance report for: ${address}`);
    
    const { stdout, stderr } = await execAsync(command, {
      env,
      timeout: 120000, // 2 minute timeout
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    if (stderr && !stderr.includes('Warning')) {
      console.error('Python script stderr:', stderr);
    }

    // Parse the JSON output from Python script
    try {
      const reportData = JSON.parse(stdout);
      
      return res.status(200).json({
        success: true,
        data: reportData,
        message: 'Compliance report generated successfully'
      });
    } catch (parseError) {
      console.error('Failed to parse Python output:', stdout);
      return res.status(500).json({
        error: 'Failed to parse report data',
        details: stdout.substring(0, 500)
      });
    }

  } catch (error) {
    console.error('Error generating compliance report:', error);
    return res.status(500).json({
      error: 'Failed to generate compliance report',
      message: error.message
    });
  }
}
