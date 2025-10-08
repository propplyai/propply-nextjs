#!/usr/bin/env python3
"""
Philadelphia Property Finder
Similar to NYC property finder but for Philadelphia properties
"""

import re
from typing import List, Dict, Optional, Any
from philly_opendata_client import PhillyOpenDataClient
import logging

logger = logging.getLogger(__name__)

def parse_philly_address(address: str) -> Dict[str, str]:
    """
    Parse Philadelphia address into components
    
    Args:
        address: Full address string
        
    Returns:
        Dictionary with parsed address components
    """
    # Common Philadelphia address patterns
    patterns = [
        # "123 Main St, Philadelphia, PA 19101"
        r'^(\d+)\s+([^,]+),\s*(?:Philadelphia|Phila\.?),\s*PA\s*(\d{5})(?:-\d{4})?$',
        # "123 Main St, 19101"
        r'^(\d+)\s+([^,]+),\s*(\d{5})(?:-\d{4})?$',
        # "123 Main St Philadelphia PA 19101"
        r'^(\d+)\s+([^,]+)\s+(?:Philadelphia|Phila\.?)\s+PA\s*(\d{5})(?:-\d{4})?$',
        # "123 Main St"
        r'^(\d+)\s+(.+)$'
    ]
    
    address_clean = address.strip()
    
    for pattern in patterns:
        match = re.match(pattern, address_clean, re.IGNORECASE)
        if match:
            groups = match.groups()
            if len(groups) >= 3:
                return {
                    'house_number': groups[0],
                    'street_name': groups[1].strip(),
                    'zip_code': groups[2] if len(groups) > 2 else None,
                    'city': 'Philadelphia',
                    'state': 'PA'
                }
            elif len(groups) == 2:
                return {
                    'house_number': groups[0],
                    'street_name': groups[1].strip(),
                    'zip_code': None,
                    'city': 'Philadelphia',
                    'state': 'PA'
                }
    
    # Fallback - return original address
    return {
        'house_number': None,
        'street_name': address_clean,
        'zip_code': None,
        'city': 'Philadelphia',
        'state': 'PA'
    }

def search_property_by_address(client: PhillyOpenDataClient, address: str, 
                             zip_code: str = None) -> List[Dict]:
    """
    Search for Philadelphia properties by address
    
    Args:
        client: Philadelphia Open Data client
        address: Property address
        zip_code: Optional zip code filter
        
    Returns:
        List of matching property records
    """
    try:
        # Parse the address
        address_components = parse_philly_address(address)
        
        if not address_components['house_number'] or not address_components['street_name']:
            logger.warning(f"Insufficient address data: {address}")
            return []
        
        # Search in property assessments first (most comprehensive)
        matches = []
        
        # Try property assessments dataset
        assessment_matches = client.get_property_assessments(address)
        for record in assessment_matches:
            if _is_address_match(record, address_components):
                matches.append({
                    'address': _format_address(record),
                    'dataset': 'property_assessments',
                    'strategy': 'assessment_lookup',
                    'opa_account': record.get('opa_account'),
                    'market_value': record.get('market_value'),
                    'assessed_value': record.get('assessed_value'),
                    'land_area': record.get('land_area'),
                    'building_area': record.get('building_area'),
                    'year_built': record.get('year_built'),
                    'zoning': record.get('zoning'),
                    'use_code': record.get('use_code'),
                    'source_record': record
                })
        
        # If no matches in assessments, try building permits
        if not matches:
            permit_matches = client.get_building_permits(address)
            for record in permit_matches:
                if _is_address_match(record, address_components):
                    matches.append({
                        'address': _format_address(record),
                        'dataset': 'building_permits',
                        'strategy': 'permit_lookup',
                        'permit_number': record.get('permit_number'),
                        'permit_type': record.get('permit_type'),
                        'permit_issued_date': record.get('permitissuedate'),
                        'work_type': record.get('work_type'),
                        'contractor': record.get('contractor'),
                        'source_record': record
                    })
        
        # If still no matches, try building violations
        if not matches:
            violation_matches = client.get_building_violations(address)
            for record in violation_matches:
                if _is_address_match(record, address_components):
                    matches.append({
                        'address': _format_address(record),
                        'dataset': 'building_violations',
                        'strategy': 'violation_lookup',
                        'violation_number': record.get('violation_number'),
                        'violation_date': record.get('violation_date'),
                        'violation_type': record.get('violation_type'),
                        'status': record.get('status'),
                        'source_record': record
                    })
        
        return matches
        
    except Exception as e:
        logger.error(f"Error searching for property {address}: {e}")
        return []

def _is_address_match(record: Dict, address_components: Dict) -> bool:
    """
    Check if a record matches the address components
    
    Args:
        record: Property record from dataset
        address_components: Parsed address components
        
    Returns:
        True if the record matches the address
    """
    record_address = record.get('address', '').lower()
    house_number = address_components.get('house_number', '').lower()
    street_name = address_components.get('street_name', '').lower()
    
    # Check if house number and street name are in the record address
    return (house_number in record_address and 
            any(word in record_address for word in street_name.split()))

def _format_address(record: Dict) -> str:
    """
    Format address from record data
    
    Args:
        record: Property record
        
    Returns:
        Formatted address string
    """
    address = record.get('address', '')
    if address:
        return address
    
    # Try to construct from components
    house_number = record.get('house_number', '')
    street_name = record.get('street_name', '')
    city = record.get('city', 'Philadelphia')
    state = record.get('state', 'PA')
    zip_code = record.get('zip_code', '')
    
    parts = []
    if house_number:
        parts.append(house_number)
    if street_name:
        parts.append(street_name)
    if city:
        parts.append(city)
    if state:
        parts.append(state)
    if zip_code:
        parts.append(zip_code)
    
    return ', '.join(parts) if parts else 'Unknown Address'

def get_property_compliance(client: PhillyOpenDataClient, address: str) -> Dict[str, Any]:
    """
    Get comprehensive compliance information for a Philadelphia property
    
    Args:
        client: Philadelphia Open Data client
        address: Property address
        
    Returns:
        Dictionary with compliance information
    """
    try:
        compliance_data = {
            'address': address,
            'city': 'Philadelphia',
            'compliance_summary': {
                'total_violations': 0,
                'open_violations': 0,
                'recent_permits': 0,
                'fire_inspections': 0,
                'compliance_score': 100
            },
            'violations': [],
            'permits': [],
            'fire_inspections': [],
            'housing_violations': [],
            'zoning_info': {}
        }
        
        # Get building violations
        violations = client.get_building_violations(address)
        compliance_data['violations'] = violations
        compliance_data['compliance_summary']['total_violations'] = len(violations)
        compliance_data['compliance_summary']['open_violations'] = len([
            v for v in violations if v.get('status', '').lower() in ['open', 'active']
        ])
        
        # Get building permits (last 2 years)
        from datetime import datetime, timedelta
        two_years_ago = (datetime.now() - timedelta(days=730)).strftime('%Y-%m-%d')
        permits = client.get_building_permits(address, start_date=two_years_ago)
        compliance_data['permits'] = permits
        compliance_data['compliance_summary']['recent_permits'] = len(permits)
        
        # Get fire inspections
        fire_inspections = client.get_fire_inspections(address)
        compliance_data['fire_inspections'] = fire_inspections
        compliance_data['compliance_summary']['fire_inspections'] = len(fire_inspections)
        
        # Get housing violations
        housing_violations = client.get_housing_violations(address)
        compliance_data['housing_violations'] = housing_violations
        
        # Get zoning information
        zoning_info = client.get_zoning_info(address)
        if zoning_info:
            compliance_data['zoning_info'] = zoning_info[0] if zoning_info else {}
        
        # Calculate compliance score
        compliance_score = 100
        compliance_score -= len(compliance_data['violations']) * 5  # -5 per violation
        compliance_score -= len(compliance_data['housing_violations']) * 3  # -3 per housing violation
        compliance_score = max(0, compliance_score)  # Don't go below 0
        
        compliance_data['compliance_summary']['compliance_score'] = compliance_score
        
        return compliance_data
        
    except Exception as e:
        logger.error(f"Error getting compliance for {address}: {e}")
        return {
            'address': address,
            'city': 'Philadelphia',
            'error': str(e),
            'compliance_summary': {
                'compliance_score': 0,
                'total_violations': 0,
                'open_violations': 0,
                'recent_permits': 0,
                'fire_inspections': 0
            }
        }

def get_property_details(client: PhillyOpenDataClient, address: str) -> Dict[str, Any]:
    """
    Get detailed property information including assessments and characteristics
    
    Args:
        client: Philadelphia Open Data client
        address: Property address
        
    Returns:
        Dictionary with detailed property information
    """
    try:
        # Get property assessments
        assessments = client.get_property_assessments(address)
        
        if not assessments:
            return {'address': address, 'error': 'No assessment data found'}
        
        # Use the first assessment record
        assessment = assessments[0]
        
        property_details = {
            'address': _format_address(assessment),
            'opa_account': assessment.get('opa_account'),
            'market_value': assessment.get('market_value'),
            'assessed_value': assessment.get('assessed_value'),
            'land_area': assessment.get('land_area'),
            'building_area': assessment.get('building_area'),
            'year_built': assessment.get('year_built'),
            'zoning': assessment.get('zoning'),
            'use_code': assessment.get('use_code'),
            'use_description': assessment.get('use_description'),
            'total_livable_area': assessment.get('total_livable_area'),
            'basement': assessment.get('basement'),
            'fireplaces': assessment.get('fireplaces'),
            'garage_spaces': assessment.get('garage_spaces'),
            'garage_type': assessment.get('garage_type'),
            'exterior_condition': assessment.get('exterior_condition'),
            'interior_condition': assessment.get('interior_condition'),
            'basement_finished': assessment.get('basement_finished'),
            'attic_finished': assessment.get('attic_finished'),
            'central_air': assessment.get('central_air'),
            'fuel': assessment.get('fuel'),
            'heating': assessment.get('heating'),
            'sewer': assessment.get('sewer'),
            'water': assessment.get('water'),
            'source_record': assessment
        }
        
        return property_details
        
    except Exception as e:
        logger.error(f"Error getting property details for {address}: {e}")
        return {'address': address, 'error': str(e)}

# Example usage
if __name__ == "__main__":
    client = PhillyOpenDataClient()
    
    # Test address search
    test_address = "1234 Market St, Philadelphia, PA 19107"
    print(f"Searching for: {test_address}")
    
    matches = search_property_by_address(client, test_address)
    print(f"Found {len(matches)} matches")
    
    for match in matches:
        print(f"- {match['address']} ({match['dataset']})")
    
    # Test compliance check
    if matches:
        compliance = get_property_compliance(client, test_address)
        print(f"\nCompliance Score: {compliance['compliance_summary']['compliance_score']}")
        print(f"Violations: {compliance['compliance_summary']['total_violations']}")
        print(f"Recent Permits: {compliance['compliance_summary']['recent_permits']}")

