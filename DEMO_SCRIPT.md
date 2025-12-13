# Treasure Coast AI - Demo Script

**Duration:** 15-20 minutes  
**Last Updated:** December 13, 2025

---

## Demo Overview

This script guides you through demonstrating the key features of Treasure Coast AI, an agency-first AI assistant platform for local businesses.

---

## Pre-Demo Setup

1. [ ] Application running at https://[your-replit-url].replit.app
2. [ ] OpenAI API key configured (for live AI responses)
3. [ ] Demo accounts ready:
   - Super Admin: admin / admin123
   - Client: demo_faith_house / demo123

---

## Demo Script

### Part 1: Introduction (2 minutes)

**Talking Points:**
- "Treasure Coast AI helps agencies deploy custom AI assistants for their clients"
- "24/7 lead capture, appointment booking, and customer support"
- "Two-sided platform: Agency dashboard + Client analytics"

### Part 2: Super Admin Dashboard (5 minutes)

**Steps:**
1. Navigate to /login
2. Login as admin / admin123
3. Show the Super Admin Dashboard

**Highlight:**
- "This is the agency command center"
- "See all clients, assistants, and platform analytics"
- "Dark luxury design with glassmorphism accents"

**Navigate to:**
- **Clients Section:** Show client management
- **Assistants:** Show bot configuration options
- **Analytics:** Show platform-wide metrics

### Part 3: Bot Builder (4 minutes)

**Steps:**
1. Navigate to Assistants/Bots section
2. Select or create an assistant
3. Show configuration options

**Highlight:**
- "Define AI personality and knowledge base"
- "Configure FAQs and automated responses"
- "Set up lead capture and booking flows"
- "Customize widget appearance"

### Part 4: Widget Demo (3 minutes)

**Steps:**
1. Navigate to widget demo page
2. Show the chat widget
3. Demonstrate a conversation

**Highlight:**
- "Fully themeable, matches client branding"
- "Mobile responsive"
- "Captures leads automatically"
- "Books appointments inline"

**Sample Conversation:**
```
User: "Hi, I'd like to learn more about your services"
Bot: [Responds with business info from knowledge base]
User: "Can I schedule a consultation?"
Bot: [Collects booking information]
```

### Part 5: Client Dashboard (3 minutes)

**Steps:**
1. Logout from admin
2. Login as demo_faith_house / demo123
3. Show client dashboard

**Highlight:**
- "Clients get view-only access to their data"
- "See all conversations and leads"
- "Track bookings and appointments"
- "Simple, focused analytics"

**Navigate to:**
- **Conversations:** Show conversation history
- **Leads:** Show captured leads
- **Bookings:** Show appointments

### Part 6: Key Differentiators (2 minutes)

**Talking Points:**
- "ONE BRAIN, ONE BEHAVIOR - Consistent AI across all touchpoints"
- "Multi-tenant isolation - Each client's data is secure"
- "Agency-managed - Clients don't need to configure anything"
- "White-label ready - Customizable to your brand"

---

## Q&A Preparation

### Common Questions

**Q: How is the AI trained?**
A: "The AI uses GPT-4 with a knowledge base you configure. Website scraping, FAQs, and custom responses."

**Q: Can clients modify their bot?**
A: "Clients have view-only access. Agencies maintain full control over bot configuration."

**Q: What about data security?**
A: "Multi-tenant isolation ensures each client's data is completely separate. HMAC-signed tokens protect widget access."

**Q: How are leads captured?**
A: "The AI detects lead intent and collects contact information inline. Leads are saved automatically with AI quality scoring."

**Q: Can it book appointments?**
A: "Yes! The AI can collect booking information and create appointments directly in the system."

---

## Demo Troubleshooting

### Widget not loading?
- Check WIDGET_TOKEN_SECRET is configured
- Verify domain is in allowlist
- Check browser console for errors

### AI not responding?
- Verify OPENAI_API_KEY is valid
- Check server logs for API errors
- May need to refresh the page

### Login issues?
- Super Admin: admin / admin123
- Client: demo_faith_house / demo123
- Check if account is locked (wait 15 minutes)

---

## Post-Demo Follow-Up

- [ ] Share platform access for trial
- [ ] Discuss implementation timeline
- [ ] Review pricing and packages
- [ ] Schedule technical deep-dive if needed

---

*Document generated as part of platform release process.*
