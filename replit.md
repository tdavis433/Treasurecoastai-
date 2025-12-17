# Treasure Coast AI - Agency-First AI Assistant Platform

## Overview
Treasure Coast AI is an agency-first AI assistant platform empowering agencies to build and manage custom AI assistants for local businesses. It provides 24/7 AI assistants for lead capture, appointment booking, and answering questions. The platform features an agency-facing dashboard for bot creation and deployment, and a client dashboard for analytics. The vision is to deliver a premium, dark luxury SaaS with neon-glass accents, revolutionizing local business customer engagement through streamlined, agency-managed AI solutions.

## User Preferences
Super Admin Login: username `admin`, password `admin123`

## System Architecture

### Design Philosophy
The platform adopts a "Dark Luxury SaaS with Neon-Glass Accents" aesthetic, inspired by platforms like Linear, Vercel, and Stripe, utilizing deep blacks, glassmorphism cards, vibrant cyan and electric purple accents, neon glow effects, and smooth micro-animations.

### System Structure
The platform operates on a two-surface system:
1.  **Admin Dashboard (Agency Side):** A comprehensive interface for bot building, website scraping, knowledge management, FAQ configuration, personality customization, widget design, and deployment.
2.  **Client Dashboard:** A simplified, view-only analytics portal for clients to monitor conversations, leads, and bookings.

### Key Features
*   **Website Scraper:** AI-powered tool for extracting and structuring business information.
*   **AI Engine (GPT-4 Powered):** Handles conversational AI, dynamic context building, lead/booking intent detection, and incorporates a safety layer.
*   **AI Conversation Analysis:** Asynchronously analyzes conversations for summaries, user intent, sentiment, lead quality, and booking intent.
*   **Chat Widget:** Fully themeable, glassmorphism-designed, mobile-responsive widget with dynamic color theming, business-type-specific icons, and a visual editor.
*   **Services Catalog & Dynamic Welcome Messages:** Allows configuration of services with details and booking URLs, dynamically displayed in the chat widget.
*   **Client Analytics:** Provides view-only access to conversation history, lead management, and booking overviews.
*   **Super Admin Dashboard:** Centralized hub for platform management, client/assistant management, template galleries, global knowledge, and user roles.
*   **Assistant Editor (Bot Builder):** Tools for defining AI persona, knowledge management, automation setup, and channel customization.
*   **AI-Driven In-Chat Booking Collection:** AI can collect booking information within conversations and create appointment records.
*   **Automated Client Onboarding:** New client wizard provides out-of-the-box setup including workspace, user account, default AI assistant, and widget embed code.
*   **Notification Settings:** Configurable email/SMS notification toggles with granular event-based preferences.

### Core Architecture Principle
"ONE BRAIN ONE BEHAVIOR": All chat entry points are routed through a single Unified Conversation Orchestrator to ensure consistent AI behavior across the platform.

### Technical Implementation
*   **Frontend:** React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion.
*   **Backend:** Express.js, Node.js.
*   **Database:** PostgreSQL (Neon) with Drizzle ORM.
*   **AI:** OpenAI GPT-4.
*   **Authentication:** Admin and client accounts (clients have view-only access).
*   **Security:** Includes rate limiting, HMAC-signed widget tokens, per-bot security settings, domain validation, Helmet for secure HTTP headers, account lockout, strong password policies, secure password reset, SameSite cookies, CSRF protection, session invalidation, idle timeout, secure super-admin impersonation, and 3-tier role-based access control.
*   **3-Tier Access Control:** Workspace membership roles control access: `owner`/`manager` (full access), `staff` (operational + config), `agent` (operational only).
*   **Resilient Persistence:** When OpenAI API fails, the orchestrator extracts contact info and saves leads/bookings to prevent data loss.
*   **Mobile Responsiveness:** Enhanced for mobile viewports across landing pages and dashboards.

### Quick Book Analytics & Sales Wording
The platform supports three booking modes with transparent analytics:
1.  **Handoff Mode (External Booking):** Tracks clicks to external booking systems; `completedBookings` remains zero.
2.  **Internal Mode (Staff Follow-up):** No external link clicks logged; `completedBookings` remains zero.
3.  **Demo Mode (Confirmable):** Full funnel tracking with simulated confirmation; `completedBookings` increments on demo confirmation.
The "Analytics Honesty Principle" ensures no overclaiming of "confirmed" status for unverified external bookings.

### Recovery/Sober Living Template
Utilizes a deterministic intent router for safety and compliance, classifying intents like `admissions_intake`, `availability`, and `crisis`. Features safety guardrails such as no medical advice, staff referral for clinical questions, and immediate resource provision for crisis situations. Progressive lead enrichment uses session-based upsert with conservative merging and intent tagging, ensuring standardized tag naming and proper intent precedence. The assistant answers questions and facilitates tour/callback requests with minimal data collection, focusing on name, phone/email, and preferred time window, without collecting sensitive personal details. The widget UX for sober living businesses hides Quick Book UI and features a text-based conversational flow.

## External Dependencies
*   **OpenAI GPT-4:** Core AI engine and conversational analysis.
*   **Neon (PostgreSQL):** Managed PostgreSQL database hosting.
*   **Drizzle ORM:** Object-Relational Mapper for database interactions.