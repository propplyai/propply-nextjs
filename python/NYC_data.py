#!/usr/bin/env python3
"""
NYC Open Data API Client
A comprehensive script to access NYC Open Data via Socrata API (SODA)
Integrated with Propply AI system
"""

import requests
import json
import urllib.parse
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NYCOpenDataClient:
    """Client for accessing NYC Open Data via Socrata API"""
    
    def __init__(self, api_key_id: str = None, api_key_secret: str = None):
        """Initialize the NYC Open Data client"""
        self.base_url = "https://data.cityofnewyork.us/resource"
        self.auth = (api_key_id, api_key_secret) if api_key_id and api_key_secret else None
        self.session = requests.Session()
        
        # Dataset configurations
        self.datasets = {
            'hpd_violations': {
                'id': 'wvxf-dwi5',
                'name': 'HPD Violations',
                'description': 'Housing Preservation & Development violations'
            },
            'dob_violations': {
                'id': '3h2n-5cm9',
                'name': 'DOB Violations',
                'description': 'Building code compliance data'
            },
            'elevator_inspections': {
                'id': 'e5aq-a4j2',
                'name': 'Elevator Inspections',
                'description': 'DOB NOW Elevator Compliance data'
            },
            'boiler_inspections': {
                'id': '52dp-yji6',
                'name': 'DOB NOW: Safety Boiler',
                'description': 'DOB NOW safety data for boilers'
            },
            'electrical_permits': {
                'id': 'dm9a-ab7w',
                'name': 'DOB NOW: Electrical Permit Applications',
                'description': 'Electrical permit applications'
            }
        }
    
    @classmethod
    def from_config(cls):
        """Creates a client instance with API credentials from environment"""
        import os
        api_key_id = os.getenv('NYC_APP_TOKEN')
        api_key_secret = os.getenv('API_KEY_SECRET')
        return cls(api_key_id=api_key_id, api_key_secret=api_key_secret)
    
    def _build_url(self, dataset_id: str, format_type: str = 'json') -> str:
        """Build the API endpoint URL"""
        return f"{self.base_url}/{dataset_id}.{format_type}"
    
    def get_data(self, dataset_key: str, limit: int = 1000, offset: int = 0, 
                 where: str = None, select: str = None, order: str = None,
                 format_type: str = 'json', **kwargs) -> List[Dict]:
        """Retrieve data from a specific dataset"""
        if dataset_key not in self.datasets:
            raise ValueError(f"Unknown dataset: {dataset_key}")
        
        dataset_id = self.datasets[dataset_key]['id']
        url = self._build_url(dataset_id, format_type)
        
        timeout = 30
        params = {
            '$limit': limit,
            '$offset': offset
        }
        
        if where:
            params['$where'] = where
        if select:
            params['$select'] = select
        if order:
            params['$order'] = order
        
        try:
            response = self.session.get(url, params=params, auth=self.auth, timeout=timeout)
            response.raise_for_status()
            
            if format_type == 'json':
                data = response.json()
                return data if data else []
            else:
                return response.text
                
        except Exception as e:
            print(f"Error fetching data from {dataset_key}: {e}")
            return []
