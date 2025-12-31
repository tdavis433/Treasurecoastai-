# SUPER-ADMIN REFACTOR - COMPLETE IMPLEMENTATION GUIDE

## Overview

Breaking the 10,766-line super-admin.tsx into clean, maintainable modules.

**Current:** Everything in `/client/src/pages/super-admin.tsx`
**New:** Organized structure in `/client/src/pages/super-admin/`

---

## New File Structure

```
/client/src/pages/super-admin/
├── index.tsx                          (NEW - main container, 120 lines)
├── components/
│   ├── ClientsSection.tsx            (client list & management)
│   ├── ClientDetailView.tsx          (individual client view)
│   ├── TemplatesSection.tsx          (template CRUD)
│   ├── AnalyticsSection.tsx          (global analytics)
│   ├── UsersSection.tsx              (user management)
│   ├── BillingSection.tsx            (billing overview)
│   ├── LogsSection.tsx               (system logs)
│   ├── ImpersonateButton.tsx         (NEW - view as client)
│   └── panels/                       (bot configuration panels)
│       ├── OverviewPanel.tsx         (lines 3690-3862 from old file)
│       ├── PersonaPanel.tsx          (lines 3864-4170)
│       ├── KnowledgePanel.tsx        (lines 4172-4514)
│       ├── BookingLinksPanel.tsx     (lines 4516-4856)
│       ├── ChannelsPanel.tsx         (lines 4858-5132)
│       ├── BotSettingsPanel.tsx      (lines 5134-5747)
│       ├── AnalyticsPanel.tsx        (lines 5749-5828)
│       ├── AutomationsPanel.tsx      (lines 5830-5931)
│       ├── WidgetSettingsPanel.tsx   (lines 5933-6049)
│       ├── LogsPanel.tsx             (lines 6051-6104)
│       ├── TestChatPanel.tsx         (lines 6648-7039)
│       └── InstallPanel.tsx          (lines 7041-7236)
└── hooks/
    ├── useSaveLock.ts                (lines 17-54 from old file)
    ├── useClients.ts                 (NEW - client data fetching)
    ├── useBots.ts                    (NEW - bot data fetching)
    └── useImpersonation.ts           (NEW - impersonation logic)
```

---

## Step-by-Step Migration

### Step 1: Create New Directory Structure

```bash
mkdir -p client/src/pages/super-admin/components/panels
mkdir -p client/src/pages/super-admin/hooks
```

### Step 2: Extract Utility Hooks

#### File: `/client/src/pages/super-admin/hooks/useSaveLock.ts`

**Extract from super-admin.tsx lines 9-54:**

```tsx
import { useState, useRef, createContext, useContext } from "react";

interface SaveLockContextType {
  acquireLock: () => Promise<void>;
  releaseLock: () => void;
  isLocked: boolean;
}

const SaveLockContext = createContext<SaveLockContextType | null>(null);

export function SaveLockProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const lockPromiseRef = useRef<Promise<void> | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  const acquireLock = async () => {
    while (lockPromiseRef.current) {
      await lockPromiseRef.current;
    }
    lockPromiseRef.current = new Promise((resolve) => {
      resolveRef.current = resolve;
    });
    setIsLocked(true);
  };

  const releaseLock = () => {
    setIsLocked(false);
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
    lockPromiseRef.current = null;
  };

  return (
    <SaveLockContext.Provider value={{ acquireLock, releaseLock, isLocked }}>
      {children}
    </SaveLockContext.Provider>
  );
}

export function useSaveLock() {
  const context = useContext(SaveLockContext);
  if (!context) {
    return { acquireLock: async () => {}, releaseLock: () => {}, isLocked: false };
  }
  return context;
}
```

---

### Step 3: Extract Bot Configuration Panels

These are the panels shown when editing an individual bot.

#### File: `/client/src/pages/super-admin/components/panels/OverviewPanel.tsx`

**Extract from super-admin.tsx lines 3690-3862**

**Method:**
1. Copy lines 3690-3862 from old super-admin.tsx
2. Paste into new OverviewPanel.tsx
3. Add necessary imports at top
4. Export default function

**Required imports:**
```tsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Save, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSaveLock } from "../../hooks/useSaveLock";
```

---

#### File: `/client/src/pages/super-admin/components/panels/PersonaPanel.tsx`

**Extract from super-admin.tsx lines 3864-4170**

**Method:** Same as OverviewPanel

---

#### File: `/client/src/pages/super-admin/components/panels/KnowledgePanel.tsx`

**Extract from super-admin.tsx lines 4172-4514**

---

#### File: `/client/src/pages/super-admin/components/panels/BookingLinksPanel.tsx`

**Extract from super-admin.tsx lines 4516-4856**

---

#### File: `/client/src/pages/super-admin/components/panels/ChannelsPanel.tsx`

**Extract from super-admin.tsx lines 4858-5132**

---

#### File: `/client/src/pages/super-admin/components/panels/BotSettingsPanel.tsx`

**Extract from super-admin.tsx lines 5134-5747**

---

#### File: `/client/src/pages/super-admin/components/panels/AnalyticsPanel.tsx`

**Extract from super-admin.tsx lines 5749-5828**

---

#### File: `/client/src/pages/super-admin/components/panels/AutomationsPanel.tsx`

**Extract from super-admin.tsx lines 5830-5931**

---

#### File: `/client/src/pages/super-admin/components/panels/WidgetSettingsPanel.tsx`

**Extract from super-admin.tsx lines 5933-6049**

---

#### File: `/client/src/pages/super-admin/components/panels/LogsPanel.tsx`

**Extract from super-admin.tsx lines 6051-6104**

---

#### File: `/client/src/pages/super-admin/components/panels/TestChatPanel.tsx`

**Extract from super-admin.tsx lines 6648-7039**

---

#### File: `/client/src/pages/super-admin/components/panels/InstallPanel.tsx`

**Extract from super-admin.tsx lines 7041-7236**

---

### Step 4: Extract Main Sections

#### File: `/client/src/pages/super-admin/components/ClientsSection.tsx`

**Extract from super-admin.tsx lines 7238-7658**

This is the AssistantsSectionPanel function - it shows the list of clients.

**Method:**
1. Copy AssistantsSectionPanel function
2. Rename to ClientsSection
3. Add imports
4. Export default

---

#### File: `/client/src/pages/super-admin/components/TemplatesSection.tsx`

**Extract from super-admin.tsx lines 7660-8082**

This is the TemplatesSectionPanel function.

---

#### File: `/client/src/pages/super-admin/components/UsersSection.tsx`

**Extract from super-admin.tsx lines 9523-10094**

This is the UsersSectionPanel function.

---

#### File: `/client/src/pages/super-admin/components/BillingSection.tsx`

**Extract from super-admin.tsx lines 9121-9521**

This is the BillingSectionPanel function.

---

#### File: `/client/src/pages/super-admin/components/LogsSection.tsx`

**NEW - Create a clean system logs viewer**

```tsx
import { useQuery } from "@tanstack/react-query";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function LogsSection() {
  const { data: logs } = useQuery({
    queryKey: ["/api/super-admin/logs"],
  });

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>System Logs</GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent>
        <ScrollArea className="h-[600px]">
          {logs?.map((log: any, i: number) => (
            <div key={i} className="py-2 border-b border-white/5">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{log.level}</Badge>
                <span className="text-xs text-white/40">{log.timestamp}</span>
              </div>
              <p className="text-sm text-white/80 mt-1">{log.message}</p>
            </div>
          ))}
        </ScrollArea>
      </GlassCardContent>
    </GlassCard>
  );
}
```

---

#### File: `/client/src/pages/super-admin/components/AnalyticsSection.tsx`

**NEW - Create global analytics dashboard**

```tsx
import { useQuery } from "@tanstack/react-query";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsSection() {
  const { data: analytics } = useQuery({
    queryKey: ["/api/super-admin/analytics"],
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard>
          <GlassCardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{analytics?.totalClients || 0}</div>
            <div className="text-sm text-white/60">Total Clients</div>
          </GlassCardContent>
        </GlassCard>
        
        <GlassCard>
          <GlassCardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{analytics?.totalBots || 0}</div>
            <div className="text-sm text-white/60">Total Bots</div>
          </GlassCardContent>
        </GlassCard>
        
        <GlassCard>
          <GlassCardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{analytics?.totalConversations || 0}</div>
            <div className="text-sm text-white/60">Conversations</div>
          </GlassCardContent>
        </GlassCard>
        
        <GlassCard>
          <GlassCardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{analytics?.totalLeads || 0}</div>
            <div className="text-sm text-white/60">Leads Captured</div>
          </GlassCardContent>
        </GlassCard>
      </div>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Platform Activity</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.activityData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
              <YAxis stroke="rgba(255,255,255,0.6)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)' 
                }} 
              />
              <Line type="monotone" dataKey="conversations" stroke="#00e5ff" strokeWidth={2} />
              <Line type="monotone" dataKey="leads" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
```

---

### Step 5: Add "View as Client" Feature

#### File: `/client/src/pages/super-admin/components/ImpersonateButton.tsx`

**NEW - Create impersonation button**

```tsx
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImpersonateButtonProps {
  clientId: string;
  clientName: string;
}

export default function ImpersonateButton({ clientId, clientName }: ImpersonateButtonProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleImpersonate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/super-admin/impersonate/${clientId}`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Impersonating Client",
          description: `Viewing as ${clientName}`,
        });
        setLocation("/client/dashboard");
      } else {
        throw new Error("Failed to impersonate");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to impersonate client",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleImpersonate}
      disabled={isLoading}
      className="border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/10"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Eye className="w-4 h-4 mr-2" />
      )}
      View as Client
    </Button>
  );
}
```

---

### Step 6: Wire Everything Together

#### Update App.tsx routing:

```tsx
// Change this:
import SuperAdmin from "@/pages/super-admin";

// To this:
import SuperAdmin from "@/pages/super-admin/index";
```

---

### Step 7: Add Server-Side Impersonation API

#### Add to `/server/routes.ts`:

```typescript
// Impersonation endpoint (super-admin only)
app.post('/api/super-admin/impersonate/:clientId', async (req, res) => {
  try {
    // Verify user is super-admin
    const user = (req as any).user;
    if (!user || user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { clientId } = req.params;

    // Find a user with CLIENT role in this workspace
    const [clientUser] = await db
      .select()
      .from(users)
      .where(eq(users.workspaceId, clientId))
      .where(eq(users.role, 'CLIENT'))
      .limit(1);

    if (!clientUser) {
      return res.status(404).json({ error: 'No client user found' });
    }

    // Create new session as this client
    const impersonationToken = jwt.sign(
      {
        userId: clientUser.id,
        username: clientUser.username,
        role: 'CLIENT',
        workspaceId: clientUser.workspaceId,
        impersonatedBy: user.id, // Track who is impersonating
      },
      process.env.JWT_SECRET!,
      { expiresIn: '2h' } // Short session for security
    );

    // Set cookie
    res.cookie('auth-token', impersonationToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    // Log impersonation for audit trail
    await db.insert(systemLogs).values({
      level: 'info',
      message: `Super admin ${user.username} impersonated client ${clientUser.username}`,
      metadata: JSON.stringify({
        superAdminId: user.id,
        clientId: clientUser.id,
        workspaceId: clientId,
      }),
      timestamp: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Impersonation error:', error);
    res.status(500).json({ error: 'Failed to impersonate' });
  }
});

// Exit impersonation
app.post('/api/super-admin/exit-impersonation', async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Verify this was an impersonated session
    if (!user.impersonatedBy) {
      return res.status(400).json({ error: 'Not in impersonation mode' });
    }

    // Find original super-admin user
    const [superAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.impersonatedBy))
      .limit(1);

    if (!superAdmin) {
      return res.status(404).json({ error: 'Original user not found' });
    }

    // Restore super-admin session
    const token = jwt.sign(
      {
        userId: superAdmin.id,
        username: superAdmin.username,
        role: superAdmin.role,
        workspaceId: superAdmin.workspaceId,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Exit impersonation error:', error);
    res.status(500).json({ error: 'Failed to exit impersonation' });
  }
});
```

---

## Testing Checklist

After migration:

### Test 1: Super-Admin Access ✅
- [ ] Log in as Tyler (SUPER_ADMIN)
- [ ] Can access /super-admin
- [ ] See all 6 tabs: Clients, Templates, Analytics, Users, Billing, Logs
- [ ] Each tab loads without errors

### Test 2: Client List ✅
- [ ] Clients tab shows all clients
- [ ] Can click on a client
- [ ] See bot configuration panels
- [ ] Can edit bot settings
- [ ] Changes save successfully

### Test 3: Impersonation ✅
- [ ] Click "View as Client" button
- [ ] Redirected to /client/dashboard
- [ ] See client's view (not admin view)
- [ ] Can exit impersonation
- [ ] Return to super-admin

### Test 4: Templates ✅
- [ ] Templates tab shows all templates
- [ ] Can create new template
- [ ] Can edit existing template
- [ ] Can delete template

### Test 5: Analytics ✅
- [ ] Analytics tab shows global stats
- [ ] Charts render correctly
- [ ] Data is accurate

---

## Deployment

### Option 1: Manual Migration
1. Create new folder structure
2. Copy/paste each component
3. Update imports
4. Add impersonation API
5. Test thoroughly

### Option 2: Automated Script
I can create a migration script that:
- Extracts all components automatically
- Creates all files
- Updates imports
- Ready to test

**Which do you want?**

---

## Summary

**Before:** 10,766-line monolith
**After:** Clean modular structure

**Benefits:**
- ✅ Easy to navigate
- ✅ Easy to maintain
- ✅ Reusable components
- ✅ "View as Client" feature
- ✅ Better organization

**Next:** Batch 2 (Routes split) when ready

