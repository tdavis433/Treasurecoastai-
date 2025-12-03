# Treasure Coast AI - Agency-First AI Chatbot Platform

## Overview
Treasure Coast AI is an agency-first AI assistant platform designed to empower agencies to build and manage custom AI chatbots for local businesses. The core mission is to provide local businesses with a 24/7 AI assistant capable of capturing leads, booking appointments, and answering questions. Clients access a view-only dashboard to monitor results, while the agency handles all bot creation and management. The platform aims to be a premium, dark luxury SaaS with neon-glass accents, targeting the local business market with a streamlined, agency-managed solution for AI-driven customer interaction.

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
*   **Client Analytics (View Only):** Provides conversation history, lead management, booking overviews, and simple settings (display-only).
*   **Control Center (Admin Only):** Comprehensive platform management including client and assistant management, template galleries, global knowledge management, API key hub, billing, system logs, and user role management.
*   **Assistant Editor (Bot Builder):** Tools for defining AI persona and system prompts, managing knowledge/content, setting up automations/flows, customizing channels & embeds, and a testing sandbox.

### Technical Implementation
*   **Frontend:** React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion.
*   **Backend:** Express.js, Node.js.
*   **Database:** PostgreSQL (Neon) with Drizzle ORM.
*   **AI:** OpenAI GPT-4.
*   **Payments:** Stripe integration.
*   **Authentication:** Admin accounts (`/super-admin`) and client accounts (`/client/dashboard`) with view-only access.
*   **API Endpoints:** Structured for core chat interactions, widget configuration, and protected routes for admin and client dashboards to manage clients, bots, analytics, conversations, leads, and stats.

## External Dependencies
*   **OpenAI GPT-4:** For AI engine and conversation analysis.
*   **Neon (PostgreSQL):** Database hosting.
*   **Drizzle ORM:** Object-Relational Mapper for database interactions.
*   **Stripe:** Payment processing and integration.