# Treasure Coast AI - Multi-Tenant Chatbot Platform

## Overview
This project is a multi-tenant AI chatbot platform providing customizable, AI-driven conversational agents for various businesses. It offers templated bots for diverse industries, administrative tools, analytics, and robust security features, with a strong emphasis on privacy and data protection. The platform aims to be a leading solution for AI-powered customer interaction.

## User Preferences
- **Current Mode:** Database-backed multi-tenant platform (Phases 1A-1E in progress)
- **Real Tenant:** Faith House Sober Living (migrated to database)
- **Bot Templates:** 10 industry templates stored in database (restaurant, barber, gym, auto_shop, home_services, med_spa, real_estate, tattoo, sober_living, generic)
- **Super-Admin Access:** Password-protected settings management for business configuration
- Privacy-first approach with PII protection

## Development Roadmap Progress
### Phase 1: Flow Engine & Visual Bot Builder (Complete)
- **Phase 1A (Complete):** Multi-channel conversation schema (channels, conversations, messages, participants, attachments)
- **Phase 1B (Complete):** Channel connector architecture (BaseConnector, ChatWidgetConnector, EmailConnector, ChannelService)
- **Phase 1C (Complete):** Flow engine schema (bot_flows, bot_flow_versions, flow_sessions)
- **Phase 1D (Complete):** Flow interpreter service with 11 node types (start, message, question, condition, ai_answer, action, set_variable, delay, api_call, handoff, end)
- **Phase 1E (Complete):** Visual bot builder UI with React Flow (FlowBuilder, NodePalette, PropertyEditor, FlowListPage)

### Phase 2: Knowledge Hub & AI Enhancements
- **Phase 2A (Complete):** Knowledge base schema (knowledge_sources, knowledge_documents, knowledge_chunks) with full CRUD API and workspace isolation

## System Architecture
The system is built with a React, TypeScript, Tailwind CSS, and shadcn/ui frontend, and an Express, Node.js backend.

### Multi-Tenant System
- **Database Tables:** Utilizes `workspaces`, `workspace_memberships`, `bots`, `bot_settings`, and `bot_templates` for multi-tenancy.
- **Bot Configuration:** Database-driven with JSON file fallback.
- **Security:** Enforces cross-tenant isolation through `clientId`/`workspace` validation.
- **Conversation Logging:** File-based logging per client and bot in JSON Lines format (`/logs/{clientId}/{botId}-{YYYYMMDD}.log`).

### API Endpoints
- **Chat:** `POST /api/chat/:clientId/:botId` for AI interaction.
- **Templates:** `GET /api/templates`, `GET /api/templates/:templateId` for industry templates.
- **Workspaces:** `GET /api/workspaces`, `GET /api/workspaces/:slug`, `GET /api/workspaces/:id/bots` (super admin only).
- **Platform Management:** APIs for managing clients, bots, and accessing logs.
- **Admin & Client Dashboards:** Dedicated APIs for analytics, leads, inbox, and configuration.
- **Flow Builder:** `GET/POST /api/flows`, `GET/PUT/DELETE /api/flows/:flowId`, `POST /api/flows/:flowId/versions`, `POST /api/flows/:flowId/publish` for visual bot builder.
- **Knowledge Base:** `GET/POST /api/knowledge/sources`, `GET/PUT/DELETE /api/knowledge/sources/:sourceId`, `GET/POST /api/knowledge/documents`, `GET/PUT/DELETE /api/knowledge/documents/:documentId`, `GET/POST /api/knowledge/chunks`, `GET /api/knowledge/search` for AI knowledge management.

### Frontend
- **Demo Hub (`/demos`):** Showcases available bot templates.
- **Admin Interface (`/admin`, `/super-admin`):**
    - **Control Center (`/super-admin`):** Full SaaS owner dashboard with quick actions, system status, workspace management, global analytics (using Recharts), and system logs.
    - **Bot-Specific Dashboards (`/admin/bot/:botId`):** Tailored dashboards with industry-specific tabs.
    - **Bot Creation Wizard (`/admin/bot/wizard`):** A 5-step process for bot creation, including template selection and widget code generation.
- **Client Dashboard (`/client/dashboard`):** Sidebar-based dashboard with sections for overview, analytics, leads, inbox, appointments, widget code, integrations, and settings.
- **Leads Module (`/client/leads`):** Manages lead generation and tracking with bulk actions.
- **Inbox Module (`/client/inbox`):** Provides conversation management with notes and session states.
- **Self-Service Signup (`/signup`):** Public registration page for new customers, including automatic workspace and bot creation.

### Key Features
- **AI Chat:** OpenAI integration with safety protocols.
- **Appointment Booking:** Supports multi-type appointments with pre-qualification.
- **Notification System:** Email (Resend) and SMS (Twilio) alerts.
- **Webhook Integrations:** Outbound webhooks with HMAC-SHA256 signatures for key events (e.g., `lead.created`, `appointment.created`).
- **Authentication & RBAC:** Session-based authentication with `super_admin` and `client_admin` roles.
- **Analytics:** Multi-layer tracking for message events, sessions, and daily trends, with CSV export.
- **Privacy & Data Protection:** PII sanitization and privacy warnings.
- **Stripe Integration:** Subscription billing, customer portal, and automatic deactivation.
- **Design System:** Dark Neon-Glass theme with consistent UI components.

### Security & Middleware
- **Production-Ready Stack:** Incorporates Helmet.js, Stripe webhook handling, CORS (widget routes), rate limiting, and session management.
- **Environment Validation:** Zod-based validation of environment variables in `server/env.ts`.

### Database Integrity
- **Drizzle Relations:** Comprehensive ORM relations defined for entities like workspaces, bots, users, and automations.
- **Monthly Usage Upsert:** Utilizes `ON CONFLICT` for reliable monthly usage tracking.

### Testing Infrastructure
- **Vitest:** Used for unit testing with TypeScript support.
- **Error Handling:** Centralized module (`server/errorHandler.ts`) for production-safe error sanitization, stripping sensitive details and stack traces in production.

## External Dependencies
- **OpenAI:** For AI chatbot capabilities and conversation summarization.
- **PostgreSQL (Neon):** The primary database for data persistence.
- **Resend:** Optional email notification service.
- **Twilio:** Optional SMS notification service.
- **Stripe:** For subscription billing and payment processing.