#!/usr/bin/env python3
"""
Property Compliance Report API Service
Flask API that generates comprehensive property compliance reports
Supports: NYC and Philadelphia
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Import compliance systems
from generate_report import get_property_identifiers, get_comprehensive_compliance_data, calculate_scores
from generate_philly_report import generate_philly_report
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Property Compliance API',
        'supported_cities': ['NYC', 'Philadelphia']
    })

def detect_city(address: str) -> str:
    """Detect city from address string"""
    address_lower = address.lower()

    # Check for Philadelphia indicators
    if any(indicator in address_lower for indicator in ['philadelphia', 'philly', ', pa']):
        return 'Philadelphia'

    # Check for NYC indicators
    if any(indicator in address_lower for indicator in ['new york', 'nyc', 'brooklyn', 'queens', 'bronx', 'manhattan', 'staten island', ', ny']):
        return 'NYC'

    # Default to NYC if unclear
    return 'NYC'

@app.route('/api/compliance/generate', methods=['POST'])
def generate_compliance_report():
    """Generate comprehensive property compliance report for NYC or Philadelphia"""
    try:
        data = request.get_json()
        address = data.get('address')
        city = data.get('city')  # Optional: can be explicitly provided

        if not address:
            return jsonify({'error': 'Address is required'}), 400

        # Auto-detect city if not provided
        if not city:
            city = detect_city(address)

        print(f"[Python API] Generating {city} report for: {address}", file=sys.stderr)

        # Route to appropriate city handler
        if city.lower() in ['philadelphia', 'philly']:
            report = generate_philly_report(address)

            if 'error' in report:
                return jsonify(report), 404

            return jsonify(report)

        else:  # NYC (default)
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
                'city': 'NYC',
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
