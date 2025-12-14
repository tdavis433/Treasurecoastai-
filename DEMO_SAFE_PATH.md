# Demo Safe Path - Treasure Coast AI

**Generated:** December 14, 2025

## Quick Demo Path (60 Seconds)

This is the "never fails" demo path for quick showcases.

### Steps

1. **Open demo page** - Navigate to `/demo` or direct demo bot URL
2. **Show chat widget** - Click the floating chat button
3. **Send greeting** - "Hi, I'm interested in your services"
4. **Watch AI respond** - AI gives personalized response based on business type
5. **Ask about hours** - "What are your hours?"
6. **Ask about services** - "What services do you offer?"
7. **Request appointment** - "I'd like to book an appointment"
8. **Show lead capture** - AI asks for contact info
9. **Close widget** - Show it minimizes cleanly

### Talking Points During Demo
- "24/7 availability - never miss a lead"
- "Personalized responses based on your business"
- "Automatically captures contact information"
- "No coding required"

---

## Full Demo Script (15-20 Minutes)

### Part 1: The Problem (2 min)
- "Local businesses miss 50% of after-hours inquiries"
- "Phone calls go to voicemail, potential customers leave"
- "Hiring 24/7 staff is expensive"

### Part 2: The Solution (1 min)
- "AI assistant that knows your business"
- "Available 24/7, instant responses"
- "Captures leads and books appointments automatically"

### Part 3: Live Demo - Customer View (5 min)

1. **Open public demo page**
   - Navigate to demo bot (e.g., Faith House, Paws & Suds)
   - "This is what your customers see"

2. **Start conversation**
   ```
   User: "Hi, I'm looking for help"
   AI: [Personalized greeting based on business]
   ```

3. **Ask common questions**
   ```
   User: "What are your hours?"
   User: "What services do you offer?"
   User: "How much does it cost?"
   ```

4. **Trigger booking flow**
   ```
   User: "I'd like to schedule an appointment"
   AI: [Asks for name, phone, preferred time]
   ```

5. **Complete lead capture**
   - Show how AI collects contact info
   - "This creates a lead in your dashboard automatically"

### Part 4: Admin Dashboard Tour (7 min)

1. **Login as admin**
   - Show super-admin dashboard
   - "This is the agency view - you manage all clients here"

2. **Show workspace management**
   - List of client workspaces
   - Status indicators (active, paused)

3. **Show conversation history**
   - Real conversations captured
   - AI summaries and sentiment analysis

4. **Show leads dashboard**
   - All captured leads
   - Contact info, source, status
   - "Export to your CRM"

5. **Show appointments**
   - Scheduled appointments
   - Status tracking

6. **Show analytics**
   - Conversation trends
   - Lead conversion rates
   - Top performing bots

### Part 5: Bot Customization (3 min)

1. **Open assistant editor**
   - Business profile settings
   - FAQ management
   - Personality sliders

2. **Show widget customization**
   - Color themes
   - Position options
   - Greeting messages

3. **Show embed code**
   - "One line of code to add to any website"
   - Copy embed code to clipboard

### Part 6: Close (2 min)

- "Questions?"
- "Ready to set up your first AI assistant?"
- Show pricing/plan options (starter, pro, enterprise)

---

## Emergency Fallbacks

If something goes wrong during demo:

### Widget doesn't load
- Check browser console for errors
- Refresh page
- Use backup demo URL

### AI doesn't respond
- Check if OpenAI API key is configured
- Show cached demo responses
- "We're experiencing high demand - let me show you a recording"

### Database errors
- Switch to in-memory demo mode
- "Let me show you the mobile experience instead"

### Network issues
- Have screenshots/video backup ready
- "Let me show you what this looks like"

---

## Demo Environment Checklist

Before every demo:

- [ ] Demo bots are seeded (`POST /api/admin/demo/faith-house/reset`)
- [ ] OpenAI API key is valid
- [ ] Database is connected
- [ ] Widget CSS/JS files load (check Network tab)
- [ ] No console errors on demo page
- [ ] Test one conversation end-to-end
