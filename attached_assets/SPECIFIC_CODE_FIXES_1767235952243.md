# SPECIFIC CODE FIXES FOR TREASURE COAST AI

## FIX 1: CHAT WIDGET API ERROR

### Problem
Chat returns "I'm having trouble connecting" after first message

### Solution A: Fix Backend API Handler

**File:** `server/routes.ts`

Find the `/api/chat` endpoint and ensure it looks like this:

```typescript
// BEFORE (likely broken):
app.post("/api/chat", async (req, res) => {
  const { message, botId } = req.body;
  // Missing error handling
  const response = await orchestrator.processMessage(message, botId);
  res.json(response);
});

// AFTER (fixed):
app.post("/api/chat", async (req, res) => {
  try {
    const { message, botId, conversationId } = req.body;
    
    if (!message || !botId) {
      return res.status(400).json({ 
        error: "Missing required fields: message and botId" 
      });
    }

    console.log(`[Chat API] Processing message for bot ${botId}:`, message);
    
    const response = await orchestrator.processMessage({
      message,
      botId,
      conversationId: conversationId || `conv-${Date.now()}`
    });

    console.log(`[Chat API] Response:`, response);
    
    res.json({
      role: "assistant",
      content: response.message || response.content || "I'm here to help!",
      suggestedReplies: response.suggestedReplies || [],
      actions: response.actions || []
    });
    
  } catch (error) {
    console.error("[Chat API] Error:", error);
    res.status(500).json({ 
      error: "Failed to process message",
      details: error.message 
    });
  }
});
```

### Solution B: Fix Frontend Chat Handler

**Files to check:**
- Any demo page (e.g., `demo-barbershop.tsx`)
- Client dashboard with chat widget

Find the `sendMessage` or `handleSendMessage` function and ensure it:

```typescript
const handleSendMessage = async (message: string) => {
  try {
    setIsLoading(true);
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        botId: 'your-bot-id', // Make sure this is set correctly
        conversationId: conversationId || null
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Add assistant response
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: data.content || data.message,
      suggestedReplies: data.suggestedReplies
    }]);

  } catch (error) {
    console.error('Chat error:', error);
    
    // Show user-friendly error
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: "I'm having trouble connecting. Please try again in a moment."
    }]);
  } finally {
    setIsLoading(false);
  }
};
```

---

## FIX 2: BOT CONFIGURATION BLANK PAGE

### Problem
Navigate to `/admin/bot/:botId` shows blank page, back button breaks

### Solution

**File:** Wherever bot configuration route is defined

**Option A - Add Route (if missing):**

```typescript
// In App.tsx or routing file:
<Route path="/admin/bot/:botId" component={BotDashboard} />
```

**Option B - Fix BotDashboard Component:**

**File:** `bot-dashboard.tsx`

```typescript
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export default function BotDashboard() {
  const [, params] = useRoute("/admin/bot/:botId");
  const [, setLocation] = useLocation();
  const botId = params?.botId;

  // Redirect if no botId
  useEffect(() => {
    if (!botId) {
      setLocation("/super-admin");
    }
  }, [botId, setLocation]);

  // Fetch bot data
  const { data: bot, isLoading, error } = useQuery({
    queryKey: [`/api/bots/${botId}`],
    enabled: !!botId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !bot) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Error Loading Bot</h1>
        <p>{error?.message || "Bot not found"}</p>
        <button 
          onClick={() => setLocation("/super-admin")}
          className="mt-4 px-4 py-2 bg-primary text-white rounded"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <button 
        onClick={() => setLocation("/super-admin")}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← Back to Assistants
      </button>
      
      <h1 className="text-3xl font-bold mb-6">Configure {bot.name}</h1>
      
      {/* Bot configuration form goes here */}
      <div className="space-y-6">
        {/* Add your bot config UI */}
      </div>
    </div>
  );
}
```

---

## FIX 3: LOGOUT DROPDOWN DOESN'T OPEN

### Problem
Clicking dropdown arrow does nothing

### Solution

**Files to fix:**
- Super-admin header
- Client dashboard header

**Find code that looks like:**

```tsx
// BEFORE (broken):
<div className="flex items-center">
  <UserIcon />
  <span>{username}</span>
  <ChevronDown /> {/* This doesn't do anything */}
</div>
```

**Replace with:**

```tsx
// AFTER (working):
import { useState } from "react";

const [isDropdownOpen, setIsDropdownOpen] = useState(false);

<div className="relative">
  <button 
    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
    className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded"
  >
    <UserIcon />
    <span>{username}</span>
    <ChevronDown className={isDropdownOpen ? "rotate-180" : ""} />
  </button>

  {isDropdownOpen && (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
      <button
        onClick={() => {
          setIsDropdownOpen(false);
          // Navigate to account settings
        }}
        className="w-full px-4 py-2 text-left hover:bg-gray-100"
      >
        Account Settings
      </button>
      <button
        onClick={() => {
          setIsDropdownOpen(false);
          handleLogout();
        }}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
      >
        Logout
      </button>
    </div>
  )}
</div>

{/* Click outside to close */}
{isDropdownOpen && (
  <div 
    className="fixed inset-0 z-40" 
    onClick={() => setIsDropdownOpen(false)}
  />
)}
```

---

## FIX 4: IMPERSONATION EXIT LOGS OUT

### Problem
Exit impersonation calls logout instead of returning to super-admin

### Solution

**File:** `super-admin.tsx` (or wherever impersonation is handled)

**Find:**

```typescript
// WRONG:
const exitImpersonation = () => {
  logout(); // ❌ This logs admin out
  navigate('/login');
};
```

**Replace with:**

```typescript
// RIGHT:
const exitImpersonation = () => {
  // Clear impersonation state
  setImpersonatedClient(null);
  localStorage.removeItem('impersonatedClientId');
  
  // Return to super-admin (don't log out)
  navigate('/super-admin');
  
  // Optionally refresh the page to restore admin session
  // window.location.href = '/super-admin';
};
```

**In the impersonation banner:**

```tsx
<div className="bg-yellow-500 text-white p-4 flex justify-between items-center">
  <span>Viewing as {impersonatedClient.name}</span>
  <button 
    onClick={exitImpersonation}
    className="bg-white text-yellow-600 px-4 py-2 rounded font-semibold"
  >
    Exit Impersonation
  </button>
</div>
```

---

## FIX 5: DEMO CTA BUTTONS

### Problem
"Book a Tour", "Book Appointment" buttons do nothing

### Quick Fix (Make them open chat)

**In any demo page** (faith-house, barbershop, salon, etc.):

```tsx
// Find all CTA buttons like:
<button>Book a Tour</button>
<button>Book Appointment</button>
<button>Chat With Us Now</button>

// Add onClick handlers:
<button 
  onClick={() => {
    setIsChatOpen(true); // Open the chat widget
  }}
  className="bg-primary text-white px-6 py-3 rounded-lg"
>
  Book a Tour
</button>

<button 
  onClick={() => {
    setIsChatOpen(true);
    // Optionally send initial message
    setTimeout(() => {
      handleSendMessage("I'd like to book an appointment");
    }, 500);
  }}
  className="bg-primary text-white px-6 py-3 rounded-lg"
>
  Book Appointment
</button>
```

### Better Fix (Add Booking Modal)

Create `BookingModal.tsx`:

```tsx
export function BookingModal({ isOpen, onClose, businessName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Book Appointment</h2>
        
        <form className="space-y-4">
          <input 
            type="text" 
            placeholder="Your Name" 
            className="w-full px-4 py-2 border rounded"
            required
          />
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full px-4 py-2 border rounded"
            required
          />
          <input 
            type="tel" 
            placeholder="Phone" 
            className="w-full px-4 py-2 border rounded"
            required
          />
          <textarea 
            placeholder="Message (optional)" 
            className="w-full px-4 py-2 border rounded"
            rows={3}
          />
          
          <div className="flex gap-2">
            <button 
              type="submit"
              className="flex-1 bg-primary text-white px-4 py-2 rounded"
            >
              Submit Request
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

Then in demo pages:

```tsx
const [showBookingModal, setShowBookingModal] = useState(false);

<button onClick={() => setShowBookingModal(true)}>
  Book a Tour
</button>

<BookingModal 
  isOpen={showBookingModal}
  onClose={() => setShowBookingModal(false)}
  businessName="Faith House"
/>
```

---

## FIX 6: CREATE TEMPLATE BUTTON

### Problem
Button does nothing

### Solution

**File:** `super-admin.tsx` Templates tab

**Find:**

```tsx
<button>Create Template</button>
```

**Replace with:**

```tsx
const [showTemplateModal, setShowTemplateModal] = useState(false);

<button onClick={() => setShowTemplateModal(true)}>
  Create Template
</button>

{showTemplateModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-lg w-full">
      <h2 className="text-2xl font-bold mb-4">Create Template</h2>
      
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Template Name</label>
          <input 
            type="text" 
            className="w-full px-4 py-2 border rounded"
            placeholder="e.g., Barbershop Template"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Industry</label>
          <select className="w-full px-4 py-2 border rounded">
            <option>Beauty & Wellness</option>
            <option>Healthcare</option>
            <option>Professional Services</option>
            <option>Hospitality</option>
            <option>Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea 
            className="w-full px-4 py-2 border rounded"
            rows={3}
            placeholder="Describe this template..."
          />
        </div>
        
        <div className="flex gap-2">
          <button 
            type="submit"
            className="flex-1 bg-primary text-white px-4 py-2 rounded"
          >
            Create Template
          </button>
          <button 
            type="button"
            onClick={() => setShowTemplateModal(false)}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}
```

---

## FIX 7: ONBOARDING VALIDATION

### Problem
Can proceed with empty required fields

### Solution

**File:** Client onboarding wizard

**Add validation to Step 2:**

```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

const validateStep2 = () => {
  const newErrors: Record<string, string> = {};
  
  if (!formData.businessName.trim()) {
    newErrors.businessName = "Business name is required";
  }
  
  if (!formData.email.trim()) {
    newErrors.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    newErrors.email = "Email is invalid";
  }
  
  if (!formData.phone.trim()) {
    newErrors.phone = "Phone number is required";
  }
  
  if (!formData.industry) {
    newErrors.industry = "Please select an industry";
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleNext = () => {
  if (currentStep === 2) {
    if (!validateStep2()) {
      return; // Don't proceed if validation fails
    }
  }
  
  setCurrentStep(currentStep + 1);
};

// In the form:
<input
  value={formData.businessName}
  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
  className={errors.businessName ? "border-red-500" : ""}
/>
{errors.businessName && (
  <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>
)}
```

---

## TESTING AFTER FIXES

Run this checklist:

1. **Chat Widget:**
   - [ ] Open any demo page
   - [ ] Send "Hello" in chat
   - [ ] Should get response (not error)

2. **Bot Config:**
   - [ ] Click Configure on assistant
   - [ ] Page loads (not blank)
   - [ ] Click back
   - [ ] Previous page shows (not blank)

3. **Logout:**
   - [ ] Click dropdown arrow
   - [ ] Menu opens
   - [ ] Click logout
   - [ ] Logs out successfully

4. **Impersonation:**
   - [ ] Click eye icon on client
   - [ ] Enter impersonation
   - [ ] Click "Exit Impersonation"
   - [ ] Returns to super-admin (not login)

5. **CTAs:**
   - [ ] Click "Book a Tour" on demo
   - [ ] Chat opens or modal appears

6. **Templates:**
   - [ ] Click "Create Template"
   - [ ] Modal opens with form

7. **Onboarding:**
   - [ ] Start new client
   - [ ] Try clicking Next with empty fields
   - [ ] Shows error messages

---

## DEPLOYMENT INSTRUCTIONS

1. Apply all fixes
2. Test locally
3. Commit: `git commit -m "Fix critical bugs from QA"`
4. Push and deploy
5. Test on production
6. Monitor for errors

Good luck! 🚀
