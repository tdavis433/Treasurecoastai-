# Treasure Coast AI - Agency-First AI Assistant Platform

## Overview
Treasure Coast AI is an agency-first AI assistant platform designed to empower agencies in building and managing custom AI assistants for local businesses. It provides 24/7 AI assistants for lead capture, appointment booking, and answering questions. The platform features a two-sided interface: a comprehensive agency-facing dashboard for bot creation and deployment, and a simplified, view-only client dashboard for analytics. The vision is to be a premium, dark luxury SaaS with neon-glass accents, revolutionizing local business customer engagement through streamlined, agency-managed AI solutions.

## User Preferences
Super Admin Login: username `admin`, password `admin123`

## System Architecture

### Design Philosophy
The platform adopts a "Dark Luxury SaaS with Neon-Glass Accents" aesthetic, drawing inspiration from platforms like Linear, Vercel, and Stripe. This includes deep blacks, glassmorphism cards, vibrant cyan and electric purple accents, neon glow effects, and smooth micro-animations.

### System Structure
The platform operates on a two-surface system:
1.  **Admin Dashboard (Agency Side):** A comprehensive interface for bot building, website scraping, knowledge management, FAQ configuration, personality customization, widget design, and deployment.
2.  **Client Dashboard:** A simplified, view-only analytics portal for clients to monitor conversations, leads, and bookings.

### Key Features
*   **Website Scraper:** AI-powered tool for extracting and structuring business information.
*   **AI Engine (GPT-4 Powered):** Handles conversational AI, dynamic context building, lead/booking intent detection, and incorporates a safety layer.
*   **AI Conversation Analysis:** Asynchronously analyzes conversations for summaries, user intent, sentiment, lead quality, and booking intent.
*   **Needs Review / Flagged Conversations System:** AI automatically flags critical conversations for admin review.
*   **Chat Widget:** Fully themeable, glassmorphism-designed, mobile-responsive widget with dynamic color theming (CSS variables), business-type-specific icons, and a visual editor. Widget colors automatically match demo page branding via `--tcai-primary`, `--tcai-primary-rgb`, and `--tcai-primary-hover` CSS variables.
*   **Services Catalog & Dynamic Welcome Messages:** Clients can configure a services catalog with individual service details (name, price, description, booking URL). The chat widget's initial greeting dynamically displays available services with prices, making it easy for customers to choose what they need. For external booking mode, each service can have its own direct booking URL.
*   **Client Analytics:** Provides view-only access to conversation history, lead management, and booking overviews.
*   **Super Admin Dashboard:** Centralized hub for platform management, client/assistant management, template galleries, global knowledge, API key management, system logs, and user roles. Includes a Services Manager (Deploy → Services tab) for configuring Quick Book service buttons with name, price, duration, and optional external booking URLs.
*   **Assistant Editor (Bot Builder):** Tools for defining AI persona, knowledge management, automation setup, channel customization, and a testing sandbox.
*   **AI-Driven In-Chat Booking Collection:** AI can collect booking information directly within conversations and automatically create appointment records.
*   **Demo & Live Tenant Separation:** Provides distinct environments for demo and live instances with dedicated workspaces and bots.
*   **Integration Panel:** Generates customizable widget embed code for easy integration.
*   **Automated Client Onboarding:** New client wizard provides complete out-of-the-box setup including workspace creation, client user account, default AI assistant, FAQ templates, default automations, widget embed code, and client settings.

### Core Architecture Principle
"ONE BRAIN ONE BEHAVIOR": All chat entry points are routed through a single Unified Conversation Orchestrator to ensure consistent AI behavior across the platform.

### Technical Implementation
*   **Frontend:** React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion.
*   **Backend:** Express.js, Node.js.
*   **Database:** PostgreSQL (Neon) with Drizzle ORM.
*   **AI:** OpenAI GPT-4.
*   **Payments:** None (Option A: Zero-Stripe). See NO_PAYMENTS_COMPLIANCE.md for details.
*   **Authentication:** Admin and client accounts (clients have view-only access).
*   **API Endpoints:** Structured for core chat interactions, widget configuration, and protected routes.
*   **Security:** Rate limiting, HMAC-signed widget tokens, per-bot security settings, domain validation, Helmet for secure HTTP headers and CSP, account lockout, strong password policies, secure password reset flow, SameSite cookies, CSRF protection (double-submit cookie pattern), session invalidation on password change, idle timeout (30 min default, configurable via SESSION_IDLE_TIMEOUT_MINUTES), secure super-admin impersonation (session-based, DB-first tenant validation, audit logged), and 3-tier role-based access control (operational/config/destructive).
*   **3-Tier Access Control:** Workspace membership roles control access: `owner`/`manager` (full access), `staff` (operational + config), `agent` (operational only - day-to-day ops like updating leads/notes/bookings but no config changes or deletions).
*   **Key Architecture Components:** Unified Conversation Orchestrator, Enhanced Bot Config Cache, Multi-Tenant Data Isolation, Session Data Tracking, Daily Analytics.
*   **Resilient Persistence:** When OpenAI API fails, the orchestrator extracts contact info and saves leads/bookings to prevent data loss.
*   **Form Validation:** Inline validation for critical forms.
*   **Mobile Responsiveness:** Enhanced for mobile viewports across landing pages and dashboards.

## Quick Book Analytics & Sales Wording

### Three Booking Modes
The platform supports three booking modes with honest analytics that never overclaim:

1. **Handoff Mode (External Booking)**
   - Funnel: Intent → Lead Captured → Clicked to Book
   - Analytics: Tracks clicks to external booking system (Calendly, Square, etc.)
   - Sales pitch: "We track intent → captured contact → clicked to book." (NOT "confirmed")
   - `completedBookings` stays 0 (we can't verify external confirmations)

2. **Internal Mode (Staff Follow-up)**
   - Funnel: Intent → Lead Captured → Booking Request Created
   - Analytics: No link clicks logged (no external redirect)
   - Sales pitch: "We capture the customer + service and create a follow-up booking request."
   - `completedBookings` stays 0 (staff confirms manually)

3. **Demo Mode (Confirmable)**
   - Funnel: Intent → Lead Captured → Clicked to Book → Confirmed
   - Analytics: Full funnel tracking with simulated confirmation
   - Sales pitch: "'Confirmed' is simulated for demo only."
   - `completedBookings` increments on demo confirmation

### Analytics Honesty Principle
- Never claim "confirmed" for external bookings we can't verify
- `funnelMode` in API response: `internal`, `handoff`, or `confirmable`
- Only `confirmable` mode shows non-zero `completedBookings`

## Recovery/Sober Living Template (Production-Ready)

### Deterministic Recovery Router
The sober living template uses a deterministic intent router (`server/recoveryRouter.ts`) instead of AI-driven classification for safety and compliance:
- **Intent Classification:** admissions_intake, availability, tour_request, insurance_payment, crisis, faq, general
- **Crisis Detection:** Keyword-based detection (suicide, overdose, emergency) triggers immediate 988/911/SAMHSA resources
- **Session Persistence:** Intent and contact capture state stored in session for consistent multi-turn behavior

### Safety Guardrails
- **No Medical Advice:** AI never provides treatment recommendations or clinical guidance
- **Staff Referral:** Clinical questions always defer to admissions staff
- **Crisis Protocol:** Immediate resource provision + gentle handoff to professionals
- **Disclaimers:** Insurance/payment discussions include "consult admissions for details"

### Progressive Lead Enrichment
- **Session-Based Upsert:** `storage.upsertLeadBySession()` enables progressive enrichment
- **Conservative Merge:** Fields only update if not already set, priority only elevates (never downgrades), tags union, metadata shallow-merges
- **Intent Tagging:** Leads tagged with single primary intent (`intent:admissions_intake`, etc.) for analytics
- **Single Primary Intent:** Each lead has exactly ONE `intent:*` tag. The `stripIntentTags()` and `getPrimaryIntentFromTags()` helpers in routes.ts ensure old intent tags are replaced (not accumulated) when upgrading.
- **Standardized Tag Naming:** Non-intent tags use `flag:` prefix (`flag:hot_lead`, `flag:appointment_request`) for consistent filtering.
- **Tag Lint Guard:** All tag writes pass through `lintTags()` which enforces max 1 intent:*, auto-prefixes bare tags with `flag:`, and logs warnings for auto-corrections.
- **AutoCaptureLead Integration:** The `autoCaptureLead` function in routes.ts uses recovery router to classify intent for sober living businesses at lead creation time, ensuring proper intent tags are applied from the start
- **Intent Precedence:** Intent tags only upgrade (never downgrade) - crisis (100) > human_handoff (95) > admissions_intake (90) > availability (80) > insurance_payment (70) > services_pricing (60) > rules_eligibility (50) > contact_hours_location (40) > general (10)
- **Intent History:** Metadata includes `intentHistory` array tracking intent upgrades for debugging/analytics
- **Booking Status Normalization:** For tour/admissions intents, `bookingStatus` is set to `pending_followup`, `bookingIntent=true`, and `serviceRequested='Tour Request'`. Status `requested` is normalized to `pending_followup`.

### Intent Naming Conventions (Stable Across Templates)
- `intent:crisis` - Suicide, overdose, emergency situations (priority: 100)
- `intent:human_handoff` - Explicit request for staff/human (priority: 95)
- `intent:admissions_intake` - Tour requests, admissions inquiries, move-in questions (priority: 90)
- `intent:availability` - Bed availability, vacancy questions (priority: 80)
- `intent:insurance_payment` - Insurance, payment, cost questions (priority: 70)
- `intent:services_pricing` - Services offered, pricing details (priority: 60)
- `intent:rules_eligibility` - House rules, eligibility requirements (priority: 50)
- `intent:contact_hours_location` - Contact info, hours, directions (priority: 40)
- `intent:faq_or_info` - General FAQ, informational (priority: 30)
- `intent:general` - Catch-all for unclassified (priority: 10)

### Dashboard Quick Filters
The Leads page includes quick filter presets for sober living operators:
- **Tours / Callbacks** → `intent:admissions_intake`
- **Wants Human** → `intent:human_handoff`
- **Hot Leads** → `flag:hot_lead`
- **Needs Follow-up** → `booking_status=pending_followup`

### Widget UX for Sober Living
- **No Quick Book UI:** Service selection buttons and Quick Book flow are hidden for sober living businesses
- **Text-based conversation:** Users trigger tour/admissions requests naturally through chat, not button clicks
- **Simple greeting:** "How can I help you today?" instead of "What service would you like to book?"
- **Config flag:** `widget.showServiceOptions = false` is auto-applied for `business.type === "sober_living" || "recovery_house"`

### Demo Pages
- `/demo/faith-house` - Faith House Sober Living template

## External Dependencies
*   **OpenAI GPT-4:** Used for the core AI engine and conversational analysis.
*   **Neon (PostgreSQL):** Provides managed PostgreSQL database hosting.
*   **Drizzle ORM:** Utilized as the Object-Relational Mapper for database interactions.