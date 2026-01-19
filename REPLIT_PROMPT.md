# REPLIT AGENT EXECUTION PROMPT
## Step 29: Organization Membership Management + Org Switcher

**🎯 Objective:** Deploy the completed Step 29 implementation to your Replit environment.

**⚠️ Prerequisites:**
- DATABASE_URL environment variable must be configured
- PostgreSQL database must be accessible

---

## 📋 EXECUTION STEPS

### Step 1: Verify All Files Are Present

Check that these 5 new files exist:
```bash
ls -la migrations/0002_workspace_invitations.sql
ls -la client/src/pages/workspace-members.tsx
ls -la client/src/pages/accept-invite.tsx
ls -la client/src/components/workspace-switcher.tsx
ls -la STEP29_IMPLEMENTATION.md
```

Check that these 4 files were modified:
```bash
git diff HEAD~1 shared/schema.ts
git diff HEAD~1 server/storage.ts
git diff HEAD~1 server/routes.ts
git diff HEAD~1 client/src/App.tsx
```

### Step 2: Install Dependencies (if needed)

```bash
pnpm install
```

### Step 3: Run Database Migration

**Option A: Using db:push (Recommended for Replit)**
```bash
pnpm db:push
```

**Option B: Manual SQL (if db:push fails)**
```bash
psql $DATABASE_URL < migrations/0002_workspace_invitations.sql
```

**Verification:**
```bash
psql $DATABASE_URL -c "\d workspace_invitations"
```

You should see the table structure with columns:
- id, workspace_id, token, role, created_by_user_id, email, expires_at, used_at, used_by_user_id, created_at

### Step 4: Type Check

```bash
pnpm check
```

Expected output: Only pre-existing errors (nanoid, preferredDateTime) should appear. No new errors related to workspace invitations.

### Step 5: Build Application

```bash
pnpm build
```

Expected output: Build should complete successfully with no errors.

### Step 6: Start Development Server

```bash
pnpm dev
```

Expected output: Server starts on configured port (typically 3000 or 5000).

### Step 7: Verify in Browser

1. **Navigate to Team Management Page:**
   - Go to `http://localhost:3000/admin/workspace/members`
   - Should see "Team Management" page with member list
   - Should see "Invite Member" button

2. **Test Invitation Flow:**
   - Click "Invite Member"
   - Select role: "Staff"
   - Click "Generate Link"
   - Copy the invitation link
   - Open in new incognito window
   - Accept the invitation

3. **Test Workspace Switcher:**
   - If user belongs to multiple workspaces, workspace switcher should appear
   - Click dropdown to switch workspaces

### Step 8: Commit Changes (if satisfied)

```bash
git add -A
git commit -m "$(cat <<'EOF'
Implement Step 29: Workspace Membership Management

- Add workspaceInvitations table with secure token-based invites
- Implement 8 new API endpoints for member management
- Create team management UI at /admin/workspace/members
- Add workspace switcher component for multi-workspace users
- Implement last owner protection logic
- Add invitation acceptance flow at /accept-invite
- Ensure strict tenant isolation and RBAC enforcement
EOF
)"
```

### Step 9: Push to Remote

```bash
git push -u origin claude/org-membership-switcher-9vNJe
```

---

## 🔍 TROUBLESHOOTING

### Issue: Database migration fails with "relation already exists"

**Solution:**
```bash
# Drop the table if it exists (only in development!)
psql $DATABASE_URL -c "DROP TABLE IF EXISTS workspace_invitations CASCADE;"

# Then run migration again
pnpm db:push
```

### Issue: TypeScript errors about missing types

**Solution:**
```bash
# Regenerate types
pnpm check

# If errors persist, restart TypeScript server
# In VS Code: Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

### Issue: "Cannot find module" errors when running

**Solution:**
```bash
# Clean install
rm -rf node_modules
pnpm install
```

### Issue: Invitation link doesn't work

**Checklist:**
1. Is user logged in?
2. Is token in URL correct?
3. Has invitation expired?
4. Has invitation already been used?
5. Check browser console for errors

### Issue: Workspace switcher doesn't appear

**Reason:** User only belongs to 1 workspace
**Solution:** Workspace switcher is hidden when user has only 1 workspace (by design)

---

## 🎯 QUICK VERIFICATION COMMANDS

### Check database table exists:
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM workspace_invitations;"
```

### Check API endpoints are registered:
```bash
curl -X GET http://localhost:3000/api/user/workspaces -b cookies.txt
```

### Check TypeScript compilation:
```bash
pnpm check 2>&1 | grep -v "nanoid\|preferredDateTime"
```

### Check build output size:
```bash
pnpm build && du -sh dist/
```

---

## 📊 SUCCESS CRITERIA

✅ **Database:** workspace_invitations table created with 3 indexes
✅ **Backend:** 8 new API endpoints return expected responses
✅ **Frontend:** Team management page renders without errors
✅ **TypeScript:** No new type errors introduced
✅ **Build:** Production build completes successfully
✅ **Security:** Last owner protection prevents invalid operations
✅ **UX:** Invitation flow works end-to-end

---

## 🚀 POST-DEPLOYMENT TASKS

### 1. Create Initial Workspace Memberships

If you have existing workspaces without memberships:

```sql
INSERT INTO workspace_memberships (workspace_id, user_id, role, status, invited_by, accepted_at)
SELECT
  id as workspace_id,
  owner_id as user_id,
  'owner' as role,
  'active' as status,
  owner_id as invited_by,
  created_at as accepted_at
FROM workspaces
WHERE NOT EXISTS (
  SELECT 1 FROM workspace_memberships wm
  WHERE wm.workspace_id = workspaces.id
  AND wm.user_id = workspaces.owner_id
);
```

### 2. Test with Real Users

1. Create test workspace
2. Generate invitation link
3. Accept invitation with different user
4. Verify permissions work correctly
5. Test role changes
6. Test member removal
7. Verify last owner protection

### 3. Monitor Logs

```bash
# Watch for errors in console
tail -f logs/app.log | grep -i "error\|workspace"
```

### 4. Set Up Monitoring (Optional)

Add alerts for:
- Failed invitation acceptances
- Unauthorized access attempts to member management
- Attempts to remove last owner

---

## 📚 REFERENCE

**Full Documentation:** See `STEP29_IMPLEMENTATION.md`

**Key Files:**
- Backend API: `/server/routes.ts` (lines 5180-5499)
- Storage Layer: `/server/storage.ts` (lines 1630-1750)
- Database Schema: `/shared/schema.ts` (lines 1014-1038)
- UI Page: `/client/src/pages/workspace-members.tsx`
- Switcher: `/client/src/components/workspace-switcher.tsx`

**API Endpoints:**
- GET `/api/workspace/members` - List members
- PATCH `/api/workspace/members/:id` - Update role
- DELETE `/api/workspace/members/:id` - Remove member
- POST `/api/workspace/invitations/create` - Generate invite
- GET `/api/workspace/invitations` - List invites
- POST `/api/workspace/invitations/accept` - Accept invite
- DELETE `/api/workspace/invitations/:id` - Revoke invite
- GET `/api/user/workspaces` - List user workspaces

---

## ✅ FINAL CHECKLIST

Before marking Step 29 complete:

- [ ] All files committed to git
- [ ] Database migration applied successfully
- [ ] TypeScript compilation passes
- [ ] Build completes without errors
- [ ] Dev server starts without errors
- [ ] Team management page loads at `/admin/workspace/members`
- [ ] Invitation creation works
- [ ] Invitation acceptance works
- [ ] Role updates work
- [ ] Member removal works
- [ ] Last owner protection works
- [ ] Workspace switcher appears for multi-workspace users
- [ ] Changes pushed to branch `claude/org-membership-switcher-9vNJe`

---

**🎉 Ready to Deploy!**

If all checks pass, your Step 29 implementation is production-ready.
