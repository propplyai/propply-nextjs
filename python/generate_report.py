#!/usr/bin/env python3
"""
Wrapper script to generate NYC compliance reports
Uses the comprehensive property compliance system
"""

import sys
import json
import os

# Add the python directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the comprehensive system (we'll need to save the full script)
import asyncio
import requests
from datetime import datetime
from typing import Dict, List, Optional
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
        
        block = None
        lot = None
        bbl = pad_data.get('bbl')
        if bbl and len(bbl) >= 10:
            try:
                block = bbl[1:6].lstrip('0')
                lot = bbl[6:].lstrip('0')
            except:
                pass
        
        result_address = f"{properties.get('housenumber', '')} {properties.get('street', '')}".strip()
        print(f"[Address Lookup] Final result: {result_address}, BIN: {pad_data.get('bin')}", file=sys.stderr)
        
        return {
            'bin': pad_data.get('bin'),
            'bbl': bbl,
            'borough': properties.get('borough'),
            'block': block,
            'lot': lot,
            'address': result_address
        }
    except Exception as e:
        print(f"Error getting property identifiers: {e}", file=sys.stderr)
        return None

def get_comprehensive_compliance_data(identifiers):
    """Get comprehensive compliance data using multi-key search strategies"""
    client = NYCOpenDataClient.from_config()
    
    bin_num = identifiers.get('bin')
    block = identifiers.get('block')
    lot = identifiers.get('lot')
    bbl = identifiers.get('bbl')
    
    result = {
        'hpd_violations': [],
        'dob_violations': [],
        'elevator_data': [],
        'boiler_data': [],
        'electrical_permits': []
    }
    
    if not bin_num:
        return result
    
    # HPD Violations - Active only with multi-key search
    # CRITICAL: Only use BIN or BBL - Block/Lot can match wrong borough!
    strategies = []
    if bin_num:
        strategies.append(("BIN", f"bin = '{bin_num}' AND violationstatus = 'Open'"))
    if bbl:
        strategies.append(("BBL", f"bbl = '{bbl}' AND violationstatus = 'Open'"))
    
    for strategy_name, where_clause in strategies:
        try:
            data = client.get_data('hpd_violations', where=where_clause, limit=500)
            if data and len(data) > 0:
                # CRITICAL: Verify BIN matches to prevent wrong property data
                if bin_num:
                    data = [v for v in data if v.get('bin') == bin_num]
                    if len(data) == 0:
                        print(f"HPD {strategy_name} search returned data but BIN mismatch - skipping", file=sys.stderr)
                        continue
                result['hpd_violations'] = data
                print(f"Found {len(data)} HPD violations using {strategy_name}", file=sys.stderr)
                break
        except Exception as e:
            print(f"HPD {strategy_name} search failed: {e}", file=sys.stderr)
            continue
    
    # DOB Violations - Active only with multi-key search
    # CRITICAL: Only use BIN or BBL - Block/Lot can match wrong borough!
    strategies = []
    if bin_num:
        strategies.append(("BIN", f"bin = '{bin_num}' AND violation_category LIKE '%ACTIVE%'"))
    if bbl:
        strategies.append(("BBL", f"bbl = '{bbl}' AND violation_category LIKE '%ACTIVE%'"))
    
    for strategy_name, where_clause in strategies:
        try:
            data = client.get_data('dob_violations', where=where_clause, limit=500)
            if data and len(data) > 0:
                # CRITICAL: Verify BIN matches to prevent wrong property data
                if bin_num:
                    data = [r for r in data if r.get('bin') == bin_num]
                    if len(data) == 0:
                        print(f"DOB {strategy_name} search returned data but BIN mismatch - skipping", file=sys.stderr)
                        continue
                result['dob_violations'] = data
                print(f"Found {len(data)} DOB violations using {strategy_name}", file=sys.stderr)
                break
        except Exception as e:
            print(f"DOB {strategy_name} search failed: {e}", file=sys.stderr)
            continue
    
    # Elevator Inspections - BIN only to prevent wrong property data
    if bin_num:
        try:
            data = client.get_data('elevator_inspections', where=f"bin = '{bin_num}'", limit=500)
            if data and len(data) > 0:
                result['elevator_data'] = data
                print(f"Found {len(data)} elevator records using BIN", file=sys.stderr)
        except Exception as e:
            print(f"Elevator BIN search failed: {e}", file=sys.stderr)
    
    # Boiler Inspections - BIN only (dataset doesn't support other searches)
    if bin_num:
        try:
            data = client.get_data('boiler_inspections', where=f"bin_number = '{bin_num}'", limit=500)
            if data:
                result['boiler_data'] = data
                print(f"Found {len(data)} boiler records", file=sys.stderr)
        except Exception as e:
            print(f"Boiler search failed: {e}", file=sys.stderr)
    
    # Electrical Permits - Multi-key search
    strategies = []
    if bin_num:
        strategies.append(("BIN", f"bin = '{bin_num}'"))
    if block:
        borough_name = identifiers.get('borough', '').upper()
        if borough_name:
            strategies.append(("Borough/Block", f"borough = '{borough_name}' AND block = '{block}'"))
    
    for strategy_name, where_clause in strategies:
        try:
            data = client.get_data('electrical_permits', where=where_clause, limit=500)
            if data and len(data) > 0:
                result['electrical_permits'] = data
                print(f"Found {len(data)} electrical permits using {strategy_name}", file=sys.stderr)
                break
        except Exception as e:
            print(f"Electrical {strategy_name} search failed: {e}", file=sys.stderr)
            continue
    
    return result

def calculate_scores(data):
    """Calculate compliance scores"""
    hpd_active = len(data.get('hpd_violations', []))
    dob_active = len(data.get('dob_violations', []))
    
    hpd_score = max(0, 100 - (hpd_active * 10))
    dob_score = max(0, 100 - (dob_active * 15))
    overall_score = (hpd_score * 0.5) + (dob_score * 0.5)
    
    return {
        'hpd_score': round(hpd_score, 1),
        'dob_score': round(dob_score, 1),
        'overall_score': round(overall_score, 1),
        'hpd_violations_active': hpd_active,
        'dob_violations_active': dob_active,
        'elevator_devices': len(data.get('elevator_data', [])),
        'boiler_devices': len(data.get('boiler_data', [])),
        'electrical_permits': len(data.get('electrical_permits', []))
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Address required'}))
        sys.exit(1)
    
    address = sys.argv[1]
    
    # Get property identifiers
    identifiers = get_property_identifiers(address)
    if not identifiers or not identifiers.get('bin'):
        print(json.dumps({'error': 'Property not found or BIN not available'}))
        sys.exit(1)
    
    # Get compliance data
    compliance_data = get_comprehensive_compliance_data(identifiers)
    
    # Calculate scores
    scores = calculate_scores(compliance_data)
    
    # Build final report
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
    
    # Output JSON to stdout
    print(json.dumps(report))

if __name__ == "__main__":
    main()
