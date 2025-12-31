# REPLIT AGENT PROMPT - COMPLETE SUPER-ADMIN EXTRACTION

## OBJECTIVE
Extract and modularize the monolithic `/client/src/pages/super-admin.tsx` (10,767 lines) into a clean, maintainable component structure at `/client/src/pages/super-admin-refactored/` while preserving 100% of functionality.

---

## CURRENT STATE

### What Exists:
**Location:** `/client/src/pages/super-admin-refactored/`

**Files Already Created (WORKING):**
1. `index.tsx` - Main container with 6 tabs
2. `types/index.ts` - Shared TypeScript interfaces
3. `hooks/useSaveLock.tsx` - Save lock context
4. `components/sections/ClientsSection.tsx` - PLACEHOLDER (needs replacement)
5. `components/sections/TemplatesSection.tsx` - PLACEHOLDER (needs replacement)
6. `components/sections/AnalyticsSection.tsx` - PLACEHOLDER (needs extraction)
7. `components/sections/UsersSection.tsx` - PLACEHOLDER (needs extraction)
8. `components/sections/BillingSection.tsx` - PLACEHOLDER (needs extraction)
9. `components/sections/LogsSection.tsx` - PLACEHOLDER (needs extraction)

**Files in `/mnt/user-data/outputs/` to Use:**
- `TemplatesSection-FULL.tsx` - Complete templates implementation
- `ClientsSection-FULL.tsx` - Complete clients/bots implementation

### What Needs to Be Done:
Extract remaining sections from `/client/src/pages/super-admin.tsx` and create fully functional components.

---

## TASK 1: REPLACE PLACEHOLDER SECTIONS

### 1.1 Replace TemplatesSection
**Source:** `/mnt/user-data/outputs/super-admin-refactored/components/sections/TemplatesSection-FULL.tsx`
**Destination:** `/client/src/pages/super-admin-refactored/components/sections/TemplatesSection.tsx`
**Action:** Replace the existing placeholder file with the FULL version

### 1.2 Replace ClientsSection  
**Source:** `/mnt/user-data/outputs/super-admin-refactored/components/sections/ClientsSection-FULL.tsx`
**Destination:** `/client/src/pages/super-admin-refactored/components/sections/ClientsSection.tsx`
**Action:** Replace the existing placeholder file with the FULL version

---

## TASK 2: EXTRACT ANALYTICS SECTION

### Location in Original:
Lines approximately 6500-6900 in `/client/src/pages/super-admin.tsx`

### What to Extract:
Look for the `AnalyticsSectionPanel` function and extract:

```typescript
function AnalyticsSectionPanel({ 
  globalAnalytics, 
  analyticsRange, 
  setAnalyticsRange,
  botAnalytics
}: { 
  globalAnalytics: any; 
  analyticsRange: number; 
  setAnalyticsRange: (days: number) => void;
  botAnalytics: any;
})
```

### Key Features to Include:
1. **Global Stats Cards:**
   - Total Conversations
   - Total Messages
   - Total Leads
   - Total Appointments
   - Active Workspaces
   - Total Bots

2. **Date Range Selector:**
   - 7 days, 14 days, 30 days, 90 days options
   - Should update analytics data when changed

3. **Daily Trends Chart:**
   - Line chart showing conversations, leads, appointments over time
   - Use recharts library (already imported in original)

4. **Top Performing Bots:**
   - List of bots sorted by conversations
   - Show bot name, workspace, conversation count

### Required Imports:
```typescript
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, MessageSquare, Users, Calendar, Building2, Bot } from "lucide-react";
```

### Output File:
`/client/src/pages/super-admin-refactored/components/sections/AnalyticsSection.tsx`

---

## TASK 3: EXTRACT USERS SECTION

### Location in Original:
Lines approximately 8800-9400 in `/client/src/pages/super-admin.tsx`

### What to Extract:
Look for the `UsersSectionPanel` function:

```typescript
function UsersSectionPanel({ 
  users, 
  clients, 
  onCreateUser, 
  onEditUser, 
  onDeleteUser 
}: { 
  users: any[]; 
  clients: Client[]; 
  onCreateUser: () => void; 
  onEditUser: (user: any) => void; 
  onDeleteUser: (userId: string) => void; 
})
```

### Key Features to Include:
1. **User List Table:**
   - Username
   - Role (super_admin, client_admin, client_user)
   - Associated Client/Workspace
   - Last Login
   - Status (active/disabled)

2. **Actions:**
   - Create User button
   - Edit user (inline or modal)
   - Delete user (with confirmation)
   - Disable/Enable user toggle

3. **Filters:**
   - Filter by role
   - Filter by client
   - Search by username

### Required Imports:
```typescript
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Shield, User, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
```

### Output File:
`/client/src/pages/super-admin-refactored/components/sections/UsersSection.tsx`

---

## TASK 4: EXTRACT BILLING SECTION

### Location in Original:
Lines approximately 9600-9900 in `/client/src/pages/super-admin.tsx`

### What to Extract:
Look for the `BillingSectionPanel` function:

```typescript
function BillingSectionPanel({ 
  workspaces 
}: { 
  workspaces: any[]; 
})
```

### Key Features to Include:
1. **Billing Overview:**
   - Total MRR (Monthly Recurring Revenue)
   - Total Workspaces
   - Plan Distribution (Starter, Pro, Enterprise)

2. **Workspace Billing Table:**
   - Workspace Name
   - Current Plan
   - Monthly Cost
   - Status
   - Next Billing Date

3. **Actions:**
   - Change Plan (upgrade/downgrade)
   - View Billing History
   - Export Billing Report

### Required Imports:
```typescript
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, TrendingUp, Download } from "lucide-react";
```

### Output File:
`/client/src/pages/super-admin-refactored/components/sections/BillingSection.tsx`

---

## TASK 5: EXTRACT LOGS SECTION

### Location in Original:
Lines approximately 9900-10400 in `/client/src/pages/super-admin.tsx`

### What to Extract:
Look for the `LogsSectionPanel` function:

```typescript
function LogsSectionPanel({ 
  logs, 
  logFilters, 
  setLogFilters, 
  onResolveLog 
}: { 
  logs: any; 
  logFilters: any; 
  setLogFilters: (filters: any) => void; 
  onResolveLog: (logId: string) => void; 
})
```

### Key Features to Include:
1. **Log Filters:**
   - Level (all, info, warn, error)
   - Source (all, api, bot, auth, system)
   - Status (all, resolved, unresolved)
   - Client filter

2. **Log List:**
   - Timestamp
   - Level badge (color-coded)
   - Source
   - Message
   - Metadata (expandable)
   - Stack trace (for errors)
   - Resolve button (for unresolved logs)

3. **Stats:**
   - Total logs
   - Unresolved count
   - Error count
   - Last 24h count

### Required Imports:
```typescript
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, Info, AlertTriangle, CheckCircle, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
```

### Output File:
`/client/src/pages/super-admin-refactored/components/sections/LogsSection.tsx`

---

## TASK 6: UPDATE MAIN INDEX FILE

### Location:
`/client/src/pages/super-admin-refactored/index.tsx`

### Changes Needed:

1. **Import the Completed Sections:**
```typescript
import ClientsSection from "./components/sections/ClientsSection";
import TemplatesSection from "./components/sections/TemplatesSection";
import AnalyticsSection from "./components/sections/AnalyticsSection";
import UsersSection from "./components/sections/UsersSection";
import BillingSection from "./components/sections/BillingSection";
import LogsSection from "./components/sections/LogsSection";
```

2. **Update Tab Content Rendering:**
Replace placeholder `<div>` tags with actual components:

```typescript
{activeTab === 'clients' && <ClientsSection />}
{activeTab === 'templates' && <TemplatesSection />}
{activeTab === 'analytics' && <AnalyticsSection />}
{activeTab === 'users' && <UsersSection />}
{activeTab === 'billing' && <BillingSection />}
{activeTab === 'logs' && <LogsSection />}
```

3. **Remove any placeholder text** like "Coming soon..." or "Section under construction"

---

## TASK 7: EXTRACT SHARED UTILITIES

### Location in Original:
Look throughout `/client/src/pages/super-admin.tsx` for these constants and utilities

### 7.1 Business Types Constant
```typescript
const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'barber', label: 'Barber / Salon' },
  { value: 'auto', label: 'Auto Shop' },
  { value: 'home_services', label: 'Home Services' },
  { value: 'gym', label: 'Gym / Fitness' },
  { value: 'sober_living', label: 'Sober Living' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'med_spa', label: 'Med Spa' },
  { value: 'tattoo', label: 'Tattoo Studio' },
  // ... add all values from original
];
```

**Output:** `/client/src/pages/super-admin-refactored/constants/businessTypes.ts`

### 7.2 Helper Functions
Look for utility functions like:
- `formatDate`
- `formatCurrency`
- `getStatusColor`
- `getBadgeClassName`

**Output:** `/client/src/pages/super-admin-refactored/utils/helpers.ts`

---

## TASK 8: UPDATE TYPE DEFINITIONS

### Location:
`/client/src/pages/super-admin-refactored/types/index.ts`

### Ensure These Types Are Defined:

```typescript
export interface Client {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'paused' | 'demo' | 'suspended';
  plan: string;
  createdAt: string;
  // ... add all fields from original
}

export interface BotConfig {
  botId: string;
  clientId: string;
  name: string;
  status: 'active' | 'paused';
  businessProfile: {
    businessName: string;
    type: string;
    phone?: string;
    email?: string;
    // ... add all fields
  };
  faqs: Array<{ question: string; answer: string }>;
  // ... add all fields from original
}

export interface Template {
  botId: string;
  name: string;
  description: string;
  metadata?: {
    templateCategory?: string;
    isDemo?: boolean;
  };
  businessProfile: any;
  faqs: Array<{ question: string; answer: string }>;
  // ... add all fields
}

export interface User {
  id: string;
  username: string;
  role: 'super_admin' | 'client_admin' | 'client_user';
  clientId?: string;
  disabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  metadata?: any;
  stack?: string;
  workspaceId?: string;
  clientId?: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  createdAt: string;
}
```

---

## TASK 9: FIX IMPORTS AND DEPENDENCIES

### For Each New Section File:

1. **Ensure all imports resolve correctly:**
   - Check that `@/components/ui/*` paths work
   - Verify `@/hooks/use-toast` exists
   - Confirm `@/lib/queryClient` is accessible

2. **Add missing UI components if needed:**
   - If a component import fails, check `/client/src/components/ui/`
   - May need to install: `Collapsible`, `Dialog`, `Tabs`, etc.

3. **Verify icon imports:**
   - All icons should come from `lucide-react`
   - Check that all icon names used exist in the library

---

## TASK 10: TESTING CHECKLIST

### After Extraction, Test Each Section:

**Templates Tab:**
- [ ] Templates display in grid
- [ ] Category filtering works
- [ ] Search works
- [ ] Preview modal opens and shows template details
- [ ] Create template button visible
- [ ] No console errors

**Clients Tab:**
- [ ] Bot list displays
- [ ] Grid/List view toggle works
- [ ] Filters work (status, type, client, search)
- [ ] Sort works (name, type, conversations, leads)
- [ ] Stats cards show correct counts
- [ ] Bot actions work (edit, duplicate, pause/activate)
- [ ] Clicking bot navigates to detail view
- [ ] No console errors

**Analytics Tab:**
- [ ] Global stats cards display
- [ ] Date range selector works
- [ ] Chart renders with data
- [ ] Top bots list shows
- [ ] No console errors

**Users Tab:**
- [ ] User list displays
- [ ] Create user button works
- [ ] Edit user works
- [ ] Delete user works (with confirmation)
- [ ] Filters work
- [ ] No console errors

**Billing Tab:**
- [ ] Billing overview displays
- [ ] Workspace billing table shows
- [ ] Plan badges display correctly
- [ ] No console errors

**Logs Tab:**
- [ ] Logs list displays
- [ ] Filters work (level, source, status, client)
- [ ] Log details expandable
- [ ] Resolve log button works
- [ ] Stats show correct counts
- [ ] No console errors

---

## TASK 11: FINAL INTEGRATION

### Update App.tsx:
Change the import to use the refactored version:

**File:** `/client/src/App.tsx`
**Line:** ~10

```typescript
// Change from:
import SuperAdmin from "@/pages/super-admin";

// To:
import SuperAdmin from "@/pages/super-admin-refactored";
```

### Test Full Flow:
1. Log in as super-admin
2. Navigate to /super-admin
3. Click through each tab
4. Verify all functionality works
5. Check browser console for errors
6. Test on mobile viewport

---

## SUCCESS CRITERIA

### ✅ When Complete:
- [ ] All 6 tabs render without errors
- [ ] Templates tab shows all templates with search/filter
- [ ] Clients tab shows all bots with full functionality
- [ ] Analytics tab shows charts and stats
- [ ] Users tab shows user management
- [ ] Billing tab shows workspace billing
- [ ] Logs tab shows system logs with filters
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All API calls work correctly
- [ ] Mobile responsive
- [ ] Fast page load (<3 seconds)

---

## TROUBLESHOOTING

### Common Issues:

**Import errors:**
- Check file paths are correct
- Ensure `@/` alias is configured in tsconfig.json
- Verify components exist in `/components/ui/`

**Type errors:**
- Add missing types to `/types/index.ts`
- Use `any` temporarily if blocked, then refine
- Check that interfaces match API responses

**API errors:**
- Verify API endpoints exist in `/server/routes.ts`
- Check query keys match backend routes
- Ensure authentication middleware works

**Component not rendering:**
- Check component is default exported
- Verify it's imported correctly in index.tsx
- Look for runtime errors in console

---

## NOTES

### Important Considerations:

1. **Preserve ALL functionality** - Don't remove features during extraction
2. **Maintain styling** - Use same GlassCard components and Tailwind classes
3. **Keep API calls identical** - Don't change endpoint paths or request formats
4. **Test incrementally** - Test each section after creation
5. **Use TypeScript** - All files should be `.tsx` with proper types

### Reference Files:
- Original: `/client/src/pages/super-admin.tsx` (READ ONLY - don't modify)
- Completed examples: `/mnt/user-data/outputs/super-admin-refactored/components/sections/*-FULL.tsx`

---

## EXECUTION ORDER

1. ✅ Copy TemplatesSection-FULL.tsx → TemplatesSection.tsx
2. ✅ Copy ClientsSection-FULL.tsx → ClientsSection.tsx
3. ⏳ Extract and create AnalyticsSection.tsx
4. ⏳ Extract and create UsersSection.tsx
5. ⏳ Extract and create BillingSection.tsx
6. ⏳ Extract and create LogsSection.tsx
7. ⏳ Extract constants and utilities
8. ⏳ Update types/index.ts
9. ⏳ Update index.tsx to use all sections
10. ⏳ Update App.tsx import
11. ⏳ Test everything
12. ✅ DONE

---

## EXPECTED OUTCOME

A fully functional, modularized super-admin panel with:
- Clean component structure
- Separated concerns
- Maintainable codebase
- 100% feature parity with original
- No bugs or regressions
- Professional code quality

**Time estimate:** 2-4 hours for Replit Agent

**GO!**
