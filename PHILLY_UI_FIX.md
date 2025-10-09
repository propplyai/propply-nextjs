# Philadelphia UI Display Fix - Complete ✅

## Problem Diagnosis

From the screenshot, Philadelphia property showed:
- ❌ "HPD Violations" and "DOB Violations" (NYC-specific)
- ❌ No Philadelphia L&I data displaying
- ❌ Wrong database table (`nyc_compliance_reports` doesn't exist)
- ❌ UI hardcoded for NYC data structure

## Root Causes Fixed

### 1. ✅ API Not Passing City
**File:** `pages/api/properties/generate-compliance.js`
- **Before:** Only sent `address` to Python service
- **After:** Now sends `city` parameter explicitly
- **Impact:** Python service can route to correct data source (NYC vs Philly)

### 2. ✅ Wrong Database Table
**Files:** `pages/properties/[id].js`, `pages/compliance/[id].js`
- **Before:** Tried to insert into `nyc_compliance_reports` (doesn't exist)
- **After:** Uses `compliance_reports` table created in SQL migration
- **Impact:** Reports now save successfully

### 3. ✅ NYC-Only Data Mapping
**File:** `pages/properties/[id].js` (handleGenerateReport function)
- **Before:** Hardcoded BIN, BBL, HPD, DOB fields
- **After:** City-aware field mapping:
  ```javascript
  if (city === 'Philadelphia') {
    // OPA account, L&I permits/violations/certifications
  } else {
    // BIN, BBL, HPD, DOB
  }
  ```
- **Impact:** Correct data structure for each city

### 4. ✅ UI Shows NYC Categories Only
**File:** `components/ComplianceDisplay.js` (NEW)
- **Created:** City-aware component that auto-detects and routes
- **Philadelphia Display:**
  - L&I Building Permits
  - L&I Code Violations
  - Building Certifications
  - L&I Case Investigations
- **NYC Display:**
  - HPD Violations
  - DOB Violations
  - Elevator Equipment
  - Boiler Equipment
  - Electrical Permits

## Files Changed

### Modified (4 files)
1. **pages/api/properties/generate-compliance.js**
   - Added `city` parameter to Python service call

2. **pages/properties/[id].js**
   - Fixed table name: `nyc_compliance_reports` → `compliance_reports`
   - Added city-aware field mapping for database insert
   - City-specific violation counting
   - City-specific success messages

3. **pages/compliance/[id].js**
   - Fixed table name: `nyc_compliance_reports` → `compliance_reports`
   - Integrated `ComplianceDisplay` component
   - Deprecated old NYC-only sections

4. **components/ComplianceDisplay.js** (NEW)
   - `ComplianceDisplay`: Main router component
   - `PhiladelphiaCompliance`: L&I data display
   - `NYCCompliance`: HPD/DOB data display
   - `ComplianceSection`: Reusable expandable section wrapper
   - Item renderers for each data type

## Data Flow Now

```
User adds Philly property
    ↓
Property saved with city="Philadelphia"
    ↓
User clicks "Fetch Property Data"
    ↓
handleGenerateReport sends:
  - address: "21 S 13th St, Philadelphia, PA"
  - city: "Philadelphia"
    ↓
API proxy forwards to Python service
    ↓
Python service detects "Philadelphia"
    ↓
Routes to generate_philly_report()
    ↓
Returns L&I data structure
    ↓
Frontend saves to compliance_reports with Philly fields:
  - opa_account
  - li_permits_total
  - li_violations_active
  - li_certifications_active
  - li_investigations_total
    ↓
ComplianceDisplay component detects city="Philadelphia"
    ↓
Shows PhiladelphiaCompliance UI with L&I categories
```

## What Users See Now

### Philadelphia Property:
- ✅ L&I Building Permits (total + recent count)
- ✅ L&I Code Violations (total + active count)
- ✅ Building Certifications (active + expired count)
- ✅ L&I Case Investigations (total count)
- ✅ Correct compliance score
- ✅ Expandable sections with actual data

### NYC Property:
- ✅ HPD Violations
- ✅ DOB Violations
- ✅ Elevator Equipment
- ✅ Boiler Equipment
- ✅ Electrical Permits
- ✅ (Unchanged - still works)

## Next Steps (Optional)

### 1. Remove "Fetch NYC Property Data" Button
Instead of manual button, auto-fetch on property creation:
- Move fetch logic to property add page
- Show loading state during fetch
- Automatically populate compliance data

### 2. Manual Compliance Entry Page
Create `/properties/[id]/edit-compliance` for users to add:
- Additional permits not in public APIs
- Private inspections
- Internal certifications
- Notes and attachments

### 3. Update Property Stats Card
The screenshot shows 0 violations but might need to query compliance_reports:
- Fix violation count display on property detail page
- Show city-specific metrics

## Testing

To test the fix:
1. Add a Philadelphia property (e.g., "21 S 13th St, Philadelphia, PA 19107")
2. Click "Fetch Property Data" (or whatever the button says)
3. Should see L&I categories instead of HPD/DOB
4. Data should save to `compliance_reports` table
5. Compliance report page should show Philadelphia-specific sections

## Commits

- `28a8406` - fix: Add city-aware compliance display for Philadelphia properties
- `e29e653` - feat: Add Philadelphia compliance report support to Python service

