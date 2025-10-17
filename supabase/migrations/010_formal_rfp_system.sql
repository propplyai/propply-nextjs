-- Formal RFP System Database Schema
-- Created: 2025-01-27
-- Purpose: Complete formal Request for Proposal system

-- =====================================================
-- Table: rfp_projects
-- Purpose: Store formal RFP projects with detailed specifications
-- =====================================================
CREATE TABLE IF NOT EXISTS rfp_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  compliance_report_id UUID REFERENCES compliance_reports(id) ON DELETE SET NULL,
  
  -- Project details
  project_title TEXT NOT NULL,
  project_description TEXT NOT NULL,
  project_type TEXT NOT NULL CHECK (project_type IN (
    'compliance_fix', 'maintenance', 'renovation', 'inspection', 
    'permit_work', 'violation_remediation', 'equipment_repair', 'other'
  )),
  
  -- Project specifications
  scope_of_work TEXT NOT NULL,
  technical_requirements TEXT,
  materials_specifications TEXT,
  quality_standards TEXT,
  
  -- Timeline and budget
  project_timeline_days INTEGER,
  deadline_date DATE,
  budget_range_min DECIMAL(10,2),
  budget_range_max DECIMAL(10,2),
  urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'critical')),
  
  -- Compliance context
  compliance_issues TEXT[], -- Array of specific compliance issues
  regulatory_requirements TEXT,
  permit_requirements TEXT,
  inspection_requirements TEXT,
  
  -- RFP status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'published', 'vendor_responses', 'evaluation', 
    'awarded', 'completed', 'cancelled'
  )),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  deadline_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- Table: rfp_vendor_invitations
-- Purpose: Track which vendors are invited to each RFP
-- =====================================================
CREATE TABLE IF NOT EXISTS rfp_vendor_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign keys
  rfp_project_id UUID NOT NULL REFERENCES rfp_projects(id) ON DELETE CASCADE,
  vendor_place_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_email TEXT,
  vendor_phone TEXT,
  
  -- Invitation details
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  invitation_email_id TEXT, -- For tracking email delivery
  invitation_status TEXT DEFAULT 'pending' CHECK (invitation_status IN (
    'pending', 'sent', 'delivered', 'opened', 'responded', 'declined'
  )),
  
  -- Response tracking
  vendor_response_at TIMESTAMP WITH TIME ZONE,
  vendor_proposal_url TEXT,
  vendor_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Table: rfp_vendor_proposals
-- Purpose: Store vendor proposals and responses
-- =====================================================
CREATE TABLE IF NOT EXISTS rfp_vendor_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign keys
  rfp_project_id UUID NOT NULL REFERENCES rfp_projects(id) ON DELETE CASCADE,
  rfp_vendor_invitation_id UUID NOT NULL REFERENCES rfp_vendor_invitations(id) ON DELETE CASCADE,
  
  -- Proposal details
  proposal_title TEXT NOT NULL,
  proposal_summary TEXT,
  proposed_timeline_days INTEGER,
  proposed_cost DECIMAL(10,2),
  cost_breakdown JSONB, -- Detailed cost breakdown
  
  -- Technical details
  technical_approach TEXT,
  materials_used TEXT,
  quality_assurances TEXT,
  warranties_offered TEXT,
  
  -- Compliance and permits
  permit_handling TEXT,
  compliance_approach TEXT,
  inspection_coordination TEXT,
  
  -- Vendor qualifications
  vendor_credentials TEXT,
  similar_projects TEXT,
  references TEXT,
  
  -- Proposal status
  status TEXT DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'under_review', 'accepted', 'rejected', 'withdrawn'
  )),
  
  -- Evaluation
  technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
  cost_score INTEGER CHECK (cost_score >= 0 AND cost_score <= 100),
  timeline_score INTEGER CHECK (timeline_score >= 0 AND timeline_score <= 100),
  overall_score DECIMAL(5,2),
  evaluation_notes TEXT,
  
  -- Metadata
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  evaluated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Table: rfp_documents
-- Purpose: Store generated RFP documents and templates
-- =====================================================
CREATE TABLE IF NOT EXISTS rfp_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign keys
  rfp_project_id UUID NOT NULL REFERENCES rfp_projects(id) ON DELETE CASCADE,
  
  -- Document details
  document_type TEXT NOT NULL CHECK (document_type IN (
    'rfp_template', 'rfp_published', 'vendor_invitation', 
    'proposal_template', 'evaluation_sheet', 'award_letter'
  )),
  document_title TEXT NOT NULL,
  document_content TEXT NOT NULL, -- Full document content
  document_url TEXT, -- URL to stored document file
  
  -- Document metadata
  version INTEGER DEFAULT 1,
  is_template BOOLEAN DEFAULT FALSE,
  template_category TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rfp_projects_user ON rfp_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_rfp_projects_property ON rfp_projects(property_id);
CREATE INDEX IF NOT EXISTS idx_rfp_projects_status ON rfp_projects(status);
CREATE INDEX IF NOT EXISTS idx_rfp_projects_created ON rfp_projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rfp_vendor_invitations_project ON rfp_vendor_invitations(rfp_project_id);
CREATE INDEX IF NOT EXISTS idx_rfp_vendor_invitations_status ON rfp_vendor_invitations(invitation_status);

CREATE INDEX IF NOT EXISTS idx_rfp_vendor_proposals_project ON rfp_vendor_proposals(rfp_project_id);
CREATE INDEX IF NOT EXISTS idx_rfp_vendor_proposals_status ON rfp_vendor_proposals(status);
CREATE INDEX IF NOT EXISTS idx_rfp_vendor_proposals_score ON rfp_vendor_proposals(overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_rfp_documents_project ON rfp_documents(rfp_project_id);
CREATE INDEX IF NOT EXISTS idx_rfp_documents_type ON rfp_documents(document_type);

-- Enable Row Level Security
ALTER TABLE rfp_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_vendor_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_vendor_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own RFP projects"
  ON rfp_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own RFP projects"
  ON rfp_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RFP projects"
  ON rfp_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view RFP invitations for their projects"
  ON rfp_vendor_invitations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rfp_projects 
    WHERE rfp_projects.id = rfp_vendor_invitations.rfp_project_id 
    AND rfp_projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can create RFP invitations for their projects"
  ON rfp_vendor_invitations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM rfp_projects 
    WHERE rfp_projects.id = rfp_vendor_invitations.rfp_project_id 
    AND rfp_projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can view proposals for their RFPs"
  ON rfp_vendor_proposals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rfp_projects 
    WHERE rfp_projects.id = rfp_vendor_proposals.rfp_project_id 
    AND rfp_projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can view documents for their RFPs"
  ON rfp_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rfp_projects 
    WHERE rfp_projects.id = rfp_documents.rfp_project_id 
    AND rfp_projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can create documents for their RFPs"
  ON rfp_documents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM rfp_projects 
    WHERE rfp_projects.id = rfp_documents.rfp_project_id 
    AND rfp_projects.user_id = auth.uid()
  ));

-- Functions for RFP management
CREATE OR REPLACE FUNCTION update_rfp_project_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rfp_projects_updated_at
  BEFORE UPDATE ON rfp_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_rfp_project_updated_at();

CREATE TRIGGER trigger_update_rfp_vendor_invitations_updated_at
  BEFORE UPDATE ON rfp_vendor_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_rfp_project_updated_at();

CREATE TRIGGER trigger_update_rfp_vendor_proposals_updated_at
  BEFORE UPDATE ON rfp_vendor_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_rfp_project_updated_at();

CREATE TRIGGER trigger_update_rfp_documents_updated_at
  BEFORE UPDATE ON rfp_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_rfp_project_updated_at();
