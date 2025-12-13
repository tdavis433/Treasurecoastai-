# Treasure Coast AI - Demo Script

**Duration:** 15-20 minutes  
**Last Updated:** December 13, 2025  
**Policy:** NO PAYMENT PROCESSING (redirect-only booking)

---

## 60-Second Safe Demo Path (BACKUP)

Use this if you need a quick demo or if AI responses are slow/flaky.

### Fast Click Path (60 seconds)

1. **Landing Page** (10 sec)
   - Open app URL → Show hero section
   - Say: "This is our agency AI platform for local businesses"

2. **Admin Dashboard** (20 sec)
   - Login: `admin` / `admin123`
   - Click: Clients → Show client list
   - Click: Assistants → Show bot list
   - Say: "Agencies manage everything from here"

3. **Widget Preview** (20 sec)
   - Click: Any assistant → Widget Settings → Preview
   - Say: "This is the embeddable chat widget"
   - Don't type - just show it loads

4. **Client View** (10 sec)
   - Logout → Login: `demo_faith_house` / `demo123`
   - Say: "Clients see their analytics - view only, no configuration access"

### Fallback Talk-Track (If OpenAI is slow/unavailable)

> "The AI assistant is experiencing high demand right now. Let me show you what a typical response looks like..."
> 
> - Show a previous conversation in the Conversations tab
> - Say: "Here's an example conversation where the AI captured a lead and offered to book an appointment"
> - Pivot to dashboard features: "Let me show you the analytics and lead management instead"

---

## Demo Overview

This script guides you through demonstrating the key features of Treasure Coast AI, an agency-first AI assistant platform for local businesses.

**Key Messaging:**
- AI assistants for 24/7 lead capture and booking
- Two-sided platform: Agency dashboard + Client analytics
- **NO payment processing** - booking redirects to client's external platform

---

## Pre-Demo Setup

1. [ ] Application running at https://[your-replit-url].replit.app
2. [ ] OpenAI API key configured (for live AI responses)
3. [ ] Verify widget loads on demo page (test before demo)
4. [ ] Demo accounts ready:
   - Super Admin: `admin` / `admin123`
   - Client: `demo_faith_house` / `demo123`

**Rotate these credentials before any public demo.**

---

## Demo Script

### Part 1: Introduction (2 minutes)

**Talking Points:**
- "Treasure Coast AI helps agencies deploy custom AI assistants for their clients"
- "24/7 lead capture, appointment scheduling, and customer support"
- "Two-sided platform: Agency dashboard for management + Client portal for analytics"

---

### Part 2: Super Admin Dashboard (5 minutes)

**Exact Click Path:**
1. Navigate to `/login`
2. Enter username: `admin`
3. Enter password: `admin123`
4. Click "Sign In"
5. Dashboard loads → Show overview metrics

**Highlights:**
- "This is the agency command center"
- "See all clients, assistants, and platform analytics at a glance"
- "Dark luxury design with glassmorphism accents - premium feel"

**Navigate to (with exact clicks):**

| Section | Click Path | What to Show |
|---------|------------|--------------|
| Clients | Sidebar → Clients | Client list, add new client button |
| Assistants | Sidebar → Assistants | Bot list, configuration options |
| Analytics | Sidebar → Analytics | Platform-wide metrics, charts |
| Templates | Sidebar → Templates | Pre-built bot templates |

---

### Part 3: Bot Builder (4 minutes)

**Exact Click Path:**
1. Sidebar → Assistants
2. Click on "Faith House Assistant" (or any existing bot)
3. Show tabs: Personality, Knowledge, FAQs, Widget

**Highlights:**
- "Define AI personality and tone of voice"
- "Configure knowledge base - upload info or scrape from website"
- "Set up FAQs for instant answers"
- "Customize widget colors to match client branding"

**Demo Questions to Ask the Bot (in preview):**
- "What services do you offer?"
- "What are your hours?"
- "I'd like to schedule a tour"

---

### Part 3.5: Sales Preview Link (2 minutes)

**Overview:**
Generate a time-limited (24h) branded preview link to share with prospects. They can test the AI assistant without full onboarding.

**Exact Click Path:**
1. Sidebar → Agency Console → Onboarding
2. Select a workspace/client
3. Click **"Generate Preview Link (24h)"** button (purple button)
4. Copy the generated link
5. Share with prospect via email/text

**Demo the Preview Page:**
1. Open the copied link in a new browser tab
2. Show the branded header with business logo/name
3. Point out the **expiry banner** at top (shows time remaining)
4. Click **"Wow Buttons"** to demo AI capabilities
5. Widget opens with pre-filled message

**Talking Points:**
- "Prospects get a branded preview without account setup"
- "Link expires in 24 hours for security"
- "They can try the AI assistant immediately"
- "Conversations are tracked for follow-up"

---

### Part 4: Widget Demo (3 minutes)

**⚠️ NO PAYMENTS NOTICE:**
This platform is redirect-only for booking. Booking requests track intent and redirect users to the client's external booking platform.

**Exact Click Path:**
1. Navigate to widget demo page (or use Preview in bot settings)
2. Widget appears in bottom-right corner
3. Click to open chat

**Highlights:**
- "Fully themeable - matches client branding automatically"
- "Mobile responsive - works on any device"
- "Captures leads automatically with AI quality scoring"
- "Tracks booking intent and redirects to client's external booking system"

**Sample Demo Conversation:**

```
You: "Hi, I'd like to learn more about your program"
Bot: [Responds with business info from knowledge base]

You: "What are the requirements to apply?"
Bot: [Lists requirements from FAQ/knowledge base]

You: "I'd like to schedule a tour"
Bot: [Collects contact info, logs booking intent]
Bot: "Great! Click here to book your tour" → [REDIRECTS EXTERNALLY]
```

**What happens with "Book Now":**
1. AI detects booking intent
2. Collects basic contact info (name, phone, email)
3. Creates internal booking record (no payment)
4. Redirects user to client's external booking/payment platform
5. We log the redirect event for analytics

---

### Part 5: Client Dashboard (3 minutes)

**Exact Click Path:**
1. Click user menu (top right) → Logout
2. Navigate to `/login`
3. Enter username: `demo_faith_house`
4. Enter password: `demo123`
5. Click "Sign In"

**Highlights:**
- "Clients get view-only access to their data"
- "See all conversations and chat transcripts"
- "Track leads and their quality scores"
- "Monitor booking requests and redirects"

**Navigate to (with exact clicks):**

| Section | Click Path | What to Show |
|---------|------------|--------------|
| Overview | Dashboard home | Key metrics, recent activity |
| Conversations | Sidebar → Conversations | Full chat transcripts |
| Leads | Sidebar → Leads | Lead list, status, quality score |
| Bookings | Sidebar → Bookings | Booking requests, redirect status |

---

### Part 6: Key Differentiators (2 minutes)

**Talking Points:**
- "ONE BRAIN, ONE BEHAVIOR - Consistent AI across all touchpoints"
- "Multi-tenant isolation - Each client's data is completely secure and separate"
- "Agency-managed - Clients don't need to configure anything"
- "White-label ready - Customizable branding for your agency"
- "No payment processing - we handle leads and bookings, clients handle payments externally"

---

## What to Avoid During Live Demo

**Risky Edge Cases - Don't Demo These:**

| Scenario | Why Avoid | Workaround |
|----------|-----------|------------|
| Complex multi-turn conversations | AI might hallucinate or get confused | Stick to 2-3 turn conversations |
| Asking about payments/pricing | Platform doesn't handle payments | Say "Pricing is handled by the client's system" |
| Creating new clients live | May expose setup complexity | Show existing demo client instead |
| Testing email notifications | SMTP may not be configured | Skip or say "Emails go to staff" |
| Rapid-fire questions | May trigger rate limits | Pause 3-5 seconds between messages |
| Widget on third-party site | May have CORS/domain issues | Use built-in preview page |

**If Something Breaks:**
1. Stay calm - "Let me show you a different feature"
2. Switch to the 60-second backup path above
3. Show saved conversations in the dashboard as examples

---

## Q&A Preparation

### Common Questions

**Q: How is the AI trained?**
A: "The AI uses GPT-4 with a custom knowledge base you configure. You can scrape websites, upload FAQs, or write custom responses."

**Q: Can clients modify their bot?**
A: "Clients have view-only access. Agencies maintain full control over bot configuration - that's the value prop."

**Q: What about data security?**
A: "Multi-tenant isolation ensures each client's data is completely separate. HMAC-signed tokens protect widget access. We follow security best practices."

**Q: How are leads captured?**
A: "The AI detects lead intent naturally in conversation and collects contact information inline. Leads are saved automatically with AI quality scoring."

**Q: Can it book appointments?**
A: "Yes! The AI collects booking preferences and contact info, creates an internal record, then redirects users to the client's existing booking platform. We capture intent and hand off to their system."

**Q: Do you handle payments?**
A: "No, payments are handled by the client's existing system. We capture the booking intent and redirect to their Square, Calendly, Acuity, or whatever they use. This keeps things simple and compliant."

---

## Demo Troubleshooting

### Widget not loading?
- Check WIDGET_TOKEN_SECRET is configured
- Verify domain is in allowlist (or use preview page)
- Check browser console for CORS errors
- Try hard refresh (Ctrl+Shift+R)

### AI not responding / "High demand"?
- Verify OPENAI_API_KEY is valid
- Check server logs for rate limit errors
- Use fallback talk-track (show previous conversations)
- May need to wait 30-60 seconds and retry

### Login issues?
- Super Admin: `admin` / `admin123`
- Client: `demo_faith_house` / `demo123`
- Check if account is locked (wait 15 minutes)
- Verify DEFAULT_ADMIN_PASSWORD env var

### Booking redirect not working?
- Verify external booking URL is configured for the workspace
- Check that "Book Now" button appears after booking intent
- Confirm redirect target is external domain (not our app)

---

## Post-Demo Follow-Up

- [ ] Share platform access for trial period
- [ ] Discuss implementation timeline
- [ ] Confirm client's external booking system URL
- [ ] Schedule technical deep-dive if needed
- [ ] Rotate demo credentials if they were shared

---

*Document generated as part of platform release process.*
*Version 1.1 - December 2025*
