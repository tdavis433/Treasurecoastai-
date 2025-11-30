# Treasure Coast AI - Multi-Tenant Chatbot Platform

## Overview
This project is a multi-tenant AI chatbot platform designed to support various businesses with AI-powered conversational agents. Originally developed for a sober-living facility, it has expanded to a platform offering templated bots for diverse industries. The platform aims to provide customizable, AI-driven customer interaction solutions, complete with administrative tools, analytics, and robust security features, emphasizing privacy and data protection.

## User Preferences
- **Current Mode:** Database-backed multi-tenant platform (Phase 1-3 complete)
- **Real Tenant:** Faith House Sober Living (migrated to database)
- **Bot Templates:** 10 industry templates stored in database (restaurant, barber, gym, auto_shop, home_services, med_spa, real_estate, tattoo, sober_living, generic)
- **Super-Admin Access:** Password-protected settings management for business configuration
- Privacy-first approach with PII protection

## Current Build Progress (10-Phase Roadmap)
- **Phase 1 (Database Foundation):** COMPLETE - 5 new tables (workspaces, workspace_memberships, bots, bot_settings, bot_templates)
- **Phase 2 (API & Security):** COMPLETE - Zod validation on all major routes, workspace membership validation, HMAC-signed widget tokens
- **Phase 3 (Bot Wizard):** COMPLETE - 5-step wizard at /admin/bot/wizard, createBotConfig function for new bot file creation, template lookup from database bot_templates table
- **Phase 4 (Automations V2):** COMPLETE - Database-backed automation workflows with trigger types (keyword, schedule, inactivity, message_count, lead_captured, appointment_booked), conditions/actions, run logging, Admin UI at /admin/bot/:botId/automations
- **Phase 5 (Widget Improvements):** COMPLETE - widget_settings table, full widget customization (theme modes: light/dark/auto, colors, position, avatar, auto-open, notification sounds, accessibility), Admin UI at /admin/bot/:botId/widget-settings with live preview
- **Phase 6 (Analytics/Leads/Inbox):** COMPLETE
  - 6.1 Enhanced Analytics: COMPLETE - Date range filtering, bot selector, CSV export buttons
  - 6.2 CSV Export Endpoints: COMPLETE - Server-side endpoints for analytics, leads, and sessions export
  - 6.3 Auto-Lead Capture: COMPLETE - extractContactInfo() and autoCaptureLead() functions detect email/phone in chat messages and auto-create leads
  - 6.4 Bulk Lead Actions: COMPLETE - Bulk status update, bulk delete endpoint (POST /api/client/leads/bulk), multi-select UI with checkboxes
  - 6.5 Conversation Notes & Session States: COMPLETE - conversation_notes and session_states database tables, CRUD API endpoints, Inbox UI with notes panel (add/delete notes), session state controls (read/unread toggle, status dropdown, priority selector), tabbed interface for messages/notes
  - 6.6 User Management: COMPLETE - Full CRUD for admin users (POST/PATCH/DELETE /api/super-admin/users), create user modal, role promotion/demotion, deletion with confirmation
  - 6.7 Workspace Management: COMPLETE - Full CRUD for workspaces (POST/PATCH/DELETE /api/super-admin/workspaces/:slug), create workspace modal with name/slug/plan/owner, edit workspace modal, delete with confirmation, dropdown menu actions on workspace cards
  - 6.8 Self-Service Account Management: COMPLETE - Password change with bcrypt hashing, notification preferences with Zod validation and proper data merging, billing portal access via Stripe Customer Portal, usage limits display with progress bars
  - 6.9 Super Admin Billing Overview: COMPLETE - MRR calculation with CTE-based aggregation handling multi-item subscriptions and quantity, subscription counts by status (active/past_due/canceled), per-client billing details, GET /api/super-admin/billing/overview endpoint
  - 6.10 Help/Support Section: COMPLETE - FAQ section with common questions, documentation links, contact support button
  - 6.11 Mobile Responsiveness: COMPLETE - All dashboards verified working on mobile (375x667) and tablet (768x1024) viewports, responsive grid patterns (grid-cols-1 md:grid-cols-2 lg:grid-cols-4), collapsible sidebar navigation
- **Phases 7-10:** Pending

## System Architecture
The system utilizes a React, TypeScript, Tailwind CSS, and shadcn/ui frontend, with an Express and Node.js backend. Core architectural decisions include:

### Multi-Tenant System
- **Database Tables:** workspaces, workspace_memberships, bots, bot_settings, bot_templates (PostgreSQL/Neon)
- **Bot Configuration:** Loaded from database with JSON file fallback for backwards compatibility
- **Templates:** 10 industry templates stored in bot_templates table
- **Workspaces:** Each tenant has a workspace with slug-based routing (e.g., faith_house)
- **Security:** Cross-tenant access blocked via clientId/workspace validation
- **Conversation Logging:** File-based logging per client and bot (`/logs/{clientId}/{botId}-{YYYYMMDD}.log`) in JSON Lines format.

### API Endpoints
- **Chat:** `POST /api/chat/:clientId/:botId` for AI interaction (database-backed with JSON fallback)
- **Templates:** `GET /api/templates`, `GET /api/templates/:templateId` for industry templates
- **Workspaces:** `GET /api/workspaces`, `GET /api/workspaces/:slug`, `GET /api/workspaces/:id/bots` (super admin only)
- **Platform Management:** Endpoints for listing clients, bots, and accessing logs
- **Demo Hub:** Endpoints to list and retrieve demo bot configurations
- **Admin & Client Dashboards:** Dedicated APIs for analytics, leads, inbox, and configuration management

### Frontend
- **Demo Hub (`/demos`):** Showcases available bot templates.
- **Admin Interface (`/admin`, `/super-admin`):**
    - **Control Center (`/super-admin`):** Full SaaS owner dashboard with:
      - **Quick Actions Bar:** Toggle between Overview, Workspaces, and Analytics sections
      - **System Status Badge:** Real-time health indicator showing operational status, warnings, or incidents
      - **Workspaces Section:** Grid view of all tenant workspaces with metrics (bots count, conversations, status)
      - **Global Analytics:** Platform-wide KPIs (conversations, leads, active workspaces, total bots) with 7-day trend charts using Recharts
      - **System Logs:** Filterable logs by level/source/workspace with resolution tracking
      - **Overview Section:** Unified bot management with split-pane layout, bot search, and detailed configuration tabs (Settings, Billing, Analytics, Logs, Install)
    - **Bot-Specific Dashboards (`/admin/bot/:botId`):** Tailored dashboards with industry-specific tabs.
    - **Bot Creation Wizard (`/admin/bot/wizard`):** 5-step process with template selection, business info, services, FAQs, personality sliders, and widget code generation.
- **Client Dashboard (`/client/dashboard`):** Enhanced sidebar-based dashboard with 8 sections:
      - **Dashboard:** Overview stats, Quick Overview card, Recent Sessions, Usage & Plan card with progress bars
      - **Analytics:** Date range filtering (7/14/30/90 days), CSV export buttons, trend charts
      - **Leads:** Lead management and tracking (navigates to /client/leads)
      - **Inbox:** Conversation management (navigates to /client/inbox)
      - **Appointments:** Appointment management interface
      - **Widget Code:** Embed code with copy-to-clipboard functionality and installation instructions
      - **Integrations:** Webhook configuration, external booking/payment URLs, event selection, secret management, test webhook delivery, and documentation
      - **Settings:** Limited business info editing (phone, hours, location only - bot config remains admin-only)
- **Leads Module (`/client/leads`):** Manages lead generation and tracking with bulk actions.
- **Inbox Module (`/client/inbox`):** Provides conversation management with notes panel and session states.

### Key Features
- **AI Chat:** OpenAI integration with safety protocols.
- **Appointment Booking:** Supports multi-type appointments with pre-qualification, external booking URL redirect.
- **Notification System:** Dual Email (Resend) and SMS (Twilio) alerts.
- **Webhook Integrations:** Outbound webhooks with HMAC-SHA256 signatures for lead.created, lead.updated, appointment.created, session.started, session.ended events; external booking/payment URL support.
- **Authentication & RBAC:** Session-based authentication with `super_admin` and `client_admin` roles.
- **Analytics:** Multi-layer tracking for message events, sessions, and daily trends, with CSV export.
- **Crisis Support:** Integration of crisis hotlines.
- **Privacy & Data Protection:** PII sanitization, file-based logging, and privacy warnings.
- **Stripe Integration:** Subscription billing, customer portal, and automatic deactivation on payment failure.
- **Design System:** Dark Neon-Glass theme with consistent UI components.

### Security & Middleware
- **Production-Ready Stack:** Helmet.js, Stripe webhook handling, body parsers, CORS (widget routes), rate limiting, and session management.
- **Rate Limiting:** Configured for general API, authentication, and chat endpoints.
- **CORS:** Applied selectively to widget routes.
- **CSP:** Strict Content Security Policy for production environments.
- **Environment Validation:** Zod-based validation in `server/env.ts` with centralized access for OpenAI, Twilio, Resend, admin credentials; required vars throw boot errors, optional vars have sensible fallbacks.

### Database Integrity
- **Drizzle Relations:** Comprehensive ORM relations defined for workspaces, bots, users, sessions, leads, analytics, and automations enabling proper FK constraints and optimized queries.
- **Monthly Usage Upsert:** Unique constraint on `monthly_usage(clientId, month)` with PostgreSQL `ON CONFLICT` upsert logic prevents race condition duplicates.

### Testing Infrastructure
- **Vitest:** Configured with TypeScript support and type checking
- **Unit Tests:** 48 passing tests across 4 test suites (utils, automations, planLimits, conversationLogger)
- **Run Tests:** `npm test` or `npx vitest run`
- **Coverage:** `npm run test:coverage`

### Error Handling
- **Centralized Module:** `server/errorHandler.ts` provides production-safe error sanitization
- **Stack Trace Protection:** Sensitive details and stack traces stripped in production mode
- **Standardized Responses:** Consistent error codes and messages across all endpoints

### Documentation
- **README.md:** Quick start guide, architecture overview, and development instructions
- **DEPLOYMENT.md:** Complete deployment guide for Replit with environment setup
- **API Documentation:** Inline route documentation with Zod schema validation

### Demo Data Seeding
- **Seed Script:** `npx tsx scripts/seed-demo-data.ts` initializes demo data
- **Demo Admin:** Username `demo_admin`, password `DemoPass123!`
- **Demo Workspace:** Pre-configured workspace with sample leads
- **Bot Templates:** 10 industry templates seeded from script

## QA Testing Results (November 2025)

### Comprehensive Testing Completed
All 10 sections verified with E2E Playwright tests:
1. **Authentication:** Login/logout flows, session management, cache clearing on logout
2. **Super Admin:** Control Center navigation, workspace management, user CRUD
3. **Client Dashboard:** Analytics, leads, appointments, widget code access
4. **Bot Wizard:** Template selection, 5-step wizard flow, bot creation
5. **Demo Hub:** Template showcase, demo bot interactions
6. **Chat Widget:** AI responses, appointment booking, lead capture
7. **CSV Exports:** Analytics, leads, sessions export functionality
8. **Responsive Design:** Mobile (375x667) and tablet (768x1024) viewports
9. **Security/Permissions:** 401/403 responses, RBAC enforcement
10. **Cross-Tenant Isolation:** Proper clientId/workspace scoping

### Bug Fixes Applied
1. **Logout Security:** Added `queryClient.clear()` before redirect to prevent cached auth data leakage
2. **Template Selection:** Changed div elements to `<button type="button">` for proper click handling with DialogOverlay
3. **Demo Admin Configuration:** Set `client_id = 'faith_house'` in admin_users for client API access
4. **Workspace Membership:** Added workspace_memberships record and updated seed script for demo_admin → faith_house
5. **Appointment Routes:** Updated 5 routes to derive clientId from session instead of hardcoded value
6. **Mobile Navigation:** Added `overflow-x-auto` to Quick Actions Bar for horizontal scroll on small screens
7. **OpenAI Model Name:** Fixed invalid model name `gpt-4.1-mini` → `gpt-4o-mini` in server/routes.ts (5 instances)
8. **Faith House Status:** Changed client status from `paused` → `active` in clients/clients.json to enable chat
9. **Leads CSV Export:** Added Export CSV button to leads page header with client-side CSV generation and download
10. **Leads Mobile Responsive:** Made filter dropdowns responsive (w-[130px] sm:w-[160px]) and added overflow-x-auto to prevent horizontal overflow at 360px viewport

### Production Readiness
- All critical workflows validated end-to-end
- Security patterns verified (401/403 responses working)
- RBAC middleware enforcing proper access
- Cross-tenant isolation confirmed
- No LSP TypeScript errors

## External Dependencies
- **OpenAI:** Provides AI chatbot capabilities and conversation summarization via Replit AI Integrations.
- **PostgreSQL (Neon):** Primary database for data persistence (currently for Faith House tenant and Stripe schema).
- **Resend:** Optional email notification service.
- **Twilio:** Optional SMS notification service.
- **Stripe:** For subscription billing and payment processing.