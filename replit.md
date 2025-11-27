# Treasure Coast AI - Multi-Tenant Chatbot Platform

## Overview
This project is a production-ready multi-tenant AI chatbot platform originally developed for The Faith House sober-living facility. As of November 2025, the system has been expanded to support multiple tenants with a JSON-based configuration approach (pre-database solution). The platform includes Faith House as a real tenant plus 5 demo bots showcasing different business types.

## User Preferences
- **Current Mode:** Multi-tenant platform with JSON-based bot configurations
- **Real Tenant:** Faith House Sober Living (fully functional)
- **Demo Bots:** Restaurant, Barber/Salon, Home Services, Auto Shop, Gym
- **Super-Admin Access:** Password-protected settings management for business configuration
- Privacy-first approach with PII protection

## Multi-Tenant Architecture

### Bot Configuration System (/bots folder)
Each bot has a dedicated JSON configuration file containing:
- **Business Profile:** Name, type, location, hours, services
- **System Prompt:** AI behavior instructions
- **FAQs:** Question-answer pairs for common queries
- **Safety Rules:** Crisis keywords, forbidden topics, redirect behaviors

Bot Files:
- `faith_house.json` - Real tenant (sober living)
- `restaurant_demo.json` - Demo (restaurant)
- `barber_demo.json` - Demo (barber/salon)
- `home_services_demo.json` - Demo (home services)
- `auto_shop_demo.json` - Demo (auto shop)
- `gym_demo.json` - Demo (gym/fitness)

### Client Management (/clients folder)
- `clients.json` - Central registry of all clients
- Each client has an id, name, status, and list of bot IDs

### Conversation Logging (/logs folder)
- Logs organized by clientId: `/logs/{clientId}/`
- Daily log files: `{botId}-{YYYYMMDD}.log`
- JSON Lines format for easy parsing

## API Endpoints

### Multi-Tenant Chat
- `POST /api/chat/:clientId/:botId` - Send message to specific bot
- Loads bot config dynamically
- Applies bot-specific crisis detection
- Logs conversations to file system

### Demo Hub
- `GET /api/demos` - List all available demo bots
- `GET /api/demo/:botId` - Get specific bot config for UI

### Platform Management
- `GET /api/platform/clients` - List all clients with their bots
- `GET /api/platform/bots/:clientId/:botId` - Get full bot config
- `GET /api/platform/logs/:clientId` - Get conversation logs (authenticated)

### Legacy Single-Tenant (Faith House)
- `POST /api/chat` - Original chat endpoint (still works)
- All existing appointment, admin, and settings endpoints

## Frontend Routes

### Demo Hub
- `/demos` - Demo selector page showing all bots
- `/demo/:botId` - Individual demo bot chat interface

### Admin
- `/admin/dashboard` - Appointment KPIs and overview
- `/admin/appointments` - Appointment management
- `/admin/analytics` - Chat analytics
- `/super-admin` - Super admin configuration (super_admin role only)

## System Architecture
The system employs a React, TypeScript, Tailwind CSS, and shadcn/ui frontend with an Express and Node.js backend. PostgreSQL (Neon) is used for data persistence, and OpenAI provides AI capabilities via Replit AI Integrations, with TanStack Query for state management.

**Key Features:**
- **AI Chat:** OpenAI integration with advanced safety protocols.
- **Multi-Tenant Support:** JSON-based bot configurations with file-based logging
- **Demo Hub:** Showcase platform capabilities with 5 industry demos
- **Enhanced Appointment Booking:** Supports multi-type appointments with contact preference tracking.
- **Dual Notification System:** Email (Resend) and SMS (Twilio) for staff alerts.
- **Pre-qualification Intake:** Captures sobriety status, support, and timeline before booking.
- **Admin Dashboards:** Full suite of admin tools
- **Secure Authentication:** Session-based with role-based access control
- **Role-Based Access Control (RBAC):** Two roles implemented:
  - `super_admin`: Full access including /super-admin and platform configuration
  - `client_admin`: Access to dashboard, appointments, and analytics only
- **Enhanced Analytics:** Category-based message classification with CSV export.
- **Crisis Support:** Integration of resources like 988 and 1-800-662-HELP.

**Database Schema (for Faith House tenant):**
- `appointments`: Booking requests, status, contact preferences
- `client_settings`: Customizable business settings
- `conversation_analytics`: Chat metrics with PII-sanitized responses
- `admin_users`: Admin authentication with roles

**Privacy & Data Protection:**
- **PII Sanitization:** Automatic redaction of phone numbers, emails, SSNs
- **File-Based Logging:** Conversations logged separately by client
- **Privacy UI Warnings:** Notifications in admin dashboards

## External Dependencies
- **OpenAI:** For AI chatbot capabilities and conversation summarization.
- **Resend:** Email notification service (optional).
- **Twilio:** SMS notification service (optional).
- **PostgreSQL (Neon):** Database for Faith House tenant data.
- **Replit AI Integrations:** OpenAI service integration.

## Recent Changes (November 2025)
- Implemented multi-tenant bot configuration system
- Created 6 bot JSON configs (1 real tenant + 5 demos)
- Added multi-tenant chat endpoint with crisis detection
- Created Demo Hub UI for showcasing platform
- Added file-based conversation logging
- Added platform management API endpoints
