# Zero Payments Compliance (Option A)

## Status: COMPLIANT

Last verified: December 14, 2025

## Overview

Treasure Coast AI operates under **Option A: Zero Stripe** policy. This means:

- **NO payment processing** is built into the platform
- **NO billing functionality** exists in the codebase
- **Bookings redirect** to external provider URLs only
- **Plan limits** are for feature gating, not billing

## What Was Removed

### Server-Side
- `server/stripeClient.ts` - Stripe SDK initialization
- `server/stripeService.ts` - Payment processing logic
- `server/webhookHandlers.ts` - Webhook event handlers
- All `/api/stripe/*` routes
- All `/api/billing/*` routes
- Stripe CSP headers
- Stripe webhook rate limiters
- Stripe CSRF exceptions

### Client-Side
- Billing navigation in super-admin dashboard
- Billing panel/tab in super-admin dashboard
- Stripe integration card in integrations section
- STRIPE_SECRET_KEY environment variable display
- Stripe webhook endpoint display

### Dependencies
- `stripe` npm package uninstalled

## Guard Script

The `scripts/guard-no-payments.sh` script enforces zero-Stripe compliance by scanning for:

### Detected Patterns
- Stripe SDK imports: `from "stripe"`, `require("stripe")`
- Stripe client instantiation: `new Stripe(`
- Stripe API calls: `stripe.customers.`, `stripe.paymentIntents.`, etc.
- Stripe webhook patterns: `stripe-signature`, `/api/stripe/`
- Legacy service helpers: `stripeClient`, `stripeService`, `createCheckoutSession`

### Excluded Files (Security Filters)
These files legitimately mention "stripe" for security purposes:
- `server/auditLogger.ts` - Sanitizes sensitive data including payment-related keywords
- `server/urlValidator.ts` - Blocks payment-related URLs for security

## Running the Guard

```bash
bash ./scripts/guard-no-payments.sh
```

Exit code 0 = PASS (no Stripe code detected)
Exit code 1 = FAIL (Stripe code detected)

## Database Schema

The `workspaces` table retains empty columns for potential future use:
- `stripe_customer_id` (nullable, unused)
- `stripe_subscription_id` (nullable, unused)

These columns are NOT populated or queried by any code path.

## Future Development

If payment processing is ever needed:
1. Create new Stripe service files
2. Add billing routes
3. Update guard script to Option B (allow payments)
4. Re-implement billing UI
5. Update this compliance document
