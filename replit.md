# Treasure Coast AI - Multi-Tenant Chatbot Platform

## Overview
This project is a production-ready multi-tenant AI chatbot platform originally developed for The Faith House sober-living facility. As of November 2025, the system has been expanded to support multiple tenants with a JSON-based configuration approach (pre-database solution). The platform includes Faith House as a real tenant plus 5 demo bots showcasing different business types.

## User Preferences
- **Current Mode:** Multi-tenant platform with JSON-based bot configurations
- **Real Tenant:** Faith House Sober Living (fully functional)
- **Demo Bots:** Restaurant, Barber/Salon, Home Services, Auto Shop, Gym, Real Estate, Med Spa, Tattoo Studio (9 total templates)
- **Super-Admin Access:** Password-protected settings management for business configuration
- Privacy-first approach with PII protection

## Multi-Tenant Architecture

### Bot Configuration System (/bots folder)
Each bot has a dedicated JSON configuration file containing:
- **Business Profile:** Name, type, location, hours, services
- **System Prompt:** AI behavior instructions
- **FAQs:** Question-answer pairs for common queries
- **Safety Rules:** Crisis keywords, forbidden topics, redirect behaviors

Bot Files:
- `faith_house.json` - Real tenant (sober living)
- `restaurant_demo.json` - Demo (restaurant)
- `barber_demo.json` - Demo (barber/salon)
- `homeservice_demo.json` - Demo (home services)
- `autoservice_demo.json` - Demo (auto shop)
- `gym_demo.json` - Demo (gym/fitness)
- `realestate_demo.json` - Demo (real estate)
- `medspa_demo.json` - Demo (med spa)
- `tattoo_demo.json` - Demo (tattoo studio)

### Client Management (/clients folder)
- `clients.json` - Central registry of all clients
- Each client has an id, name, status, and list of bot IDs

### Conversation Logging (/logs folder)
- Logs organized by clientId: `/logs/{clientId}/`
- Daily log files: `{botId}-{YYYYMMDD}.log`
- JSON Lines format for easy parsing

## API Endpoints

### Multi-Tenant Chat
- `POST /api/chat/:clientId/:botId` - Send message to specific bot
- Loads bot config dynamically
- Applies bot-specific crisis detection
- Logs conversations to file system

### Demo Hub
- `GET /api/demos` - List all available demo bots
- `GET /api/demo/:botId` - Get specific bot config for UI

### Platform Management
- `GET /api/platform/clients` - List all clients with their bots
- `GET /api/platform/bots/:clientId/:botId` - Get full bot config
- `GET /api/platform/logs/:clientId` - Get conversation logs (authenticated)

### Legacy Single-Tenant (Faith House)
- `POST /api/chat` - Original chat endpoint (still works)
- All existing appointment, admin, and settings endpoints

## Frontend Routes

### Demo Hub
- `/demos` - Demo selector page showing all bots
- `/demo/:botId` - Individual demo bot chat interface

### Admin
- `/admin/dashboard` - Appointment KPIs and overview
- `/admin/appointments` - Appointment management
- `/admin/analytics` - Chat analytics
- `/admin/bot/:botId` - Per-bot dashboard with business-type-specific tabs
- `/super-admin` - Super admin configuration (super_admin role only)

### Control Center (Super Admin)
- `/super-admin/control-center` - Unified platform management interface
  - **Left Sidebar:** Lists all chatbots with search, templates for creating new clients
  - **Overview Tab:** Quick stats (messages, conversations, leads, bookings), bot info, services, knowledge base
  - **Bot Settings Tab:** Full bot editing (name, business profile, hours, services, system prompt, FAQs)
  - **Billing Tab:** Stripe subscription status, checkout creation, customer portal
  - **Analytics Tab:** Performance metrics with link to full dashboard
  - **Logs Tab:** Conversation log files
  - **Faith House Features:** Special section for sober_living clients with crisis detection, pre-intake forms, appointment booking

### Client Dashboard
- `/client/dashboard` - Client-facing dashboard for viewing business data
  - Shows conversation statistics and message counts
  - Lists appointments (for applicable business types)
  - Displays business information and bot configuration
  - Data is scoped to the logged-in client's business only

## System Architecture
The system employs a React, TypeScript, Tailwind CSS, and shadcn/ui frontend with an Express and Node.js backend. PostgreSQL (Neon) is used for data persistence, and OpenAI provides AI capabilities via Replit AI Integrations, with TanStack Query for state management.

**Key Features:**
- **AI Chat:** OpenAI integration with advanced safety protocols.
- **Multi-Tenant Support:** JSON-based bot configurations with file-based logging
- **Demo Hub:** Showcase platform capabilities with 5 industry demos
- **Enhanced Appointment Booking:** Supports multi-type appointments with contact preference tracking.
- **Dual Notification System:** Email (Resend) and SMS (Twilio) for staff alerts.
- **Pre-qualification Intake:** Captures sobriety status, support, and timeline before booking.
- **Admin Dashboards:** Full suite of admin tools
- **Secure Authentication:** Session-based with role-based access control
- **Role-Based Access Control (RBAC):** Two roles implemented:
  - `super_admin`: Full access including /super-admin and platform configuration
  - `client_admin`: Access to dashboard, appointments, and analytics only
- **Enhanced Analytics:** Category-based message classification with CSV export.
- **Crisis Support:** Integration of resources like 988 and 1-800-662-HELP.

**Database Schema (for Faith House tenant):**
- `appointments`: Booking requests, status, contact preferences
- `client_settings`: Customizable business settings
- `conversation_analytics`: Chat metrics with PII-sanitized responses
- `admin_users`: Admin authentication with roles
- `chat_analytics_events`: Per-message analytics with topics, response times
- `chat_sessions`: Aggregated session data with crisis flags, topics arrays
- `daily_analytics`: Daily rollup for trends visualization

**Privacy & Data Protection:**
- **PII Sanitization:** Automatic redaction of phone numbers, emails, SSNs
- **File-Based Logging:** Conversations logged separately by client
- **Privacy UI Warnings:** Notifications in admin dashboards

## External Dependencies
- **OpenAI:** For AI chatbot capabilities and conversation summarization.
- **Resend:** Email notification service (optional).
- **Twilio:** SMS notification service (optional).
- **PostgreSQL (Neon):** Database for Faith House tenant data.
- **Replit AI Integrations:** OpenAI service integration.

## Recent Changes (November 2025)
- Implemented multi-tenant bot configuration system
- Created 6 bot JSON configs (1 real tenant + 5 demos)
- Added multi-tenant chat endpoint with crisis detection
- Created Demo Hub UI for showcasing platform
- Added file-based conversation logging
- Added platform management API endpoints
- **Individual Bot Editing:** Added per-bot dashboard at `/admin/bot/:botId`
- **Business-Type Specific Dashboards:** Each bot type has custom tabs:
  - Sober Living: Appointments, Pre-Intake, Crisis Handling
  - Restaurant: Menu & Cuisine, Reservations
  - Barber: Services & Pricing, Appointments
  - Gym: Memberships, Classes & Amenities
  - Home/Auto Services: Services & Pricing, Scheduling
- **Super-Admin Bot Listing:** All bots now listed individually with Dashboard and Preview buttons
- **Bot Config API:** Added GET/PUT `/api/super-admin/bots/:botId` for editing bot JSON configs
- **Client Dashboard:** Added `/client/dashboard` for each business to view their own data
  - Client users are linked to their business via clientId in admin_users table
  - Shows conversation stats, appointments, and business info
  - Data properly scoped to prevent cross-tenant data leakage
  - Super admins can view any client's data via query param
- **Client API Endpoints:** Added `/api/client/*` endpoints for client-scoped data access
- **Create Bot Feature:** Added ability to create new bots from super-admin
  - `/admin/bot/new` - Create bot page with template selection
  - POST `/api/super-admin/bots` - Create new bot API
  - Supports cloning from existing templates (inherits system prompt, FAQs, safety rules)
  - Start from scratch option with default configurations
  - Auto-generate IDs feature based on business name
- **Comprehensive Analytics System:** Multi-layer analytics tracking for chatbot performance
  - Per-message event tracking: Topics, response times, crisis detection, appointment requests
  - Session-level aggregation: Total messages, topics arrays, crisis/appointment flags
  - Daily rollups: Trends visualization for conversations, messages, events
  - Client dashboard Analytics tab: Charts (line/pie), metrics cards, session history
  - Super-admin Platform Analytics: Platform-wide overview with per-bot performance
  - Tenant-scoped APIs: `/api/client/analytics/summary`, `/api/client/analytics/trends`, `/api/client/analytics/sessions`
  - Platform-wide API: `/api/super-admin/analytics/overview`
- **Client Status System:** Status management for tenant lifecycle
  - Three statuses: Active (fully functional), Paused (chat disabled), Demo (showcase mode)
  - Chat endpoint enforcement: Paused clients receive friendly "temporarily unavailable" message
  - Status stored in clients.json alongside bot IDs and client metadata
  - Super-admin UI controls for toggling client status
- **Stripe Subscription Billing:** Full Stripe integration for subscription management
  - Uses `stripe-replit-sync` package for managed webhooks and data synchronization
  - Automatic webhook handling with UUID-based routing (registered before express.json middleware)
  - Billing endpoints: `/api/stripe/products`, `/api/stripe/checkout`, `/api/stripe/subscription/:clientId`, `/api/stripe/portal`
  - Customer portal integration for self-service subscription management
  - Auto-deactivation on payment failure via webhook handlers (invoice.payment_failed, customer.subscription.deleted)
  - Stripe schema stored in PostgreSQL with automatic migration on startup
- **Bot-Centric Control Center:** Unified management interface at `/super-admin/control-center`
  - Left sidebar lists all bots (not clients) with search and template selection
  - 5-tab structure: Overview, Bot Settings, Billing, Analytics, Logs
  - Bot Settings includes editable FAQ management (add/edit/delete)
  - Tone/Voice controls with 5 options (Professional, Friendly, Casual, Compassionate, Informative)
  - Response length selector (Brief, Medium, Detailed)
  - 3-step onboarding wizard for creating new bots from templates:
    - Step 1: Business basics (name, ID, phone, email, website)
    - Step 2: Address and primary contact information
    - Step 3: Service tier and billing plan selection
- **9 Business Templates:** Complete template system for new client onboarding
  - restaurant_demo, barber_demo, autoservice_demo, homeservice_demo, gym_demo
  - realestate_demo, medspa_demo, tattoo_demo, soberliving_demo
  - Each template includes business profile, system prompt, FAQs, and safety rules
