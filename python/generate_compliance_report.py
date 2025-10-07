#!/usr/bin/env python3
"""
NYC Property Compliance Report Generator
Generates comprehensive compliance reports for NYC properties
"""

import os
import sys
import json
import requests
from datetime import datetime
from NYC_data import NYCOpenDataClient

def get_property_identifiers(address):
    """Get property identifiers using NYC Planning GeoSearch API"""
    base_url = "https://geosearch.planninglabs.nyc/v2"
    
    try:
        params = {'text': address, 'size': 1}
        response = requests.get(f"{base_url}/search", params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if not data.get('features'):
            return None
        
        feature = data['features'][0]
        properties = feature.get('properties', {})
        pad_data = properties.get('addendum', {}).get('pad', {})
        
        return {
            'bin': pad_data.get('bin'),
            'bbl': pad_data.get('bbl'),
            'borough': properties.get('borough'),
            'address': f"{properties.get('housenumber', '')} {properties.get('street', '')}".strip()
        }
    except Exception as e:
        print(f"Error getting property identifiers: {e}", file=sys.stderr)
        return None

def get_compliance_data(identifiers):
    """Get compliance data from NYC Open Data"""
    client = NYCOpenDataClient.from_config()
    data = {
        'hpd_violations': [],
        'dob_violations': [],
        'elevator_data': [],
        'boiler_data': [],
        'electrical_permits': []
    }
    
    bin_num = identifiers.get('bin')
    
    if not bin_num:
        return data
    
    # HPD Violations (active only)
    try:
        hpd = client.get_data(
            'hpd_violations',
            where=f"bin = '{bin_num}' AND violationstatus = 'Open'",
            limit=500
        )
        data['hpd_violations'] = hpd if hpd else []
    except Exception as e:
        print(f"Error fetching HPD violations: {e}", file=sys.stderr)
    
    # DOB Violations (active only)
    try:
        dob = client.get_data(
            'dob_violations',
            where=f"bin = '{bin_num}' AND violation_category LIKE '%ACTIVE%'",
            limit=500
        )
        data['dob_violations'] = dob if dob else []
    except Exception as e:
        print(f"Error fetching DOB violations: {e}", file=sys.stderr)
    
    # Elevator Inspections
    try:
        elevators = client.get_data(
            'elevator_inspections',
            where=f"bin = '{bin_num}'",
            limit=500
        )
        data['elevator_data'] = elevators if elevators else []
    except Exception as e:
        print(f"Error fetching elevator data: {e}", file=sys.stderr)
    
    # Boiler Inspections
    try:
        boilers = client.get_data(
            'boiler_inspections',
            where=f"bin_number = '{bin_num}'",
            limit=500
        )
        data['boiler_data'] = boilers if boilers else []
    except Exception as e:
        print(f"Error fetching boiler data: {e}", file=sys.stderr)
    
    # Electrical Permits
    try:
        electrical = client.get_data(
            'electrical_permits',
            where=f"bin = '{bin_num}'",
            limit=500
        )
        data['electrical_permits'] = electrical if electrical else []
    except Exception as e:
        print(f"Error fetching electrical permits: {e}", file=sys.stderr)
    
    return data

def calculate_compliance_score(data):
    """Calculate compliance scores"""
    hpd_active = len(data['hpd_violations'])
    dob_active = len(data['dob_violations'])
    
    # Calculate scores
    hpd_score = max(0, 100 - (hpd_active * 10)) if hpd_active > 0 else 100
    dob_score = max(0, 100 - (dob_active * 15)) if dob_active > 0 else 100
    
    overall_score = (hpd_score * 0.5) + (dob_score * 0.5)
    
    return {
        'hpd_score': round(hpd_score, 1),
        'dob_score': round(dob_score, 1),
        'overall_score': round(overall_score, 1),
        'hpd_violations_active': hpd_active,
        'dob_violations_active': dob_active,
        'elevator_devices': len(data['elevator_data']),
        'boiler_devices': len(data['boiler_data']),
        'electrical_permits': len(data['electrical_permits'])
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Address required'}))
        sys.exit(1)
    
    address = sys.argv[1]
    
    # Get property identifiers
    identifiers = get_property_identifiers(address)
    if not identifiers:
        print(json.dumps({'error': 'Property not found'}))
        sys.exit(1)
    
    # Get compliance data
    compliance_data = get_compliance_data(identifiers)
    
    # Calculate scores
    scores = calculate_compliance_score(compliance_data)
    
    # Build final report
    report = {
        'success': True,
        'property': identifiers,
        'scores': scores,
        'data': {
            'hpd_violations': compliance_data['hpd_violations'][:50],  # Limit to 50 most recent
            'dob_violations': compliance_data['dob_violations'][:50],
            'elevator_data': compliance_data['elevator_data'][:20],
            'boiler_data': compliance_data['boiler_data'][:20],
            'electrical_permits': compliance_data['electrical_permits'][:20]
        },
        'generated_at': datetime.now().isoformat()
    }
    
    # Output JSON to stdout
    print(json.dumps(report))

if __name__ == "__main__":
    main()
