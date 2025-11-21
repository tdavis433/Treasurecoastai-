# Faith House Chatbot - White Label SaaS

## Overview
This is a white-label AI chatbot assistant for sober-living facilities. Built as a SaaS product where you (the reseller) control all customizations to maintain recurring revenue from clients.

## Business Model
- **You control**: All branding, knowledge base content, operating hours, colors via super-admin panel
- **Clients get**: A fully customized chatbot without needing technical knowledge
- **Recurring revenue**: Clients must stay subscribed to you for updates and customization changes

## Key Features
✅ AI-powered chat with OpenAI integration
✅ 8 menu options (About, Requirements, Pricing, Apply, Tour Request, Crisis Support, Contact)
✅ Appointment booking system with status tracking (New → Contacted → Scheduled → Completed)
✅ Client admin dashboard at `/admin` for managing appointments
✅ Super-admin control panel at `/super-admin` for YOU to customize settings
✅ **Secure authentication** - Password-protected super-admin panel with session management
✅ Analytics dashboard at `/analytics` showing performance metrics
✅ CSV export for appointments
✅ Spanish language support with toggle button
✅ Operating hours awareness (auto-responds differently after hours)
✅ PostgreSQL database for persistent data
✅ Crisis support resources (988, 1-800-662-HELP)

## Admin Routes
- `/` - Public chatbot landing page
- `/admin` - Client dashboard (view/manage appointments)
- `/login` - **Login page** for super-admin authentication
- `/super-admin` - **Protected** YOUR control panel (customize everything)
- `/analytics` - **Protected** Performance metrics dashboard

### Authentication
- **Default credentials**: Username: `admin`, Password: `admin123`
- **Security**: All super-admin routes are protected with session-based authentication
- **SESSION_SECRET**: Required environment variable (already configured in Replit)

## Super-Admin Settings
You can customize for each client:
- Business name and tagline
- Knowledge base (about, requirements, pricing, application info)
- Operating hours and after-hours message
- Primary brand color
- Notification email and phone
- Email/SMS notification toggles

## Optional Integrations (Dismissed)
The following integrations were considered but not set up. If you want to enable notifications:

### Email Notifications (Resend)
- Integration: `connector:ccfg_resend_01K69QKYK789WN202XSE3QS17V`
- Status: Dismissed
- To enable: You can set up Resend later and use the `ask_secrets` tool to securely store `RESEND_API_KEY`

### SMS Notifications (Twilio)
- Integration: `connector:ccfg_twilio_01K69QJTED9YTJFE2SJ7E4SY08`
- Status: Not configured
- To enable: Set up Twilio and use `ask_secrets` tool to store `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

## Database Schema
- `appointments` - Tour/call requests with status tracking
- `client_settings` - Customizable business settings
- `conversation_analytics` - Chat metrics and usage data
- `admin_users` - Super-admin authentication credentials

## Tech Stack
- Frontend: React + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Express + Node.js
- Database: PostgreSQL (Neon)
- AI: OpenAI via Replit AI Integrations
- State: TanStack Query

## Recent Changes (November 21, 2025)
- **Added secure authentication system** with password-protected super-admin access
- Added comprehensive super-admin control panel
- Implemented appointment status tracking system
- Built analytics dashboard with conversion metrics
- Added CSV export functionality
- Implemented Spanish language support
- Added operating hours awareness with after-hours messaging
- Dynamic AI prompts based on database settings
- Protected all super-admin API routes with authentication middleware

## User Preferences
- White-label SaaS model: User controls all customizations
- Clients cannot access super-admin settings
- Focus on recurring revenue through control of updates
