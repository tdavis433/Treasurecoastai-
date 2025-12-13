# REPO_MAP.md - Treasure Coast AI Platform

## Overview
Agency-first AI assistant platform for local businesses. Features include 24/7 AI chatbots for lead capture, appointment booking, and FAQ handling.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | Express.js, Node.js 20.x |
| **Database** | PostgreSQL (Neon), Drizzle ORM |
| **AI Engine** | OpenAI GPT-4 |
| **Payments** | Stripe (redirect-only) |
| **Auth** | Express Session, bcrypt, passport-local |
| **Build** | Vite, esbuild |

---

## Directory Structure

```
treasure-coast-ai/
├── client/src/           # Frontend React application
│   ├── components/       # UI components (shadcn/ui, demo configs)
│   ├── contexts/         # React contexts (admin state)
│   ├── hooks/            # Custom hooks (chat, toast, mobile)
│   ├── lib/              # Utilities (queryClient, chatClient)
│   ├── pages/            # Route pages
│   └── App.tsx           # Main app with routing
├── server/               # Backend Express server
│   ├── routes.ts         # All API endpoints (193 routes)
│   ├── storage.ts        # Database layer (Drizzle ORM)
│   ├── orchestrator.ts   # AI conversation engine
│   ├── botConfig.ts      # Bot configuration management
│   ├── emailService.ts   # Email notifications
│   ├── stripeClient.ts   # Stripe integration
│   └── app.ts            # Express app setup
├── shared/               # Shared types
│   └── schema.ts         # Database schema (Drizzle)
├── migrations/           # Database migrations
├── bots/                 # Bot configuration files
├── docs/                 # Documentation
└── tests/                # Test files
```

---

## Public Routes (Landing/Demo)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | home.tsx | Landing page |
| `/demos` | demos.tsx | Demo bot gallery |
| `/demo/:slug` | demo-*.tsx | Individual demo pages |
| `/login` | login.tsx | Authentication |
| `/signup` | signup.tsx | Registration |
| `/forgot-password` | forgot-password.tsx | Password reset request |
| `/reset-password/:token` | reset-password.tsx | Password reset form |

---

## Client Dashboard Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/client` | client-dashboard.tsx | Main dashboard |
| `/client/leads` | (within dashboard) | Lead management |
| `/client/conversations` | (within dashboard) | Chat inbox |
| `/client/bookings` | (within dashboard) | Booking management |
| `/client/analytics` | (within dashboard) | Analytics overview |
| `/change-password` | change-password.tsx | Password change |

---

## Admin/Super-Admin Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | admin.tsx | Admin layout |
| `/admin/dashboard` | admin-dashboard.tsx | Overview metrics |
| `/admin/analytics` | admin-analytics.tsx | Platform analytics |
| `/admin/appointments` | admin-appointments.tsx | Appointment management |
| `/super-admin` | super-admin.tsx | Super admin panel |
| `/bot/:id` | bot-dashboard.tsx | Bot configuration |
| `/bot/:id/automations` | automations.tsx | Automation workflows |
| `/bot/:id/widget` | widget-settings.tsx | Widget customization |
| `/inbox` | inbox.tsx | Conversation inbox |
| `/leads` | leads.tsx | Lead management |

---

## API Endpoints (193 Total)

### Authentication (`/api/auth/*`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | User login |
| POST | `/api/auth/logout` | Any | Logout |
| GET | `/api/auth/check` | Any | Session check |
| GET | `/api/auth/me` | Auth | Current user info |
| POST | `/api/auth/signup` | Public | Registration |
| POST | `/api/auth/change-password` | Auth | Change password |
| POST | `/api/auth/forgot-password` | Public | Request reset |
| POST | `/api/auth/reset-password` | Public | Complete reset |

### Chat & Widget (`/api/chat/*`, `/api/widget/*`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/chat` | Public | Send chat message |
| POST | `/api/chat/:clientId/:botId` | Widget | Bot-specific chat |
| POST | `/api/chat/:clientId/:botId/stream` | Widget | Streaming chat |
| GET | `/api/widget/config/:clientId/:botId` | Widget | Widget config |
| GET | `/api/widget/full-config/:clientId/:botId` | Widget | Full config |

### Demos (`/api/demo/*`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/demos` | Public | List demos |
| GET | `/api/demo/:botIdOrSlug` | Public | Get demo config |

### Client API (`/api/client/*`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/client/me` | Client | Client info |
| GET | `/api/client/stats` | Client | Dashboard stats |
| GET | `/api/client/conversations` | Client | Conversation list |
| GET | `/api/client/leads` | Client | Lead list |
| GET | `/api/client/bookings` | Client | Booking list |
| GET | `/api/client/analytics/*` | Client | Analytics data |
| POST | `/api/client/billing/portal` | Client | Stripe portal redirect |

### Super Admin API (`/api/super-admin/*`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/super-admin/clients` | SuperAdmin | List clients |
| POST | `/api/super-admin/new-client` | SuperAdmin | Create client |
| GET | `/api/super-admin/bots` | SuperAdmin | List bots |
| POST | `/api/super-admin/bots` | SuperAdmin | Create bot |
| GET | `/api/super-admin/workspaces` | SuperAdmin | List workspaces |
| GET | `/api/super-admin/analytics/overview` | SuperAdmin | Platform metrics |
| GET | `/api/super-admin/system/status` | SuperAdmin | System health |

### Appointments & Bookings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/appointment` | Public | Create appointment |
| GET | `/api/appointments` | Auth | List appointments |
| POST | `/api/bookings/link-click` | Public | Track redirect |

### Stripe (Redirect-Only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/stripe/publishable-key` | Public | Get Stripe key |
| GET | `/api/stripe/products` | Public | List products |
| POST | `/api/stripe/checkout` | SuperAdmin | Create checkout session |
| POST | `/api/stripe/portal` | SuperAdmin | Create portal session |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Express session secret |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Alt | Alternative OpenAI key |
| `NODE_ENV` | No | Environment (development/production) |
| `PORT` | No | Server port (default: 5000) |
| `SMTP_HOST` | No | Email server host |
| `SMTP_PORT` | No | Email server port |
| `SMTP_USER` | No | Email username |
| `SMTP_PASS` | No | Email password |
| `EMAIL_FROM` | No | Sender email address |
| `DEFAULT_ADMIN_PASSWORD` | No | Initial admin password |
| `WIDGET_TOKEN_SECRET` | No | Widget HMAC secret |
| `WIDGET_ALLOWED_ORIGINS` | No | CORS allowed origins |
| `LOGIN_MAX_ATTEMPTS` | No | Login lockout threshold |
| `LOGIN_LOCKOUT_MINUTES` | No | Lockout duration |
| `REPLIT_DOMAINS` | No | Replit domain names |
| `REPLIT_DEPLOYMENT` | No | Deployment flag |

---

## Bot/Assistant Architecture

### Configuration Storage
- `bots/` - JSON configuration files
- `botConfigs` table - Database storage
- `configCache.ts` - In-memory caching

### AI Components
- **Orchestrator** (`orchestrator.ts`) - Central conversation engine
- **Context Builder** - Dynamic prompt construction
- **Intent Detection** - Lead/booking recognition
- **Safety Layer** - Content filtering

### Widget System
- Themeable glassmorphism design
- CSS variable-based theming
- Business-type specific icons
- Mobile responsive

---

## Analytics & Events

### Tracked Events
- Chat session starts/ends
- Message sends/receives
- Lead captures
- Booking intents
- Widget interactions
- Redirect clicks

### Storage
- `chatSessions` table
- `chatMessages` table
- `leads` table
- `bookings` table
- `widgetEvents` table

---

## Security Features

- Rate limiting (express-rate-limit)
- HMAC-signed widget tokens
- Domain validation
- Helmet security headers
- bcrypt password hashing
- Secure session cookies
- CORS restrictions
- Account lockout policy

---

*Generated: December 13, 2025*
