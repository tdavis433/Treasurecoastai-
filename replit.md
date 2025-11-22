# Faith House Chatbot - White Label SaaS

## Overview
This is a white-label AI chatbot assistant for sober-living facilities. Built as a SaaS product where you (the reseller) control all customizations to maintain recurring revenue from clients.

## Business Model
- **You control**: All branding, knowledge base content, operating hours, colors via super-admin panel
- **Clients get**: A fully customized chatbot without needing technical knowledge
- **Recurring revenue**: Clients must stay subscribed to you for updates and customization changes

## Key Features
✅ AI-powered chat with OpenAI integration and TOP-TIER safety protocols
✅ 8 menu options (About, Requirements, Availability, Pricing, See if I qualify, Request call/tour, Crisis support, Contact info)
✅ **Enhanced appointment booking** - Multi-type appointments (Tour/Phone call/Family info call)
✅ **Contact preference tracking** - Phone/Text/Email options for optimal client follow-up
✅ **Dual notification system** - Email (Resend) + SMS (Twilio) for staff alerts & client confirmations
✅ **Pre-qualification intake flow** - Captures sobriety status, support system, timeline before booking
✅ Appointment status tracking (New → Contacted → Scheduled → Completed)
✅ Client admin dashboard at `/admin` for managing appointments
✅ Super-admin control panel at `/super-admin` for YOU to customize settings
✅ **Secure authentication** - Password-protected super-admin panel with session management
✅ **Enhanced analytics** - Category-based message classification with performance metrics
✅ CSV export for appointments
✅ Spanish language support with toggle button (full UI + AI responses)
✅ Operating hours awareness (auto-responds differently after hours)
✅ PostgreSQL database for persistent data
✅ Crisis support resources (988, 1-800-662-HELP)
✅ **Test notification button** - Verify email/SMS configuration from super-admin panel

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
- `appointments` - Tour/call/family requests with status tracking, contact preferences, email field
- `client_settings` - Customizable business settings
- `conversation_analytics` - Chat metrics with category classification (8 categories) and role field
- `admin_users` - Super-admin authentication credentials
- `clients` - Multi-tenant table for future white-label scaling (prepared, not yet used)

## Tech Stack
- Frontend: React + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Express + Node.js
- Database: PostgreSQL (Neon)
- AI: OpenAI via Replit AI Integrations
- State: TanStack Query

## Privacy & Data Protection
### PII Sanitization (Implemented)
✅ **Automatic Redaction** - All NEW analytics data is automatically sanitized before storage:
- Phone numbers (US/international formats, with/without parentheses, dots, dashes, spaces)
- Email addresses
- Social Security Numbers
- Street addresses (including apartment/unit numbers)
- Self-declared names in context ("my name is...", "call me...", etc.)

✅ **Double-Layer Protection**:
1. PII redaction applied when assistant responses are logged to analytics (server/routes.ts line 356)
2. Additional sanitization when generating conversation summaries (line 232)
3. AI instructed to avoid including PII in summaries

✅ **Privacy UI Warnings**:
- Analytics dashboard explains only assistant responses are logged (user messages never stored)
- Admin dashboard warns appointments contain sensitive contact information
- Privacy tab in super-admin panel documents PII protection measures

### Current Limitations
⚠️ **Regex-Based Detection**: PII sanitization uses pattern matching which may miss edge cases with unusual phrasing or formatting
⚠️ **Historical Data**: Existing analytics records from before this implementation may contain unsanitized PII
⚠️ **No Retention Policy**: Analytics data persists indefinitely; no automated purge mechanism

### Future Enhancements (Roadmap)
📋 **Historical Data Migration**: Endpoint to sanitize all existing analytics records (super-admin Privacy tab, currently disabled)
📋 **Automated Retention**: Configurable TTL settings (30/60/90 days) with scheduled purge jobs
📋 **Manual Purge**: Admin-triggered "Delete All Analytics" button with confirmation
📋 **Advanced PII Detection**: Consider ML-based libraries (Microsoft Presidio) for improved accuracy
📋 **Per-Appointment Purge**: Allow deletion of individual appointment conversation logs

## Recent Changes

### November 22, 2025 - Final Production Polish
✅ **Admin Panel Enhancements**
- **Search Functionality** - Real-time case-insensitive search across name, email, and phone fields
- **Status Filtering** - Dropdown filter to view appointments by status (All/New/Contacted/Scheduled/Completed)
- **Clickable Contact Information** - Phone numbers use `tel:` links, emails use `mailto:` links for one-click communication
- **Pre-Intake Display** - Prominently shows all pre-qualification answers (looking for self/loved one, sobriety status, support system, timeline)
- **Enhanced Details** - Displays appointment type (Tour/Phone/Family), contact preference (Phone/Text/Email), and AI-generated conversation summary
- **Responsive Design** - Search and filter controls stack on mobile, display inline on desktop
- **Smart Counter** - Shows "X of Y requests" when filters are active

✅ **Crisis Disclaimer**
- **Prominent Warning** - Displayed above chat input: "Not an emergency service. For crisis, call or text 988, or call 911."
- **Bilingual Support** - Full translation in Spanish: "No es un servicio de emergencia. Para crisis, llama o envía mensaje de texto al 988, o llama al 911."
- **Always Visible** - Placed outside scroll region so it remains persistently visible during entire chat session

### November 21, 2025 - TOP-TIER Production Upgrade
- **Enhanced AI System Prompts** - Comprehensive safety protocols with structured behavior guidelines (English + Spanish)
- **6-Step Appointment Flow** - Separate phone/email fields, contact preference selector, appointment type selection
- **SMS Notification System** - Twilio integration with staff alerts + client confirmations based on contact preference
- **Intelligent Category Logging** - Auto-classification of conversations into 8 categories:
  - `faq_general` - General information about facility
  - `pricing` - Cost and payment questions
  - `availability` - Bed/space availability
  - `requirements` - Entry requirements and rules
  - `application_process` - How to apply
  - `pre_intake` - Pre-qualification questions
  - `crisis_redirect` - Emergency/crisis support
  - `contact_info` - Contact details
- **Enhanced Analytics Dashboard** - New "Message Categories" card showing topic breakdown
- **Multi-tenant Database Structure** - Clients table prepared for future white-label scaling
- **Database Schema Updates**:
  - Added `email`, `contactPreference`, `appointmentType` to appointments table
  - Renamed `messageType` to `role` in conversation_analytics
  - Added `category` field for intelligent classification
- **Email Notification Enhancements** - Include all new appointment fields in staff notifications

### Previous Updates
- **Implemented comprehensive PII sanitization** with multi-layer protection for analytics and summaries
- **Added secure authentication system** with password-protected super-admin access
- Added comprehensive super-admin control panel with Privacy tab
- Implemented appointment status tracking system
- Built analytics dashboard with conversion metrics and privacy notices
- Added CSV export functionality
- Implemented Spanish language support
- Added operating hours awareness with after-hours messaging
- Dynamic AI prompts based on database settings
- Protected all super-admin API routes with authentication middleware
- Email notifications with Resend integration (graceful degradation)
- AI-powered conversation summaries for appointments

## User Preferences
- White-label SaaS model: User controls all customizations
- Clients cannot access super-admin settings
- Focus on recurring revenue through control of updates
- Privacy-first approach with PII protection
