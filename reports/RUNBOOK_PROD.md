# Treasure Coast AI - Production Runbook

**Generated:** December 15, 2025  
**Version:** 1.0

---

## 1. Pre-Deployment Checklist

### Environment Variables
Ensure all required variables are set (see `env.example`):

```bash
# Required
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
SESSION_SECRET=<random-32-char-string>
WIDGET_SECRET=<random-32-char-string>

# Security (recommended for production)
NODE_ENV=production
WIDGET_ALLOWED_ORIGINS=https://client1.com,https://client2.com
SESSION_IDLE_TIMEOUT_MINUTES=30
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCKOUT_MINUTES=15
```

### Pre-Deploy Gates
Run these before deploying:

```bash
# Run all checks
./scripts/run-all-checks.sh

# Individual checks
./scripts/secrets-scan.sh
./scripts/guard-no-payments.sh
./scripts/predeploy-gate.sh
npx tsc --noEmit
npx vitest run
```

---

## 2. Deployment Steps

### Build
```bash
npm run build
```

### Start Production Server
```bash
npm run start
# or
node dist/index.js
```

### Health Check
```bash
curl https://your-domain.com/api/health
# Expected: { "status": "ok", "timestamp": "..." }
```

---

## 3. Common Operations

### Seed Templates (First Deployment)
```bash
npx tsx scripts/seed-bot-templates.ts
```

### Validate Templates
```bash
npx tsx scripts/validate-db-templates.ts
```

### Reset Password (Super Admin)
Use the admin dashboard or directly via API with proper authentication.

### Clear Bot Config Cache
The cache auto-invalidates on bot updates. For manual invalidation:
```javascript
// In code: configCache.invalidateBotConfig(botId)
```

---

## 4. Monitoring

### Logs
- Structured JSON logs in `/logs/` directory
- Audit logs for security events
- Conversation logs with session tracking

### Key Metrics to Monitor
1. **API response times** - /api/chat should respond < 5s
2. **Error rates** - Watch for 4xx/5xx spikes
3. **OpenAI API failures** - Check failsafe persistence kicks in
4. **Rate limit hits** - Indicates potential abuse

### Health Endpoints
- `GET /api/health` - Basic health check
- `GET /api/admin/diagnostics` (authenticated) - Detailed diagnostics

---

## 5. Troubleshooting

### Widget Not Loading
1. Check CORS: Is origin in `WIDGET_ALLOWED_ORIGINS`?
2. Check CSP: Is widget domain allowed?
3. Verify bot is active and client exists

### AI Not Responding
1. Check `OPENAI_API_KEY` is valid
2. Check rate limits on OpenAI account
3. Failsafe should still capture lead/contact info

### Login Issues
1. Check if account is locked (LOGIN_LOCKOUT_MINUTES)
2. Verify password meets policy
3. Check session store (DATABASE_URL for PG session store)

### Template/Provisioning Failures
```bash
# Validate templates
npx tsx scripts/validate-db-templates.ts

# Re-seed if needed
npx tsx scripts/seed-bot-templates.ts
```

---

## 6. Security Incident Response

### Suspected Data Breach
1. Rotate all secrets immediately
2. Review audit logs
3. Invalidate all sessions
4. Contact affected clients

### Suspected SSRF Attack
1. Check URL validator logs
2. Review blocked requests
3. Add suspicious domains to blocklist

### High Error Rates
1. Check OpenAI API status
2. Review database connectivity
3. Check for rate limiting
4. Scale resources if needed

---

## 7. Backup & Recovery

### Database
- Neon provides automatic backups
- Point-in-time recovery available

### Configuration
- Bot configs stored in database
- Templates in code (industryTemplates.ts)
- Can re-seed templates at any time

---

## 8. Contacts

### Technical Support
- Review logs first
- Check this runbook
- Escalate to development team

### Emergency Procedures
1. Kill switch: Disable problematic bot via admin dashboard
2. Full shutdown: Stop Node.js process
3. Rollback: Use Replit checkpoints or Neon point-in-time recovery
