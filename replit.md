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

## External Dependencies
*   **OpenAI GPT-4:** Used for AI engine and conversation analysis.
*   **Neon (PostgreSQL):** Database hosting.
*   **Drizzle ORM:** Object-Relational Mapper.
*   **Stripe:** Payment processing.