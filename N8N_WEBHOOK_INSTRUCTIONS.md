# N8N Webhook Instructions for AI Analysis

## Status Values

Your n8n webhook MUST update the `ai_property_analyses` table with the correct status value when the analysis is complete.

### Allowed Status Values:
- `'processing'` - Set by the frontend when analysis is triggered
- `'completed'` - **SET THIS when your AI analysis finishes successfully**
- `'failed'` - Set this if the analysis encounters an error

## What Your N8N Workflow Must Do

After receiving the webhook and completing the AI analysis, you MUST update the database record:

```sql
UPDATE ai_property_analyses
SET
  status = 'completed',  -- CRITICAL: Change from 'processing' to 'completed'
  risk_level = 'high',   -- low | medium | high | critical
  analysis_data = {...}, -- The full AI response JSON
  insight_count = 3,
  recommendation_count = 5,
  model_used = 'gpt-4-turbo',
  processing_time_ms = 3500
WHERE id = $analysis_id;
```

## Current Issue

Your n8n workflow is receiving the webhook and processing successfully, but it's **NOT updating the status from 'processing' to 'completed'**.

This causes the frontend to show "Analyzing Property..." forever because it's polling for status changes.

## How the Frontend Polling Works

1. User clicks "Run AI Analysis"
2. API creates record with `status = 'processing'`
3. Frontend shows loading spinner
4. Frontend polls every 5 seconds checking: `SELECT * FROM ai_property_analyses WHERE property_id = ? ORDER BY created_at DESC LIMIT 1`
5. **When status changes to 'completed' or 'failed', frontend stops polling and shows results**

## Testing

To test if your webhook is working, manually update a processing analysis:

```sql
-- Find your processing analysis
SELECT id, status, created_at
FROM ai_property_analyses
WHERE property_id = 'b41f7e6a-3ae5-4356-8fae-0cdce7be49a4'
ORDER BY created_at DESC LIMIT 1;

-- Update it to completed
UPDATE ai_property_analyses
SET
  status = 'completed',
  analysis_data = '{"overall_assessment": {"summary": "Test analysis"}}'
WHERE id = 'your-analysis-id-here';
```

Then refresh the page - it should immediately show the results instead of loading.

## Required Fields for Completed Analysis

Minimum fields your n8n workflow should set:

```json
{
  "status": "completed",  // REQUIRED
  "risk_level": "medium", // REQUIRED: low | medium | high | critical
  "analysis_data": {      // REQUIRED: Full AI response
    "overall_assessment": {
      "risk_level": "medium",
      "summary": "Your AI generated summary here...",
      "compliance_score": 75
    },
    "insights": [...],
    "recommendations": [...]
  },
  "insight_count": 3,           // RECOMMENDED
  "recommendation_count": 5,     // RECOMMENDED
  "model_used": "gpt-4-turbo",  // OPTIONAL
  "processing_time_ms": 3500    // OPTIONAL
}
```

## Error Handling

If your AI analysis fails, set status to 'failed':

```sql
UPDATE ai_property_analyses
SET
  status = 'failed',
  error_message = 'AI service timeout'
WHERE id = $analysis_id;
```

The frontend will display the error to the user.
