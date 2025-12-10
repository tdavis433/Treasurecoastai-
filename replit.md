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
*   **Website Scraper:** AI-powered tool for extracting and structuring business information (admin-only).
*   **AI Engine (GPT-4 Powered):** Handles conversational AI, dynamic context building, lead/booking intent detection, and incorporates a safety layer.
*   **AI Conversation Analysis:** Asynchronously analyzes conversations for summaries, user intent, sentiment, lead quality, and booking intent using GPT-4o-mini.
*   **Needs Review / Flagged Conversations System:** AI automatically flags critical conversations for admin review.
*   **Chat Widget:** Customizable, glassmorphism-designed, mobile-responsive widget with neon accents and a visual editor for appearance.
*   **Client Analytics:** Provides view-only access to conversation history, lead management, and booking overviews.
*   **Super Admin Dashboard:** Centralized hub for platform management, client/assistant management, template galleries, global knowledge, API key management, billing, system logs, and user roles.
*   **Assistant Editor (Bot Builder):** Tools for defining AI persona, knowledge management, automation setup, channel customization, and a testing sandbox.
*   **AI-Driven In-Chat Booking Collection:** AI can collect booking information (name, phone, email, time, notes) directly within conversations and automatically create appointment records.
*   **Demo & Live Tenant Separation:** Provides distinct environments for demo and live instances with dedicated workspaces and bots.
*   **Integration Panel:** Generates customizable widget embed code for easy integration into client websites.

### Core Architecture Principle
"ONE BRAIN ONE BEHAVIOR": All chat entry points are routed through a single Unified Conversation Orchestrator to ensure consistent AI behavior across the platform.

### Technical Implementation
*   **Frontend:** React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion.
*   **Backend:** Express.js, Node.js.
*   **Database:** PostgreSQL (Neon) with Drizzle ORM.
*   **AI:** OpenAI GPT-4.
*   **Payments:** Stripe integration.
*   **Authentication:** Admin and client accounts (clients have view-only access).
*   **API Endpoints:** Structured for core chat interactions, widget configuration, and protected routes.
*   **Security:** Rate limiting, HMAC-signed widget tokens, per-bot security settings (e.g., `requireWidgetToken`, `allowedDomains`), domain validation, Helmet for secure HTTP headers and CSP, account lockout, and strong password policies.
*   **Key Architecture Components:** Unified Conversation Orchestrator, Enhanced Bot Config Cache, Multi-Tenant Data Isolation, Session Data Tracking, and Daily Analytics.

### Security Features (December 2024)
*   **Account Lockout:** Locks accounts after 5 failed login attempts for 15 minutes
    *   Environment variables: `LOGIN_MAX_ATTEMPTS` (default: 5), `LOGIN_LOCKOUT_MINUTES` (default: 15), `LOGIN_WINDOW_MINUTES` (default: 15)
    *   Successful login clears failed attempt counter
    *   **Limitations:** In-memory tracking resets on server restart; keyed by username only (not IP)
*   **Password Policy:** Strong password requirements for new passwords
    *   Minimum 8 characters, at least one uppercase, lowercase, number, and special character
*   **Rate Limiting:** Configurable limits for login (10/15min), chat (30/min), and general API (100/15min)
*   **CORS Allow-list:** Widget endpoints can be restricted via `WIDGET_ALLOWED_ORIGINS` environment variable
    *   Format: Comma-separated list of allowed domains (e.g., `https://client1.com,https://client2.com`)
    *   Localhost origins auto-allowed in development
    *   **Note:** Changes require server restart to take effect
*   **Session Security:** httpOnly cookies, secure flag in production, 7-day max age
*   **Helmet Headers:** CSP, X-Frame-Options, XSS protection, and other security headers enabled
*   **RBAC for Destructive Actions:** Middleware `requireAdminRole` restricts delete operations to super_admin and workspace_admin roles
    *   Applied to: appointment deletion, automation workflow deletion
    *   Other destructive endpoints use `requireSuperAdmin` for higher privilege
*   **Tenant Isolation:** All lead operations require explicit clientId parameter; no fallback to "default-client"
    *   Storage layer enforces clientId in WHERE clauses for getLeadById, updateLead, deleteLead
*   **Environment-Based Configuration:** Staff user creation uses `DEFAULT_STAFF_CLIENT_ID` env var instead of hardcoded values

### Resilient Persistence (December 2024)
*   **OpenAI Failure Recovery:** When OpenAI API fails (rate limit, timeout, network errors), the orchestrator:
    *   Extracts contact info (name, phone, email) from all conversation messages
    *   Saves leads automatically if phone or email is found
    *   Creates "pending confirmation" bookings if booking intent + name + phone are detected
    *   Returns context-aware friendly messages confirming what data was saved
*   **No Data Loss:** User contact information is preserved even during AI service outages
*   **Implementation:** `extractContactAndBookingFromMessages()` function in `server/orchestrator.ts`
*   **Booking Schema:** `preferredTime` stores raw time phrase, `scheduledAt` stores parsed ISO datetime

### Form Validation (December 2024)
*   **New Client Wizard (Step 1):** Inline validation for business name and contact email fields
    *   Validates on blur and when clicking Next
    *   Shows red error text below invalid fields
    *   Email format validation with regex
    *   Errors clear as user corrects input
*   **Create Client Login Form:** Inline validation for email format and password strength
    *   Email must be valid format
    *   Password requires 8+ characters with uppercase, lowercase, and number
    *   Touched field tracking prevents showing errors before user interaction
*   **UI Refresh Optimization:** Client login list refreshes immediately after creation via await on refetch

### UX Improvements (December 2024)
*   **Chat Widget Reset Button:** Now positioned in header next to close button with rotation animation on hover
*   **Widget Error Recovery:** Added amber-themed error UI with recoverable state handling for API failures
*   **Inbox Session Filtering:** Sessions with 0 messages are now hidden from the conversations list
*   **Conversation Snippets:** Session items display meaningful previews from AI summary, user intent, topics, or default fallbacks
*   **Message Count Display:** Shows formatted "{count} msgs" for clearer conversation sizing
*   **Widget Header Actions:** Container groups reset and close buttons with consistent styling

### Workspace Management (December 2024)
*   **Edit Workspace Name:** Super-admin can edit workspace names via Settings tab → Edit Name button
    *   Modal with validation (non-empty name required)
    *   Immediate UI refresh after save via cache invalidation
*   **Workspace Users List Fix:** Fixed API response handling so newly created users appear immediately
    *   Users query now handles both array and object response formats
    *   Cache invalidation correctly refreshes user list after creation
*   **Create Client Login Validation:** Enhanced form validation with inline errors
    *   Email format validation with visual feedback
    *   Password strength requirements (8+ chars with letters and numbers)
    *   Touched field tracking for better UX
    *   Submit button enabled to trigger validation on click

## External Dependencies
*   **OpenAI GPT-4:** Used for the core AI engine and conversational analysis.
*   **Neon (PostgreSQL):** Provides managed PostgreSQL database hosting.
*   **Drizzle ORM:** Utilized as the Object-Relational Mapper for database interactions.
*   **Stripe:** Integrated for payment processing functionalities.