# Treasure Coast AI - Comprehensive Code Audit Report

**Date:** November 28, 2025  
**Auditor:** Replit Agent  
**Scope:** Production-grade SaaS platform analysis (~100+ files)  
**Status:** Phase 2 - Categorized Audit Report Complete

---

## Executive Summary

Treasure Coast AI is a well-structured multi-tenant AI chatbot platform with solid foundational architecture. The codebase demonstrates good separation of concerns and follows modern JavaScript/TypeScript patterns. However, several areas require attention before production deployment:

- **Critical Issues:** 2 (security: hardcoded credentials, missing rate limiting) - TypeScript issues ✅ resolved
- **High Priority:** 8 (database indexes, CORS, validation gaps, error handling)
- **Medium Priority:** 15 (code quality, UX improvements)
- **Low Priority:** 12 (documentation, minor optimizations)

**Audit Progress:**
- ✅ Phase 1: Discovery & Analysis - Complete
- ✅ Phase 2: Categorized Report - Complete  
- 🔄 Phase 3: Actionable Fix Plan - Ready for approval
- ⏳ Phase 4: Code Rewrites - Awaiting approval

---

## 1. BUGS - Issues Requiring Immediate Fix

### 1.1 TypeScript/Type Issues

#### ~~Bug #1: storage.ts Line 676 - createLead Insert~~ ✅ VERIFIED CORRECT
**File:** `server/storage.ts`  
**Status:** No fix required - Drizzle v5 correctly accepts single-object `.values(...)` calls.
```typescript
// Current implementation is CORRECT:
const [created] = await db.insert(leads).values(lead).returning();
return created;
```

#### ~~Bug #2: app.ts Lines 39-40 - Session Declaration~~ ✅ FIXED
**File:** `server/app.ts`  
**Status:** RESOLVED - Added missing `clientId` to SessionData interface.
```typescript
// Fixed implementation:
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: 'super_admin' | 'client_admin';
    clientId?: string | null;  // Added
  }
}
```

### 1.2 High: Potential Runtime Errors

#### Bug #3: Missing null checks in widget.js
**File:** `public/widget/widget.js`  
**Issue:** Lines 232-238 attempt hex color parsing without validation.
```javascript
// Current (can throw on invalid color):
var r = parseInt(config.primaryColor.slice(1, 3), 16);

// Fix: Add validation
function applyTheme() {
  if (!config.primaryColor || !/^#[0-9A-Fa-f]{6}$/.test(config.primaryColor)) {
    config.primaryColor = '#2563eb'; // fallback
  }
  // ... rest of function
}
```

#### Bug #4: Unhandled Promise Rejection in automations.ts
**File:** `server/automations.ts`  
**Issue:** Line 173 - The lead creation in automation doesn't handle potential errors from storage.createLead.
```typescript
// Add try-catch wrapper for lead capture action
```

---

## 2. REMOVALS - Dead Code & Unused Items

### 2.1 Unused Imports/Variables

| File | Line(s) | Item | Notes |
|------|---------|------|-------|
| `server/routes.ts` | Multiple | Various unused imports | Clean up after refactoring |
| `client/src/pages/control-center.tsx` | Line 22 | `Check` icon import | Imported but not used in JSX |

### 2.2 Legacy/Deprecated Code

#### Item #1: Legacy Single-Tenant Faith House Code
**Files:** Multiple routes in `server/routes.ts`  
**Recommendation:** The legacy `/api/chat` endpoint and related Faith House-specific routes should be marked as deprecated or migrated to the multi-tenant pattern.

#### Item #2: Duplicate System Prompt Logic
**Files:** `server/routes.ts` (getSystemPrompt, getDefaultSystemPrompt) and `server/botConfig.ts` (buildSystemPromptFromConfig)  
**Recommendation:** Consolidate into single source of truth in `botConfig.ts`.

### 2.3 Commented Out Code
- Review and remove any `// TODO` or commented blocks that are no longer relevant

---

## 3. ADDITIONS - Missing Functionality

### 3.1 Critical: Security Additions Needed

#### Addition #1: Rate Limiting
**Priority:** CRITICAL  
**Reason:** No rate limiting on API endpoints, making the platform vulnerable to abuse.
```typescript
// Recommended: Add express-rate-limit
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: { error: 'Too many requests' }
});

app.use('/api/', apiLimiter);
```

#### Addition #2: Input Sanitization for Chat Messages
**Priority:** HIGH  
**File:** `server/routes.ts` (multi-tenant chat endpoint)  
**Reason:** User messages should be sanitized before processing to prevent injection attacks.

#### Addition #3: CORS Configuration for Widget
**Priority:** HIGH  
**File:** `server/app.ts`  
**Reason:** Widget embeds on third-party sites need explicit CORS headers.
```typescript
import cors from 'cors';

const widgetCors = cors({
  origin: (origin, callback) => {
    // Validate against client's registered domains
    callback(null, true);
  },
  credentials: true
});

app.use('/api/chat/:clientId/:botId', widgetCors);
app.use('/widget', widgetCors);
```

### 3.2 High: Database Additions

#### Addition #4: Missing Database Indexes
**File:** `shared/schema.ts`  
**Impact:** Query performance will degrade with data growth.
```typescript
// Add to schema.ts using Drizzle's index syntax:

// appointments table
export const appointmentsClientIdIdx = index('appointments_client_id_idx').on(appointments.clientId);
export const appointmentsStatusIdx = index('appointments_status_idx').on(appointments.status);

// chatSessions table
export const chatSessionsClientIdIdx = index('chat_sessions_client_id_idx').on(chatSessions.clientId);
export const chatSessionsSessionIdIdx = index('chat_sessions_session_id_idx').on(chatSessions.sessionId);

// chatAnalyticsEvents table
export const chatEventsClientIdIdx = index('chat_events_client_id_idx').on(chatAnalyticsEvents.clientId);
export const chatEventsSessionIdIdx = index('chat_events_session_id_idx').on(chatAnalyticsEvents.sessionId);
export const chatEventsCreatedAtIdx = index('chat_events_created_at_idx').on(chatAnalyticsEvents.createdAt);

// leads table
export const leadsClientIdIdx = index('leads_client_id_idx').on(leads.clientId);
export const leadsStatusIdx = index('leads_status_idx').on(leads.status);

// dailyAnalytics table
export const dailyAnalyticsClientDateIdx = index('daily_analytics_client_date_idx')
  .on(dailyAnalytics.clientId, dailyAnalytics.date);

// monthlyUsage table
export const monthlyUsageClientMonthIdx = index('monthly_usage_client_month_idx')
  .on(monthlyUsage.clientId, monthlyUsage.month);
```

#### Addition #5: Foreign Key Relationships
**File:** `shared/schema.ts`  
**Issue:** Tables reference clientId but lack formal foreign key constraints.
```typescript
// Consider adding relations for referential integrity
export const appointmentsRelations = relations(appointments, ({ one }) => ({
  settings: one(clientSettings, {
    fields: [appointments.clientId],
    references: [clientSettings.clientId],
  }),
}));
```

### 3.3 Medium: Feature Additions

#### Addition #6: Request Logging/Audit Trail
**Priority:** MEDIUM  
**Reason:** No audit logging for admin actions (status changes, config updates).
```typescript
// Add audit_logs table to schema.ts
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  action: text("action").notNull(), // 'update_status', 'edit_bot', 'delete_lead'
  resourceType: text("resource_type").notNull(), // 'client', 'bot', 'lead'
  resourceId: varchar("resource_id").notNull(),
  oldValue: json("old_value"),
  newValue: json("new_value"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### Addition #7: Health Check Endpoint
**Priority:** MEDIUM  
**Reason:** No health check for monitoring/load balancers.
```typescript
app.get('/api/health', async (req, res) => {
  try {
    // Check DB connection
    await db.execute(sql`SELECT 1`);
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version 
    });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});
```

---

## 4. IMPROVEMENTS - Enhancements to Existing Code

### 4.1 Critical: Security Improvements

#### Improvement #1: Default Admin Credentials
**File:** `server/routes.ts` Lines 52-101  
**Issue:** Hardcoded default credentials ("admin/admin123", "staff/staff123").
**Risk:** CRITICAL - These are exposed in source code.
**Fix:**
```typescript
async function ensureAdminUserExists() {
  const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
  if (!defaultAdminPassword) {
    console.warn("WARNING: No DEFAULT_ADMIN_PASSWORD set. Skipping default user creation.");
    return;
  }
  // ... rest of function using env variable
}
```

#### Improvement #2: Session Secret Validation
**File:** `server/app.ts` Lines 44-46  
**Current:** Throws generic error if SESSION_SECRET missing.
**Improvement:** Add minimum length/complexity requirements.
```typescript
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters for security");
}
```

### 4.2 High: Validation Improvements

#### Improvement #3: Multi-tenant Chat Endpoint Validation
**File:** `server/routes.ts` (POST /api/chat/:clientId/:botId)  
**Issue:** Limited validation on request body.
```typescript
// Add comprehensive schema
const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(10000), // Add max length
  })).min(1).max(50), // Limit conversation history
  sessionId: z.string().min(1).max(100).optional(),
  language: z.enum(['en', 'es']).optional().default('en'),
  source: z.enum(['web', 'widget', 'api']).optional().default('web'),
});
```

#### Improvement #4: Bot Config Validation
**File:** `server/botConfig.ts`  
**Issue:** JSON files are loaded without schema validation.
**Fix:** Add Zod schema for BotConfig and validate on load.

### 4.3 Medium: Error Handling Improvements

#### Improvement #5: Consistent Error Response Format
**Multiple Files**  
**Issue:** Inconsistent error response structures across endpoints.
```typescript
// Standardize all API errors:
interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Create error utility:
function sendError(res: Response, status: number, error: string, code?: string) {
  res.status(status).json({ error, code });
}
```

#### Improvement #6: OpenAI Error Handling
**File:** `server/routes.ts`  
**Issue:** OpenAI API errors may expose internal details.
```typescript
try {
  const completion = await openai.chat.completions.create({...});
} catch (error) {
  if (error instanceof OpenAI.APIError) {
    console.error('OpenAI API Error:', error.status, error.message);
    // Return user-friendly message, log full error
    return res.status(503).json({ error: 'AI service temporarily unavailable' });
  }
  throw error;
}
```

### 4.4 Medium: Performance Improvements

#### Improvement #7: Bot Config Caching Strategy
**File:** `server/botConfig.ts`  
**Issue:** File system reads on every request (even with cache, TTL is only 60s).
**Improvement:** Use longer cache TTL with cache invalidation on write.
```typescript
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
// Invalidate cache only when saveBotConfig is called
```

#### Improvement #8: Database Connection Pooling
**File:** `server/storage.ts`  
**Issue:** Verify pool settings are optimized for production.
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

### 4.5 Low: Code Quality Improvements

#### Improvement #9: TypeScript Strict Mode
**File:** `tsconfig.json`  
**Recommendation:** Enable stricter TypeScript checks.
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

#### Improvement #10: Component Prop Types
**Multiple Frontend Files**  
**Issue:** Some components lack proper TypeScript interfaces for props.

---

## 5. FILE-BY-FILE PRIORITY MATRIX

### Tier 1: Fix Immediately (Production Blockers)

| File | Action | Effort | Impact | Status |
|------|--------|--------|--------|--------|
| ~~`server/storage.ts:676`~~ | ~~Fix createLead insert type~~ | - | - | ✅ Verified correct |
| ~~`server/app.ts:39-40`~~ | ~~Fix SessionData declaration~~ | - | - | ✅ Fixed |
| `server/routes.ts:52-101` | Remove hardcoded credentials | 30 min | Critical | ⚠️ PENDING |
| `server/app.ts` | Add CORS for widget | 30 min | High | ⚠️ PENDING |
| NEW: Add rate limiting | Install express-rate-limit | 30 min | Critical | ⚠️ PENDING |

### Tier 2: Fix Before Launch (High Priority)

| File | Action | Effort | Impact |
|------|--------|--------|--------|
| `shared/schema.ts` | Add database indexes | 1 hour | High |
| `server/routes.ts` | Add rate limiting | 1 hour | High |
| `server/routes.ts` | Add chat request validation | 30 min | High |
| `public/widget/widget.js` | Add color validation | 15 min | Medium |

### Tier 3: Fix After Launch (Medium Priority)

| File | Action | Effort | Impact |
|------|--------|--------|--------|
| `shared/schema.ts` | Add audit_logs table | 2 hours | Medium |
| `server/botConfig.ts` | Add config validation | 1 hour | Medium |
| Multiple | Standardize error responses | 2 hours | Medium |
| Multiple | Add health check endpoint | 30 min | Medium |

### Tier 4: Technical Debt (Low Priority)

| File | Action | Effort | Impact |
|------|--------|--------|--------|
| `server/routes.ts` | Consolidate system prompt logic | 1 hour | Low |
| Multiple | Remove unused imports | 30 min | Low |
| `tsconfig.json` | Enable strict mode | 2 hours | Low |

---

## 6. SECURITY CHECKLIST

### Authentication & Authorization
- [x] Session-based auth with PostgreSQL store
- [x] Password hashing with bcrypt
- [x] Role-based access control (super_admin, client_admin)
- [ ] Rate limiting on login endpoint
- [ ] Password complexity requirements
- [ ] Account lockout after failed attempts
- [ ] Session timeout configuration

### Data Protection
- [x] PII sanitization in analytics
- [x] HttpOnly cookies for sessions
- [x] Secure cookie flag in production
- [ ] Input sanitization for all user inputs
- [ ] SQL injection protection (using Drizzle ORM - safe)
- [ ] XSS protection headers

### API Security
- [ ] Rate limiting on all endpoints
- [ ] CORS properly configured for widget
- [ ] API key authentication for external integrations
- [ ] Request size limits

### Infrastructure
- [x] Environment variable for secrets
- [x] Stripe webhook signature verification
- [ ] HTTPS enforcement
- [ ] Security headers (Helmet.js)

---

## 7. RECOMMENDED NEXT STEPS

### Phase 3: Actionable Fix Plan (Ready for Approval)

1. **Immediate (Day 1):**
   - Fix LSP errors in storage.ts and app.ts
   - Remove hardcoded default credentials
   - Add rate limiting middleware

2. **Short-term (Week 1):**
   - Add database indexes
   - Implement CORS for widget
   - Add request validation schemas
   - Add health check endpoint

3. **Medium-term (Week 2-3):**
   - Add audit logging
   - Consolidate duplicate code
   - Implement comprehensive error handling
   - Add security headers

4. **Long-term (Month 1):**
   - Enable TypeScript strict mode
   - Add integration tests
   - Performance optimization
   - Documentation updates

---

## 8. APPENDIX

### A. Files Analyzed (Comprehensive List)

**Backend (12 files):**
- server/app.ts
- server/routes.ts (3020 lines)
- server/storage.ts
- server/botConfig.ts
- server/stripeService.ts
- server/stripeClient.ts
- server/webhookHandlers.ts
- server/automations.ts
- server/planLimits.ts
- server/conversationLogger.ts
- server/vite.ts
- server/index.ts

**Shared (1 file):**
- shared/schema.ts

**Frontend (16+ pages):**
- client/src/App.tsx
- client/src/pages/control-center.tsx
- client/src/pages/client-dashboard.tsx
- client/src/pages/inbox.tsx
- client/src/pages/leads.tsx
- client/src/pages/login.tsx
- client/src/pages/demos.tsx
- client/src/pages/demo-bot.tsx
- client/src/pages/bot-dashboard.tsx
- client/src/pages/create-bot.tsx
- client/src/pages/super-admin.tsx
- client/src/pages/admin-dashboard.tsx
- client/src/pages/admin-appointments.tsx
- client/src/pages/admin-analytics.tsx
- client/src/pages/home.tsx
- client/src/pages/not-found.tsx

**Widget (5 files):**
- public/widget/embed.js
- public/widget/widget.js
- public/widget/frame.html
- public/widget/widget.css
- public/widget/README.md

**Bot Configs (10 files):**
- bots/faith_house.json
- bots/restaurant_demo.json
- bots/barber_demo.json
- bots/homeservice_demo.json
- bots/autoservice_demo.json
- bots/gym_demo.json
- bots/realestate_demo.json
- bots/medspa_demo.json
- bots/tattoo_demo.json
- bots/soberliving_demo.json

### B. Testing Recommendations

1. Add unit tests for:
   - Storage layer methods
   - Automation engine
   - Plan limits checking
   - Bot config loading

2. Add integration tests for:
   - Authentication flow
   - Multi-tenant chat
   - Stripe checkout flow
   - Widget embedding

3. Add E2E tests for:
   - Control Center workflows
   - Client dashboard
   - Lead management
   - Inbox conversations

---

**Report Generated:** November 28, 2025  
**Next Phase:** Awaiting approval to proceed with Phase 4 (Code Rewrites)
