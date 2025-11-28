# Treasure Coast AI - Multi-Tenant Chatbot Platform

## Overview
This project is a multi-tenant AI chatbot platform designed to support various businesses with AI-powered conversational agents. Originally developed for a sober-living facility, it has expanded to a platform offering templated bots for diverse industries. The platform aims to provide customizable, AI-driven customer interaction solutions, complete with administrative tools, analytics, and robust security features, emphasizing privacy and data protection.

## User Preferences
- **Current Mode:** Multi-tenant platform with JSON-based bot configurations
- **Real Tenant:** Faith House Sober Living (fully functional)
- **Demo Bots:** Restaurant, Barber/Salon, Home Services, Auto Shop, Gym, Real Estate, Med Spa, Tattoo Studio (9 total templates)
- **Super-Admin Access:** Password-protected settings management for business configuration
- Privacy-first approach with PII protection

## System Architecture
The system utilizes a React, TypeScript, Tailwind CSS, and shadcn/ui frontend, with an Express and Node.js backend. Core architectural decisions include:

### Multi-Tenant System
- **Bot Configuration:** Each bot uses a dedicated JSON file (`/bots/{botId}.json`) for its business profile, AI system prompt, FAQs, and safety rules.
- **Client Management:** A central `clients.json` manages client metadata and associated bot IDs.
- **Conversation Logging:** File-based logging per client and bot (`/logs/{clientId}/{botId}-{YYYYMMDD}.log`) in JSON Lines format.

### API Endpoints
- **Chat:** `POST /api/chat/:clientId/:botId` for AI interaction.
- **Platform Management:** Endpoints for listing clients, bots, and accessing logs.
- **Demo Hub:** Endpoints to list and retrieve demo bot configurations.
- **Admin & Client Dashboards:** Dedicated APIs for analytics, leads, inbox, and configuration management.

### Frontend
- **Demo Hub (`/demos`):** Showcases available bot templates.
- **Admin Interface (`/admin`, `/super-admin`):**
    - **Control Center (`/super-admin/control-center`):** Unified bot management with split-pane layout, bot search, and detailed configuration tabs (Overview, Settings, Billing, Analytics, Logs).
    - **Bot-Specific Dashboards (`/admin/bot/:botId`):** Tailored dashboards with industry-specific tabs.
    - **Bot Creation Wizard:** 3-step process for creating new bots from templates or scratch.
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