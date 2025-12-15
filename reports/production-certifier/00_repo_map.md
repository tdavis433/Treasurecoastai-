# 00 - Repository Map

**Generated:** December 15, 2025  
**Certifier:** Treasure Coast AI Production Certifier

---

## Directory Tree (Excluding node_modules/dist)

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
│   ├── app.ts                       # Express app setup (Helmet, CORS, session)
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
│   └── test/                        # Test assets
│
├── migrations/                      # Drizzle migrations
│   ├── meta/                        # Migration metadata
│   └── *.sql                        # SQL migration files
│
├── tests/                           # Test suites
│   ├── unit/                        # Unit tests (507 tests)
│   └── integration/                 # Integration tests
│
├── scripts/                         # Automation scripts
│   ├── seed-bot-templates.ts        # Template seeding
│   ├── validate-db-templates.ts     # Template validation
│   ├── provisioning-smoke-test.ts   # Provisioning tests
│   ├── secrets-scan.sh              # Secrets scanner
│   ├── guard-no-payments.sh         # Payment guard
│   └── ...                          # Other scripts
│
└── reports/                         # Certification reports
    └── production-certifier/        # This audit
```

---

## Key Entry Points

| Component | Location | Description |
|-----------|----------|-------------|
| **Express Entry (Dev)** | `server/index-dev.ts` | Development server with Vite HMR |
| **Express Entry (Prod)** | `server/index-prod.ts` | Production server |
| **Express App Setup** | `server/app.ts` | Helmet, CORS, session, rate limiting |
| **API Routes** | `server/routes.ts` | All REST API endpoints (~12,000 lines) |
| **Frontend Entry** | `client/src/main.tsx` | React app mount point |
| **Frontend Router** | `client/src/App.tsx` | Wouter routing setup |
| **DB Schema** | `shared/schema.ts` | Drizzle ORM table definitions |

---

## Session/Auth Middleware Stack

| Middleware | Location | Purpose |
|------------|----------|---------|
| `helmet()` | `server/app.ts` | Secure HTTP headers + CSP |
| `session()` | `server/app.ts` | connect-pg-simple session store |
| `csrfMiddleware` | `server/csrfMiddleware.ts` | Double-submit cookie pattern |
| `requireAuth` | `server/routes.ts` | Session validation |
| `requireSuperAdmin` | `server/routes.ts` | Super admin only |
| `requireClientAuth` | `server/routes.ts` | Client + workspace validation |
| `requireOperationalAccess` | `server/utils/rbac.ts` | RBAC - operational tier |
| `requireConfigAccess` | `server/utils/rbac.ts` | RBAC - config tier |
| `requireDestructiveAccess` | `server/utils/rbac.ts` | RBAC - destructive tier |

---

## Template System

| Component | Location | Purpose |
|-----------|----------|---------|
| `INDUSTRY_TEMPLATES` | `server/industryTemplates.ts` | 15 industry definitions |
| `bot_templates` table | `shared/schema.ts` | DB template storage |
| `templateIdMap.ts` | `server/templates/` | Key → DB ID mapping |
| `ensureTemplatesSeeded.ts` | `server/templates/` | Boot-time seeding |
| `buildClientFromTemplate.ts` | `server/templates/` | Provisioning logic |

---

## Widget Embed Security

| Control | Location | Status |
|---------|----------|--------|
| CORS allowlist | `server/app.ts` | WIDGET_ALLOWED_ORIGINS |
| HMAC tokens | `server/routes.ts` | Widget auth |
| Rate limiting | `server/app.ts` | 100 req/15min (prod) |
| credentials:false | `server/app.ts` | No cookie sharing |

---

## Evidence

Commands run:
```bash
$ ls -R (filtered)
$ grep -r "registerRoutes" server/
$ cat server/app.ts | head -200
```

**Status:** PASS
