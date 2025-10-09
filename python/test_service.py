#!/usr/bin/env python3
"""Test script for the consolidated compliance service"""

import sys
from generate_philly_report import generate_philly_report
from generate_report import get_property_identifiers, get_comprehensive_compliance_data, calculate_scores

def test_philadelphia():
    """Test Philadelphia compliance report generation"""
    print("\n" + "="*60)
    print("Testing Philadelphia Compliance Report")
    print("="*60)

    test_address = "1431 Spruce St, Philadelphia, PA 19102"
    print(f"\nTest Address: {test_address}")

    try:
        report = generate_philly_report(test_address)

        if 'error' in report:
            print(f"❌ Error: {report['error']}")
            return False

        print(f"\n✅ Report Generated Successfully!")
        print(f"   City: {report.get('city')}")
        print(f"   Overall Score: {report.get('scores', {}).get('overall_score')}%")
        print(f"   Active Violations: {report.get('scores', {}).get('li_violations_active')}")
        print(f"   Total Permits: {report.get('scores', {}).get('li_permits_total')}")
        print(f"   Active Certifications: {report.get('scores', {}).get('li_certifications_active')}")

        return True

    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_nyc():
    """Test NYC compliance report generation"""
    print("\n" + "="*60)
    print("Testing NYC Compliance Report")
    print("="*60)

    test_address = "350 5th Ave, New York, NY 10118"  # Empire State Building
    print(f"\nTest Address: {test_address}")

    try:
        identifiers = get_property_identifiers(test_address)

        if not identifiers:
            print("❌ Could not get property identifiers")
            return False

        print(f"\n✅ Property Identifiers Found:")
        print(f"   BIN: {identifiers.get('bin')}")
        print(f"   BBL: {identifiers.get('bbl')}")
        print(f"   Borough: {identifiers.get('borough')}")

        # Note: We're just testing identifier lookup, not full report
        # to avoid hitting NYC APIs in this test

        return True

    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("\n🧪 Testing Consolidated Compliance Service")
    print("=" * 60)

    # Test Philadelphia
    philly_passed = test_philadelphia()

    # Test NYC
    nyc_passed = test_nyc()

    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    print(f"Philadelphia: {'✅ PASSED' if philly_passed else '❌ FAILED'}")
    print(f"NYC: {'✅ PASSED' if nyc_passed else '❌ FAILED'}")
    print("="*60 + "\n")

    sys.exit(0 if (philly_passed and nyc_passed) else 1)
