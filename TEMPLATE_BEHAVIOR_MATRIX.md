# Template Behavior Matrix - Treasure Coast AI

**Generated:** December 14, 2025

## Overview

Each industry template defines default booking behavior, CTAs, and failsafe rules.

---

## Industry Templates

| Industry | Default Booking Mode | Primary CTA | Failsafe Pivot | Pivot Label |
|----------|---------------------|-------------|----------------|-------------|
| Sober Living | internal | Request Tour | request_callback | Request Callback |
| Restaurant | internal | Make Reservation | request_callback | Request Callback |
| Barber/Salon | external | Book Appointment | request_appointment | Request Appointment |
| Gym/Fitness | external | Book Class | request_callback | Request Callback |
| Auto Shop | internal | Schedule Service | request_callback | Request Callback |
| Home Services | internal | Request Quote | request_callback | Request Callback |
| Tattoo Studio | external | Book Consultation | request_callback | Request Callback |
| Real Estate | internal | Schedule Viewing | request_callback | Request Callback |
| Med Spa | external | Book Treatment | request_appointment | Request Appointment |
| Pet Grooming | external | Book Grooming | request_appointment | Request Appointment |

---

## Booking Mode Definitions

### External Mode
- **Behavior:** Redirect user to client's external booking/payment URL
- **URL Requirement:** Must be HTTPS only
- **Validation:** Blocks javascript:, data:, file:, http: schemes
- **Payment:** NEVER processes on our platform (redirect-only)

### Internal Mode
- **Behavior:** Create appointment request in our database
- **Notification:** Email/SMS to business owner (if configured)
- **Required Fields:** Name, contact info (email or phone), service type
- **Payment:** NONE - just captures lead/appointment request

---

## Failsafe Pivot Rules

When the default booking mode cannot complete (e.g., missing external URL), the system pivots to a fallback:

| Scenario | Default Mode | Pivot To | Action |
|----------|-------------|----------|--------|
| No external URL configured | external | internal | Create appointment request |
| External URL blocked | external | internal | Create appointment request |
| User prefers callback | any | internal | Create callback request |
| Crisis keywords detected | any | internal | Flag for human review + save contact |

---

## CTA Appointment Types

Each CTA maps to a specific appointment type for proper categorization:

| Industry | CTA | Appointment Type |
|----------|-----|------------------|
| Sober Living | Request Tour | tour |
| Restaurant | Make Reservation | reservation |
| Barber/Salon | Book Appointment | appointment |
| Gym/Fitness | Book Class | class |
| Auto Shop | Schedule Service | service |
| Home Services | Request Quote | quote |
| Tattoo Studio | Book Consultation | consultation |
| Real Estate | Schedule Viewing | viewing |
| Med Spa | Book Treatment | treatment |
| Pet Grooming | Book Grooming | grooming |

---

## Validation Rules

### External URL Validation
```
ALLOWED: https://booking.example.com
BLOCKED: http://booking.example.com (not HTTPS)
BLOCKED: javascript:alert(1)
BLOCKED: data:text/html,...
BLOCKED: file:///etc/passwd
BLOCKED: vbscript:...
BLOCKED: about:blank
```

### Required Fields for Internal Appointments
- `name` (string, required)
- `email` OR `phone` (at least one required)
- `serviceType` (string, required)
- `preferredDate` (optional)
- `preferredTime` (optional)
- `notes` (optional)

---

## No-Payments Rule

**CRITICAL:** This platform operates under Option A (Zero Stripe).

- External booking mode redirects to client's payment provider
- We NEVER collect, process, or store payment information
- All billing endpoints return 501 or are removed
- guard-no-payments.sh enforces this at CI/CD level
