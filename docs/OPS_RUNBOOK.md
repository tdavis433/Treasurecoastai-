# Operations Runbook - Treasure Coast AI

## Overview

This runbook provides standard operating procedures for backup, restore, disaster recovery, and database migration operations for the Treasure Coast AI platform.

## Table of Contents

1. [Backup Procedures](#backup-procedures)
2. [Restore Procedures](#restore-procedures)
3. [Database Migration Safety](#database-migration-safety)
4. [Disaster Recovery](#disaster-recovery)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Incident Response](#incident-response)

---

## Backup Procedures

### Automated Database Backups

The Neon PostgreSQL database includes automated point-in-time recovery (PITR) with the following characteristics:

- **Retention Period**: 7 days (configurable in Neon console)
- **Granularity**: Point-in-time recovery to any second within the retention window
- **Location**: Neon's managed infrastructure

### Manual Backup Export

For critical data export before major changes:

```bash
# Export full database (requires DATABASE_URL)
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# Export specific tables (leads, appointments, conversations)
pg_dump "$DATABASE_URL" -t leads -t appointments -t conversations > pii_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Application State Backup

```bash
# Backup configuration files
tar -czvf config_backup_$(date +%Y%m%d).tar.gz \
  .env \
  drizzle.config.ts \
  shared/schema.ts
```

### Pre-Deployment Checklist

Before any production deployment:

1. [ ] Run `npm run db:push --dry-run` to preview schema changes
2. [ ] Run `scripts/predeploy-gate.sh` safety checks
3. [ ] Create database backup (if destructive changes)
4. [ ] Document rollback procedure
5. [ ] Notify stakeholders of maintenance window

---

## Restore Procedures

### Point-in-Time Recovery (Neon)

1. Access Neon Console: https://console.neon.tech
2. Navigate to project > Branches
3. Select "Restore" option
4. Choose timestamp for recovery
5. Confirm restore operation

### Manual Database Restore

```bash
# Restore from SQL backup
psql "$DATABASE_URL" < backup_YYYYMMDD_HHMMSS.sql

# Restore specific tables only
psql "$DATABASE_URL" < pii_backup_YYYYMMDD_HHMMSS.sql
```

### Application Rollback

1. **Replit Checkpoints**: Use Replit's built-in checkpoint system to rollback code
2. **Database Rollback**: Restore from Neon PITR or manual backup
3. **Verify Services**: Restart workflows and verify health endpoints

### Data Recovery Verification

After any restore operation:

```sql
-- Verify record counts
SELECT 'leads' as table_name, COUNT(*) as count FROM leads
UNION ALL SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL SELECT 'bots', COUNT(*) FROM bots
UNION ALL SELECT 'workspaces', COUNT(*) FROM workspaces;
```

---

## Database Migration Safety

### Pre-Migration Checks

Run the migration safety gate before any schema changes:

```bash
./scripts/migration-safety-gate.sh
```

### Safe Migration Workflow

1. **Review Changes**
   ```bash
   npm run db:push --dry-run
   ```

2. **Backup Current State**
   ```bash
   pg_dump "$DATABASE_URL" > pre_migration_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Apply Changes**
   ```bash
   npm run db:push
   ```

4. **Verify Migration**
   ```bash
   npm run db:check
   ```

### Dangerous Operations Requiring Manual Approval

The following operations require explicit approval:

- ❌ Dropping tables or columns
- ❌ Changing primary key types
- ❌ Renaming tables with data
- ❌ Altering column types that may lose data
- ❌ Removing foreign key constraints

### Migration Rollback

If a migration fails:

1. Stop all workflows
2. Restore from pre-migration backup
3. Revert schema changes in code
4. Restart workflows
5. Document incident

---

## Disaster Recovery

### Recovery Time Objective (RTO)

- **Target**: 1 hour for full service restoration
- **Database**: 30 minutes (Neon PITR)
- **Application**: 15 minutes (Replit redeploy)
- **Verification**: 15 minutes

### Recovery Point Objective (RPO)

- **Database**: Near-zero (Neon continuous backup)
- **Files**: Last Replit checkpoint

### DR Procedure

1. **Assess Impact**
   - Identify affected services
   - Determine data loss window
   - Notify stakeholders

2. **Initiate Recovery**
   ```bash
   # Check service status
   curl -s https://your-app.replit.app/api/health
   
   # If database issue, initiate Neon restore
   # Access Neon Console for PITR
   ```

3. **Verify Recovery**
   - Health check endpoints
   - Sample data verification
   - User authentication test

4. **Post-Incident**
   - Document timeline
   - Root cause analysis
   - Update runbook if needed

---

## Monitoring & Alerts

### Health Check Endpoints

```bash
# Application health
GET /api/health

# Database connectivity
GET /api/super-admin/retention/config  # (requires auth)
```

### Log Locations

- **Application Logs**: Replit Console
- **Structured Logs**: `/tmp/logs/` (JSON format)
- **Audit Logs**: Database `system_logs` table

### Key Metrics to Monitor

1. **API Response Times**: Target < 500ms p95
2. **Error Rate**: Target < 1%
3. **Database Connections**: Monitor pool utilization
4. **Session Count**: Active user sessions
5. **Queue Depth**: Notification retry queue

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P1 | Service down, data loss risk | Immediate |
| P2 | Major feature unavailable | 1 hour |
| P3 | Minor feature degraded | 4 hours |
| P4 | Cosmetic/non-urgent | Next business day |

### Escalation Path

1. **On-call Developer**: First response
2. **Technical Lead**: P1/P2 incidents
3. **Platform Admin**: Infrastructure issues

### Incident Template

```markdown
## Incident Report

**Date/Time**: YYYY-MM-DD HH:MM UTC
**Severity**: P1/P2/P3/P4
**Duration**: X hours Y minutes
**Impact**: Description of user impact

### Timeline
- HH:MM - Issue detected
- HH:MM - Initial response
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Service restored

### Root Cause
[Description]

### Resolution
[Steps taken]

### Prevention
[Actions to prevent recurrence]
```

---

## Data Retention & Purge

### Retention Periods

Configure via environment variables:

| Data Type | Env Variable | Default |
|-----------|--------------|---------|
| Leads | RETENTION_LEADS_DAYS | 730 days |
| Appointments | RETENTION_APPOINTMENTS_DAYS | 730 days |
| Chat Sessions | RETENTION_CHAT_SESSIONS_DAYS | 365 days |
| Conversations | RETENTION_CONVERSATIONS_DAYS | 365 days |
| Analytics Events | RETENTION_ANALYTICS_DAYS | 180 days |
| Notification Logs | RETENTION_NOTIFICATION_LOGS_DAYS | 90 days |
| Session States | RETENTION_SESSION_STATES_DAYS | 30 days |

### Manual Purge

```bash
# Via API (Super Admin only)
POST /api/super-admin/retention/purge
Authorization: [session cookie]
Content-Type: application/json

{
  "chatSessionsDays": 365,
  "leadsDays": 730,
  "conversationsDays": 365
}
```

### GDPR Data Export

```bash
# Client can request data export
GET /api/client/data/export
Authorization: [client session cookie]
```

---

## Contact Information

- **Platform Issues**: Replit Support
- **Database Issues**: Neon Support
- **Application Support**: [Internal Team Contact]

---

## Agency Onboarding Console

### Overview

The Agency Onboarding Console (`/super-admin/agency-onboarding`) provides a streamlined, done-for-you client setup workflow. It enables agencies to configure new client workspaces and AI assistants in minutes.

### Access

- **Route**: `/super-admin/agency-onboarding`
- **Required Role**: Super Admin

### Workflow Stages

1. **Client Intake**: Collect business information, select industry template
2. **Website Scanning**: AI-powered extraction of business data from client website
3. **KB Draft Review**: Edit services, FAQs, policies, and business hours
4. **CTA Configuration**: Configure primary/secondary CTAs and booking flow
5. **Notifications**: Set up lead notification email delivery
6. **Widget Preview**: Review widget appearance before deployment
7. **QA Gate**: Automated validation before going live
8. **Go Live**: Activate the bot and generate embed code

### Industry Templates

15 pre-configured templates available:
- Automotive, Barbershop, Childcare, Dental, Fitness
- Handyman, Hotel, Law Firm, Med Spa, Real Estate
- Recovery House, Restaurant, Roofing, Tattoo, Wedding

Each template includes:
- Booking profile (internal/external mode)
- Primary and secondary CTAs
- Default services and FAQs
- Industry-appropriate disclaimer
- Theme colors and welcome messages

### Booking Flow Failsafe

**NON-NEGOTIABLE Rules:**
- External booking is redirect-only (HTTPS required)
- Internal booking is request-capture only (no payments ever)
- Failsafe: If external URL missing/invalid → automatically uses internal request_callback

### QA Gate Checks

Before going live, the QA Gate validates:
- Business name and contact info present
- At least one service defined
- Valid booking configuration
- Notification recipient configured (if enabled)
- Widget theme configured

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agency-onboarding/templates` | GET | List industry templates |
| `/api/agency-onboarding/generate-draft-setup` | POST | Create draft workspace/bot |
| `/api/agency-onboarding/run-qa-gate` | POST | Validate draft configuration |
| `/api/agency-onboarding/go-live` | POST | Activate bot, generate embed code |

### Troubleshooting

**Issue**: Website scan returns no data
- Verify URL is publicly accessible
- Check if site uses heavy JavaScript (may require additional parsing)
- Manual entry is always available as fallback

**Issue**: QA Gate fails
- Review all required fields in the intake form
- Ensure at least one contact method (phone or email)
- Verify booking URL is HTTPS if using external mode

**Issue**: Go Live fails
- Ensure QA Gate has passed
- Check for any pending draft validation errors
- Verify workspace and bot IDs exist

---

*Last Updated: December 2025*
*Version: 1.1*
