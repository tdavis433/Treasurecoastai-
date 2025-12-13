# Demo Reset Runbook

## Overview

This document describes how to reset and seed demo workspaces in the Treasure Coast AI platform. Demo workspaces are used for sales presentations, training, and showcasing the platform's capabilities.

## Demo Workspaces

The platform includes multiple demo workspaces across different industries:

| Workspace Slug | Business Type | Description |
|----------------|---------------|-------------|
| `faith_house_demo` | Sober Living | Recovery housing facility |
| `demo_new_horizons` | Sober Living | Women's recovery program |
| `demo_paws_suds_grooming_demo` | Pet Services | Dog grooming salon |
| `demo_coastal_breeze` | Restaurant | Seafood restaurant |
| `demo_coastline_auto` | Auto Shop | Automotive repair |
| `demo_fade_factory` | Barber | Barbershop |
| `demo_ink_soul` | Tattoo Studio | Tattoo & piercing |
| `demo_iron_coast_fitness` | Gym | Fitness center |
| `demo_premier_properties` | Real Estate | Property agency |
| `demo_radiance_medspa` | Med Spa | Medical spa services |
| `demo_tc_handyman` | Home Services | Handyman services |
| `demo_harper_law` | Legal | Law firm |
| `demo_coastal_smiles` | Dental | Dental practice |
| `demo_palm_resort` | Hospitality | Resort/hotel |
| `demo_tc_roofing` | Home Services | Roofing contractor |
| `demo_oceanview_gardens` | Landscaping | Garden services |

## Reset Methods

### Method 1: Super Admin Dashboard (Recommended)

1. Log in as super admin (username: `admin`)
2. Navigate to **Super Admin Dashboard**
3. Scroll to the **Demo Workspaces** section
4. For each demo workspace card, click **Reset Demo Data**
5. Confirm the reset when prompted
6. Wait for the success notification

This resets all:
- Conversations/chat sessions
- Leads
- Appointments/bookings
- Analytics data

And re-seeds with fresh, realistic demo data.

### Method 2: API Endpoint

Reset a specific demo workspace via API:

```bash
# Reset a specific demo workspace
curl -X POST https://your-domain/api/super-admin/demo-workspaces/{slug}/reset \
  -H "Cookie: <session-cookie>" \
  -H "Content-Type: application/json"

# Example: Reset Faith House demo
curl -X POST https://your-domain/api/super-admin/demo-workspaces/faith_house_demo/reset \
  -H "Cookie: <session-cookie>"
```

Seed all demo workspaces:

```bash
curl -X POST https://your-domain/api/super-admin/demo-workspaces/seed-all \
  -H "Cookie: <session-cookie>"
```

### Method 3: CLI Script

Run the demo seed script directly:

```bash
# Reset and seed all demo workspaces
npx tsx server/demo-seed.ts

# Reset a specific workspace
npx tsx server/demo-seed.ts --workspace=faith_house_demo

# Seed only (no reset)
npx tsx server/demo-seed.ts --seed-only
```

## What Gets Reset

When a demo workspace is reset:

### Deleted Data
- All leads for the workspace
- All appointments/bookings
- All chat sessions and messages
- All analytics events
- All daily analytics summaries

### Preserved Data
- Bot configuration and settings
- Widget configuration
- Business profile
- FAQs and knowledge base
- User accounts and memberships
- Workspace settings

### Seeded Data
After reset, the following is created:
- 5-15 realistic leads (based on business type)
- 3-8 appointments with various statuses
- Recent chat sessions with sample conversations
- Analytics data for the past 30 days

## Pre-Demo Checklist

Before a sales demo or presentation:

1. **Reset all demo workspaces** - Use "Seed All Demos" button
2. **Verify each demo bot is working**:
   - Open public demo page (`/demo/{slug}`)
   - Send a test message
   - Verify AI responds appropriately
3. **Check client dashboard access**:
   - Log in as demo client user
   - Verify leads and appointments display
4. **Verify widget embed** on demo sites
5. **Run self-check**: Super Admin > System Health > Run Self-Check

## Troubleshooting

### Reset Fails with "Workspace not found"
- Ensure the workspace exists in the database
- Check that `isDemo: true` is set on the workspace
- Verify workspace slug matches exactly

### Reset Fails with "Permission denied"
- Ensure you're logged in as super admin
- Session may have expired - log in again
- Check that workspace is marked as demo

### Seeded data looks wrong
- Check the business configuration in `server/demo-seed.ts`
- Verify the BUSINESS_CONFIGS has the correct business type
- Re-run seed after fixing configuration

### Demo bot not responding
- Check OpenAI API key is configured
- Verify bot is in "active" status
- Check for rate limiting

## Emergency Procedures

### If demo data is corrupted during a live presentation:

1. Open a new browser tab to Super Admin
2. Click "Reset Demo Data" for the affected workspace
3. Wait 10-15 seconds for reset to complete
4. Return to demo and refresh the page

### If all demos are broken:

1. Access Super Admin Dashboard
2. Use "Seed All Demos" button
3. If that fails, SSH to server and run:
   ```bash
   npx tsx server/demo-seed.ts
   ```

## Security Notes

- Demo reset endpoints require super admin authentication
- Demo workspaces are isolated from production data
- Demo bot conversations are not stored long-term
- Demo user passwords should be rotated periodically

## Related Documentation

- [Demo Script](./faith-house-demo-script.md) - Presentation script
- [Tenant Isolation](./TENANT_ISOLATION_PROOF.md) - Data isolation proof
- [System Architecture](../replit.md) - Platform overview
