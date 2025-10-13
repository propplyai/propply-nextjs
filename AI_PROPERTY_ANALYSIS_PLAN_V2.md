# AI Property Analysis - Simplified Architecture (Direct Database Access)

## Overview
Build an external AI agent that analyzes property compliance data directly from the database and provides intelligent recommendations based on current city regulations (NYC & Philadelphia).

## Simplified Data Flow

```
User Flow:
1. User views /compliance page → sees property cards
2. Clicks "🤖 AI Property Analysis" button
3. Navigates to /ai-analysis/[propertyId]
4. Page checks if analysis exists in database
5. If exists: Show cached analysis
6. If not: Show "Run Analysis" button
7. Click triggers AI service → saves to DB → displays results
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Propply Next.js App                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Page: /compliance                                      │  │
│  │  - List all properties with compliance reports         │  │
│  │  - Each card has "🤖 AI Analysis" button               │  │
│  │  - Button links to /ai-analysis/[propertyId]          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Page: /ai-analysis/[propertyId]                        │  │
│  │  - SSR: Query ai_property_analyses table               │  │
│  │  - If analysis exists: Render analysis UI              │  │
│  │  - If not: Show "Run AI Analysis" button               │  │
│  │  - Always show "Re-run Analysis" option                │  │
│  └────────────────────┬────────────────────────────────────┘  │
│                       │                                       │
│                       │ Click "Run Analysis"                  │
│                       ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  API: /api/ai-analysis/trigger                          │  │
│  │  - Verify user owns property                            │  │
│  │  - Call AI service: POST {property_id, user_id}        │  │
│  │  - Poll for completion (or use webhook)                │  │
│  │  - Return analysis_id when done                         │  │
│  └────────────────────┬────────────────────────────────────┘  │
└─────────────────────┬─┴────────────────────────────────────┘
                      │
                      │ HTTP POST {property_id, user_id}
                      │
┌─────────────────────▼─────────────────────────────────────────┐
│              AI Property Analysis Service                      │
│                    (Python FastAPI)                            │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  POST /api/v1/analyze                                     │ │
│  │  Receives: {property_id, user_id}                         │ │
│  │                                                            │ │
│  │  Steps:                                                    │ │
│  │  1. Authenticate request (verify API key)                 │ │
│  │  2. Connect to Supabase with service role                 │ │
│  │  3. Fetch property from properties table                  │ │
│  │  4. Fetch compliance_reports for property_id             │ │
│  │  5. Fetch manual_compliance_entries if any               │ │
│  │  6. Build comprehensive property context                  │ │
│  │  7. Run AI analysis pipeline                              │ │
│  │  8. Generate insights & recommendations                   │ │
│  │  9. INSERT result into ai_property_analyses table        │ │
│  │  10. Return analysis_id + structured result               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Supabase Client (Direct DB Access)                       │ │
│  │  - Service Role Key (full access)                         │ │
│  │  - Read: properties, compliance_reports, manual entries   │ │
│  │  - Write: ai_property_analyses                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Regulation Knowledge Base                                │ │
│  │  - Vector database (Chroma/FAISS)                         │ │
│  │  - NYC Housing Maintenance Code                           │ │
│  │  - NYC Building Code                                       │ │
│  │  - Philadelphia Property Maintenance Code                 │ │
│  │  - Semantic search for relevant regulations               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  AI Analysis Pipeline (LangChain + GPT-4/Claude)         │ │
│  │                                                            │ │
│  │  Agent 1: Data Aggregator                                 │ │
│  │    → Combines all property data sources                   │ │
│  │                                                            │ │
│  │  Agent 2: Violation Analyzer                              │ │
│  │    → Maps violations to regulations                       │ │
│  │    → Assesses severity and urgency                        │ │
│  │                                                            │ │
│  │  Agent 3: Compliance Assessor                             │ │
│  │    → Identifies gaps in maintenance                       │ │
│  │    → Flags upcoming deadlines                             │ │
│  │                                                            │ │
│  │  Agent 4: Recommendation Generator                        │ │
│  │    → Creates actionable steps                             │ │
│  │    → Estimates costs & timelines                          │ │
│  │    → Suggests contractor categories                       │ │
│  │                                                            │ │
│  │  Agent 5: Priority Ranker                                 │ │
│  │    → Sorts by: legal risk, cost, time sensitivity        │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### New Table: `ai_property_analyses`

```sql
CREATE TABLE ai_property_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  report_id UUID REFERENCES compliance_reports(id) ON DELETE CASCADE,

  -- Analysis metadata
  analysis_version TEXT DEFAULT '1.0',
  model_used TEXT, -- e.g., "gpt-4-turbo", "claude-3-opus"
  processing_time_ms INTEGER,

  -- Analysis results (full structured JSON)
  analysis_data JSONB NOT NULL,
  /* Structure:
  {
    "overall_assessment": {
      "risk_level": "high",
      "summary": "...",
      "compliance_score": 45,
      "trend": "declining"
    },
    "insights": [
      {
        "id": "insight-1",
        "category": "violations",
        "severity": "critical",
        "title": "...",
        "description": "...",
        "regulations": [...],
        "cost_estimate": "$5,000 - $15,000",
        "timeline": "30 days"
      }
    ],
    "recommendations": [
      {
        "id": "rec-1",
        "priority": 1,
        "action": "...",
        "reason": "...",
        "deadline": "...",
        "cost": "$500 - $1,000",
        "contractor_categories": ["elevator"]
      }
    ]
  }
  */

  -- Quick access fields (denormalized for queries)
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  insight_count INTEGER DEFAULT 0,
  recommendation_count INTEGER DEFAULT 0,
  estimated_total_cost TEXT,

  -- Status tracking
  status TEXT DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewed_at TIMESTAMP WITH TIME ZONE,

  -- User feedback (for ML improvement)
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,
  helpful_insights TEXT[], -- Array of insight IDs marked helpful

  CONSTRAINT unique_active_analysis UNIQUE (property_id, status)
    WHERE status = 'processing' -- Only one processing analysis per property
);

-- Indexes
CREATE INDEX idx_ai_analyses_property ON ai_property_analyses(property_id);
CREATE INDEX idx_ai_analyses_user ON ai_property_analyses(user_id);
CREATE INDEX idx_ai_analyses_created ON ai_property_analyses(created_at DESC);
CREATE INDEX idx_ai_analyses_risk ON ai_property_analyses(risk_level);

-- RLS Policies
ALTER TABLE ai_property_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analyses for their properties"
  ON ai_property_analyses FOR SELECT
  USING (
    user_id = auth.uid() OR
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert analyses"
  ON ai_property_analyses FOR INSERT
  WITH CHECK (true); -- AI service uses service role

CREATE POLICY "Users can update their own analyses (feedback)"
  ON ai_property_analyses FOR UPDATE
  USING (user_id = auth.uid());
```

## UI Design for `/ai-analysis/[propertyId]`

### Page Structure

```jsx
// pages/ai-analysis/[propertyId].js

Layout:
┌─────────────────────────────────────────────────┐
│ Property: 123 Main St, Brooklyn, NY            │
│ [Back to Compliance]                            │
├─────────────────────────────────────────────────┤
│                                                 │
│  🤖 AI Property Analysis                        │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Overall Assessment                        │ │
│  │                                           │ │
│  │  Risk Level: 🔴 HIGH                     │ │
│  │  Compliance Score: 45%                    │ │
│  │  Trend: ⬇️ Declining                     │ │
│  │                                           │ │
│  │  "Property has 3 critical issues..."     │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🚨 Critical Insights (3)                 │ │
│  │                                           │ │
│  │  [Expandable Card 1]                      │ │
│  │  Lead Paint Hazard Requires Immediate... │ │
│  │  • Severity: Critical                     │ │
│  │  • Cost: $5,000 - $15,000                │ │
│  │  • Timeline: 30 days                      │ │
│  │  • Regulations: NYC Admin Code §27-2056  │ │
│  │  [👍 Helpful] [Find Contractors →]        │ │
│  │                                           │ │
│  │  [Expandable Card 2]                      │ │
│  │  Elevator Inspection Expired...           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ ✅ Recommendations (5)                    │ │
│  │                                           │ │
│  │  Priority 1: Schedule elevator inspec... │ │
│  │  Priority 2: Contact lead remediation... │ │
│  │  [Find Contractors]                       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 📋 Action Plan                            │ │
│  │  1. Contact elevator contractor           │ │
│  │  2. Schedule lead paint assessment        │ │
│  │  3. File correction paperwork             │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [🔄 Re-run Analysis] [💾 Export PDF]          │
│                                                 │
│  Analysis generated: Oct 12, 2025 at 2:30pm   │
│  Model: GPT-4 Turbo                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Implementation Steps

### Phase 1: Database & API Foundation (Week 1)
- [x] Gradient text applied to compliance header
- [ ] Create Supabase migration for `ai_property_analyses` table
- [ ] Set up Python FastAPI project structure
- [ ] Configure Supabase client with service role in AI service
- [ ] Build `/api/v1/analyze` endpoint (mock response first)
- [ ] Create Next.js API route `/api/ai-analysis/trigger`
- [ ] Test end-to-end flow with mock data

### Phase 2: AI Service Core (Week 2)
- [ ] Integrate OpenAI/Anthropic SDK
- [ ] Build data fetcher to pull from Supabase
- [ ] Create prompt templates for analysis
- [ ] Implement basic analysis pipeline
- [ ] Test with real property data
- [ ] Handle errors gracefully

### Phase 3: UI Implementation (Week 3)
- [ ] Create `/pages/ai-analysis/[propertyId].js` page
- [ ] Build analysis display components
  - [ ] OverallAssessmentCard
  - [ ] InsightCard (expandable)
  - [ ] RecommendationList
  - [ ] ActionPlan
- [ ] Add "🤖 AI Analysis" button to compliance page
- [ ] Implement loading states
- [ ] Add re-run analysis functionality

### Phase 4: Regulation Knowledge Base (Week 4)
- [ ] Collect regulation documents (NYC & Philly)
- [ ] Process and chunk documents
- [ ] Create vector embeddings
- [ ] Set up vector database (Chroma/FAISS)
- [ ] Implement semantic search
- [ ] Test regulation matching accuracy

### Phase 5: Polish & Launch (Week 5)
- [ ] Add user feedback system (helpful/not helpful)
- [ ] Implement PDF export
- [ ] Add analysis history view
- [ ] Performance optimization & caching
- [ ] Error handling & monitoring
- [ ] User acceptance testing
- [ ] Production deployment

## API Contracts

### Next.js → AI Service

**POST /api/v1/analyze**
```json
Request:
{
  "property_id": "uuid",
  "user_id": "uuid",
  "force_refresh": false // Optional: bypass cache
}

Response (Success):
{
  "status": "completed",
  "analysis_id": "uuid",
  "analysis": {
    "overall_assessment": {...},
    "insights": [...],
    "recommendations": [...]
  },
  "processing_time_ms": 3500
}

Response (Processing):
{
  "status": "processing",
  "analysis_id": "uuid",
  "estimated_completion_seconds": 30
}

Response (Error):
{
  "status": "failed",
  "error": "Property not found"
}
```

## Key Decisions Needed

1. **AI Model Choice:**
   - GPT-4 Turbo (faster, cheaper)
   - GPT-4o (better reasoning)
   - Claude 3 Opus (best for complex analysis)
   - Claude 3.5 Sonnet (balanced)

2. **Hosting:**
   - Railway (easy Python deployment)
   - Vercel (if using serverless functions)
   - AWS Lambda (scalable but complex)
   - Render (simple, affordable)

3. **Regulation Database:**
   - Manual curation (accurate but time-consuming)
   - Web scraping (automated but needs validation)
   - Licensed data (expensive but comprehensive)

4. **Pricing Model:**
   - Free: 1 analysis per property per month
   - Pro: Unlimited analyses + priority
   - Pay-per-analysis: $5 per run

## Cost Estimates

**Per Analysis:**
- AI API calls: $0.10 - $0.50 (depending on model & tokens)
- Database queries: negligible
- Compute: $0.01 - $0.05

**Monthly Costs:**
- AI Service hosting: $10-30
- Vector database: $0-50 (depending on size)
- Monitoring: $0-20

**For 100 analyses/month:** ~$15-80 total cost
**For 1,000 analyses/month:** ~$150-550 total cost

## Next Actions

1. ✅ Create this updated architecture doc
2. [ ] Create database migration file
3. [ ] Set up Python FastAPI project
4. [ ] Create AI analysis page UI mockup
5. [ ] Choose AI model (GPT-4 vs Claude)
6. [ ] Decide on hosting platform
7. [ ] Start Phase 1 implementation

What would you like to tackle first?
