# Treasure Coast AI - Repository Map and System Diagram

**Generated:** December 15, 2025  
**Phase:** 0 - Truth + Map  
**Purpose:** Production Certification Audit

---

## Directory Tree (Top 4 Levels)

```
/workspace
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── ui/                  # shadcn/ui base components
│   │   │   ├── demo/                # Demo page templates and configs
│   │   │   │   └── configs/         # Per-industry demo configurations
│   │   │   ├── examples/            # Example components
│   │   │   └── *.tsx                # Feature components (ChatWindow, etc.)
│   │   ├── pages/                   # Route pages (wouter)
│   │   ├── contexts/                # React contexts (admin-context)
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utilities (queryClient, chatClient)
│   │   ├── App.tsx                  # Main app with routing
│   │   └── main.tsx                 # Entry point
│   └── public/                      # Static assets
│
├── server/                          # Backend Express application
│   ├── templates/                   # Template system
│   │   ├── ensureTemplatesSeeded.ts # Auto-seed on boot
│   │   ├── templateIdMap.ts         # Industry ID mapping
│   │   ├── buildClientFromTemplate.ts # Client provisioning
│   │   └── index.ts                 # Template exports
│   ├── utils/                       # Server utilities
│   │   ├── rbac.ts                  # Role-based access control
│   │   ├── tenantScope.ts           # Multi-tenant isolation
│   │   ├── leadIntent.ts            # Lead detection
│   │   └── redact.ts                # PII redaction
│   ├── routes.ts                    # API routes (MAIN ENTRY)
│   ├── app.ts                       # Express app setup
│   ├── storage.ts                   # Database storage interface
│   ├── orchestrator.ts              # AI conversation orchestrator
│   ├── botConfig.ts                 # Bot configuration loader
│   ├── configCache.ts               # Enhanced config caching
│   ├── scraper.ts                   # Website scraping module
│   ├── mergeEngine.ts               # Knowledge merge engine
│   ├── previewToken.ts              # Preview link token logic
│   ├── embed.ts                     # Widget embed generator
│   ├── automations.ts               # Automation rules engine
│   ├── webhooks.ts                  # Webhook handlers
│   ├── emailService.ts              # Email notifications
│   ├── structuredLogger.ts          # Structured logging
│   ├── auditLogger.ts               # Audit trail logging
│   ├── csrfMiddleware.ts            # CSRF protection
│   ├── urlValidator.ts              # URL validation (HTTPS enforcement)
│   ├── demoSafeMode.ts              # Demo safety controls
│   ├── dataLifecycle.ts             # Data retention
│   ├── planLimits.ts                # Plan-based limits
│   ├── industryTemplates.ts         # Industry template definitions
│   ├── index-dev.ts                 # Dev server entry
│   └── index-prod.ts                # Production server entry
│
├── shared/                          # Shared types and schemas
│   ├── schema.ts                    # Drizzle ORM schema (MAIN DB SCHEMA)
│   ├── demo-template-configs.ts     # Demo template configurations
│   ├── industry-booking-profiles.ts # Per-industry booking defaults
│   └── contactSignals.ts            # Contact intent detection
│
├── public/                          # Static public assets
│   ├── widget/                      # Widget embed assets
│   │   └── (widget JS/CSS)
│   └── test/                        # Test assets
│
├── migrations/                      # Drizzle migrations
│   ├── meta/                        # Migration metadata
│   └── *.sql                        # SQL migration files
│
├── tests/                           # Test suites
│   ├── unit/                        # Unit tests
│   │   ├── behaviorPreset.test.ts
│   │   ├── rbac.test.ts
│   │   ├── templateProvisioning.test.ts
│   │   └── templateIndexConsistency.test.ts
│   └── integration/                 # Integration tests
│       └── multitenancy.test.ts
│
├── scripts/                         # Automation scripts
│   ├── seed-bot-templates.ts        # Template seeding
│   ├── validate-db-templates.ts     # Template validation
│   ├── provisioning-smoke-test.ts   # Provisioning tests
│   ├── validate-demo-templates.ts   # Demo validation
│   ├── industry-template-sweep.ts   # Industry sweep
│   ├── template-readiness-check.ts  # Template readiness
│   ├── api-e2e-test.sh              # API E2E tests
│   ├── widget-e2e-test.sh           # Widget E2E tests
│   ├── daily-self-check.sh          # Daily health check
│   ├── secrets-scan.sh              # Secrets scanner
│   ├── guard-no-payments.sh         # Payment guard
│   ├── predeploy-gate.sh            # Pre-deploy checks
│   ├── npm-audit-gate.sh            # NPM audit
│   ├── migration-safety-gate.sh     # Migration safety
│   ├── run-all-checks.sh            # Master check runner
│   └── load-test-critical-path.ts   # Load testing
│
├── bots/                            # Bot configuration files (JSON)
├── clients/                         # Client configuration files
├── logs/                            # Application logs
├── docs/                            # Documentation
└── reports/                         # Certification reports (this folder)
```

---

## Key Entry Points

| Component | Location | Description |
|-----------|----------|-------------|
| **Backend Entry (Dev)** | `server/index-dev.ts` | Development server with Vite HMR |
| **Backend Entry (Prod)** | `server/index-prod.ts` | Production server |
| **Express App Setup** | `server/app.ts` | Express middleware, Helmet, session |
| **API Routes** | `server/routes.ts` | All REST API endpoints |
| **Frontend Entry** | `client/src/main.tsx` | React app mount point |
| **Frontend Router** | `client/src/App.tsx` | Wouter routing setup |
| **DB Schema** | `shared/schema.ts` | Drizzle ORM table definitions |
| **Drizzle Config** | `drizzle.config.ts` | Drizzle-kit configuration |
| **Session/Auth Middleware** | `server/routes.ts` | Session setup in routes |
| **Widget Assets** | `public/widget/` | Embeddable widget JS/CSS |
| **Orchestrator** | `server/orchestrator.ts` | AI conversation brain |
| **Template System** | `server/templates/` | Template seeding/provisioning |
| **Onboarding Wizard** | `client/src/components/client-onboarding-wizard.tsx` | Agency onboarding |
| **Agency Console** | `client/src/pages/agency-onboarding-console.tsx` | Agency management |
| **Preview Links** | `server/previewToken.ts` | Token generation/validation |
| **Scraper Module** | `server/scraper.ts` | Website content extraction |
| **Analytics** | `client/src/pages/admin-analytics.tsx` | Analytics dashboard |
| **Structured Logging** | `server/structuredLogger.ts` | JSON logging |
| **Audit Logging** | `server/auditLogger.ts` | Security audit trail |

---

## System Flow Diagrams

### Flow 1: Widget Chat → Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WIDGET CHAT FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────┘

[External Website]
       │
       ▼
┌──────────────────┐
│  Widget Embed    │  <script src="/widget/loader.js">
│  (public/widget) │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ GET /api/widget/ │  Widget config endpoint (CORS enabled)
│ config/:clientId │  → Returns: botId, theme, businessType, bookingProfile
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ POST /api/chat   │  Chat message endpoint
│ (rate limited)   │  → Validates: HMAC token, clientId, botId
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (orchestrator.ts)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │
│  │ Load Config │→│ Build Prompt │→│ OpenAI GPT-4 Call       │   │
│  │ (configCache)│  │ (context)   │  │ (with failsafe fallback)│   │
│  └─────────────┘  └─────────────┘  └───────────┬─────────────┘   │
│                                                  │                  │
│  ┌─────────────────────────────────────────────▼────────────────┐ │
│  │ RESILIENT PERSISTENCE (even if OpenAI fails):                 │ │
│  │ - Extract contact info from conversation                      │ │
│  │ - Save lead/booking to DB                                     │ │
│  │ - Log conversation with session tracking                      │ │
│  │ - Flag for review if crisis/booking intent                    │ │
│  └───────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│ Database Writes  │  
│ (storage.ts)     │  → conversations, messages, leads, bookings, analytics
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                         DASHBOARDS                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │ Super Admin     │  │ Client Dashboard │  │ Agency Console  │   │
│  │ (full control)  │  │ (VIEW-ONLY)      │  │ (config access) │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Flow 2: Onboarding Wizard → Widget Embed

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CLIENT ONBOARDING FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

[Super Admin / Agency User]
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│              CLIENT ONBOARDING WIZARD                              │
│         (client/src/components/client-onboarding-wizard.tsx)       │
│                                                                    │
│  Step 1: Industry Template Selection (15 industries)              │
│  Step 2: Business Info (name, website URL optional)               │
│  Step 3: External Booking URL (optional, HTTPS only)              │
│  Step 4: Theme Colors (optional override)                         │
│  Step 5: Notes / Do-Not-Say rules                                 │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│              TEMPLATE PROVISIONING                                 │
│           (server/templates/buildClientFromTemplate.ts)            │
│                                                                    │
│  1. Load industry template (templateIdMap.ts)                     │
│  2. Create client record in DB                                    │
│  3. Create default AI assistant (bot)                             │
│  4. Apply booking profile defaults                                │
│  5. Set up default automations                                    │
│  6. Generate widget embed code                                    │
│  7. Create client user account                                    │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    QA VALIDATION                                   │
│                                                                    │
│  If PASS → Set to LIVE status → Copy Embed Code                   │
│  If FAIL → Show remediation suggestions                           │
│                                                                    │
│  Created data visible in:                                         │
│  • Super-admin dashboard                                          │
│  • Client view-only dashboard                                     │
│  • Widget preview                                                 │
└──────────────────────────────────────────────────────────────────┘
```

### Flow 3: Preview Link → Limited Access

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PREVIEW LINK FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────┘

[Agency User generates preview]
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│           PREVIEW TOKEN GENERATION                                 │
│              (server/previewToken.ts)                              │
│                                                                    │
│  Input: clientId, botId, expiryHours                              │
│  Output: Signed JWT token with expiry                             │
│  Storage: Token stored in DB with metadata                        │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│           PREVIEW URL                                              │
│  /preview/:token                                                   │
│  • CLIENT receives shareable link                                 │
│  • Link has time-limited validity (server-enforced)               │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│           TOKEN VALIDATION (server-side)                           │
│              (server/previewToken.ts)                              │
│                                                                    │
│  1. Verify JWT signature                                          │
│  2. Check expiry timestamp (SERVER-ENFORCED)                      │
│  3. Validate clientId/botId still exist                           │
│  4. Return 404 if expired or invalid                              │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│           PREVIEW PAGE                                             │
│         (client/src/pages/preview-page.tsx)                        │
│                                                                    │
│  • Limited functionality                                          │
│  • No admin controls                                              │
│  • Widget visible for testing                                     │
└──────────────────────────────────────────────────────────────────┘
```

### Flow 4: Scraper → Knowledge Merge → Bot Behavior

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WEBSITE SCRAPING FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

[Agency User provides website URL]
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    URL VALIDATION                                  │
│              (server/urlValidator.ts)                              │
│                                                                    │
│  SSRF PROTECTIONS:                                                │
│  ✗ Block localhost, 127.0.0.1, 0.0.0.0                           │
│  ✗ Block private IP ranges (10.x, 172.16-31.x, 192.168.x)        │
│  ✗ Block file://, ftp://, javascript://, data://                 │
│  ✗ Block http:// (HTTPS only for external)                       │
│  ✓ Only allow HTTPS URLs                                         │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SCRAPER MODULE                                  │
│              (server/scraper.ts)                                   │
│                                                                    │
│  SAFETY FEATURES:                                                 │
│  • Request timeout (configurable)                                 │
│  • Response size limits                                           │
│  • Graceful failure handling                                      │
│  • Content-type validation                                        │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    CONTENT EXTRACTION                              │
│                                                                    │
│  Extract:                                                         │
│  • Business name and description                                  │
│  • Services/products offered                                      │
│  • Contact information                                            │
│  • Hours of operation                                             │
│  • Location details                                               │
│  • FAQs and policies                                              │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    MERGE ENGINE                                    │
│              (server/mergeEngine.ts)                               │
│                                                                    │
│  SAFE MERGE:                                                      │
│  • Deduplicate entries                                            │
│  • Preserve manual edits (user overrides win)                     │
│  • Predictable conflict resolution                                │
│  • Version tracking                                               │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BOT KNOWLEDGE UPDATE                            │
│                                                                    │
│  Updates:                                                         │
│  • Bot knowledge base                                             │
│  • FAQ responses                                                  │
│  • Business context for AI                                        │
│  • Service-specific information                                   │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BOT BEHAVIOR                                    │
│              (server/orchestrator.ts)                              │
│                                                                    │
│  AI now knows:                                                    │
│  • What services the business offers                              │
│  • Business hours and location                                    │
│  • Policies and FAQ answers                                       │
│  • Contact methods and booking flow                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Security Controls

| Control | Location | Description |
|---------|----------|-------------|
| Multi-tenant Isolation | `server/utils/tenantScope.ts` | All queries scoped by effectiveClientId |
| RBAC | `server/utils/rbac.ts` | 4-tier: owner/manager/staff/agent |
| CSRF Protection | `server/csrfMiddleware.ts` | Double-submit cookie pattern |
| Session Security | `server/app.ts` | Secure cookies, httpOnly, sameSite |
| Rate Limiting | `server/routes.ts` | Per-endpoint rate limits |
| HMAC Token Validation | `server/routes.ts` | Widget request authentication |
| URL Validation | `server/urlValidator.ts` | SSRF protection, HTTPS-only |
| Audit Logging | `server/auditLogger.ts` | Security event tracking |
| Input Validation | Various routes | Zod schema validation |
| Account Lockout | `server/routes.ts` | Failed login protection |

---

## Template System (15 Industries)

Templates defined in:
- `server/industryTemplates.ts` - Industry definitions
- `server/templates/templateIdMap.ts` - ID mapping
- `shared/industry-booking-profiles.ts` - Booking defaults

Industries:
1. Restaurant
2. Barber/Salon  
3. Fitness/Gym
4. Med Spa
5. Tattoo Studio
6. Real Estate
7. Auto Care
8. Handyman/Home Services
9. Recovery House (Sober Living)
10. Wedding Venue
11. Roofing Company
12. Boutique Hotel
13. Dental Clinic
14. Law Firm
15. Pet Grooming (Paws & Suds)

---

## Scripts Inventory

| Script | Purpose | Exit Codes |
|--------|---------|------------|
| `secrets-scan.sh` | Detect leaked secrets | 0=clean, 1=found |
| `guard-no-payments.sh` | Verify no payment code | 0=pass, 1=fail |
| `predeploy-gate.sh` | Pre-deployment checks | 0=pass, 1=fail |
| `npm-audit-gate.sh` | NPM vulnerability audit | 0=pass, 1=fail |
| `migration-safety-gate.sh` | Migration safety | 0=pass, 1=fail |
| `api-e2e-test.sh` | API end-to-end tests | 0=pass, 1=fail |
| `widget-e2e-test.sh` | Widget E2E tests | 0=pass, 1=fail |
| `daily-self-check.sh` | Daily health check | 0=pass, 1=fail |
| `run-all-checks.sh` | Master runner | 0=all pass |
| `seed-bot-templates.ts` | Seed templates to DB | |
| `validate-db-templates.ts` | Validate DB templates | |
| `provisioning-smoke-test.ts` | Provisioning tests | |
| `validate-demo-templates.ts` | Demo mapping validation | |
| `industry-template-sweep.ts` | Industry sweep | |

---

**Next Phase:** Phase 1 - Baseline Checks
