# Faith House Chatbot - White Label SaaS

## Overview
This project is a white-label AI chatbot assistant designed for sober-living facilities, offered as a SaaS product. It enables resellers to fully customize branding, knowledge base content, and operational settings for their clients, ensuring recurring revenue. The chatbot provides AI-powered chat with robust safety protocols, enhanced appointment booking, pre-qualification intake flows, and dual notification systems. Its primary purpose is to offer a customizable, AI-driven solution for client engagement and lead management in the recovery sector.

## User Preferences
- White-label SaaS model: User controls all customizations
- Clients cannot access super-admin settings
- Focus on recurring revenue through control of updates
- Privacy-first approach with PII protection

## System Architecture
The system employs a React, TypeScript, Tailwind CSS, and shadcn/ui frontend with an Express and Node.js backend. PostgreSQL (Neon) is used for data persistence, and OpenAI provides AI capabilities via Replit AI Integrations, with TanStack Query for state management.

**Key Features:**
- **AI Chat:** OpenAI integration with advanced safety protocols and 8 core menu options.
- **Enhanced Appointment Booking:** Supports multi-type appointments (Tour/Phone call/Family info call) with contact preference tracking.
- **Dual Notification System:** Email (Resend) and SMS (Twilio) for staff alerts and client confirmations.
- **Pre-qualification Intake:** Captures sobriety status, support, and timeline before booking.
- **Admin Dashboards:** `/admin` for client appointment management and `/super-admin` for reseller customization.
- **Secure Authentication:** Session-based, password-protected super-admin panel.
- **Enhanced Analytics:** Category-based message classification, performance metrics, and CSV export.
- **Multilingual Support:** Full UI and AI responses in Spanish.
- **Operating Hours Awareness:** Dynamic responses based on facility hours.
- **Crisis Support:** Integration of resources like 988 and 1-800-662-HELP.
- **UI/UX Decisions:** Admin panels feature search, filtering, clickable contact info, and responsive design. A prominent, always-visible crisis disclaimer is displayed on the public chatbot.

**Database Schema:**
- `appointments`: Stores booking requests, status, contact preferences, and PII-sanitized conversation summaries.
- `client_settings`: Holds customizable business settings per client.
- `conversation_analytics`: Stores chat metrics with PII-sanitized assistant responses classified into 8 categories.
- `admin_users`: Manages super-admin authentication credentials.
- `clients`: Multi-tenant table for white-label scalability.

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