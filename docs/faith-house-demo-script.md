# Faith House AI Assistant - Landlord Demo Script

## Overview

This demo showcases the Treasure Coast AI platform's ability to help sober living homes capture leads and book tours/phone calls through an empathetic, AI-driven conversation experience.

## Demo Credentials

### Admin Access (Full Platform Control)
- **URL**: `/login`
- **Username**: `admin`
- **Password**: `admin123`
- **Dashboard**: `/super-admin`

### Client Access (View-Only Analytics)
- **URL**: `/login`
- **Username**: `staff`
- **Password**: `Staff123`
- **Dashboard**: `/client/dashboard`

## The Faith House Bot

**Bot ID**: `faith_house_main`
**Workspace**: `ws_faith_house_001`
**Bot Type**: `sober_living`

### Personality & Approach
- Warm, supportive, and understanding
- Never pushy or salesy
- Acknowledges the courage it takes to reach out
- Focuses on helping, not selling
- Uses natural conversation to gather information

### Conversion Goals
1. **Book a Tour** - For those ready to visit in person
2. **Schedule a Phone Call** - For those who want to talk first

## Demo Flow

### Step 1: Start the Widget Chat

Open the chat widget on the Faith House website (or use the test page at `/widget-demo?botId=faith_house_main`).

### Step 2: Sample Conversation Script

**Visitor**: "Hi, I'm looking for a sober living home for my brother"

**AI Response** (warm, supportive):
> Hi there! Thank you so much for reaching out – I can only imagine how much you care about your brother to be looking into this for him. It takes a lot of courage to take this step, and I'm here to help.
>
> Faith House offers supportive, structured living for men in recovery. We focus on accountability, community, and helping residents build a strong foundation for long-term sobriety.
>
> Would you like to schedule a tour so you and your brother can see the house in person, or would a phone call with our team be more helpful right now?

**Visitor**: "A tour would be great"

**AI Response** (collecting info naturally):
> A tour is a wonderful idea – it really helps to see the environment and meet some of the people here. 
>
> To get that set up, could I get your name and the best phone number to reach you?

**Visitor**: "I'm Sarah Johnson, 555-123-4567"

**AI Response**:
> Thanks Sarah! And what's the best email address for you? We'll send a confirmation once everything is scheduled.

**Visitor**: "sarah.johnson@email.com"

**AI Response**:
> Perfect! Is there a day and time that would work well for the tour this week?

**Visitor**: "How about Thursday afternoon?"

**AI Response**:
> Thursday afternoon works great. I've noted that down and someone from our team will reach out shortly to confirm the exact time. 
>
> Is there anything specific about Faith House you'd like me to share in the meantime? Our program, house rules, costs – anything at all?

### Step 3: Show the Dashboard

After the conversation, log in as the client (staff/Staff123) and navigate to:

1. **Bookings Tab** - Show the new appointment
   - Type badge: "Tour" (cyan)
   - Name: Sarah Johnson
   - Phone: 555-123-4567
   - Email: sarah.johnson@email.com
   - Preferred Time: Thursday afternoon
   - Status: New

2. **"View Chat" Button** - Click to see the full conversation transcript

3. **Overview Tab** - Show the executive summary card
   - 7-day stats: Conversations, Leads, Tours Booked, Phone Calls Scheduled

### Step 4: Phone Call Demo (Alternative Flow)

**Visitor**: "I'm not ready for a tour yet, can we just talk on the phone first?"

**AI Response**:
> Absolutely, that's completely understandable. A phone call can be a great first step to answer any questions and help you feel more comfortable.
>
> To arrange that, could I get your name and phone number?

*[Same information collection flow, but appointment type = "Phone Call" with purple badge]*

## Key Selling Points for Landlords

### 1. 24/7 Availability
- "Your AI assistant never sleeps, never takes breaks, and responds instantly"
- "Every potential resident gets a warm, helpful response – even at 2 AM"

### 2. Empathetic Conversations
- "The AI understands this is a sensitive topic and responds with appropriate compassion"
- "It never feels like talking to a robot – it's warm and supportive"

### 3. Lead Capture Built-In
- "Every interested visitor becomes a lead with contact information"
- "You see exactly what was discussed before you even pick up the phone"

### 4. Tour & Call Scheduling
- "Two conversion paths: tours for ready visitors, phone calls for cautious ones"
- "Bookings appear in your dashboard immediately with full context"

### 5. View-Only Dashboard
- "You see everything – conversations, leads, bookings, analytics"
- "We handle all the AI training and updates – you just focus on your residents"

### 6. Conversation Linking
- "Click 'View Chat' to see the full conversation that led to each booking"
- "Know exactly what was discussed before you follow up"

## Technical Notes

### How Booking Creation Works
1. AI detects booking intent (tour or phone call)
2. AI naturally collects: name, phone, email (optional), preferred time
3. System automatically creates appointment record with:
   - `appointmentType`: 'tour' or 'phone_call'
   - `sessionId`: Links back to the conversation
   - `botId`: Links to the Faith House bot
4. Booking appears instantly in client dashboard

### Dashboard Features
- **Bookings Tab**: All appointments with Type badges, status dropdown, View Chat links
- **Overview Tab**: Executive summary with 7-day rolling stats
- **Conversations Tab**: Full conversation history with AI analysis
- **Leads Tab**: Lead management with status tracking

## Common Questions

**Q: What if the AI can't answer a question?**
A: The AI will acknowledge the limitation and offer to have a staff member follow up, while still capturing the visitor's contact information.

**Q: Can the AI handle difficult or emotional conversations?**
A: Yes, the AI is trained to be empathetic and supportive. It acknowledges emotions and focuses on being helpful without being clinical or dismissive.

**Q: What about privacy?**
A: All conversations are encrypted. The client only sees conversations for their own property. Personal information is stored securely.

**Q: Can we customize the AI's personality?**
A: Absolutely! Tyler (the agency admin) can adjust the tone, add specific knowledge about your house, and customize the booking flow.

## Next Steps After Demo

1. **Collect feedback** on the demo experience
2. **Discuss customization** needs (house rules, pricing, specific FAQs)
3. **Set up their bot** with their actual business information
4. **Deploy the widget** to their website
5. **Train staff** on the view-only dashboard
