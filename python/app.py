#!/usr/bin/env python3
"""
NYC Compliance Report API Service
Flask API that generates comprehensive NYC property compliance reports
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Import our comprehensive compliance system
from generate_report import get_property_identifiers, get_comprehensive_compliance_data, calculate_scores
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'NYC Compliance API'})

@app.route('/api/compliance/generate', methods=['POST'])
def generate_compliance_report():
    """Generate comprehensive NYC property compliance report"""
    try:
        data = request.get_json()
        address = data.get('address')
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400
        
        print(f"[Python API] Generating report for: {address}", file=sys.stderr)
        
        # Get property identifiers
        identifiers = get_property_identifiers(address)
        if not identifiers or not identifiers.get('bin'):
            return jsonify({'error': 'Property not found or BIN not available'}), 404
        
        print(f"[Python API] Found property - BIN: {identifiers.get('bin')}", file=sys.stderr)
        
        # Get comprehensive compliance data using multi-key search strategies
        compliance_data = get_comprehensive_compliance_data(identifiers)
        
        # Calculate scores
        scores = calculate_scores(compliance_data)
        
        # Build response
        report = {
            'success': True,
            'property': identifiers,
            'scores': scores,
            'data': {
                'hpd_violations': compliance_data['hpd_violations'][:50],
                'dob_violations': compliance_data['dob_violations'][:50],
                'elevator_data': compliance_data['elevator_data'][:50],
                'boiler_data': compliance_data['boiler_data'][:50],
                'electrical_permits': compliance_data['electrical_permits'][:50]
            },
            'generated_at': datetime.now().isoformat()
        }
        
        print(f"[Python API] Report complete - Score: {scores['overall_score']}%", file=sys.stderr)
        print(f"[Python API] - HPD: {scores['hpd_violations_active']}, DOB: {scores['dob_violations_active']}", file=sys.stderr)
        print(f"[Python API] - Elevators: {scores['elevator_devices']}, Boilers: {scores['boiler_devices']}, Electrical: {scores['electrical_permits']}", file=sys.stderr)
        
        return jsonify(report)
    
    except Exception as e:
        print(f"[Python API] Error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to generate compliance report',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
