#!/usr/bin/env python3
"""
Enhanced Philadelphia Data Client
Based on comprehensive research of Philadelphia Open Data APIs
Implements the specific datasets identified for property compliance
"""

import requests
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging
from urllib.parse import urlencode

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PhillyEnhancedDataClient:
    """
    Enhanced client for Philadelphia Open Data APIs
    Based on comprehensive research of available datasets
    """
    
    def __init__(self, app_token: Optional[str] = None):
        """
        Initialize Philadelphia Enhanced Data client
        
        Args:
            app_token: Optional app token for higher rate limits
        """
        # Carto SQL API base URL for L&I data
        self.carto_base_url = "https://phl.carto.com/api/v2/sql"
        
        # ArcGIS REST API base URLs
        self.arcgis_building_certs_url = "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/BUILDING_CERTS/FeatureServer/0/query"
        self.arcgis_building_certs_summary_url = "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/BUILDING_CERTS_SUMMARY/FeatureServer/0/query"
        
        # Data.phila.gov Socrata base URL
        self.socrata_base_url = "https://data.phila.gov/resource"
        
        self.app_token = app_token or os.getenv('PHILLY_APP_TOKEN')
        self.session = requests.Session()
        
        # Set headers
        self.session.headers.update({
            'User-Agent': 'PropplyAI/1.0 (Property Compliance Management)',
            'Accept': 'application/json'
        })
        
        if self.app_token:
            self.session.headers.update({'X-App-Token': self.app_token})
    
    def _make_carto_query(self, sql_query: str) -> List[Dict]:
        """
        Execute a SQL query against Carto API
        
        Args:
            sql_query: SQL query string
            
        Returns:
            List of records from the query
        """
        try:
            params = {'q': sql_query}
            response = self.session.get(self.carto_base_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            return data.get('rows', [])
            
        except Exception as e:
            logger.error(f"Error executing Carto query: {e}")
            return []
    
    def _make_arcgis_query(self, url: str, params: Dict) -> List[Dict]:
        """
        Execute a query against ArcGIS REST API
        
        Args:
            url: ArcGIS REST API endpoint
            params: Query parameters
            
        Returns:
            List of features from the query
        """
        try:
            # Add default parameters for ArcGIS
            default_params = {
                'f': 'json',
                'outFields': '*',
                'returnGeometry': 'false'
            }
            default_params.update(params)
            
            response = self.session.get(url, params=default_params)
            response.raise_for_status()
            
            data = response.json()
            return data.get('features', [])
            
        except Exception as e:
            logger.error(f"Error executing ArcGIS query: {e}")
            return []
    
    def get_li_building_permits(self, address: str = None, 
                               start_date: str = None, end_date: str = None,
                               permit_type: str = None) -> List[Dict]:
        """
        Get L&I Building & Zoning Permits (2007–Present)
        
        This dataset includes comprehensive permit records for construction and related activities
        issued by the Department of Licenses & Inspections (L&I). Includes building permits
        (structural work, equipment installations) and zoning permits (land use approvals).
        
        Args:
            address: Filter by address (partial match)
            start_date: Filter permits from this date (YYYY-MM-DD)
            end_date: Filter permits to this date (YYYY-MM-DD)
            permit_type: Filter by permit type (e.g., 'Residential Building Permit', 'Mechanical')
            
        Returns:
            List of building permit records
        """
        try:
            # Build SQL query for Carto API
            where_conditions = []
            
            if address:
                # Extract just the street address part (before comma)
                street_address = address.split(',')[0].strip()
                where_conditions.append(f"address ILIKE '%{street_address}%'")
            
            if start_date:
                where_conditions.append(f"permitissuedate >= '{start_date}'")
            
            if end_date:
                where_conditions.append(f"permitissuedate <= '{end_date}'")
            
            if permit_type:
                where_conditions.append(f"permittype ILIKE '%{permit_type}%'")
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            sql_query = f"""
                SELECT 
                    permitnumber,
                    permittype,
                    permitissuedate,
                    permitdescription,
                    address,
                    contractorname as contractor,
                    status,
                    permitissuedate as applicationdate,
                    parcel_id_num as bin,
                    opa_account_num as opa_account
                FROM permits 
                WHERE {where_clause}
                ORDER BY permitissuedate DESC
                LIMIT 1000
            """
            
            return self._make_carto_query(sql_query)
            
        except Exception as e:
            logger.error(f"Error getting L&I building permits: {e}")
            return []
    
    def get_li_code_violations(self, address: str = None, 
                              status: str = None, 
                              violation_type: str = None,
                              start_date: str = None) -> List[Dict]:
        """
        Get L&I Code Violations (Property Violations)
        
        All code enforcement violations issued by L&I for building safety, property maintenance,
        and other code non-compliance. Covers violations of Philadelphia's Building Construction
        and Occupancy Code.
        
        Args:
            address: Filter by address (partial match)
            status: Filter by violation status (e.g., 'open', 'corrected', 'complied')
            violation_type: Filter by violation type/category
            start_date: Filter violations from this date (YYYY-MM-DD)
            
        Returns:
            List of code violation records
        """
        try:
            where_conditions = []
            
            if address:
                # Extract just the street address part (before comma)
                street_address = address.split(',')[0].strip()
                where_conditions.append(f"address ILIKE '%{street_address}%'")
            
            if status:
                where_conditions.append(f"violationstatus = '{status}'")
            
            if violation_type:
                where_conditions.append(f"violationcodetitle ILIKE '%{violation_type}%'")
            
            if start_date:
                where_conditions.append(f"violationdate >= '{start_date}'")
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            sql_query = f"""
                SELECT 
                    violationnumber as violationid,
                    violationdate,
                    violationcodetitle as violationtype,
                    violationcode as violationdescription,
                    violationstatus as status,
                    address,
                    parcel_id_num as bin,
                    opa_account_num as opa_account,
                    caseresponsibility as inspector,
                    violationresolutiondate as compliance_date
                FROM violations 
                WHERE {where_clause}
                ORDER BY violationdate DESC
                LIMIT 1000
            """
            
            return self._make_carto_query(sql_query)
            
        except Exception as e:
            logger.error(f"Error getting L&I code violations: {e}")
            return []
    
    def get_li_building_certifications(self, address: str = None, 
                                     certification_type: str = None,
                                     status: str = None) -> List[Dict]:
        """
        Get L&I Building Certifications (Periodic Inspection Records)
        
        Records of required periodic safety inspections for certain building systems and structures.
        Covers fire protection systems, facade inspections, fire escapes, etc.
        
        Args:
            address: Filter by address (partial match)
            certification_type: Filter by certification type (e.g., 'Sprinkler Certification', 'Fire Alarm Certification')
            status: Filter by certification status (e.g., 'Active', 'Expired')
            
        Returns:
            List of building certification records
        """
        try:
            params = {}
            
            if address:
                # Extract just the street address part (before comma)
                street_address = address.split(',')[0].strip()
                params['where'] = f"address ILIKE '%{street_address}%'"
            
            if certification_type:
                if 'where' in params:
                    params['where'] += f" AND cert_type ILIKE '%{certification_type}%'"
                else:
                    params['where'] = f"cert_type ILIKE '%{certification_type}%'"
            
            if status:
                if 'where' in params:
                    params['where'] += f" AND status = '{status}'"
                else:
                    params['where'] = f"status = '{status}'"
            
            features = self._make_arcgis_query(self.arcgis_building_certs_url, params)
            
            # Extract attributes from ArcGIS features
            return [feature.get('attributes', {}) for feature in features]
            
        except Exception as e:
            logger.error(f"Error getting L&I building certifications: {e}")
            return []
    
    def get_li_building_certification_summary(self, address: str = None) -> List[Dict]:
        """
        Get L&I Building Certification Summary (Compliance Status by Building)
        
        Property-level summary of all required certifications and their status for each building.
        One record per property, aggregating which systems are present and whether each is
        currently in compliance.
        
        Args:
            address: Filter by address (partial match)
            
        Returns:
            List of building certification summary records
        """
        try:
            params = {}
            
            if address:
                # Extract just the street address part (before comma)
                street_address = address.split(',')[0].strip()
                params['where'] = f"address ILIKE '%{street_address}%'"
            
            features = self._make_arcgis_query(self.arcgis_building_certs_summary_url, params)
            
            # Extract attributes from ArcGIS features
            return [feature.get('attributes', {}) for feature in features]
            
        except Exception as e:
            logger.error(f"Error getting L&I building certification summary: {e}")
            return []
    
    def get_li_case_investigations(self, address: str = None, 
                                 investigation_type: str = None,
                                 start_date: str = None) -> List[Dict]:
        """
        Get L&I Case Investigations (Inspection History)
        
        Records of inspections/investigations that L&I inspectors conduct, usually in response
        to code complaints or property maintenance issues. Logs each time an inspector went
        to a property to investigate potential violations.
        
        Args:
            address: Filter by address (partial match)
            investigation_type: Filter by investigation type (e.g., 'Property Maintenance Inspection', 'Fire Code Inspection')
            start_date: Filter investigations from this date (YYYY-MM-DD)
            
        Returns:
            List of case investigation records
        """
        try:
            where_conditions = []
            
            if address:
                # Extract just the street address part (before comma)
                street_address = address.split(',')[0].strip()
                where_conditions.append(f"address ILIKE '%{street_address}%'")
            
            if investigation_type:
                where_conditions.append(f"casetype ILIKE '%{investigation_type}%'")
            
            if start_date:
                where_conditions.append(f"investigationcompleted >= '{start_date}'")
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            sql_query = f"""
                SELECT 
                    casenumber as caseid,
                    investigationcompleted,
                    casetype as investigationtype,
                    investigationstatus as outcome,
                    address,
                    parcel_id_num as bin,
                    opa_account_num as opa_account,
                    caseresponsibility as inspector,
                    investigationtype as investigation_detail,
                    posse_jobid as violation_id,
                    casepriority as priority
                FROM case_investigations 
                WHERE {where_clause}
                ORDER BY investigationcompleted DESC
                LIMIT 1000
            """
            
            return self._make_carto_query(sql_query)
            
        except Exception as e:
            logger.error(f"Error getting L&I case investigations: {e}")
            return []
    
    def get_unsafe_buildings(self, address: str = None) -> List[Dict]:
        """
        Get Unsafe Buildings data
        
        Subset of violations data highlighting structures deemed unsafe.
        Available as separate dataset with ArcGIS REST API.
        
        Args:
            address: Filter by address (partial match)
            
        Returns:
            List of unsafe building records
        """
        try:
            # This would use a separate ArcGIS endpoint for unsafe buildings
            # The exact URL would need to be determined from the research
            params = {}
            
            if address:
                # Extract just the street address part (before comma)
                street_address = address.split(',')[0].strip()
                params['where'] = f"address ILIKE '%{street_address}%'"
            
            # Placeholder - would need actual unsafe buildings endpoint
            logger.warning("Unsafe buildings endpoint not yet implemented")
            return []
            
        except Exception as e:
            logger.error(f"Error getting unsafe buildings: {e}")
            return []
    
    def get_imminently_dangerous_buildings(self, address: str = None) -> List[Dict]:
        """
        Get Imminently Dangerous Buildings data
        
        Subset of violations data highlighting structures in imminent danger of collapse.
        Available as separate dataset with ArcGIS REST API.
        
        Args:
            address: Filter by address (partial match)
            
        Returns:
            List of imminently dangerous building records
        """
        try:
            # This would use a separate ArcGIS endpoint for imminently dangerous buildings
            # The exact URL would need to be determined from the research
            params = {}
            
            if address:
                # Extract just the street address part (before comma)
                street_address = address.split(',')[0].strip()
                params['where'] = f"address ILIKE '%{street_address}%'"
            
            # Placeholder - would need actual imminently dangerous buildings endpoint
            logger.warning("Imminently dangerous buildings endpoint not yet implemented")
            return []
            
        except Exception as e:
            logger.error(f"Error getting imminently dangerous buildings: {e}")
            return []
    
    def parse_boiler_device_info(self, permit_data: Dict) -> Dict[str, Any]:
        """
        Parse boiler and mechanical device information from Philadelphia permit data
        
        Args:
            permit_data: Dictionary containing permit information from Philadelphia L&I API
            
        Returns:
            Dictionary with extracted boiler/mechanical device information
        """
        device_info = {
            'permit_number': permit_data.get('permitnumber'),
            'permit_date': permit_data.get('permitissuedate'),
            'address': permit_data.get('address'),
            'contractor': permit_data.get('contractorname'),
            'status': permit_data.get('status'),
            'device_type': None,
            'capacity': None,
            'fuel_type': None,
            'work_type': None,
            'location': None,
            'manufacturer': None,
            'model': None,
            'raw_scope': permit_data.get('approvedscopeofwork')
        }
        
        scope_text = permit_data.get('approvedscopeofwork', '').upper() if permit_data.get('approvedscopeofwork') else ''
        
        if not scope_text:
            return device_info
        
        import re
        
        # Device type patterns
        device_patterns = {
            'boiler': r'BOILER|STEAM\s+BOILER|HOT\s+WATER\s+BOILER',
            'water_heater': r'WATER\s+HEATER|HOT\s+WATER\s+HEATER',
            'furnace': r'FURNACE|HEATING\s+UNIT|WARM.?AIR\s+APPLIANCE',
            'hvac': r'HVAC|AIR\s+CONDITION|A/C|AC\s+UNIT|AIR\s+HANDLER',
            'heat_pump': r'HEAT\s+PUMP',
            'chiller': r'CHILLER',
            'burner': r'BURNER|GAS\s+BURNER|OIL\s+BURNER'
        }
        
        for device_type, pattern in device_patterns.items():
            if re.search(pattern, scope_text):
                device_info['device_type'] = device_type
                break
        
        # Capacity patterns (BTU, HP, Tons, etc.)
        capacity_patterns = [
            r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(BTU|BTUH|MBH|MMBTU)',
            r'(\d+(?:\.\d+)?)\s*(HP|HORSEPOWER)',
            r'(\d+(?:\.\d+)?)\s*(TON|TONS)',
            r'(\d+(?:,\d+)*)\s*(CFM)',
            r'(\d+(?:,\d+)*)\s*(KW|KILOWATT)'
        ]
        
        for pattern in capacity_patterns:
            match = re.search(pattern, scope_text)
            if match:
                capacity_value = match.group(1).replace(',', '')
                capacity_unit = match.group(2)
                device_info['capacity'] = f"{capacity_value} {capacity_unit}"
                break
        
        # Fuel type patterns
        fuel_patterns = {
            'natural_gas': r'NATURAL\s+GAS|GAS\s+FIRED|GAS\s+BURNER',
            'oil': r'OIL\s+FIRED|FUEL\s+OIL|#\d\s+OIL',
            'electric': r'ELECTRIC|ELECTRICAL',
            'propane': r'PROPANE|LP\s+GAS|LPG',
            'dual_fuel': r'DUAL\s+FUEL|GAS/OIL'
        }
        
        for fuel_type, pattern in fuel_patterns.items():
            if re.search(pattern, scope_text):
                device_info['fuel_type'] = fuel_type
                break
        
        # Work type patterns
        work_patterns = {
            'install': r'INSTALL|INSTALLATION',
            'replace': r'REPLACE|REPLACEMENT',
            'repair': r'REPAIR|FIX',
            'upgrade': r'UPGRADE|MODIFY',
            'maintain': r'MAINTAIN|SERVICE'
        }
        
        for work_type, pattern in work_patterns.items():
            if re.search(pattern, scope_text):
                device_info['work_type'] = work_type
                break
        
        # Location patterns
        location_patterns = {
            'basement': r'BASEMENT|CELLAR',
            'roof': r'ROOF|ROOFTOP',
            'mechanical_room': r'MECHANICAL\s+ROOM|MECH\s+ROOM|BOILER\s+ROOM',
            'exterior': r'EXTERIOR|OUTSIDE',
            'garage': r'GARAGE',
            'utility_room': r'UTILITY\s+ROOM'
        }
        
        for location, pattern in location_patterns.items():
            if re.search(pattern, scope_text):
                device_info['location'] = location
                break
        
        # Manufacturer patterns
        manufacturer_patterns = [
            r'(CARRIER|TRANE|LENNOX|RHEEM|BRADFORD\s+WHITE|AO\s+SMITH|WEIL\s+MCLAIN|BUDERUS|NAVIEN|RINNAI|NORITZ)',
            r'MANUFACTURER[:\s]+([A-Z][A-Z\s&]+)'
        ]
        
        for pattern in manufacturer_patterns:
            match = re.search(pattern, scope_text)
            if match:
                device_info['manufacturer'] = match.group(1).strip()
                break
        
        # Model patterns
        model_patterns = [
            r'MODEL\s+([A-Z0-9\-]+)',
            r'MODEL[:\s]+([A-Z0-9\-\s]+)'
        ]
        
        for pattern in model_patterns:
            match = re.search(pattern, scope_text)
            if match:
                device_info['model'] = match.group(1).strip()
                break
        
            return device_info
    
    def _calculate_enhanced_compliance_score(self, violations: List[Dict], permits: List[Dict], 
                                           certifications: List[Dict], cert_summary: List[Dict]) -> int:
        """
        Calculate enhanced compliance score with risk weighting and Philadelphia-specific factors
        """
        # Violation risk weights (Philadelphia-specific)
        violation_risk_weights = {
            'FIRE': 25,      # Fire code violations are critical
            'STRUCTURAL': 20, # Structural issues are high risk
            'ELECTRICAL': 15, # Electrical hazards
            'MECHANICAL': 12, # HVAC/boiler issues
            'PLUMBING': 8,   # Plumbing violations
            'HOUSING': 5,    # General housing code
            'ZONING': 3      # Zoning violations
        }
        
        base_score = 100
        
        # Analyze violations by risk category
        open_violations = [v for v in violations if v.get('status', '').upper() in ['OPEN', 'ACTIVE', 'IN VIOLATION']]
        
        for violation in open_violations:
            violation_type = self._categorize_violation_risk(violation.get('violationtype', ''))
            risk_weight = violation_risk_weights.get(violation_type, 5)
            base_score -= risk_weight
        
        # Bonus for recent compliance activities
        recent_permits = [p for p in permits if self._is_recent_permit(p)]
        base_score += min(len(recent_permits) * 3, 15)  # Cap bonus at 15 points
        
        # Penalty for expired certifications
        expired_certs = [c for c in certifications if self._is_expired_certification(c)]
        base_score -= len(expired_certs) * 12
        
        # Bonus for active certifications
        active_certs = [c for c in certifications if not self._is_expired_certification(c)]
        base_score += min(len(active_certs) * 2, 10)  # Cap bonus at 10 points
        
        return max(0, min(100, base_score))
    
    def _categorize_violation_risk(self, violation_description: str) -> str:
        """Categorize violation by risk level for Philadelphia L&I violations"""
        if not violation_description:
            return 'OTHER'
        
        description_upper = violation_description.upper()
        
        # Fire safety violations (highest risk)
        if any(term in description_upper for term in ['FIRE', 'SMOKE', 'ALARM', 'SPRINKLER', 'EXTINGUISHER', 'EGRESS', 'EXIT']):
            return 'FIRE'
        
        # Structural violations (high risk)
        elif any(term in description_upper for term in ['STRUCTURAL', 'FACADE', 'FOUNDATION', 'BEAM', 'WALL', 'ROOF']):
            return 'STRUCTURAL'
        
        # Electrical violations (medium-high risk)
        elif any(term in description_upper for term in ['ELECTRICAL', 'WIRING', 'OUTLET', 'CIRCUIT']):
            return 'ELECTRICAL'
        
        # Mechanical violations (medium risk)
        elif any(term in description_upper for term in ['MECHANICAL', 'BOILER', 'HVAC', 'HEATING', 'VENTILATION']):
            return 'MECHANICAL'
        
        # Plumbing violations (medium risk)
        elif any(term in description_upper for term in ['PLUMBING', 'WATER', 'PIPE', 'SEWER', 'DRAIN']):
            return 'PLUMBING'
        
        # Housing code violations (low-medium risk)
        elif any(term in description_upper for term in ['HOUSING', 'OCCUPANCY', 'MAINTENANCE', 'PROPERTY']):
            return 'HOUSING'
        
        # Zoning violations (low risk)
        elif any(term in description_upper for term in ['ZONING', 'USE', 'PERMIT']):
            return 'ZONING'
        
        else:
            return 'OTHER'
    
    def _is_recent_permit(self, permit: Dict) -> bool:
        """Check if permit is recent (within last 365 days)"""
        if not permit.get('permitissuedate'):
            return False
        
        try:
            date_str = permit['permitissuedate']
            if 'T' in date_str:
                date_str = date_str.split('T')[0]
            permit_date = datetime.strptime(date_str, '%Y-%m-%d')
            return permit_date > datetime.now() - timedelta(days=365)
        except:
            return False
    
    def _is_expired_certification(self, certification: Dict) -> bool:
        """Check if certification is expired"""
        if not certification.get('expiration_date'):
            return False
        
        try:
            exp_date = datetime.strptime(certification['expiration_date'], '%Y-%m-%d')
            return exp_date < datetime.now()
        except:
            return False
    
    def get_boiler_data(self, address: str = None, permit_number: str = None) -> Dict[str, Any]:
        """
        Get comprehensive boiler and mechanical system data for a Philadelphia property
        
        Args:
            address: Property address to search
            permit_number: Specific permit number to search
            
        Returns:
            Dictionary containing boiler/mechanical system information
        """
        try:
            logger.info(f"Getting boiler data for: {address or permit_number}")
            
            # Get mechanical permits
            mechanical_permits = self.get_li_building_permits(
                address=address, 
                permit_type="Mechanical"
            )
            
            # Parse device information from each permit
            boiler_devices = []
            for permit in mechanical_permits:
                device_info = self.parse_boiler_device_info(permit)
                if device_info['device_type']:  # Only include if we identified a device
                    boiler_devices.append(device_info)
            
            # Get mechanical violations
            mechanical_violations = self.get_li_code_violations(
                address=address,
                violation_type="mechanical"
            )
            
            # Get building certifications (may include boiler certs)
            certifications = self.get_li_building_certifications(
                address=address,
                certification_type="mechanical"
            )
            
            # Categorize devices by type
            devices_by_type = {}
            for device in boiler_devices:
                device_type = device['device_type']
                if device_type not in devices_by_type:
                    devices_by_type[device_type] = []
                devices_by_type[device_type].append(device)
            
            # Calculate summary statistics
            total_devices = len(boiler_devices)
            active_permits = len([d for d in boiler_devices if d['status'] and d['status'].upper() in ['ISSUED', 'COMPLETED']])
            recent_installations = len([d for d in boiler_devices if d['permit_date'] and d['permit_date'] >= '2020-01-01'])
            
            return {
                'address': address,
                'data_retrieved_at': datetime.now().isoformat(),
                'summary': {
                    'total_devices': total_devices,
                    'active_permits': active_permits,
                    'recent_installations': recent_installations,
                    'device_types': list(devices_by_type.keys())
                },
                'devices': boiler_devices,
                'devices_by_type': devices_by_type,
                'mechanical_permits': mechanical_permits,
                'mechanical_violations': mechanical_violations,
                'certifications': certifications,
                'compliance_status': {
                    'total_violations': len(mechanical_violations),
                    'open_violations': len([v for v in mechanical_violations if v.get('status', '').upper() in ['OPEN', 'ACTIVE']]),
                    'certification_count': len(certifications)
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting boiler data: {e}")
            return {
                'address': address,
                'error': str(e),
                'data_retrieved_at': datetime.now().isoformat()
            }

    def get_comprehensive_property_data(self, address: str) -> Dict[str, Any]:
        """
        Get comprehensive property data from all available Philadelphia datasets
        
        Args:
            address: Property address to query
            
        Returns:
            Dictionary containing all available data for the property
        """
        try:
            logger.info(f"Getting comprehensive data for: {address}")
            
            # Get data from all available sources
            permits = self.get_li_building_permits(address)
            violations = self.get_li_code_violations(address)
            certifications = self.get_li_building_certifications(address)
            certification_summary = self.get_li_building_certification_summary(address)
            investigations = self.get_li_case_investigations(address)
            
            # Calculate compliance metrics
            open_violations = [v for v in violations if v.get('status') and v.get('status').upper() in ['OPEN', 'ACTIVE']]
            
            # Handle date parsing for permits (they come with timestamp)
            recent_permits = []
            for p in permits:
                if p.get('permitissuedate'):
                    try:
                        # Handle both date and datetime formats
                        date_str = p['permitissuedate']
                        if 'T' in date_str:
                            date_str = date_str.split('T')[0]  # Extract date part
                        permit_date = datetime.strptime(date_str, '%Y-%m-%d')
                        if permit_date > datetime.now() - timedelta(days=365):
                            recent_permits.append(p)
                    except:
                        continue
            
            # Calculate compliance score
            total_violations = len(violations)
            open_violation_count = len(open_violations)
            recent_permit_count = len(recent_permits)
            
            # Enhanced compliance scoring with risk weighting
            compliance_score = self._calculate_enhanced_compliance_score(
                violations, permits, certifications, certification_summary
            )
            
            return {
                'address': address,
                'data_retrieved_at': datetime.now().isoformat(),
                'permits': {
                    'total': len(permits),
                    'recent': recent_permit_count,
                    'records': permits
                },
                'violations': {
                    'total': total_violations,
                    'open': open_violation_count,
                    'records': violations
                },
                'certifications': {
                    'total': len(certifications),
                    'records': certifications
                },
                'certification_summary': {
                    'total': len(certification_summary),
                    'records': certification_summary
                },
                'investigations': {
                    'total': len(investigations),
                    'records': investigations
                },
                'compliance_summary': {
                    'compliance_score': compliance_score,
                    'total_violations': total_violations,
                    'open_violations': open_violation_count,
                    'recent_permits': recent_permit_count,
                    'last_updated': datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting comprehensive property data: {e}")
            return {
                'address': address,
                'error': str(e),
                'data_retrieved_at': datetime.now().isoformat()
            }
    
    def test_api_connectivity(self) -> Dict[str, Any]:
        """
        Test connectivity to all Philadelphia data APIs
        
        Returns:
            Dictionary with connectivity test results
        """
        test_results = {
            'timestamp': datetime.now().isoformat(),
            'apis_tested': {},
            'overall_status': 'unknown'
        }
        
        # Test Carto API (for permits, violations, investigations)
        try:
            test_query = "SELECT 1 as test"
            result = self._make_carto_query(test_query)
            test_results['apis_tested']['carto_sql'] = {
                'status': 'success' if result else 'failed',
                'response': result
            }
        except Exception as e:
            test_results['apis_tested']['carto_sql'] = {
                'status': 'failed',
                'error': str(e)
            }
        
        # Test ArcGIS Building Certifications API
        try:
            params = {'where': '1=1', 'returnCountOnly': 'true'}
            result = self._make_arcgis_query(self.arcgis_building_certs_url, params)
            test_results['apis_tested']['arcgis_building_certs'] = {
                'status': 'success',
                'response': result
            }
        except Exception as e:
            test_results['apis_tested']['arcgis_building_certs'] = {
                'status': 'failed',
                'error': str(e)
            }
        
        # Test ArcGIS Building Certifications Summary API
        try:
            params = {'where': '1=1', 'returnCountOnly': 'true'}
            result = self._make_arcgis_query(self.arcgis_building_certs_summary_url, params)
            test_results['apis_tested']['arcgis_building_certs_summary'] = {
                'status': 'success',
                'response': result
            }
        except Exception as e:
            test_results['apis_tested']['arcgis_building_certs_summary'] = {
                'status': 'failed',
                'error': str(e)
            }
        
        # Determine overall status
        successful_apis = sum(1 for api in test_results['apis_tested'].values() 
                            if api['status'] == 'success')
        total_apis = len(test_results['apis_tested'])
        
        if successful_apis == total_apis:
            test_results['overall_status'] = 'success'
        elif successful_apis > 0:
            test_results['overall_status'] = 'partial'
        else:
            test_results['overall_status'] = 'failed'
        
        test_results['successful_apis'] = successful_apis
        test_results['total_apis'] = total_apis
        
        return test_results

# Example usage and testing
if __name__ == "__main__":
    # Test the enhanced client
    client = PhillyEnhancedDataClient()
    
    print("Testing Philadelphia Enhanced Data Client")
    print("=" * 60)
    
    # Test API connectivity
    connectivity_test = client.test_api_connectivity()
    print(f"API Connectivity Status: {connectivity_test['overall_status']}")
    print(f"Successful APIs: {connectivity_test['successful_apis']}/{connectivity_test['total_apis']}")
    
    # Test with a specific address
    test_address = "1431 Spruce St, Philadelphia, PA 19102"
    print(f"\nTesting with address: {test_address}")
    print("-" * 40)
    
    # Test individual data sources
    print("Testing L&I Building Permits...")
    permits = client.get_li_building_permits(test_address)
    print(f"  Found {len(permits)} permits")
    
    print("Testing L&I Code Violations...")
    violations = client.get_li_code_violations(test_address)
    print(f"  Found {len(violations)} violations")
    
    print("Testing L&I Building Certifications...")
    certifications = client.get_li_building_certifications(test_address)
    print(f"  Found {len(certifications)} certifications")
    
    print("Testing L&I Building Certification Summary...")
    cert_summary = client.get_li_building_certification_summary(test_address)
    print(f"  Found {len(cert_summary)} certification summaries")
    
    print("Testing L&I Case Investigations...")
    investigations = client.get_li_case_investigations(test_address)
    print(f"  Found {len(investigations)} investigations")
    
    # Test comprehensive data retrieval
    print("\nTesting comprehensive data retrieval...")
    comprehensive_data = client.get_comprehensive_property_data(test_address)
    
    if 'error' in comprehensive_data:
        print(f"  Error: {comprehensive_data['error']}")
    else:
        compliance = comprehensive_data['compliance_summary']
        print(f"  Compliance Score: {compliance['compliance_score']}")
        print(f"  Total Violations: {compliance['total_violations']}")
        print(f"  Open Violations: {compliance['open_violations']}")
        print(f"  Recent Permits: {compliance['recent_permits']}")
