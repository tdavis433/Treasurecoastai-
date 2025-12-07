# Treasure Coast AI - QA Checklist

This document provides a comprehensive checklist for verifying all platform features before demos and production deployment.

## Pre-Demo Checklist

### 1. Environment Verification
- [ ] Application starts without errors (`npm run dev`)
- [ ] Database connection is active (PostgreSQL via Neon)
- [ ] OpenAI API key is configured (`OPENAI_API_KEY` secret)
- [ ] Widget token secret is set (`WIDGET_TOKEN_SECRET` secret)
- [ ] Super admin password is set (`DEFAULT_ADMIN_PASSWORD` secret)

### 2. Faith House Sober Living Demo

#### Widget Functionality
- [ ] Navigate to `/demo/faith-house`
- [ ] Floating chat bubble appears in bottom-right corner
- [ ] Greeting popup appears after 3 seconds
- [ ] Clicking bubble opens chat widget
- [ ] Widget shows "Faith House Assistant" header
- [ ] Quick reply buttons appear: "📅 Book a Tour", "📞 Schedule a Call"
- [ ] Typing indicator shows during AI response
- [ ] Widget closes with X button

#### Booking Flow - Tour
- [ ] Click "📅 Book a Tour" quick action
- [ ] AI responds asking for contact info
- [ ] Provide name and phone number
- [ ] AI collects preferred date/time
- [ ] Booking is confirmed in conversation
- [ ] Verify booking appears in client dashboard

#### Booking Flow - Phone Call
- [ ] Click "📞 Schedule a Call" quick action
- [ ] AI responds asking for contact info
- [ ] Provide name and phone number
- [ ] AI schedules callback
- [ ] Verify appointment created with type "phone_call"

#### Lead Capture
- [ ] Start new conversation (clear session)
- [ ] Provide name and phone during chat
- [ ] Verify lead is created in dashboard
- [ ] Check lead has correct name, contact, status

### 3. Client Dashboard (`/client/dashboard`)

#### Authentication
- [ ] Login as client user
- [ ] Dashboard loads with correct business name
- [ ] DEMO badge appears if demo tenant
- [ ] Cannot access super-admin routes

#### Overview Section
- [ ] Conversations count displays correctly
- [ ] Leads count displays correctly
- [ ] Booking requests count displays correctly
- [ ] Average response time displays (ms or seconds)
- [ ] Date range selector works (7 days, 30 days, All Time)
- [ ] Booking breakdown card shows tours vs phone calls

#### Leads Tab
- [ ] Leads table displays all leads
- [ ] Search functionality works
- [ ] Export button present
- [ ] Status badges show correctly (New, Contacted, Qualified, etc.)
- [ ] Empty state shows when no leads

#### Conversations Tab
- [ ] Sessions list displays correctly
- [ ] Each session shows lead name or "Guest"
- [ ] Message count shown
- [ ] Click expands to show full message history
- [ ] Messages show sender (bot/user) correctly
- [ ] Timestamps display correctly

#### Bookings Tab
- [ ] Appointments table displays correctly
- [ ] Type badges show (Tour/Phone Call)
- [ ] Status badges show (New, Confirmed, Completed, etc.)
- [ ] Status dropdown allows changes
- [ ] "View Chat" button links to source conversation
- [ ] Empty state shows when no bookings

#### Settings Tab
- [ ] Notification email displays
- [ ] Email update functionality works

### 4. Super Admin Dashboard (`/admin`)

#### Authentication
- [ ] Login as super_admin user
- [ ] Dashboard loads with workspace overview
- [ ] All navigation sections accessible

#### Workspaces Section
- [ ] Workspace list displays correctly
- [ ] Search and filter work
- [ ] Create workspace button works
- [ ] Edit workspace dialog works
- [ ] Delete workspace requires confirmation
- [ ] DEMO badge shows on demo workspaces
- [ ] "View as Client" opens client dashboard with impersonation

#### Assistants Section
- [ ] Bot list displays correctly
- [ ] Bot editor opens on selection
- [ ] Persona tab allows editing personality
- [ ] Knowledge tab shows FAQs
- [ ] Automation tab shows quick actions
- [ ] Channel tab shows widget settings
- [ ] Test tab allows conversation testing
- [ ] Save button works with confirmation

#### Templates Section
- [ ] Available templates display
- [ ] Template categories (barber, restaurant, gym, sober_living)
- [ ] Create from template works

#### System Logs
- [ ] Logs display with filtering
- [ ] Log levels filter correctly
- [ ] Source filter works
- [ ] Resolve log functionality works

### 5. Widget Integration

#### Embed Code
- [ ] Widget embed code available in bot Channel tab
- [ ] Embed includes correct clientId and botId
- [ ] Primary color matches configuration
- [ ] Business name and subtitle configurable

#### Cross-Origin Security
- [ ] Widget only loads on allowed domains (if configured)
- [ ] HMAC token validation works (if requireWidgetToken enabled)

### 6. API Endpoints

#### Core Chat API
- [ ] `POST /api/widget/chat` processes messages
- [ ] Session ID is maintained across requests
- [ ] Language detection works (English/Spanish)
- [ ] Crisis keywords trigger appropriate response

#### Client API
- [ ] `GET /api/client/stats` returns dashboard data
- [ ] `GET /api/client/leads` returns leads with pagination
- [ ] `GET /api/client/appointments` returns bookings
- [ ] `PATCH /api/client/appointments/:id` updates status
- [ ] `GET /api/client/sessions` returns conversation sessions

#### Admin API
- [ ] `GET /api/super-admin/workspaces` returns all workspaces
- [ ] `POST /api/super-admin/workspaces` creates workspace
- [ ] `PUT /api/super-admin/workspaces/:slug` updates workspace
- [ ] `DELETE /api/super-admin/workspaces/:slug` deletes workspace
- [ ] `GET /api/super-admin/bots` returns all bots
- [ ] `POST /api/super-admin/bots` creates new bot
- [ ] `PUT /api/super-admin/bots/:botId` updates bot

### 7. Demo Reset (Faith House Demo)

- [ ] `POST /api/admin/demo/faith-house/reset` clears demo data
- [ ] Only works on demo tenants (is_demo=true)
- [ ] Re-seeds with sample data
- [ ] System log entry created

---

## Test Scenarios

### Scenario 1: New Lead Walkthrough
1. Open Faith House demo widget
2. Have a conversation asking about the program
3. Provide name and phone number when asked
4. Verify lead appears in client dashboard

### Scenario 2: Tour Booking Walkthrough
1. Open Faith House demo widget
2. Click "Book a Tour" quick action
3. Provide complete booking info (name, phone, preferred time)
4. Verify booking appears with type "tour" in dashboard

### Scenario 3: Super Admin Impersonation
1. Login as super admin
2. Navigate to Workspaces
3. Click "View as Client" on Faith House Demo
4. Verify client dashboard loads with demo data
5. Verify impersonation indicator visible

### Scenario 4: Multi-Tenant Isolation
1. Create two separate workspaces
2. Create leads in each workspace
3. Login as each client
4. Verify each only sees their own data

---

## Known Issues / Edge Cases

1. **Empty Response Time**: If no conversations tracked, avgResponseTimeMs may be null/undefined - displays as "—"
2. **Session Cleanup**: Old sessions are not automatically cleaned up - may need manual intervention
3. **Rate Limiting**: Chat API has rate limiting - demo may slow down under heavy load
4. **Image Uploads**: Not currently supported in chat widget

---

## Version Information
- Last Updated: December 2024
- Platform Version: 1.0
- Bot Config Version: 1.0.0
