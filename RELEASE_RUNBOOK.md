# Treasure Coast AI - Release Runbook

**Version:** 1.0  
**Last Updated:** December 13, 2025

---

## Pre-Release Checklist

### 1. Environment Configuration

```bash
# Required Environment Variables
DATABASE_URL=            # PostgreSQL connection string (Neon)
OPENAI_API_KEY=          # OpenAI API key for GPT-4
DEFAULT_ADMIN_PASSWORD=  # Super admin initial password
WIDGET_TOKEN_SECRET=     # Secret for signing widget tokens

# Optional Environment Variables
SMTP_HOST=               # Email server host
SMTP_USER=               # Email server username
SMTP_PASS=               # Email server password
STRIPE_SECRET_KEY=       # Stripe secret (if payments enabled)
```

### 2. Database Setup

```bash
# Sync schema with database
npm run db:push

# If conflicts occur, use force sync
npm run db:push --force
```

### 3. Build Verification

```bash
# TypeScript compilation check
npx tsc --noEmit

# Expected: 0 errors
```

---

## Deployment Steps

### Step 1: Pre-Deployment Verification

1. [ ] All environment variables configured
2. [ ] Database connection verified
3. [ ] TypeScript builds without errors
4. [ ] E2E tests passing (see TEST_REPORT.md)

### Step 2: Deploy Application

1. Click "Deploy" / "Publish" in Replit
2. Wait for deployment to complete
3. Verify deployment URL is accessible

### Step 3: Post-Deployment Verification

1. [ ] Login page loads at /login
2. [ ] Admin login works (admin / [configured password])
3. [ ] Client login works (demo_faith_house / demo123)
4. [ ] Chat widget loads on demo page

---

## Default Accounts

| Account Type | Username | Default Password | Notes |
|--------------|----------|------------------|-------|
| Super Admin | admin | Set via DEFAULT_ADMIN_PASSWORD | Full platform access |
| Demo Client | demo_faith_house | demo123 | View-only analytics |

---

## Critical Paths to Verify

### 1. Authentication Flow
- Navigate to /login
- Login with admin credentials
- Verify dashboard loads
- Verify logout works

### 2. Client Dashboard
- Login as demo_faith_house
- Verify analytics visible
- Verify conversations accessible
- Verify leads/bookings visible

### 3. Widget Integration
- Generate widget embed code from admin
- Embed on test page
- Verify chat widget loads
- Test basic conversation

---

## Rollback Procedure

### Option 1: Replit Checkpoint
1. Go to "Version Control" in Replit
2. Select previous working checkpoint
3. Click "Restore"

### Option 2: Git Rollback
```bash
# View recent commits
git log --oneline -10

# Revert to specific commit
git checkout [commit-hash]
```

---

## Troubleshooting

### Issue: Login not working
1. Check DEFAULT_ADMIN_PASSWORD is set
2. Verify database connection
3. Check server logs for errors

### Issue: Widget not loading
1. Verify WIDGET_TOKEN_SECRET is set
2. Check domain is in allowlist
3. Inspect browser console for errors

### Issue: AI not responding
1. Verify OPENAI_API_KEY is set and valid
2. Check OpenAI API status
3. Review server logs for API errors

### Issue: Database errors
1. Run `npm run db:push --force`
2. Verify DATABASE_URL is correct
3. Check Neon dashboard for issues

---

## Support Contacts

- **Platform Issues:** Check server logs at /tmp/logs/
- **Database Issues:** Neon Dashboard
- **API Issues:** OpenAI Status Page

---

## Release Notes

### Version 1.0 (December 2025)

**Features:**
- Agency-first AI assistant platform
- Multi-tenant client management
- GPT-4 powered conversations
- Lead capture and booking automation
- Customizable chat widgets
- Real-time analytics

**Known Limitations:**
- Stripe payments disabled (requires configuration)
- Email features require SMTP setup
- Widget embedding requires domain configuration

---

*Document generated as part of platform release process.*
