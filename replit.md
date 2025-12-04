# Treasure Coast AI - Agency-First AI Assistant Platform

## Overview
Treasure Coast AI is an agency-first AI assistant platform designed to empower agencies to build and manage custom AI assistants for local businesses. The core mission is to provide local businesses with a 24/7 AI assistant capable of capturing leads, booking appointments, and answering questions. Clients access a view-only dashboard to monitor results, while the agency handles all bot creation and management. The platform aims to be a premium, dark luxury SaaS with neon-glass accents, targeting the local business market with a streamlined, agency-managed solution for AI-driven customer interaction.

## User Preferences
Not specified.

## System Architecture

### Design Philosophy
The platform adopts a "Dark Luxury SaaS with Neon-Glass Accents" aesthetic, drawing inspiration from Linear, Vercel, and Stripe. This includes deep blacks, glassmorphism cards with blur effects, vibrant cyan and electric purple accents, neon glow effects, and smooth micro-animations for a premium user experience.

### Two-Surface System
1.  **Admin Dashboard (Agency Side):** A powerful interface for bot building, website scraping, knowledge management, FAQ configuration, personality customization, widget design, and deployment.
2.  **Client Dashboard:** A simplified, view-only analytics portal for clients to monitor conversations, leads, and bookings. All modifications are handled by the agency.

### Key Features
*   **Website Scraper:** Admin-only tool to extract business information from client websites using AI (GPT-4) and structure it into JSON for bot knowledge bases.
*   **AI Engine (GPT-4 Powered):** Provides world-class conversational AI, dynamic context building, smart lead detection, booking intent recognition, and a safety layer.
*   **AI Conversation Analysis (Background Processing):** Asynchronously generates conversation summaries, detects user intent, sentiment, lead quality, and booking intent using GPT-4o-mini. This data enriches lead information.
*   **Needs Review / Flagged Conversations System:** AI automatically flags conversations requiring admin attention (e.g., crisis, bot confusion, dissatisfaction, hot leads) for review in a dedicated dashboard.
*   **Chat Widget:** Customizable, glassmorphism-designed widget with neon accents, smooth animations, and mobile responsiveness for client websites.
*   **Visual Widget Appearance Editor (`/admin/bot/:botId/widget-settings`):** Comprehensive visual editor for customizing chat widget appearance with:
    - **Color Scheme Section:** 6 pre-designed color presets (Midnight Cyan, Royal Purple, Ocean Blue, Clean Light, Forest Green, Rose Gold) and custom color controls for primary/secondary colors, backgrounds, text, message bubbles, and input area
    - **Layout & Style:** Position, shadow intensity, border radius, font family (System/Inter/Roboto/Nunito), font size (sm/md/lg)
    - **Launcher Bubble:** Icon style (chat-bubble/robot/message), optional label text, avatar customization
    - **Identity & Messages:** Header title/subtitle, welcome message, input placeholder, powered-by footer toggle
    - **Live Preview:** Real-time preview showing all customizations including both bot and user message bubbles
*   **Client Analytics (View Only):** Provides conversation history, lead management, booking overviews, and simple settings (display-only).
*   **Super Admin Dashboard (`/super-admin`):** Single consolidated admin hub for complete platform management including client and assistant management, template galleries, global knowledge management, API key hub, billing, system logs, and user role management.
*   **Assistant Editor (Bot Builder):** Tools for defining AI persona and system prompts, managing knowledge/content, setting up automations/flows, customizing channels & embeds, and a testing sandbox.

### Core Architecture Principle: "ONE BRAIN ONE BEHAVIOR"
All chat entry points (admin preview, public widget, demo page, API) use a single Unified Conversation Orchestrator to ensure consistent AI behavior across the platform.

### Technical Implementation
*   **Frontend:** React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion.
*   **Backend:** Express.js, Node.js.
*   **Database:** PostgreSQL (Neon) with Drizzle ORM.
*   **AI:** OpenAI GPT-4.
*   **Payments:** Stripe integration.
*   **Authentication:** Admin accounts (`/super-admin`) and client accounts (`/client/dashboard`) with view-only access.
*   **API Endpoints:** Structured for core chat interactions, widget configuration, and protected routes for admin and client dashboards to manage clients, bots, analytics, conversations, leads, and stats.
*   **Security:**
    - Rate limiting: General API (100 req/15min), Auth (10 req/15min), Chat (30 req/min)
    - Widget tokens: HMAC-signed tokens with expiration for widget authentication
    - Per-bot security settings: `requireWidgetToken`, `allowedDomains` via BotSecuritySettings
    - Domain validation: Origin/Referer checking against allowlist
    - Helmet for secure HTTP headers and CSP

## Key Architecture Components

### Unified Conversation Orchestrator (`server/orchestrator.ts`)
The central "brain" for all chat interactions. Responsibilities:
- **Config Loading:** Loads bot configuration through the config cache
- **Knowledge Retrieval:** Builds context from business profile, FAQs, and knowledge base
- **OpenAI Prompts:** Constructs system prompts with persona, business context, and conversation rules
- **Post-Processing:** Handles lead capture detection, booking intent detection, topic categorization
- **Session Management:** Persists conversation data including topics array, appointmentRequested flag, leadCaptured status

### Enhanced Bot Config Cache (`server/configCache.ts`)
In-memory caching layer for bot configurations:
- **TTL-based Caching:** Configurable time-to-live for cache entries
- **Invalidation:** Manual cache invalidation on bot updates
- **Performance:** Prevents repeated database queries for hot configs

### Routes Layer (`server/routes.ts`)
HTTP-specific handling delegated to routes:
- **Security:** Token validation, domain validation, CORS
- **Response Formatting:** Standardized API response shapes
- **Rate Limiting:** Per-endpoint rate limits
- **Error Handling:** Consistent error response format

### Multi-Tenant Data Isolation
All operations maintain strict tenant isolation:
- Queries scoped by `clientId/workspaceId` + `botId`
- Cross-tenant data access prevented at storage layer
- Session data isolated per conversation

### Session Data Tracking
Each conversation session tracks:
- `topics`: Array of categorized message topics (pricing, hours, location, services, appointments, etc.)
- `appointmentRequested`: Boolean flag when booking intent detected
- `leadCaptured`: Boolean flag when contact info captured
- `messageCount`: Total messages in conversation

### Daily Analytics
Analytics tracking includes:
- `conversationCount`: Total conversations per day
- `leadCount`: Captured leads per day
- `appointmentRequests`: Booking intent detections per day
- `avgResponseTime`: Average AI response time

## External Dependencies
*   **OpenAI GPT-4:** For AI engine and conversation analysis. Supports both `OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_API_KEY` environment variables.
*   **Neon (PostgreSQL):** Database hosting.
*   **Drizzle ORM:** Object-Relational Mapper for database interactions.
*   **Stripe:** Payment processing and integration.

## Future Enhancements
*   **Knowledge Hub:** Unified knowledge management across bots
*   **Background Job Processing:** Queue for heavy async tasks
*   **Unified Metrics & Quotas Service:** Batched writes for analytics

## Recent QA Session Summary (December 2024)

### Bugs Fixed
1. **Bot Persona Persistence Bug**: Fixed issue where bot persona/status updates weren't persisting for database-backed bots. Changed `PUT /api/super-admin/bots/:botId` and `PATCH status` routes from `saveBotConfig` (sync, JSON-only) to `saveBotConfigAsync` (handles both JSON and database storage).

2. **services.join TypeError**: Fixed runtime error in `buildSystemPromptFromConfig` where `bp.services.join()` failed when services was a string instead of array. Now safely handles both string and array types.

3. **Login Security - Password Clearing**: Added `setPassword("")` in the login form's error handler to clear password field after failed login attempts (security best practice).

4. **Bot Name UI Sync Bug**: Fixed issue where bot name changes saved to database but UI didn't refresh. Root cause: GET routes used sync functions (`getAllBotConfigs`, `getBotConfigByBotId`) that only read JSON files. Changed to async versions (`getAllBotConfigsAsync`, `getBotConfigByBotIdAsync`) that check the database first.

5. **PersonaPanel Enhancement**: Added "Assistant Identity" section to PersonaPanel with editable Assistant Name and Description fields (data-testid: `input-assistant-name`, `input-assistant-description`). Previously these fields were not editable through the UI.

### E2E Test Results (All Passed)
| Feature | Status | Notes |
|---------|--------|-------|
| Landing Page | PASS | Hero, features, pricing, contact form |
| Contact Form Submission | PASS | Leads captured successfully |
| Demo Widget | PASS | Opens, displays welcome message |
| Chat API | PASS | GPT-4 responses working |
| Multi-turn Conversations | PASS | Context maintained across messages |
| Booking Redirect Behavior | PASS | AI never confirms bookings, redirects to button |
| Lead Capture | PASS | Detects and stores contact info |
| FAQ Responses | PASS | Pricing and service info accurate |
| Business Hours | PASS | Returns correct schedule |
| Login Page | PASS | Form works, password clears on error |
| Protected Routes | PASS | /super-admin and /client/dashboard require auth |

### Critical Behavior Verified
- **REDIRECT-ONLY Booking**: AI correctly refuses to confirm appointments and directs users to external booking platform
- **Lead Collection**: AI acknowledges contact info and marks lead as captured
- **Conversation Context**: Multi-turn conversations maintain proper context
