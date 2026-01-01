# TREASURE COAST AI - CRITICAL BUG FIXES
## Instructions for Replit Agent

This document contains fixes for all critical bugs found in QA testing.
Apply each fix in order, test after each one, then move to the next.

---

## BUG 1: CHAT WIDGET FAILS AFTER FIRST MESSAGE

**Problem:** Chat widget greets user but all subsequent messages return error "I'm having trouble connecting right now"

**Root Cause:** Backend API endpoint /api/chat is likely failing or not properly configured

**Fix Location:** `server/routes.ts` and chat handler

**What to do:**
1. Find the `/api/chat` endpoint handler
2. Add proper error handling and logging
3. Verify the endpoint is calling the AI orchestrator correctly
4. Ensure response format matches what ChatWindow.tsx expects

**Expected behavior after fix:**
- User sends message → receives AI response
- No error messages
- Conversation flows naturally

---

## BUG 2: BOT CONFIGURATION PAGE BLANK

**Problem:** Clicking "Configure" on assistant navigates to `/admin/bot/:botId` but shows only spinner then blank page. Navigating back leaves previous page blank.

**Root Cause:** 
- Route may not exist or component not loading
- State management issue causing blank screen persistence

**Fix Location:** `client/src/pages/bot-dashboard.tsx` (or similar)

**What to do:**
1. Check if route `/admin/bot/:botId` exists in routing config
2. Verify bot-dashboard.tsx component exports correctly
3. Add error boundary to catch rendering errors
4. Fix navigation state so back button restores previous page
5. Add loading states and error states

**Expected behavior after fix:**
- Configure button → loads bot config page with settings
- Back button → returns to assistant list (not blank)
- All bot configuration options visible and editable

---

## BUG 3: LOGOUT DROPDOWN DOESN'T OPEN

**Problem:** Clicking dropdown arrow beside username does nothing. Users can't access logout or account settings.

**Affected Files:**
- Super-admin header
- Client dashboard header

**What to do:**
1. Find the user menu dropdown component
2. Check onClick handler is bound correctly
3. Verify dropdown state toggle logic
4. Ensure z-index allows dropdown to appear over content

**Code pattern to find:**
```tsx
// Look for something like this:
<button onClick={toggleDropdown}>
  <UserIcon />
  <ChevronDown />
</button>
{isOpen && (
  <div className="dropdown-menu">
    <button onClick={logout}>Logout</button>
  </div>
)}
```

**Expected behavior after fix:**
- Click username/arrow → dropdown opens
- Shows "Logout", "Account Settings" options
- Click logout → logs out and redirects to /login

---

## BUG 4: IMPERSONATION EXIT LOGS OUT ADMIN

**Problem:** Clicking "Exit Impersonation" logs out super-admin instead of returning to super-admin panel

**Fix Location:** Impersonation handler in super-admin.tsx

**What to do:**
1. Find the "Exit Impersonation" button click handler
2. Instead of calling logout(), it should:
   - Clear impersonation state
   - Navigate to /super-admin
   - Restore admin session
3. Keep admin authenticated

**Code to find and fix:**
```tsx
// WRONG:
const exitImpersonation = () => {
  logout(); // ❌ This logs out admin
};

// RIGHT:
const exitImpersonation = () => {
  setImpersonatedClient(null);
  navigate('/super-admin');
  // Keep admin session active
};
```

**Expected behavior after fix:**
- Click "Exit Impersonation" → returns to super-admin panel
- Admin still logged in
- No re-login required

---

## BUG 5: DEMO CTA BUTTONS ARE DEAD LINKS

**Problem:** All demo pages have buttons like "Book a Tour", "Book Appointment" that do nothing

**Affected Files:**
- All demo pages in `/demos/*`

**What to do:**
1. Find all CTA buttons on demo pages
2. Add onClick handlers that:
   - Open booking modal, OR
   - Scroll to chat widget and open it, OR
   - Open contact form modal

**Quick Fix Option:**
```tsx
// Instead of:
<button>Book a Tour</button>

// Do this:
<button onClick={() => {
  // Open chat widget
  const chatButton = document.querySelector('.chat-widget-button');
  chatButton?.click();
}}>Book a Tour</button>
```

**Better Fix:**
Create booking modal component and wire up buttons

**Expected behavior after fix:**
- Click "Book a Tour" → opens chat or booking form
- Click "Book Appointment" → opens scheduler
- CTAs actually convert visitors

---

## BUG 6: CREATE TEMPLATE BUTTON DOES NOTHING

**Problem:** Templates tab shows "Create Template" button but clicking does nothing

**Fix Location:** `client/src/pages/super-admin.tsx` Templates tab

**What to do:**
1. Find the "Create Template" button
2. Add onClick handler to open modal or navigate to template builder
3. Create template creation modal with form fields:
   - Template name
   - Industry
   - Description
   - Default settings

**Code pattern:**
```tsx
const [showTemplateModal, setShowTemplateModal] = useState(false);

<button onClick={() => setShowTemplateModal(true)}>
  Create Template
</button>

{showTemplateModal && (
  <TemplateCreationModal 
    onClose={() => setShowTemplateModal(false)}
    onSave={handleSaveTemplate}
  />
)}
```

**Expected behavior after fix:**
- Click button → modal opens
- Fill form → save → template appears in list

---

## BUG 7: ONBOARDING VALIDATION MISSING

**Problem:** New client onboarding Step 2 allows clicking "Next" with empty required fields

**Fix Location:** Client onboarding wizard component

**What to do:**
1. Find Step 2 form in onboarding flow
2. Add validation before allowing "Next":
```tsx
const handleNext = () => {
  const errors = validateStep2();
  if (errors.length > 0) {
    setValidationErrors(errors);
    return; // Don't proceed
  }
  goToNextStep();
};
```

3. Show inline error messages for required fields
4. Disable "Next" button until form is valid

**Expected behavior after fix:**
- Empty required fields → shows error messages
- Can't proceed to next step
- Red borders on invalid inputs

---

## BUG 8: FORGOT PASSWORD LINK NON-FUNCTIONAL

**Problem:** Login page shows "Forgot Password" but link doesn't work

**Fix Location:** Login page component

**What to do:**
1. Find "Forgot Password" link
2. Add onClick or href to navigate to `/forgot-password`
3. Create password reset flow:
   - Email input
   - Send reset link
   - Confirmation message

**Quick fix:**
```tsx
<a href="/forgot-password" className="text-blue-600">
  Forgot Password?
</a>
```

**Expected behavior after fix:**
- Click link → goes to password reset page
- User can request reset email

---

## TESTING CHECKLIST

After applying ALL fixes, test in this order:

### Critical Functionality:
- [ ] Chat widget responds to messages (client dashboard + all demos)
- [ ] Configure button on assistants loads bot config page
- [ ] Back button from bot config returns to assistant list (not blank)
- [ ] Logout dropdown opens on click
- [ ] Exit impersonation returns to super-admin panel

### High Priority:
- [ ] Demo CTA buttons trigger action (chat or booking)
- [ ] Create Template button opens modal
- [ ] Onboarding Step 2 validates required fields
- [ ] Forgot Password link navigates correctly

### Smoke Test:
- [ ] Login as super-admin
- [ ] Create new client through onboarding
- [ ] Configure assistant
- [ ] Impersonate client
- [ ] Test chat widget
- [ ] Exit impersonation (should return to super-admin)
- [ ] Visit demo pages and test CTAs
- [ ] Logout successfully

---

## DEPLOYMENT

Once all fixes applied and tested:

1. Commit changes: `git add . && git commit -m "Fix critical bugs from QA report"`
2. Deploy to production
3. Re-run QA tests to verify fixes
4. Monitor for new issues

---

## NOTES FOR REPLIT AGENT

- Apply fixes ONE AT A TIME
- Test after each fix before moving to next
- If a fix breaks something, revert and try different approach
- Add console.log() statements for debugging
- Check browser console for errors after each change

**Estimated time to apply all fixes: 30-60 minutes**

Good luck! 🚀
