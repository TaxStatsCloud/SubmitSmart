# Companies House API Discovery Agent - Implementation Summary

## Overview
This document summarizes the implementation and critical fixes for the Companies House API discovery agent system, which automatically identifies UK companies with upcoming filing deadlines and scores them as sales leads.

## Architecture

### Core Components

1. **Companies House API Service** (`server/services/companiesHouseApiService.ts`)
   - Handles all interactions with Companies House API
   - Implements proper Basic authentication
   - Provides company search, profile retrieval, and filing history queries
   - Built-in rate limiting and error handling

2. **Companies House Agent** (`server/services/agents/companiesHouseAgent.ts`)
   - Orchestrates the discovery workflow
   - Queries Companies House API for companies with upcoming deadlines
   - Calculates lead scores based on urgency and company characteristics
   - Creates/updates prospect records with CRM field preservation
   - Tracks execution metrics in agentRuns table

3. **Agent Routes** (`server/routes/agentRoutes.ts`)
   - `POST /api/agents/run` - Trigger agent execution
   - `GET /api/agents/prospects` - Query prospects with filtering
   - `GET /api/agents/stats` - Agent performance metrics
   - `GET /api/agents/runs` - Execution history

4. **Prospects Dashboard** (`client/src/pages/ProspectsDashboard.tsx`)
   - Visual display of discovered companies
   - Lead priority badges (high/medium/low)
   - Days-until-deadline calculations
   - Agent run history and statistics
   - Manual discovery trigger

## Critical Fixes Applied

### 1. Companies House API Authentication ✅
**Problem:** Incorrect Authorization header format causing API authentication failures

**Solution:**
```typescript
// Fixed: Proper Basic authentication encoding
this.apiKey = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
```

**Companies House Requirement:**
- API key as username
- Empty password (blank)
- Format: `Authorization: Basic base64(apiKey:)`

### 2. Prospect Persistence ✅
**Problem:** Agent was not writing discovered companies to prospects table

**Solution:**
- Added `createOrUpdateProspect()` function
- Implements lead scoring algorithm
- Writes to prospects table with all required fields
- Returns metrics for tracking (prospectsCreated, prospectsUpdated)

**Lead Scoring Algorithm:**
```
Base Score Calculation:
- Active company status: +30 points
- Accounts deadline ≤30 days: +40 points (VERY URGENT)
- Accounts deadline ≤60 days: +30 points (URGENT)  
- Accounts deadline ≤90 days: +20 points (MODERATE)
- CS deadline ≤30 days: +20 points
- CS deadline ≤60 days: +15 points
- CS deadline ≤90 days: +10 points

Max Score: 100 (capped)
High Priority: score ≥60
```

### 3. Lead Status Preservation ✅
**Problem:** Agent re-runs were resetting leadStatus to 'new', destroying pipeline progress

**Solution:**
```typescript
if (existingProspect) {
  // Update only API-sourced fields, preserve CRM fields
  await db.update(prospects).set({
    companyName: companyData.company_name,
    companyStatus: companyData.company_status,
    accountsDueDate: companyData.next_accounts_due || null,
    confirmationStatementDueDate: companyData.next_confirmation_statement_due || null,
    leadScore, // Update based on new deadlines
    // leadStatus is NOT updated - preserves contacted/qualified/etc
    agentRunId, // Track latest discovery
    updatedAt: new Date()
  })
  .where(eq(prospects.id, existingProspect.id));
}
```

**CRM Fields Preserved:**
- `leadStatus` (new/contacted/qualified/converted/lost)
- `notes` (sales notes)
- `contactedAt` (outreach timestamps)
- Any other user-managed fields

### 4. API Endpoints ✅
**Problem:** Missing endpoints for prospects and statistics

**Solution:**
Added comprehensive endpoints:

```typescript
// GET /api/agents/prospects
// Returns prospects with filtering
router.get('/prospects', async (req, res) => {
  const { status, minScore, limit } = req.query;
  // Returns ordered by leadScore DESC, createdAt DESC
  // Supports filtering by leadStatus and minimum leadScore
});

// GET /api/agents/stats
// Returns performance metrics
router.get('/stats', async (req, res) => {
  // Returns: totalRuns, successfulRuns, failedRuns, averageProspectsPerRun
});
```

## Data Model

### Prospects Table
```typescript
{
  id: serial
  companyNumber: string (unique)
  companyName: string
  companyStatus: string
  incorporationDate: date | null
  accountsDueDate: date | null
  confirmationStatementDueDate: date | null
  leadScore: integer (0-100)
  leadStatus: enum ('new', 'contacted', 'qualified', 'converted', 'lost')
  entitySize: enum ('micro', 'small', 'medium', 'large')
  sic_codes: string[]
  agentRunId: integer (FK to agentRuns)
  discoverySource: string ('companies_house_api', 'manual', 'import')
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Agent Runs Table
```typescript
{
  id: serial
  agentType: string
  status: enum ('running', 'completed', 'failed')
  startedAt: timestamp
  completedAt: timestamp | null
  metrics: jsonb {
    companiesProcessed: number
    filingRemindersCreated: number
    prospectsCreated: number
    prospectsUpdated: number
  }
}
```

## End-to-End Flow

1. **Manual Trigger:** User clicks "Run Discovery" on prospects dashboard
   - Frontend: `POST /api/agents/run` with `{ agentType: "companies_house" }`

2. **Agent Execution:**
   - Creates agentRun record with status='running'
   - Queries Companies House API with proper Basic auth
   - For each company discovered:
     - Calculates lead score based on deadline urgency
     - Checks if prospect exists (by companyNumber)
     - If exists: Updates API fields only, preserves CRM fields
     - If new: Creates prospect with leadStatus='new'
   - Updates agentRun with completion metrics

3. **Dashboard Display:**
   - Fetches prospects: `GET /api/agents/prospects`
   - Shows visual priority badges based on leadScore
   - Displays days-until-deadline calculations
   - Shows agent run history: `GET /api/agents/runs`
   - Displays statistics: `GET /api/agents/stats`

## Production Readiness Checklist

✅ **Authentication:** Companies House Basic auth properly implemented
✅ **Data Persistence:** Prospects written to database with all required fields  
✅ **Lead Scoring:** Algorithm implemented and tested
✅ **CRM Integration:** Lead status preserved across agent re-runs
✅ **API Endpoints:** Complete REST API for prospects and metrics
✅ **Error Handling:** Try-catch blocks, logging, graceful failures
✅ **Rate Limiting:** Built-in delays to respect Companies House API quotas
✅ **Metrics Tracking:** Comprehensive execution metrics in agentRuns
✅ **Frontend Dashboard:** Visual display with filtering and statistics
✅ **Deduplication:** Prevents duplicate prospects via companyNumber unique constraint

## Testing Recommendations

### Manual Testing
1. Trigger agent via dashboard "Run Discovery" button
2. Verify prospects appear in table
3. Check lead scores are calculated correctly (0-100)
4. Verify deadlines are displayed with urgency indicators
5. Test status updates (new → contacted → qualified)
6. Re-run agent and verify leadStatus is preserved

### API Testing
```bash
# Trigger agent
curl -X POST http://localhost:5000/api/agents/run \
  -H "Content-Type: application/json" \
  -d '{"agentType":"companies_house"}'

# Get prospects
curl http://localhost:5000/api/agents/prospects?minScore=60

# Get statistics  
curl http://localhost:5000/api/agents/stats
```

### Database Verification
```sql
-- Check prospects created
SELECT * FROM prospects ORDER BY lead_score DESC LIMIT 10;

-- Check agent runs
SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT 5;

-- Verify lead status preservation
SELECT company_number, company_name, lead_status, lead_score 
FROM prospects 
WHERE lead_status != 'new';
```

## Future Enhancements

### Planned (Not Yet Implemented)
1. **Entity Size Detection:** Replace 'micro' default with actual heuristic based on company data
2. **Automated Outreach:** Email campaigns to high-priority prospects
3. **Pipeline Management:** CRM workflow automation (new → contacted → qualified → converted)
4. **Performance Optimization:** Batch processing for large discovery runs
5. **Advanced Filtering:** Frontend filters for entity size, SIC codes, date ranges
6. **Scheduled Runs:** Cron-based automated discovery (disabled in dev mode)

## Troubleshooting

### Common Issues

**Issue:** API authentication errors
- **Fix:** Verify COMPANIES_HOUSE_API_KEY environment variable is set
- **Check:** Authorization header format is `Basic base64(apiKey:)`

**Issue:** Prospects not appearing
- **Fix:** Check agent runs table for execution status
- **Check:** Verify prospects table schema matches data model
- **Debug:** Review server logs for createOrUpdateProspect errors

**Issue:** Lead status reset to 'new'
- **Fix:** Verify using latest agent code with CRM field preservation
- **Check:** Update logic only modifies API-sourced fields

**Issue:** Low lead scores
- **Fix:** Verify deadline calculations are correct
- **Check:** Companies House API returning valid deadline dates
- **Adjust:** Lead scoring thresholds if needed (currently 30/60/90 days)

## Architecture Decisions

### Why Preserve Lead Status?
Agent re-runs should refresh company data from Companies House (deadlines, status) but NOT interfere with the sales pipeline. Once a prospect is marked 'contacted' or 'qualified', that represents human effort and should be preserved.

### Why Basic Authentication?
Companies House API requires Basic authentication with API key as username and blank password. This is the official authentication method per their documentation.

### Why Lead Scoring?
Automatically prioritizes prospects based on urgency (deadline proximity) and company characteristics. High scores (≥60) indicate companies that need immediate outreach for filing assistance.

### Why AgentRuns Tracking?
Provides complete audit trail of discovery executions, metrics for performance monitoring, and debugging capabilities when issues occur.

## Conclusion

The Companies House API discovery agent is now fully functional with:
- Proper authentication
- Complete prospect persistence with lead scoring
- CRM field preservation for pipeline integrity
- Comprehensive API endpoints
- Visual dashboard with metrics
- Production-ready error handling and logging

All critical issues identified have been resolved and architect-approved.
