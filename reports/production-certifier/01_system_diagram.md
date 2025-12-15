# 01 - System Diagram

**Generated:** December 15, 2025  
**Certifier:** Treasure Coast AI Production Certifier

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TREASURE COAST AI PLATFORM                             │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │  EXTERNAL SITE  │
                              │  (Client's Web) │
                              └────────┬────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              WIDGET LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  <script src="/widget/loader.js">                                        │ │
│  │  • HMAC Token Validation                                                  │ │
│  │  • CORS Restricted (WIDGET_ALLOWED_ORIGINS)                              │ │
│  │  • Rate Limited (100 req/15min)                                          │ │
│  │  • credentials:false (no cookies)                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER (Express)                               │
│  server/routes.ts (~12,000 lines)                                             │
│                                                                                │
│  PUBLIC ENDPOINTS:                  PROTECTED ENDPOINTS:                       │
│  • POST /api/chat/:clientId/:botId  • GET/POST /api/admin/*                   │
│  • GET /api/widget/config/*         • GET/POST /api/client/*                  │
│  • GET /api/health                  • GET/POST /api/super-admin/*             │
│                                                                                │
│  MIDDLEWARE STACK:                                                             │
│  ┌─────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────────────────────────┐│
│  │ Helmet  │→│ Session  │→│ CSRF Check │→│ RBAC (operational/config/destruct)││
│  │ (CSP)   │ │ (PG)     │ │            │ │ tenantScope validation            ││
│  └─────────┘ └──────────┘ └────────────┘ └──────────────────────────────────┘│
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         ORCHESTRATOR (server/orchestrator.ts)                  │
│                         "ONE BRAIN ONE BEHAVIOR"                               │
│                                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │ Load Bot Config │→ │ Build Context   │→ │ OpenAI GPT-4 Call            │  │
│  │ (configCache)   │  │ + Behavior Rules │  │ (with failsafe fallback)     │  │
│  └─────────────────┘  └─────────────────┘  └───────────────┬──────────────┘  │
│                                                             │                  │
│  ┌──────────────────────────────────────────────────────────▼──────────────┐ │
│  │ POST-PROCESSING:                                                         │ │
│  │ • Lead/Booking Intent Detection                                          │ │
│  │ • Crisis Detection → Flag + 988/911 message                             │ │
│  │ • Contact Info Extraction (resilient persistence)                        │ │
│  │ • Deduplication (session + 5-min cross-session)                         │ │
│  │ • Conversation Logging                                                   │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         STORAGE LAYER (server/storage.ts)                      │
│                         Drizzle ORM → PostgreSQL (Neon)                        │
│                                                                                │
│  ALL QUERIES SCOPED BY:                                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  effectiveClientId / workspaceId (from session)                         │  │
│  │  • tenantScope.ts enforces session-based scoping                        │  │
│  │  • No cross-tenant data exposure                                         │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  TABLES:                                                                       │
│  • workspaces, clients, users, workspace_memberships                          │
│  • bots, bot_templates                                                         │
│  • conversations, conversation_messages                                        │
│  • leads, bookings                                                             │
│  • automation_rules, webhooks                                                  │
│  • conversation_analytics, daily_analytics                                     │
│  • preview_links, password_reset_tokens                                        │
│  • system_logs, audit_logs                                                     │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              DASHBOARDS                                        │
│                                                                                │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────────┐ │
│  │ SUPER ADMIN       │  │ AGENCY DASHBOARD  │  │ CLIENT DASHBOARD          │ │
│  │ • Full platform   │  │ • Bot config      │  │ • VIEW-ONLY               │ │
│  │   control         │  │ • Widget settings │  │ • Conversations           │ │
│  │ • Client mgmt     │  │ • Lead/booking    │  │ • Leads/Bookings          │ │
│  │ • Template mgmt   │  │   management      │  │ • Analytics               │ │
│  │ • System logs     │  │ • Analytics       │  │                           │ │
│  └───────────────────┘  └───────────────────┘  └───────────────────────────┘ │
│                                                                                │
│  ROLE-BASED ACCESS CONTROL (RBAC):                                            │
│  • owner/manager: Full access                                                  │
│  • staff: Operational + Config (no destructive)                               │
│  • agent: Operational only (leads, notes, bookings - no config)               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌────────────────┐
│ Login POST  │ →  │ Validate     │ →  │ Session         │ →  │ Set Cookie     │
│ /api/login  │    │ Credentials  │    │ Regeneration    │    │ (httpOnly,     │
└─────────────┘    │ (bcrypt)     │    │ (req.session    │    │ secure, sameSite)│
                   └──────────────┘    │ .regenerate())  │    └────────────────┘
                                       └─────────────────┘
```

---

## Widget Chat Flow

```
[External Site Widget]
        │
        ├─ GET /api/widget/config/:clientId
        │   └→ Returns: botId, theme, bookingProfile
        │
        ├─ POST /api/chat/:clientId/:botId
        │   ├→ HMAC Token Validation
        │   ├→ Rate Limit Check
        │   ├→ Orchestrator.process()
        │   ├→ OpenAI API Call
        │   ├→ Lead/Booking Detection
        │   ├→ DB Writes (conversation, messages, analytics)
        │   └→ Response to Widget
        │
        └─ POST /api/booking-link-click (if external booking)
            └→ Log click event, redirect to external URL
```

---

## Multi-Tenant Isolation Points

| Layer | Isolation Mechanism |
|-------|---------------------|
| API | `effectiveClientId` from session |
| Storage | All queries filter by clientId/workspaceId |
| Config | `configCache` keyed by botId (validated per-tenant) |
| Logging | clientId included in all log entries |
| Analytics | Aggregated per-client |

---

## Evidence

Files reviewed:
- `server/app.ts` (middleware stack)
- `server/routes.ts` (API endpoints)
- `server/orchestrator.ts` (AI brain)
- `server/storage.ts` (DB layer)
- `server/utils/rbac.ts` (access control)
- `server/utils/tenantScope.ts` (tenant isolation)

**Status:** PASS
