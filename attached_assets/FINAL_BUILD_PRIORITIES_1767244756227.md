# BUILD ONBOARDING WIZARD - FINAL PRIORITIES

Based on your analysis, here's what to build in priority order:

---

## PRIORITY 1: WIZARD ONBOARDING FORM (3 days)

Build a single-page wizard that collects:

### Step 1: Basic Info
- Business name (required)
- Phone (required, format validation)
- Email (required, email validation)
- Address (required)
- Booking URL (required, URL validation)

### Step 2: Hours
- Monday-Sunday dropdowns
- Option for "Closed" or time ranges
- Default to common barbershop hours

### Step 3: Services & Pricing
- Checkbox list of common barbershop services
- Price input for each selected service
- "Add custom service" option
- Pre-select common services with default prices

### Step 4: Barbers
- Add barber fields (name, specialty)
- At least 1 required
- "Add another barber" button

### Step 5: Walk-ins
- Radio: Accept walk-ins / Appointments only
- Optional note field

### Step 6: Review & Deploy
- Show summary of all inputs
- "Create Bot" button
- Generate bot config from template
- Save to database
- Show success screen with embed code

**Key Feature:** Progress bar showing 1/6, 2/6, etc.

**Output:** Complete bot config JSON ready to deploy

---

## PRIORITY 2: TEMPLATE CLONING (1 day)

Add "Use Template" button next to existing barbershop template.

**Flow:**
1. User clicks "Use Template"
2. Opens wizard with template defaults pre-filled
3. User edits business-specific info only
4. Creates bot

**This makes Priority #1 even faster (3 min instead of 5 min)**

---

## PRIORITY 3: BOT HEALTH CHECK (1 day)

After bot creation, automatically test with 4 messages:

```javascript
const tests = [
  {
    message: "What are your hours?",
    shouldInclude: ["monday", "tuesday", "open", "closed"]
  },
  {
    message: "How much is a haircut?",
    shouldInclude: ["$", "price"]
  },
  {
    message: "I want to book",
    shouldInclude: ["name", "phone", "email"]
  },
  {
    message: "Do you take walk-ins?",
    shouldInclude: ["walk", "appointment"]
  }
];
```

**Display:**
```
🧪 BOT HEALTH CHECK

✅ Hours info - PASSED
✅ Pricing info - PASSED
✅ Lead capture - PASSED
✅ Walk-in policy - PASSED

Bot is ready to deploy!
```

If any test fails, show warning and let user edit config.

---

## PRIORITY 4: ONBOARDING PROGRESS (0.5 days)

Visual checklist showing completion:

```
ONBOARDING PROGRESS

✅ Business info collected
✅ Hours configured
✅ Services & pricing set
⏳ Barbers added (in progress)
⬜ Walk-in policy
⬜ Bot deployed
```

Updates as user progresses through wizard.

---

## TECHNICAL NOTES

### Form Library
Use `react-hook-form` for validation and state management.

### Validation Rules
- Required fields: business name, phone, email, address, booking URL
- At least 1 service selected
- At least 1 barber added
- Phone format: (XXX) XXX-XXXX
- Email format: valid email
- URL format: valid https:// URL

### Bot Generation
1. Load `barber_demo.json` template
2. Replace placeholders with form data:
   - businessName → form.businessName
   - phone → form.phone
   - hours → form.hours object
   - services → form.selectedServices array
   - barbers → form.barbers array
   - bookingUrl → form.bookingUrl
3. Generate systemPrompt with actual pricing
4. Generate FAQs with actual business info
5. Save complete config to database

### Success Screen
Show:
- ✅ "Bot Created Successfully!"
- Embed code with copy button
- Link to client dashboard
- Link to test widget
- "Create Another Client" button

---

## WHAT NOT TO BUILD (Keep Outside Platform)

❌ ROI Calculator (sales tool, not platform feature)
❌ Objection handling (sales training doc)
❌ Follow-up email templates (marketing material)
❌ Find & replace instructions (wizard eliminates this)

---

## TESTING CHECKLIST

Before marking complete:

- [ ] Can complete wizard in under 5 minutes
- [ ] All validations work correctly
- [ ] Generated bot config is valid JSON
- [ ] Bot responds to test messages
- [ ] Health check runs automatically
- [ ] Embed code copies to clipboard
- [ ] Can edit bot after creation
- [ ] Template cloning works

---

## SUCCESS METRICS

- Time to onboard: <5 minutes ✅
- Wizard completion rate: >80% ✅
- Health check pass rate: >95% ✅
- User satisfaction: "This was easy!" ✅

---

## ESTIMATED TIMELINE

**Day 1-2:** Wizard form structure + UI
**Day 3:** Bot generation logic
**Day 4:** Template cloning
**Day 5:** Health check automation

**Total: 5 days to complete system**

---

**THIS IS THE FINAL PIECE NEEDED TO LAUNCH!**

Once this is built, onboarding goes from 30 minutes to 5 minutes.

That's the difference between 10 clients and 100 clients.

Let's build it! 🚀
