# AI Property Analysis - Architecture & Implementation Plan

## Overview
Build an external AI agent that analyzes property compliance data and provides intelligent recommendations based on current city regulations (NYC & Philadelphia).

## Current State Analysis

### What We Have
1. **Property Data Collection**
   - Manual entries by users (violations, permits, equipment)
   - Automated dataset fetching from NYC/Philly open data APIs
   - Stored in `compliance_reports` table with JSON structure

2. **Data Structure** (`compliance_reports` table)
   - `property_id`, `user_id`
   - `address`, `bin`, `bbl`, `borough`
   - `report_data` (JSONB) - Contains all fetched data
   - `scores` - Individual compliance metrics
   - `overall_score` - Calculated compliance percentage
   - Manual entries in separate tables

3. **UI Components**
   - Compliance display page showing violations, permits, equipment
   - Property detail pages
   - "Coming Soon" placeholder for AI analysis

## Architecture Design

### 1. External AI Agent Service

**Technology Stack Options:**
- **Option A: Python FastAPI Service** (Recommended)
  - LangChain for AI orchestration
  - OpenAI GPT-4 or Anthropic Claude for analysis
  - Vector database (Pinecone/Weaviate) for regulation embeddings
  - PostgreSQL for analysis history

- **Option B: Next.js API Routes with Edge Functions**
  - Vercel AI SDK
  - Direct OpenAI/Anthropic integration
  - Lighter weight but less separation of concerns

**Recommendation:** Option A for better scalability and separation

### 2. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Propply Next.js App                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Property Page / Compliance Dashboard                  │  │
│  │  - Display compliance data                             │  │
│  │  - "Run AI Analysis" button                            │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │  API Route: /api/ai-analysis/analyze                   │  │
│  │  - Authenticate user                                    │  │
│  │  - Fetch property + compliance data                     │  │
│  │  - Send to AI Agent Service                             │  │
│  └────────────────────┬───────────────────────────────────┘  │
└─────────────────────┬─┴────────────────────────────────────┘
                      │
                      │ HTTP/REST API
                      │
┌─────────────────────▼─────────────────────────────────────┐
│              AI Property Analysis Service                  │
│                    (Python FastAPI)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  POST /analyze                                        │  │
│  │  - Receive property data payload                      │  │
│  │  - Extract key metrics & violations                   │  │
│  │  - Query regulation database                          │  │
│  │  - Run AI analysis chain                              │  │
│  │  - Generate recommendations                            │  │
│  │  - Return structured analysis                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Regulation Knowledge Base                            │  │
│  │  - NYC Housing Maintenance Code                       │  │
│  │  - NYC Building Code                                   │  │
│  │  - Philadelphia Property Maintenance Code             │  │
│  │  - Vector embeddings for semantic search              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AI Analysis Engine (LangChain)                       │  │
│  │  1. Context Builder: Prepare property context         │  │
│  │  2. Regulation Matcher: Find relevant rules           │  │
│  │  3. Analysis Agent: Assess compliance                 │  │
│  │  4. Recommendation Agent: Generate action items       │  │
│  │  5. Priority Ranker: Sort by urgency/impact           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Storage: Analysis History                            │  │
│  │  - Cache analyses for performance                     │  │
│  │  - Track changes over time                            │  │
│  │  - User feedback for improvement                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 3. Data Synchronization Strategy

**Input Data to AI Agent:**
```json
{
  "property_id": "uuid",
  "analysis_request_id": "uuid",
  "user_id": "uuid",
  "property_info": {
    "address": "123 Main St, Brooklyn, NY",
    "bin": "1234567",
    "bbl": "3012340001",
    "city": "NYC",
    "property_type": "residential",
    "units": 12
  },
  "compliance_data": {
    "overall_score": 45,
    "active_violations": [
      {
        "type": "HPD",
        "code": "27-2005",
        "description": "Lead paint hazard",
        "severity": "Class B",
        "date_issued": "2024-01-15",
        "status": "open"
      }
    ],
    "equipment": [
      {
        "type": "elevator",
        "status": "expired_inspection",
        "last_inspection": "2023-06-01"
      }
    ],
    "permits": [],
    "manual_entries": []
  },
  "previous_analyses": [] // Optional: for continuity
}
```

**Output from AI Agent:**
```json
{
  "analysis_id": "uuid",
  "timestamp": "2025-10-12T...",
  "overall_assessment": {
    "risk_level": "high", // low, medium, high, critical
    "summary": "Property has 3 critical issues requiring immediate attention...",
    "compliance_trend": "declining" // improving, stable, declining
  },
  "insights": [
    {
      "category": "violations",
      "severity": "critical",
      "title": "Lead Paint Hazard Requires Immediate Remediation",
      "description": "NYC Admin Code §27-2056.2 requires immediate remediation...",
      "relevant_regulations": [
        {
          "code": "27-2056.2",
          "title": "Lead Paint Remediation",
          "summary": "...",
          "source_url": "https://..."
        }
      ],
      "estimated_cost": "$5,000 - $15,000",
      "timeline": "30 days"
    }
  ],
  "recommendations": [
    {
      "priority": 1,
      "action": "Schedule elevator inspection immediately",
      "reason": "Expired inspection may result in fines and shutdown order",
      "deadline": "within 7 days",
      "estimated_cost": "$500 - $1,000",
      "suggested_vendors": ["elevator"] // Categories for marketplace
    }
  ],
  "regulatory_context": {
    "city": "NYC",
    "applicable_codes": ["Housing Maintenance Code", "Building Code"],
    "recent_changes": [] // New regulations to be aware of
  },
  "next_steps": [
    "Contact certified lead paint remediation contractor",
    "Schedule elevator inspection within 7 days",
    "File violation correction paperwork"
  ]
}
```

## Database Schema Changes

### New Tables Needed

```sql
-- AI Analysis Results Table
CREATE TABLE ai_property_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  report_id UUID REFERENCES compliance_reports(id) ON DELETE CASCADE,

  -- Analysis metadata
  analysis_version TEXT DEFAULT '1.0',
  model_used TEXT, -- e.g., "gpt-4", "claude-3"

  -- Analysis results (full JSON from AI agent)
  analysis_data JSONB NOT NULL,

  -- Quick access fields
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  insight_count INTEGER DEFAULT 0,
  recommendation_count INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewed_at TIMESTAMP WITH TIME ZONE,

  -- User feedback
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT
);

CREATE INDEX idx_ai_analyses_property ON ai_property_analyses(property_id);
CREATE INDEX idx_ai_analyses_user ON ai_property_analyses(user_id);
CREATE INDEX idx_ai_analyses_created ON ai_property_analyses(created_at DESC);

-- Regulation Knowledge Base (cached in app, source in AI service)
CREATE TABLE regulation_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city TEXT NOT NULL, -- NYC, Philadelphia
  code TEXT NOT NULL, -- e.g., "27-2005"
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- housing, building, fire, etc.
  source_url TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(city, code)
);
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [x] Apply gradient text styling to header
- [ ] Create AI service architecture
- [ ] Set up Python FastAPI service
- [ ] Create database tables for analyses
- [ ] Build basic API endpoint for triggering analysis
- [ ] Implement authentication/authorization

### Phase 2: AI Integration (Week 3-4)
- [ ] Integrate OpenAI/Anthropic API
- [ ] Build regulation knowledge base
- [ ] Create prompt templates for analysis
- [ ] Implement basic analysis chain
- [ ] Test with sample property data

### Phase 3: UI Implementation (Week 5)
- [ ] Create "Run AI Analysis" button on compliance page
- [ ] Build analysis results display component
- [ ] Show insights with expandable details
- [ ] Display recommendations with priority
- [ ] Link recommendations to marketplace

### Phase 4: Enhancement (Week 6)
- [ ] Add caching layer for repeat analyses
- [ ] Implement user feedback system
- [ ] Add analysis history view
- [ ] Create comparison feature (track over time)
- [ ] Add PDF export of analysis

### Phase 5: Regulation Updates (Ongoing)
- [ ] Set up automated regulation scraping
- [ ] Build vector database for semantic search
- [ ] Implement change detection for regulations
- [ ] Alert users of new relevant regulations

## Technical Considerations

### Security
- API authentication using JWT tokens
- Rate limiting on AI analysis requests
- Secure handling of property data
- User data privacy compliance

### Performance
- Cache analysis results (24-48 hours)
- Asynchronous processing for long analyses
- Progressive loading of results
- Pagination for large datasets

### Cost Management
- Track AI API usage per user/property
- Implement analysis limits (e.g., 10/month free)
- Consider tiered pricing for unlimited analyses

### Testing Strategy
- Unit tests for data transformation
- Integration tests for AI agent
- Mock AI responses for development
- End-to-end testing of full flow

## API Endpoints to Build

### Next.js API Routes
```
POST /api/ai-analysis/request
  - Trigger new analysis
  - Returns analysis_id

GET /api/ai-analysis/:id
  - Get specific analysis result

GET /api/ai-analysis/property/:propertyId
  - Get all analyses for property

POST /api/ai-analysis/:id/feedback
  - Submit user feedback on analysis
```

### AI Service Endpoints (Python FastAPI)
```
POST /api/v1/analyze
  - Main analysis endpoint
  - Receives property data payload
  - Returns structured analysis

GET /api/v1/regulations/:city
  - Get regulations for city

POST /api/v1/regulations/search
  - Semantic search for relevant regulations
```

## Next Steps - Action Items

1. **Immediate:**
   - Review and approve this architecture plan
   - Decide on AI model (GPT-4 vs Claude)
   - Set up Python FastAPI project structure
   - Create Supabase migration for new tables

2. **Short-term:**
   - Build basic AI agent with mock responses
   - Implement UI for triggering analysis
   - Test with sample property data

3. **Questions to Resolve:**
   - Where will AI service be hosted? (Vercel, Railway, AWS Lambda?)
   - What's the budget for AI API calls?
   - Should we build regulation database ourselves or use existing APIs?
   - How often should we allow users to run analyses?

## Cost Estimation

**Initial Development:** 4-6 weeks
**Ongoing Costs:**
- AI API: ~$0.10 - $0.50 per analysis (depending on model)
- Hosting: $20-50/month for AI service
- Vector database: $0-70/month (depending on scale)

**Revenue Opportunity:**
- Freemium model: 5 free analyses/month
- Pro plan: Unlimited analyses $29/month
- Enterprise: Custom pricing
