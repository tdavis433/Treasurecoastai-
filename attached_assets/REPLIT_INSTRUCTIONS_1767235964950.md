# INSTRUCTIONS FOR REPLIT AGENT

## Overview
This project has 8 critical bugs found during QA testing. 
All bugs are documented with specific fixes provided.

## Your Task
Apply the fixes in the order listed below. Test after each fix.

---

## FILES TO READ

1. **TREASURE_COAST_BUG_FIXES.md** - High-level overview of all bugs
2. **SPECIFIC_CODE_FIXES.md** - Exact code changes needed

---

## FIX ORDER (Do in this sequence)

### 1. Chat Widget (CRITICAL)
**File:** `server/routes.ts` and demo pages
**Issue:** Chat fails after first message
**Fix:** See SPECIFIC_CODE_FIXES.md - FIX 1
**Test:** Send message in demo chat, verify response works

### 2. Bot Configuration Page (CRITICAL)
**File:** `bot-dashboard.tsx` and routing
**Issue:** Blank page when clicking Configure
**Fix:** See SPECIFIC_CODE_FIXES.md - FIX 2
**Test:** Click Configure → page loads → back button works

### 3. Logout Dropdown (HIGH)
**Files:** Super-admin header, client header
**Issue:** Dropdown doesn't open
**Fix:** See SPECIFIC_CODE_FIXES.md - FIX 3
**Test:** Click dropdown → menu appears → logout works

### 4. Impersonation Exit (HIGH)
**File:** `super-admin.tsx`
**Issue:** Exit logs out instead of returning to super-admin
**Fix:** See SPECIFIC_CODE_FIXES.md - FIX 4
**Test:** Impersonate → Exit → returns to super-admin panel

### 5. Demo CTA Buttons (MEDIUM)
**Files:** All demo pages
**Issue:** Buttons do nothing
**Fix:** See SPECIFIC_CODE_FIXES.md - FIX 5
**Test:** Click "Book a Tour" → chat opens or modal shows

### 6. Create Template (MEDIUM)
**File:** `super-admin.tsx` Templates tab
**Issue:** Button does nothing
**Fix:** See SPECIFIC_CODE_FIXES.md - FIX 6
**Test:** Click button → modal opens with form

### 7. Onboarding Validation (MEDIUM)
**File:** Onboarding wizard
**Issue:** Can proceed with empty fields
**Fix:** See SPECIFIC_CODE_FIXES.md - FIX 7
**Test:** Try submitting empty form → shows errors

### 8. Forgot Password Link (LOW)
**File:** Login page
**Issue:** Link doesn't navigate
**Fix:** Add href="/forgot-password" or onClick handler
**Test:** Click link → goes to password reset page

---

## TESTING CHECKLIST

After applying ALL fixes, verify:

- [ ] Chat widget responds on all demo pages
- [ ] Bot configuration page loads and back button works
- [ ] Logout dropdown opens and logout works
- [ ] Impersonation exit returns to super-admin
- [ ] Demo CTA buttons trigger actions
- [ ] Create Template opens modal
- [ ] Onboarding validates required fields
- [ ] Forgot password link navigates

---

## IMPORTANT NOTES

- Apply ONE fix at a time
- Test after each fix
- If a fix breaks something, revert and try alternate approach
- Add console.log() for debugging
- Check browser console for errors
- Don't skip the testing steps

---

## ESTIMATED TIME

- Total fixes: 30-60 minutes
- Testing: 15-30 minutes
- **Total: 45-90 minutes**

---

## AFTER ALL FIXES

1. Run full smoke test
2. Commit changes
3. Deploy to production
4. Monitor for errors
5. Report completion

---

## QUESTIONS?

If you encounter issues:
1. Check browser console for errors
2. Review the fix code in SPECIFIC_CODE_FIXES.md
3. Try alternate implementation
4. Document what's not working

Good luck! 🚀
