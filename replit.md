# Treasure Coast AI - Agency-First AI Assistant Platform

## Overview
Treasure Coast AI is an agency-first AI assistant platform empowering agencies to build and manage custom AI assistants for local businesses. The platform provides local businesses with 24/7 AI assistants for lead capture, appointment booking, and answering questions. Clients access a view-only dashboard, while agencies manage bot creation and deployment. The platform aims to be a premium, dark luxury SaaS with neon-glass accents, targeting the local business market with a streamlined, agency-managed solution for AI-driven customer interaction and market potential to revolutionize local business customer engagement.

## User Preferences
Not specified.

## System Architecture

### Design Philosophy
The platform features a "Dark Luxury SaaS with Neon-Glass Accents" aesthetic, inspired by Linear, Vercel, and Stripe, utilizing deep blacks, glassmorphism cards, vibrant cyan and electric purple accents, neon glow effects, and smooth micro-animations.

### Two-Surface System
1.  **Admin Dashboard (Agency Side):** Comprehensive interface for bot building, website scraping, knowledge management, FAQ configuration, personality customization, widget design, and deployment.
2.  **Client Dashboard:** A simplified, view-only analytics portal for clients to monitor conversations, leads, and bookings.

### Key Features
*   **Website Scraper:** Admin-only AI-powered tool to extract and structure business information.
*   **AI Engine (GPT-4 Powered):** Provides conversational AI, dynamic context building, smart lead and booking intent detection, and a safety layer.
*   **AI Conversation Analysis:** Asynchronously generates conversation summaries, detects user intent, sentiment, lead quality, and booking intent using GPT-4o-mini.
*   **Needs Review / Flagged Conversations System:** AI automatically flags critical conversations for admin review.
*   **Chat Widget:** Customizable, glassmorphism-designed, mobile-responsive widget with neon accents.
*   **Visual Widget Appearance Editor:** Comprehensive visual editor for customizing chat widget appearance, including color schemes, layout, identity settings, and a live preview.
*   **Client Analytics (View Only):** Provides conversation history, lead management, booking overviews.
*   **Super Admin Dashboard:** Consolidated hub for platform management, client and assistant management, template galleries, global knowledge management, API key hub, billing, system logs, and user role management.
*   **Assistant Editor (Bot Builder):** Tools for defining AI persona, managing knowledge, setting up automations, customizing channels, and a testing sandbox.

### Core Architecture Principle
"ONE BRAIN ONE BEHAVIOR": All chat entry points utilize a single Unified Conversation Orchestrator for consistent AI behavior.

### Technical Implementation
*   **Frontend:** React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion.
*   **Backend:** Express.js, Node.js.
*   **Database:** PostgreSQL (Neon) with Drizzle ORM.
*   **AI:** OpenAI GPT-4.
*   **Payments:** Stripe integration.
*   **Authentication:** Admin and client accounts with view-only access for clients.
*   **API Endpoints:** Structured for core chat interactions, widget configuration, and protected routes for admin and client dashboards.
*   **Security:** Rate limiting, HMAC-signed widget tokens, per-bot security settings (e.g., `requireWidgetToken`, `allowedDomains`), domain validation, and Helmet for secure HTTP headers and CSP.

### Key Architecture Components
*   **Unified Conversation Orchestrator (`server/orchestrator.ts`):** Central brain for chat interactions, handling config loading, knowledge retrieval, OpenAI prompt construction, post-processing (lead/booking detection), and session management.
*   **Enhanced Bot Config Cache (`server/configCache.ts`):** In-memory, TTL-based caching layer for bot configurations with invalidation.
*   **Routes Layer (`server/routes.ts`):** Handles HTTP specifics like security, response formatting, rate limiting, and error handling.
*   **Multi-Tenant Data Isolation:** Strict tenant isolation enforced through scoped queries and session data.
*   **Session Data Tracking:** Tracks conversation topics, `appointmentRequested`, `leadCaptured`, and `messageCount`.
*   **Daily Analytics:** Tracks `conversationCount`, `leadCount`, `appointmentRequests`, and `avgResponseTime`.

## Recent Changes (December 2024)

### Demo vs Live Tenant Separation
*   **New Feature:** Demo and Live environments are now separate tenants with dedicated workspaces and bots
*   **isDemo Flag:** Workspaces table includes `is_demo` boolean column (default false) to flag demo environments
*   **Faith House Tenants:**
    *   Demo: `faith_house_demo` workspace with `faith_house_demo_main` bot
    *   Live: `faith_house_live` workspace with `faith_house_live_main` bot
*   **TenantBadge Component:** Visual DEMO/LIVE indicators displayed in dashboards
    *   Demo: Amber badge with test tube icon
    *   Live: Green badge with radio icon
*   **DemoInfoBanner Component:** Warning banner displayed on demo dashboards

### Demo Landing Page (`/demo/faith-house`)
*   **Floating Chat Widget:** Uses real embed.js widget with floating bubble in bottom-right corner
    *   Click bubble → opens floating chat window
    *   Click X → closes back to bubble only
    *   No inline/embedded chat panel - clean landing page layout
*   **Greeting Popup Feature:** Proactive engagement popup that appears above the chat bubble
    *   Appears 3 seconds after page load (configurable via `data-greeting-delay`)
    *   Dark glassmorphism styling matching TCAI theme
    *   House icon avatar with cyan glow effect
    *   "Start Chat" button with gradient and glow
    *   X button dismisses popup and saves preference to sessionStorage
    *   Auto-hides when widget is opened from bubble
*   **Full Theme Integration:** Widget and popup fully match TCAI dark luxury aesthetic
    *   Primary color: `#00E5CC` (cyan/teal)
    *   Dark glassmorphism backgrounds with blur effects
    *   Gradient borders and neon glow accents
    *   Chat bubble with animated glow on hover
    *   Widget container with gradient top border accent

### Visual Upgrade (December 2024)
*   **Landing Page Enhancements:**
    *   ParticleField: 40 floating cyan particles with drift animation
    *   AmbientBackground: Radial gradient blobs with ambient shift animation
    *   Frosted glass hero section with gradient borders
    *   Gradient title text with shimmer effect
    *   Animated underline dividers with glow streaks
*   **Chat Bubble Redesign:**
    *   House+plus icon (configurable via `data-bubble-icon="house-plus"`)
    *   Subtle hover animation: scale 1.04, rotate 1.5deg
    *   Idle pulse animation every 11 seconds to attract attention
    *   Memory-safe interval cleanup on widget removal
*   **Chat Widget Premium Effects:**
    *   Dark glass container with backdrop blur
    *   Calibration animation on widget open (shimmer border effect)
    *   AI sync indicator banner with sliding animation
    *   Status dot with green pulse animation
    *   AI/Human mode toggle button in header
*   **Message Styling:**
    *   Enhanced gradient backgrounds for bot/user messages
    *   Neon bar typing indicator (vertical bars with shimmer)
    *   Glow effects on message bubbles
*   **CSS Keyframe Animations:**
    *   `ambientShift`: Background gradient motion
    *   `glowStreak`: Animated divider glow
    *   `gradientSlide`: Shimmer border effect
    *   `pulseGlow`: Idle bubble attention pulse
    *   `statusPulse`: Header status dot animation
    *   `neonShimmer`: Typing indicator bar animation
*   **Widget Configuration:**
    *   `clientId`: `faith_house_demo`
    *   `botId`: `faith_house_demo_main`
    *   `data-primary-color`: `#00E5CC` - TCAI cyan accent
    *   `data-business-name`: `Faith House Assistant`
    *   `data-business-subtitle`: `Sober Living • Demo`
    *   `data-show-greeting-popup`: `true` - enables popup
    *   `data-greeting-title`: `Faith House Assistant`
    *   `data-greeting-message`: Message about sober living and booking tours
    *   `data-greeting-delay`: `3` - seconds before popup appears
    *   `data-testid`: `faith-house-demo-widget` (container), `widget-bubble` (bubble), `greeting-popup` (popup)
*   **Branding:** Treasure Coast AI branding with LIVE DEMO badge, demo info banner

### Super Admin Demo Features
*   **Workspace Cards:** DEMO badge with TestTube2 icon on demo workspaces
*   **Workspace Detail Page:** 
    *   DEMO badge next to workspace name (data-testid: `badge-demo-workspace-detail`)
    *   "Open Demo Dashboard" button for demo tenants (data-testid: `button-open-demo-dashboard`)
*   **Reset Demo Data:** Dropdown option on faith_house_demo workspace card

### Demo Reset Endpoint
*   **Endpoint:** `POST /api/admin/demo/faith-house/reset` (Super Admin only)
*   **Safety:** Only workspaces with `is_demo=true` can be reset
*   **Actions:**
    *   Deletes all appointments, leads, messages, sessions, and analytics for demo tenant
    *   Re-seeds with sample demo data (3 leads, 3 appointments, 3 sessions)
    *   Creates system log entry
*   **Status Endpoint:** `GET /api/admin/demo/faith-house/status` returns demo workspace info and data counts

### AI-Driven In-Chat Booking Collection (Faith House Demo)
*   **New Feature:** AI can now collect booking information directly in conversation instead of just redirecting to external booking links
*   **Two Conversion Goals:** Book a Tour (cyan badge) or Schedule a Phone Call (purple badge)
*   **Information Collection:** Name, phone, email (optional), preferred time, notes
*   **Automatic Appointment Creation:** Orchestrator detects complete booking info and creates appointment records
*   **Conversation Linking:** Appointments now include `sessionId` and `botId` for linking back to source conversations
*   **Dashboard Enhancements:**
    *   Type badges (Tour/Phone Call) on bookings
    *   "View Chat" button to see the conversation that led to each booking
    *   Executive summary card with 7-day rolling stats (conversations, leads, tours, phone calls)
*   **Demo Script:** See `docs/faith-house-demo-script.md` for landlord demo walkthrough

### Faith House Bot Configuration
*   **Bot ID:** `faith_house_main`
*   **Workspace:** `ws_faith_house_001`
*   **Bot Type:** `sober_living`
*   **Personality:** Warm, supportive, never pushy, acknowledges courage, focuses on helping

## External Dependencies
*   **OpenAI GPT-4:** Used for AI engine and conversation analysis.
*   **Neon (PostgreSQL):** Database hosting.
*   **Drizzle ORM:** Object-Relational Mapper.
*   **Stripe:** Payment processing.