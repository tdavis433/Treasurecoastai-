# BARBERSHOP ONBOARDING SYSTEM
## Turn Any Barbershop Into a Client in 5 Minutes

---

## STEP 1: COLLECT CLIENT INFO (2 minutes)

Use this checklist when talking to a new barbershop client:

### Basic Info:
- [ ] Business name: _______________
- [ ] Phone number: _______________
- [ ] Address: _______________
- [ ] Website (if they have one): _______________
- [ ] Booking system URL (Booksy/Calendly/Square): _______________

### Hours:
- [ ] Monday: _______________
- [ ] Tuesday: _______________
- [ ] Wednesday: _______________
- [ ] Thursday: _______________
- [ ] Friday: _______________
- [ ] Saturday: _______________
- [ ] Sunday: _______________

### Services & Pricing:
Ask: "What services do you offer and what do you charge?"

Common services (check all that apply):
- [ ] Classic Haircut - $___
- [ ] Fade/Taper - $___
- [ ] Skin Fade - $___
- [ ] Beard Trim - $___
- [ ] Beard Trim + Haircut Combo - $___
- [ ] Hot Towel Shave - $___
- [ ] Kids Cut (12 & under) - $___
- [ ] Senior Cut (65+) - $___
- [ ] Lineup/Edge-up - $___
- [ ] Hair Designs - $___

Other services:
- [ ] _______________- $___
- [ ] _______________- $___

### Barbers/Staff:
Ask: "Who are your barbers and what do they specialize in?"

1. Name: _______________ Specialty: _______________
2. Name: _______________ Specialty: _______________
3. Name: _______________ Specialty: _______________
4. Name: _______________ Specialty: _______________

### Walk-ins:
- [ ] Accept walk-ins? Yes / No
- [ ] Note about walk-ins: _______________

---

## STEP 2: GENERATE BOT CONFIG (1 minute)

Copy the barbershop template JSON and use FIND & REPLACE:

### Find & Replace List:

| Find This | Replace With |
|-----------|--------------|
| `Fade Factory Barbershop` | [Client's business name] |
| `1423 Main Street, Stuart, FL 34994` | [Client's address] |
| `(772) 555-FADE` | [Client's phone] |
| `book@fadefactoryfl.com` | [Client's email] |
| `https://fadefactoryfl.com` | [Client's website] |
| `https://fadefactoryfl.com/book` | [Client's booking URL] |

### Update Hours Section:

Replace the entire `hours` object with client's actual hours:

```json
"hours": {
  "monday": "Closed",  // or "10am-7pm"
  "tuesday": "10am-7pm",
  "wednesday": "10am-7pm",
  "thursday": "10am-8pm",
  "friday": "10am-8pm",
  "saturday": "9am-5pm",
  "sunday": "Closed"
}
```

### Update Services Array:

Replace with client's actual services:

```json
"services": [
  "Classic Haircuts",
  "Fades & Tapers",
  // Add all services they offer
]
```

### Update Barbers Array:

```json
"barbers": [
  { "name": "Marcus", "specialty": "Fades & designs", "experience": "8 years" },
  { "name": "Tony", "specialty": "Classic cuts & hot shaves", "experience": "15 years" },
  // Replace with actual barbers
]
```

### Update Pricing in systemPrompt:

Find the PRICING MENU section and update all prices:

```
PRICING MENU:
- Classic Haircut: $30  // Update with real price
- Fade/Taper: $35       // Update with real price
- Skin Fade: $40        // Update with real price
// etc.
```

### Update Walk-in Policy:

```json
"booking": {
  "onlineBookingUrl": "https://[client-booking-url]",
  "walkInsWelcome": true,  // or false
  "walkInsNote": "Walk-ins welcome as capacity allows - booking recommended for weekends"
}
```

---

## STEP 3: UPLOAD & TEST (2 minutes)

### Upload to Platform:

1. Go to Treasure Coast AI admin
2. Click "New Client"
3. Paste the customized JSON
4. Click "Create Bot"

### Test the Bot:

Send these test messages:

1. "What are your hours?"
   - Should respond with correct hours ✅

2. "How much is a haircut?"
   - Should respond with correct prices ✅

3. "I want to book an appointment"
   - Should ask for name, phone, email
   - Should provide booking link ✅

4. "Do you do walk-ins?"
   - Should respond based on walk-in policy ✅

### If Everything Works:

✅ Bot is ready to deploy!

---

## STEP 4: DEPLOY TO CLIENT WEBSITE (INSTANT)

### Give Client This Embed Code:

```html
<!-- Treasure Coast AI Chatbot -->
<script>
  window.treasureCoastAI = {
    botId: "[CLIENT_BOT_ID]",
    industry: "barbershop",
    position: "bottom-right",
    primaryColor: "#000000",
    accentColor: "#FFD700"
  };
</script>
<script src="https://treasure-coast-ai.com/widget.js"></script>
<!-- End Chatbot -->
```

### Installation Instructions for Client:

**Option 1 - They Have a Website Developer:**
"Give this code to your web developer. They'll paste it before the closing `</body>` tag."

**Option 2 - They Use Squarespace/Wix/WordPress:**
"Go to Settings → Advanced → Code Injection → Paste in Footer"

**Option 3 - You Install It:**
"I can install it for you for free as part of onboarding!"

---

## AUTOMATED ONBOARDING FORM (FUTURE)

For even faster onboarding, build a form in Treasure Coast AI:

```
=== BARBERSHOP CLIENT SETUP ===

📋 BASIC INFO
Business Name: [___________]
Phone: [___________]
Email: [___________]
Address: [___________]
Booking URL: [___________]

⏰ HOURS
Mon: [Closed ▼] or [10:00 AM ▼] to [7:00 PM ▼]
Tue: [10:00 AM ▼] to [7:00 PM ▼]
Wed: [10:00 AM ▼] to [7:00 PM ▼]
Thu: [10:00 AM ▼] to [8:00 PM ▼]
Fri: [10:00 AM ▼] to [8:00 PM ▼]
Sat: [9:00 AM ▼] to [5:00 PM ▼]
Sun: [Closed ▼]

💈 SERVICES (Select all that apply)
☑ Classic Haircut - $[30]
☑ Fade/Taper - $[35]
☑ Skin Fade - $[40]
☑ Beard Trim - $[15]
☑ Beard + Haircut Combo - $[50]
☑ Hot Towel Shave - $[35]
☑ Kids Cut (12 & under) - $[22]
☑ Senior Cut (65+) - $[25]
☑ Lineup/Edge-up - $[15]
☑ Hair Designs - $[10+]

+ Add Custom Service

👨 BARBERS
1. Name: [___] Specialty: [___]
2. Name: [___] Specialty: [___]
3. Name: [___] Specialty: [___]
+ Add Barber

🚶 WALK-INS
○ Accept walk-ins
○ Appointments only
Note: [___________________]

[Generate Bot →]
```

**Form fills in all the JSON automatically.**
**Client approves preview.**
**Click "Generate" → Bot is live.**

---

## PRICING CALCULATOR

Show client the ROI:

```
=== YOUR CHATBOT ROI ===

Your Website Traffic: 500/month

With Chatbot:
- 50% engage with bot: 250 people
- 30% request appointment: 75 leads
- 50% book (with follow-up): 37 appointments

Your Average Haircut: $35
37 appointments × $35 = $1,295/month

Your Investment: $150/month
Your Return: $1,295/month
ROI: 8.6x

Plus you get:
✅ 75 leads in your dashboard
✅ Phone numbers to follow up
✅ 24/7 availability
✅ No missed calls
```

---

## COMMON OBJECTIONS & RESPONSES

### "I don't have a website"
**Response:** "No problem! We can build you a simple landing page with the chatbot for an extra $50 one-time. Or you can add it to your Facebook page!"

### "I already use Booksy/Square"
**Response:** "Perfect! The chatbot sends customers directly to your existing Booksy link. Nothing changes on your end - you just get more bookings."

### "What if people ask questions it can't answer?"
**Response:** "The bot is trained on YOUR services, prices, and hours. If someone asks something unusual, it captures their phone number and you call them back. You see every conversation in your dashboard."

### "Can I try it first?"
**Response:** "Absolutely! Let me set up a test version for your shop right now. You can use it for a week free. If you don't see value, no charge."

### "$150 seems expensive"
**Response:** "Think of it this way - one extra haircut per day pays for it. The bot works 24/7, never calls in sick, and books appointments while you sleep. Most shops book 30-50 extra appointments per month. That's $1,000+ in revenue for $150."

---

## ONBOARDING TIMELINE

### Day 1 (5 minutes):
- Collect client info
- Generate bot config
- Upload to platform
- Test

### Day 2 (10 minutes):
- Train client on dashboard
- Show them leads page
- Install widget on website
- Send confirmation email

### Day 3-7:
- Monitor first leads
- Check in with client
- Answer any questions
- Get testimonial

### Week 2:
- Review stats with client
- Show ROI ($1,295 revenue from bot)
- Ask for referrals
- Upsell additional services

---

## SUCCESS CHECKLIST

Before marking onboarding complete:

- [ ] Bot responds correctly to hours question
- [ ] Bot provides accurate pricing
- [ ] Bot captures lead info (name, phone, email)
- [ ] Bot provides correct booking URL
- [ ] Widget appears on client website
- [ ] Client can access dashboard
- [ ] Client knows how to view leads
- [ ] Client has embed code saved
- [ ] First test lead captured successfully
- [ ] Client is trained on follow-up process

---

## FOLLOW-UP EMAIL TEMPLATE

```
Subject: Welcome to Treasure Coast AI! 🎉

Hi [CLIENT NAME],

Your AI assistant is now live at [WEBSITE]!

Here's what happens next:

1. MONITOR YOUR DASHBOARD
   Login: https://treasure-coast-ai.com/login
   Username: [USERNAME]
   Password: [PASSWORD]

2. CHECK LEADS DAILY
   Every person who chats shows up in your Leads tab
   You'll see their name, phone, and what they wanted

3. FOLLOW UP FAST
   People who don't complete booking - call them!
   "Hey [NAME], saw you wanted a [SERVICE] - we have an opening tomorrow!"

4. TRACK YOUR ROI
   Watch your bookings increase over the next 30 days
   Most shops see 30-50 extra appointments/month

Questions? Text me anytime: [YOUR PHONE]

Let's crush it!
- Tyler
Treasure Coast AI
```

---

## NEXT STEPS

1. Use this onboarding process for your first 3 barbershop clients
2. Time yourself - should take 5-7 minutes per client
3. Build the automated form (optional - for faster scaling)
4. Create templates for other industries using same structure

---

**This is your plug-and-play barbershop onboarding system.**
**Copy → Customize → Deploy → Collect $150/month** 💰
