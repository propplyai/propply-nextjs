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

def normalize_house_number(house_num):
    """Normalize house number for comparison (e.g., '60-48' or '6048')"""
    if not house_num:
        return None
    # Remove spaces, hyphens, and convert to lowercase
    return str(house_num).replace('-', '').replace(' ', '').lower()

def extract_house_number(address):
    """Extract house number from address string"""
    import re
    # Match patterns like "60-48" or "6048" at the start
    match = re.match(r'^([\d-]+)', address.strip())
    if match:
        return match.group(1)
    return None

def get_property_identifiers(address):
    """Get property identifiers using NYC Planning GeoSearch API with validation"""
    base_url = "https://geosearch.planninglabs.nyc/v2"
    
    try:
        # Get multiple results to find the best match
        params = {'text': address, 'size': 10}
        response = requests.get(f"{base_url}/search", params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if not data.get('features'):
            return None
        
        # Extract house number from input address for validation
        input_house_num = extract_house_number(address)
        input_normalized = normalize_house_number(input_house_num)
        
        print(f"[Address Lookup] Input address: {address}", file=sys.stderr)
        print(f"[Address Lookup] Extracted house number: {input_house_num} (normalized: {input_normalized})", file=sys.stderr)
        print(f"[Address Lookup] Found {len(data['features'])} potential matches", file=sys.stderr)
        
        # Find the best matching feature
        best_match = None
        for idx, feature in enumerate(data['features']):
            properties = feature.get('properties', {})
            api_house_num = properties.get('housenumber', '')
            api_normalized = normalize_house_number(api_house_num)
            api_street = properties.get('street', '')
            
            print(f"[Address Lookup] Match {idx + 1}: {api_house_num} {api_street} (normalized: {api_normalized})", file=sys.stderr)
            
            # Check if house numbers match
            if input_normalized and api_normalized and input_normalized == api_normalized:
                print(f"[Address Lookup] ✓ Found exact house number match: {api_house_num} {api_street}", file=sys.stderr)
                best_match = feature
                break
        
        # If no exact match found, use first result but warn
        if not best_match:
            print(f"[Address Lookup] ⚠ WARNING: No exact house number match found. Using first result.", file=sys.stderr)
            best_match = data['features'][0]
        
        properties = best_match.get('properties', {})
        pad_data = properties.get('addendum', {}).get('pad', {})
        
        result_address = f"{properties.get('housenumber', '')} {properties.get('street', '')}".strip()
        print(f"[Address Lookup] Final result: {result_address}, BIN: {pad_data.get('bin')}", file=sys.stderr)
        
        return {
            'bin': pad_data.get('bin'),
            'bbl': pad_data.get('bbl'),
            'borough': properties.get('borough'),
            'address': result_address
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
