# Faith House Chatbot - White Label SaaS

## Overview
This project is a production-ready AI chatbot assistant for The Faith House sober-living facility. The system operates in **stable single-tenant mode** following the Rollback & Stabilization Guide (November 2025). It provides AI-powered chat with robust safety protocols, enhanced appointment booking, pre-qualification intake flows, and dual notification systems. The database includes future-ready multi-tenant columns (clientId, logoUrl, accentColor) but all operations are locked to a single client ('default-client') for production stability.

## User Preferences
- **Current Mode:** Single-tenant production system for The Faith House
- **Future SaaS Foundation:** Database schema includes multi-tenant columns (clientId, logoUrl, accentColor) but all logic locked to 'default-client'
- **Rollback Applied:** November 2025 - Disabled incomplete multi-tenant routing and theme UI per stabilization guide
- **Super-Admin Access:** Password-protected settings management for business configuration
- Privacy-first approach with PII protection

## System Architecture
The system employs a React, TypeScript, Tailwind CSS, and shadcn/ui frontend with an Express and Node.js backend. PostgreSQL (Neon) is used for data persistence, and OpenAI provides AI capabilities via Replit AI Integrations, with TanStack Query for state management.

**Key Features:**
- **AI Chat:** OpenAI integration with advanced safety protocols and 8 core menu options.
- **Enhanced Appointment Booking:** Supports multi-type appointments (Tour/Phone call/Family info call) with contact preference tracking.
- **Dual Notification System:** Email (Resend) and SMS (Twilio) for staff alerts and client confirmations.
- **Pre-qualification Intake:** Captures sobriety status, support, and timeline before booking.
- **Admin Dashboards:** `/admin` for dashboard with KPIs, `/admin/appointments` for appointment management, `/admin/analytics` for detailed analytics, `/admin/settings` for configuration.
- **Secure Authentication:** Session-based, password-protected admin panel with default credentials (admin/admin123).
- **Enhanced Analytics:** Category-based message classification, performance metrics, Activity Over Time chart (recharts), and CSV export.
- **Multilingual Support:** Full UI and AI responses in Spanish.
- **Operating Hours Awareness:** Dynamic responses based on facility hours.
- **Crisis Support:** Integration of resources like 988 and 1-800-662-HELP.
- **UI/UX Decisions:** Futuristic glassmorphism admin design with:
  - Dark theme background (#0B0E13) with semi-transparent glass panels
  - Neon cyan/blue accent colors (#4FC3F7, #2FE2FF)
  - Custom glass-effect components: GlassCard, NeonBadge, StatusBadge, FuturisticStatCard, DrawerPanel
  - 72px icon sidebar with gradient nav items
  - Transparent blurred top navigation bar
  - All pages (Dashboard, Appointments, Analytics, Settings) use consistent glassmorphism styling
  - Radix Sheet-based DrawerPanel for proper accessibility
  - shadcn Tabs with custom styling for keyboard navigation
  - Public chatbot features prominent crisis disclaimer

**Database Schema:**
- `appointments`: Stores booking requests, status, contact preferences, and PII-sanitized conversation summaries. Includes clientId column (all set to 'default-client').
- `client_settings`: Holds customizable business settings. Includes future-ready columns: clientId, logoUrl, accentColor (currently unused in UI).
- `conversation_analytics`: Stores chat metrics with PII-sanitized assistant responses classified into 8 categories. Includes clientId column (all set to 'default-client').
- `admin_users`: Manages super-admin authentication credentials.

**Single-Tenant Enforcement:**
All database operations explicitly filter by or set `clientId = 'default-client'`:
- All inserts (appointments, analytics, settings) set clientId='default-client'
- All reads filter by clientId='default-client'
- All updates/deletes filter by clientId='default-client'
This ensures zero multi-tenant leakage and production stability.

**Privacy & Data Protection:**
- **PII Sanitization:** Automatic redaction of phone numbers, emails, SSNs, and street addresses from new analytics data and conversation summaries.
- **Double-Layer Protection:** Redaction during logging and summary generation, with AI instructed to avoid PII.
- **Privacy UI Warnings:** Notifications in admin and analytics dashboards regarding data handling.

## External Dependencies
- **OpenAI:** For AI chatbot capabilities and conversation summarization.
- **Resend:** Email notification service (optional, configured via `RESEND_API_KEY`).
- **Twilio:** SMS notification service for staff alerts and client confirmations (optional, configured via `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`).
- **PostgreSQL (Neon):** Primary database for persistent data storage.
- **Replit AI Integrations:** Utilized for integrating OpenAI services.