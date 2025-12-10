# Treasure Coast AI - Agency-First AI Assistant Platform

## Overview
Treasure Coast AI is an agency-first AI assistant platform designed to empower agencies in building and managing custom AI assistants for local businesses. It provides 24/7 AI assistants for lead capture, appointment booking, and answering questions. The platform features a two-sided interface: a comprehensive agency-facing dashboard for bot creation and deployment, and a simplified, view-only client dashboard for analytics. The vision is to be a premium, dark luxury SaaS with neon-glass accents, revolutionizing local business customer engagement through streamlined, agency-managed AI solutions.

## User Preferences
Super Admin Login: username `admin`, password `admin123`

### Faith House Workspace Architecture
**Canonical Workspace:** `faith_house`
- Used by client login: `demo_faith_house` (password: `demo123`)
- Used by super-admin when viewing "Faith House" workspace
- Contains production-like data for demos
- Admin and client dashboards show the SAME leads, bookings, and conversations

**Demo Reset Workspace:** `faith_house_demo`
- Used ONLY by `/demo/faith-house` public demo page
- Can be reset via `/api/admin/demo/faith-house/reset`
- Isolated from canonical workspace to allow safe demo resets without affecting client data

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
*   **AI-Driven In-Chat Booking Collection:** AI can collect booking information directly within conversations and automatically create appointment records.
*   **Demo & Live Tenant Separation:** Provides distinct environments for demo and live instances with dedicated workspaces and bots.
*   **Integration Panel:** Generates customizable widget embed code for easy integration into client websites.
*   **Automated Client Onboarding:** New client wizard provides complete out-of-the-box setup including workspace creation, client user account, default AI assistant (with industry-specific prompts and persona), FAQ templates, default automations, widget embed code, and client settings.

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
*   **Security:** Rate limiting, HMAC-signed widget tokens, per-bot security settings, domain validation, Helmet for secure HTTP headers and CSP, account lockout, and strong password policies. Includes secure password reset flow.
*   **Key Architecture Components:** Unified Conversation Orchestrator, Enhanced Bot Config Cache, Multi-Tenant Data Isolation, Session Data Tracking, Daily Analytics.
*   **Resilient Persistence:** When OpenAI API fails, the orchestrator extracts contact info and saves leads/bookings to prevent data loss.
*   **Form Validation:** Inline validation for critical forms (e.g., new client wizard, client login creation).
*   **Mobile Responsiveness:** Enhanced for mobile viewports across landing pages and dashboards.

## External Dependencies
*   **OpenAI GPT-4:** Used for the core AI engine and conversational analysis.
*   **Neon (PostgreSQL):** Provides managed PostgreSQL database hosting.
*   **Drizzle ORM:** Utilized as the Object-Relational Mapper for database interactions.
*   **Stripe:** Integrated for payment processing functionalities.