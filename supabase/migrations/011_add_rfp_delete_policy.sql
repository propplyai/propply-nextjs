-- Add missing DELETE policy for RFP projects
-- This allows users to delete their own RFP projects

CREATE POLICY "Users can delete their own RFP projects"
  ON rfp_projects FOR DELETE
  USING (auth.uid() = user_id);
