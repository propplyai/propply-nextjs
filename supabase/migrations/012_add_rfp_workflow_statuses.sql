-- Add new RFP workflow statuses and timestamps
-- Created: 2025-01-27
-- Purpose: Add documents_generated and vendors_contacted statuses to RFP workflow

-- Add new timestamp columns
ALTER TABLE rfp_projects
ADD COLUMN IF NOT EXISTS documents_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS vendors_contacted_at TIMESTAMP WITH TIME ZONE;

-- Drop the old status constraint
ALTER TABLE rfp_projects
DROP CONSTRAINT IF EXISTS rfp_projects_status_check;

-- Add new status constraint with additional statuses
ALTER TABLE rfp_projects
ADD CONSTRAINT rfp_projects_status_check
CHECK (status IN (
  'draft',
  'documents_generated',
  'vendors_contacted',
  'published',
  'vendor_responses',
  'evaluation',
  'awarded',
  'completed',
  'cancelled'
));

-- Update existing RFPs that have documents but are still in draft status
-- This fixes any RFPs stuck in draft with documents already generated
UPDATE rfp_projects
SET
  status = 'documents_generated',
  documents_generated_at = COALESCE(
    (SELECT MIN(created_at) FROM rfp_documents WHERE rfp_documents.rfp_project_id = rfp_projects.id),
    NOW()
  )
WHERE status = 'draft'
  AND EXISTS (
    SELECT 1 FROM rfp_documents
    WHERE rfp_documents.rfp_project_id = rfp_projects.id
  );

-- Update existing RFPs that have vendors invited
UPDATE rfp_projects
SET
  status = 'vendors_contacted',
  vendors_contacted_at = COALESCE(
    (SELECT MIN(created_at) FROM rfp_vendor_invitations WHERE rfp_vendor_invitations.rfp_project_id = rfp_projects.id),
    NOW()
  )
WHERE status IN ('published', 'documents_generated')
  AND EXISTS (
    SELECT 1 FROM rfp_vendor_invitations
    WHERE rfp_vendor_invitations.rfp_project_id = rfp_projects.id
  );

-- Create indexes for new timestamp columns
CREATE INDEX IF NOT EXISTS idx_rfp_projects_docs_generated ON rfp_projects(documents_generated_at);
CREATE INDEX IF NOT EXISTS idx_rfp_projects_vendors_contacted ON rfp_projects(vendors_contacted_at);

-- Add comment explaining the workflow
COMMENT ON COLUMN rfp_projects.documents_generated_at IS 'Timestamp when RFP documents were first generated';
COMMENT ON COLUMN rfp_projects.vendors_contacted_at IS 'Timestamp when first vendor was invited';
