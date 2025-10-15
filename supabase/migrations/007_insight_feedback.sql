-- Create insight_feedback table to store user feedback on insights
CREATE TABLE IF NOT EXISTS insight_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_id TEXT NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(insight_id, property_id, user_id)
);

-- Create dismissed_insights table to store dismissed insights
CREATE TABLE IF NOT EXISTS dismissed_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_id TEXT NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(insight_id, property_id, user_id)
);

-- Create dismissed_recommendations table to store dismissed recommendations
CREATE TABLE IF NOT EXISTS dismissed_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id TEXT NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recommendation_id, property_id, user_id)
);

-- Create recommendation_feedback table to store user feedback on recommendations
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id TEXT NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recommendation_id, property_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_insight_feedback_property_user ON insight_feedback(property_id, user_id);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_insight ON insight_feedback(insight_id);
CREATE INDEX IF NOT EXISTS idx_dismissed_insights_property_user ON dismissed_insights(property_id, user_id);
CREATE INDEX IF NOT EXISTS idx_dismissed_insights_insight ON dismissed_insights(insight_id);
CREATE INDEX IF NOT EXISTS idx_dismissed_recommendations_property_user ON dismissed_recommendations(property_id, user_id);
CREATE INDEX IF NOT EXISTS idx_dismissed_recommendations_recommendation ON dismissed_recommendations(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_property_user ON recommendation_feedback(property_id, user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_recommendation ON recommendation_feedback(recommendation_id);

-- Enable RLS
ALTER TABLE insight_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE dismissed_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE dismissed_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for insight_feedback
CREATE POLICY "Users can view their own feedback" ON insight_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" ON insight_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON insight_feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback" ON insight_feedback
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for dismissed_insights
CREATE POLICY "Users can view their own dismissed insights" ON dismissed_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dismissed insights" ON dismissed_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dismissed insights" ON dismissed_insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dismissed insights" ON dismissed_insights
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for dismissed_recommendations
CREATE POLICY "Users can view their own dismissed recommendations" ON dismissed_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dismissed recommendations" ON dismissed_recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dismissed recommendations" ON dismissed_recommendations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dismissed recommendations" ON dismissed_recommendations
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for recommendation_feedback
CREATE POLICY "Users can view their own recommendation feedback" ON recommendation_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendation feedback" ON recommendation_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendation feedback" ON recommendation_feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recommendation feedback" ON recommendation_feedback
  FOR DELETE USING (auth.uid() = user_id);
