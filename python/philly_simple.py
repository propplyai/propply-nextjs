#!/usr/bin/env python3
"""
Philadelphia Open Data Client
Similar to NYC Open Data Client but for Philadelphia datasets
"""

import requests
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PhillyOpenDataClient:
    """Client for accessing Philadelphia Open Data APIs"""
    
    def __init__(self, app_token: Optional[str] = None):
        """
        Initialize Philadelphia Open Data client
        
        Args:
            app_token: Optional Socrata app token for higher rate limits
        """
        self.base_url = "https://data.phila.gov"
        self.socrata_base = "https://data.phila.gov/resource"
        self.app_token = app_token or os.getenv('PHILLY_APP_TOKEN')
        self.session = requests.Session()
        
        # Set headers
        self.session.headers.update({
            'User-Agent': 'PropplyAI/1.0 (Property Compliance Management)',
            'Accept': 'application/json'
        })
        
        if self.app_token:
            self.session.headers.update({'X-App-Token': self.app_token})
    
    @classmethod
    def from_config(cls) -> 'PhillyOpenDataClient':
        """Create client from environment configuration"""
        return cls()
    
    def search_datasets(self, query: str, limit: int = 10) -> List[Dict]:
        """
        Search for datasets on OpenDataPhilly
        
        Args:
            query: Search term
            limit: Maximum number of results
            
        Returns:
            List of dataset metadata
        """
        try:
            url = f"{self.socrata_base}/package_search"
            params = {
                'q': query,
                'rows': limit
            }
            
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            return data.get('result', {}).get('results', [])
            
        except Exception as e:
            logger.error(f"Error searching datasets: {e}")
            return []
    
    def get_dataset_info(self, dataset_id: str) -> Optional[Dict]:
        """
        Get detailed information about a specific dataset
        
        Args:
            dataset_id: Dataset identifier
            
        Returns:
            Dataset metadata or None if not found
        """
        try:
            url = f"{self.socrata_base}/package_show"
            params = {'id': dataset_id}
            
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            return data.get('result', {})
            
        except Exception as e:
            logger.error(f"Error getting dataset info for {dataset_id}: {e}")
            return None
    
    def query_dataset(self, dataset_id: str, where_clause: str = None, 
                     limit: int = 1000, offset: int = 0) -> List[Dict]:
        """
        Query a specific dataset with optional filters
        
        Args:
            dataset_id: Dataset identifier
            where_clause: SQL WHERE clause for filtering
            limit: Maximum number of records
            offset: Number of records to skip
            
        Returns:
            List of records from the dataset
        """
        try:
            # Construct the Socrata API URL
            url = f"https://data.phila.gov/resource/{dataset_id}.json"
            
            params = {
                '$limit': limit,
                '$offset': offset
            }
            
            if where_clause:
                params['$where'] = where_clause
            
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Error querying dataset {dataset_id}: {e}")
            return []
    
    def get_building_permits(self, address: str = None, 
                           start_date: str = None, end_date: str = None) -> List[Dict]:
        """
        Get building permits data
        
        Args:
            address: Filter by address (partial match)
            start_date: Filter permits from this date (YYYY-MM-DD)
            end_date: Filter permits to this date (YYYY-MM-DD)
            
        Returns:
            List of building permit records
        """
        where_conditions = []
        
        if address:
            where_conditions.append(f"address ILIKE '%{address}%'")
        
        if start_date:
            where_conditions.append(f"permitissuedate >= '{start_date}'")
        
        if end_date:
            where_conditions.append(f"permitissuedate <= '{end_date}'")
        
        where_clause = " AND ".join(where_conditions) if where_conditions else None
        
        # Use the building permits dataset ID
        return self.query_dataset("permits", where_clause)
    
    def get_building_violations(self, address: str = None, 
                              status: str = None) -> List[Dict]:
        """
        Get building violations data
        
        Args:
            address: Filter by address (partial match)
            status: Filter by violation status
            
        Returns:
            List of building violation records
        """
        where_conditions = []
        
        if address:
            where_conditions.append(f"address ILIKE '%{address}%'")
        
        if status:
            where_conditions.append(f"status = '{status}'")
        
        where_clause = " AND ".join(where_conditions) if where_conditions else None
        
        # Use the building violations dataset ID
        return self.query_dataset("violations", where_clause)
    
    def get_property_assessments(self, address: str = None) -> List[Dict]:
        """
        Get property assessment data
        
        Args:
            address: Filter by address (partial match)
            
        Returns:
            List of property assessment records
        """
        where_clause = f"address ILIKE '%{address}%'" if address else None
        
        # Use the property assessments dataset ID
        return self.query_dataset("property-assessments", where_clause)
    
    def get_fire_inspections(self, address: str = None, 
                           start_date: str = None) -> List[Dict]:
        """
        Get fire department inspection data
        
        Args:
            address: Filter by address (partial match)
            start_date: Filter inspections from this date (YYYY-MM-DD)
            
        Returns:
            List of fire inspection records
        """
        where_conditions = []
        
        if address:
            where_conditions.append(f"address ILIKE '%{address}%'")
        
        if start_date:
            where_conditions.append(f"inspection_date >= '{start_date}'")
        
        where_clause = " AND ".join(where_conditions) if where_conditions else None
        
        # Use the fire inspections dataset ID
        return self.query_dataset("fire-inspections", where_clause)
    
    def get_housing_violations(self, address: str = None) -> List[Dict]:
        """
        Get housing code violations data
        
        Args:
            address: Filter by address (partial match)
            
        Returns:
            List of housing violation records
        """
        where_clause = f"address ILIKE '%{address}%'" if address else None
        
        # Use the housing violations dataset ID
        return self.query_dataset("housing-violations", where_clause)
    
    def get_zoning_info(self, address: str = None) -> List[Dict]:
        """
        Get zoning information
        
        Args:
            address: Filter by address (partial match)
            
        Returns:
            List of zoning records
        """
        where_clause = f"address ILIKE '%{address}%'" if address else None
        
        # Use the zoning dataset ID
        return self.query_dataset("zoning", where_clause)
    
    def get_dataset_metadata(self) -> Dict[str, Dict]:
        """
        Get metadata for all relevant property compliance datasets
        
        Returns:
            Dictionary mapping dataset names to their metadata
        """
        datasets = {
            'building_permits': {
                'id': 'permits',
                'name': 'Building Permits',
                'description': 'L&I building permits and inspections',
                'category': 'Building & Infrastructure',
                'update_frequency': 'Daily'
            },
            'building_violations': {
                'id': 'violations', 
                'name': 'Building Violations',
                'description': 'L&I building code violations',
                'category': 'Building & Infrastructure',
                'update_frequency': 'Daily'
            },
            'property_assessments': {
                'id': 'property-assessments',
                'name': 'Property Assessments',
                'description': 'Property tax assessments and valuations',
                'category': 'Real Estate',
                'update_frequency': 'Annual'
            },
            'fire_inspections': {
                'id': 'fire-inspections',
                'name': 'Fire Department Inspections',
                'description': 'Fire safety inspections and violations',
                'category': 'Public Safety',
                'update_frequency': 'Weekly'
            },
            'housing_violations': {
                'id': 'housing-violations',
                'name': 'Housing Code Violations',
                'description': 'Housing code violations and enforcement',
                'category': 'Real Estate',
                'update_frequency': 'Daily'
            },
            'zoning': {
                'id': 'zoning',
                'name': 'Zoning Information',
                'description': 'Property zoning classifications and regulations',
                'category': 'Planning & Zoning',
                'update_frequency': 'Monthly'
            }
        }
        
        return datasets

# Example usage and testing
if __name__ == "__main__":
    # Test the client
    client = PhillyOpenDataClient()
    
    # Search for datasets
    print("Searching for building-related datasets...")
    datasets = client.search_datasets("building permits")
    for dataset in datasets[:3]:
        print(f"- {dataset.get('title', 'Unknown')}")
    
    # Get dataset metadata
    print("\nAvailable datasets:")
    metadata = client.get_dataset_metadata()
    for name, info in metadata.items():
        print(f"- {info['name']}: {info['description']}")

