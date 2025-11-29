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
- **Phase 3 (Bot Wizard):** COMPLETE - 5-step wizard at /admin/bot/wizard
- **Phase 4 (Automations V2):** COMPLETE - Database-backed automation workflows with trigger types (keyword, schedule, inactivity, message_count, lead_captured, appointment_booked), conditions/actions, run logging, Admin UI at /admin/bot/:botId/automations
- **Phase 5 (Widget Improvements):** COMPLETE - widget_settings table, full widget customization (theme modes: light/dark/auto, colors, position, avatar, auto-open, notification sounds, accessibility), Admin UI at /admin/bot/:botId/widget-settings with live preview
- **Phase 6 (Analytics/Leads/Inbox):** IN PROGRESS
  - 6.1 Enhanced Analytics: COMPLETE - Date range filtering, bot selector, CSV export buttons
  - 6.2 CSV Export Endpoints: COMPLETE - Server-side endpoints for analytics, leads, and sessions export
  - 6.3 Auto-Lead Capture: COMPLETE - extractContactInfo() and autoCaptureLead() functions detect email/phone in chat messages and auto-create leads
  - 6.4 Bulk Lead Actions: COMPLETE - Bulk status update, bulk delete endpoint (POST /api/client/leads/bulk), multi-select UI with checkboxes
  - 6.5 Conversation Notes & Session States: COMPLETE - conversation_notes and session_states database tables, CRUD API endpoints, Inbox UI with notes panel (add/delete notes), session state controls (read/unread toggle, status dropdown, priority selector), tabbed interface for messages/notes
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
    - **Control Center (`/super-admin/control-center`):** Unified bot management with split-pane layout, bot search, and detailed configuration tabs (Overview, Settings, Billing, Analytics, Logs, Install).
    - **Bot-Specific Dashboards (`/admin/bot/:botId`):** Tailored dashboards with industry-specific tabs.
    - **Bot Creation Wizard (`/admin/bot/wizard`):** 5-step process with template selection, business info, services, FAQs, personality sliders, and widget code generation.
- **Client Dashboard (`/client/dashboard`):** Client-specific view of conversation statistics, appointments, and business info, with proper data scoping.
- **Leads Module (`/client/leads`):** Manages lead generation and tracking.
- **Inbox Module (`/client/inbox`):** Provides a conversation management interface for sessions.

### Key Features
- **AI Chat:** OpenAI integration with safety protocols.
- **Appointment Booking:** Supports multi-type appointments with pre-qualification.
- **Notification System:** Dual Email (Resend) and SMS (Twilio) alerts.
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

## External Dependencies
- **OpenAI:** Provides AI chatbot capabilities and conversation summarization via Replit AI Integrations.
- **PostgreSQL (Neon):** Primary database for data persistence (currently for Faith House tenant and Stripe schema).
- **Resend:** Optional email notification service.
- **Twilio:** Optional SMS notification service.
- **Stripe:** For subscription billing and payment processing.