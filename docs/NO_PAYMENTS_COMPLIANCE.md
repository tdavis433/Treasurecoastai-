# NO_PAYMENTS_COMPLIANCE.md - Treasure Coast AI Platform

## Summary

**COMPLIANCE STATUS: ✅ COMPLIANT**

The Treasure Coast AI platform does NOT collect, store, transmit, or process payment details directly. All payment flows use external redirects to third-party payment processors.

---

## Payment Architecture Overview

### 1. Stripe Integration (Agency Billing)

The platform uses Stripe for agency subscription billing, implemented as **redirect-only**:

| Component | Implementation | Compliant |
|-----------|----------------|-----------|
| Checkout | Stripe Hosted Checkout (stripe.com) | ✅ |
| Card Collection | Stripe's PCI-compliant forms | ✅ |
| Billing Portal | Stripe Customer Portal (stripe.com) | ✅ |
| Webhooks | Status updates only, no payment data | ✅ |

**Code Evidence:**

```typescript
// server/stripeService.ts:15-33
async createCheckoutSession(...) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,  // Redirect back after completion
    cancel_url: cancelUrl,
    ...
  });
}
```

The `session.url` returned is a Stripe-hosted URL (e.g., `checkout.stripe.com/...`). Users are redirected to Stripe to enter payment details. The platform never sees or stores card data.

**API Endpoints:**

| Endpoint | Purpose | Access |
|----------|---------|--------|
| `POST /api/stripe/checkout` | Create checkout session URL | SuperAdmin |
| `POST /api/stripe/portal` | Create billing portal URL | SuperAdmin |
| `GET /api/stripe/products` | List available plans | Public |

All endpoints return URLs for external redirect - no payment processing occurs on platform servers.

---

### 2. Booking System (Client End-Users)

The platform implements booking as **intent logging + external redirect**:

| Component | Implementation | Compliant |
|-----------|----------------|-----------|
| Booking Intent | Logged internally for analytics | ✅ |
| "Book Now" Button | Redirects to `externalBookingUrl` | ✅ |
| Payment Collection | Client's external system | ✅ |
| Click Tracking | Logged via `/api/bookings/link-click` | ✅ |

**Code Evidence:**

```typescript
// server/routes.ts:7270-7296
app.post("/api/bookings/link-click", async (req, res) => {
  const { clientId, botId, sessionId, leadId, bookingUrl } = req.body;
  
  // Log the click event (analytics only)
  await storage.logBookingLinkClickEvent({
    clientId, botId, sessionId, leadId, bookingUrl
  });
  
  // Update lead status to 'redirected'
  if (leadId) {
    await storage.updateLead(leadId, {
      bookingStatus: 'redirected',
      bookingUrlUsed: bookingUrl  // External URL, not our domain
    });
  }
  
  res.json({ success: true });
});
```

**Configuration:**

- `externalBookingUrl` - Configured per-client in settings
- Points to external booking systems (Calendly, Acuity, Square, etc.)
- Widget displays booking URL provided by client

**Flow:**
1. AI detects booking intent during conversation
2. AI provides booking button/link with `externalBookingUrl`
3. User clicks → Platform logs click for analytics
4. User redirected to client's external booking/payment system
5. All payment processing happens externally

---

## What is NOT Present

The following payment-related elements are NOT implemented:

| Element | Status |
|---------|--------|
| Card input fields | ❌ Not present |
| ACH/bank account collection | ❌ Not present |
| Wallet integration (Apple Pay, Google Pay) | ❌ Not present |
| Payment form on platform domain | ❌ Not present |
| PCI-DSS scope requirements | ❌ Not applicable |
| Stored payment methods | ❌ Not present |
| Refund processing UI | ❌ Not present |
| Chargeback handling | ❌ Not present |

---

## Files Reviewed

| File | Contains Payment Code | Type |
|------|----------------------|------|
| `server/stripeService.ts` | Yes | Stripe API client (redirect-only) |
| `server/stripeClient.ts` | Yes | Stripe SDK initialization |
| `server/routes.ts` | Yes | Checkout/portal session endpoints |
| `server/webhookHandlers.ts` | Yes | Webhook status updates (no payment data) |
| `server/storage.ts` | Yes | Booking click logging |
| `client/src/*` | No | No payment forms |

---

## Webhook Safety

The platform receives Stripe webhooks for status updates only:

| Event | Handling |
|-------|----------|
| `checkout.session.completed` | Activate client service |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Pause client service |
| `invoice.payment_succeeded` | Log for analytics |
| `invoice.payment_failed` | Log failed payment |

**No payment data (card numbers, CVV, etc.) is ever received or stored.**

---

## Booking Redirect Proof

Location: `server/routes.ts:7270-7296`

```typescript
app.post("/api/bookings/link-click", async (req, res) => {
  // 1. Extract redirect URL from request
  const { bookingUrl } = req.body;
  
  // 2. Log click event (analytics)
  await storage.logBookingLinkClickEvent({ ... bookingUrl });
  
  // 3. Response confirms logging only
  res.json({ success: true });
  
  // NOTE: Actual redirect happens client-side via widget
  // Platform only logs intent - no payment processing
});
```

---

## Conclusion

**The platform is COMPLIANT with the no-payment-processing requirement.**

- ✅ Stripe integration uses hosted checkout (redirect to stripe.com)
- ✅ Booking uses external URLs (redirect to client's system)
- ✅ No card/payment data collected or stored
- ✅ No payment forms on platform domain
- ✅ Webhooks receive status updates only

---

*Verified: December 13, 2025*
