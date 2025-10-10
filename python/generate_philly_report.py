#!/usr/bin/env python3
"""
Philadelphia Compliance Report Generator
Generates comprehensive compliance reports for Philadelphia properties
"""

import sys
import json
import os
from datetime import datetime
from typing import Dict, List, Optional
from philly_data import PhillyEnhancedDataClient

def get_philly_property_identifiers(address: str) -> Optional[Dict]:
    """
    Get Philadelphia property identifiers
    Note: Philadelphia doesn't have a direct geocoding API like NYC's GeoSearch
    We'll use the address directly with the L&I data APIs
    """
    try:
        # For now, return the address as-is
        # The Philly APIs accept address-based queries
        return {
            'address': address,
            'opa_account': None,  # Could be fetched from property assessment data
            'parcel_id': None
        }
    except Exception as e:
        print(f"Error getting Philadelphia property identifiers: {e}", file=sys.stderr)
        return None

def get_philly_compliance_data(address: str) -> Dict:
    """Get comprehensive Philadelphia L&I compliance data"""
    client = PhillyEnhancedDataClient()

    try:
        # Get comprehensive property data
        property_data = client.get_comprehensive_property_data(address)

        return {
            'li_permits': property_data.get('permits', {}).get('records', []),
            'li_violations': property_data.get('violations', {}).get('records', []),
            'li_certifications': property_data.get('certifications', {}).get('records', []),
            'certification_summary': property_data.get('certification_summary', {}).get('records', []),
            'li_investigations': property_data.get('investigations', {}).get('records', []),
            'li_appeals': property_data.get('appeals', {}).get('records', []),
            'compliance_summary': property_data.get('compliance_summary', {}),
            'data_retrieved_at': property_data.get('data_retrieved_at'),
            'data_period': property_data.get('data_period', 'Last 3 years')
        }
    except Exception as e:
        print(f"Error getting Philadelphia compliance data: {e}", file=sys.stderr)
        return {
            'li_permits': [],
            'li_violations': [],
            'li_certifications': [],
            'certification_summary': [],
            'li_investigations': [],
            'li_appeals': [],
            'compliance_summary': {},
            'data_retrieved_at': datetime.now().isoformat(),
            'data_period': 'Last 3 years'
        }

def calculate_philly_scores(compliance_data: Dict) -> Dict:
    """Calculate compliance scores for Philadelphia property"""

    # Extract data
    permits = compliance_data.get('li_permits', [])
    violations = compliance_data.get('li_violations', [])
    certifications = compliance_data.get('li_certifications', [])
    cert_summary = compliance_data.get('certification_summary', [])
    investigations = compliance_data.get('li_investigations', [])
    appeals = compliance_data.get('li_appeals', [])

    # Count active violations (open/active status)
    active_violations = len([
        v for v in violations
        if v.get('status', '').upper() in ['OPEN', 'ACTIVE', 'IN VIOLATION']
    ])

    # Count recent permits (last 2 years)
    from datetime import datetime, timedelta
    two_years_ago = (datetime.now() - timedelta(days=730)).strftime('%Y-%m-%d')
    recent_permits = len([
        p for p in permits
        if p.get('permitissuedate', '') >= two_years_ago
    ])

    # Count active vs expired certifications
    active_certs = len([
        c for c in certifications
        if c.get('status', '').upper() in ['ACTIVE', 'CURRENT', 'VALID']
    ])

    expired_certs = len([
        c for c in certifications
        if c.get('status', '').upper() in ['EXPIRED', 'INACTIVE']
    ])

    # Use the pre-calculated compliance score from the client if available
    overall_score = compliance_data.get('compliance_summary', {}).get('compliance_score', 0)

    # If no pre-calculated score, calculate a basic one
    if overall_score == 0:
        overall_score = 100
        # Deduct points for violations
        overall_score -= min(active_violations * 10, 50)
        # Deduct points for expired certifications
        overall_score -= min(expired_certs * 5, 20)
        # Add points for recent permits (compliance activity)
        overall_score += min(recent_permits * 2, 10)
        # Ensure score is between 0-100
        overall_score = max(0, min(100, overall_score))

    return {
        'overall_score': overall_score,
        'li_permits_total': len(permits),
        'li_permits_recent': recent_permits,
        'li_violations_active': active_violations,
        'li_violations_total': len(violations),
        'li_certifications_active': active_certs,
        'li_certifications_expired': expired_certs,
        'li_investigations_total': len(investigations),
        'li_appeals_total': len(appeals),
        'compliance_score': overall_score
    }

def generate_philly_report(address: str) -> Dict:
    """Generate complete Philadelphia compliance report"""

    print(f"[Philly API] Generating report for: {address}", file=sys.stderr)

    # Get property identifiers
    identifiers = get_philly_property_identifiers(address)
    if not identifiers:
        return {
            'error': 'Could not process Philadelphia address',
            'city': 'Philadelphia'
        }

    print(f"[Philly API] Processing address: {identifiers.get('address')}", file=sys.stderr)

    # Get compliance data
    compliance_data = get_philly_compliance_data(address)

    # Calculate scores
    scores = calculate_philly_scores(compliance_data)

    print(f"[Philly API] Report complete - Score: {scores['overall_score']}%", file=sys.stderr)
    print(f"[Philly API] - Period: {compliance_data.get('data_period', 'Last 3 years')}", file=sys.stderr)
    print(f"[Philly API] - Violations: {scores['li_violations_active']} active / {scores['li_violations_total']} total", file=sys.stderr)
    print(f"[Philly API] - Permits: {scores['li_permits_recent']} recent / {scores['li_permits_total']} total", file=sys.stderr)
    print(f"[Philly API] - Certifications: {scores['li_certifications_active']} active, {scores['li_certifications_expired']} expired", file=sys.stderr)
    print(f"[Philly API] - Appeals: {scores['li_appeals_total']} total", file=sys.stderr)

    # Build response
    report = {
        'success': True,
        'city': 'Philadelphia',
        'property': identifiers,
        'scores': scores,
        'data': {
            'li_permits': compliance_data['li_permits'][:50],  # Limit to 50 records
            'li_violations': compliance_data['li_violations'][:50],
            'li_certifications': compliance_data['li_certifications'][:50],
            'certification_summary': compliance_data['certification_summary'][:50],
            'li_investigations': compliance_data['li_investigations'][:50],
            'li_appeals': compliance_data['li_appeals'][:50]
        },
        'generated_at': compliance_data.get('data_retrieved_at', datetime.now().isoformat()),
        'data_period': compliance_data.get('data_period', 'Last 3 years')
    }

    return report
