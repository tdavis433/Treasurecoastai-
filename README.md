# Treasure Coast AI - Multi-Tenant Chatbot Platform

A production-grade multi-tenant SaaS platform for AI-powered chatbots, featuring workspace management, analytics, lead tracking, and customizable widget deployment.

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- OpenAI API key

### Environment Setup

1. Copy the environment example:
   ```bash
   cp .env.example .env
   ```

2. Configure required environment variables:
   ```
   DATABASE_URL=postgresql://...
   OPENAI_API_KEY=sk-...
   DEFAULT_ADMIN_PASSWORD=your-secure-password
   WIDGET_TOKEN_SECRET=your-secret-key
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Push database schema:
   ```bash
   npm run db:push
   ```

5. Seed demo data (optional):
   ```bash
   npx tsx scripts/seed-demo-data.ts
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`.

## Architecture

### Multi-Tenant Structure

```
Platform
├── Workspaces (tenants)
│   ├── Users (workspace_memberships)
│   └── Bots
│       ├── Bot Settings
│       ├── Widget Settings
│       ├── Automations
│       └── Analytics/Leads/Sessions
```

### Key Components

- **Super Admin Control Center** (`/super-admin`): Platform-wide management
- **Client Dashboard** (`/client/dashboard`): Tenant-specific bot management
- **Widget Embed**: Deployable chat widget for customer websites

### API Structure

| Route | Purpose |
|-------|---------|
| `/api/chat/:clientId/:botId` | Chat endpoint for widgets |
| `/api/client/*` | Client dashboard APIs |
| `/api/super-admin/*` | Super admin APIs |
| `/api/templates` | Bot template lookup |
| `/widget/:token` | Widget configuration |

## Features

### Core Features
- AI-powered conversational agents using OpenAI
- Multi-tenant workspace isolation
- 10 industry-specific bot templates
- Customizable widget themes (light/dark/auto)
- Lead capture and management
- Conversation inbox with notes
- Analytics with CSV export

### Security
- bcrypt password hashing
- Strong password requirements (8+ chars, mixed case, numbers, special)
- HMAC-signed widget tokens
- Rate limiting on auth and chat endpoints
- Cross-tenant access validation
- Helmet.js security headers

### Automation
- Keyword-triggered responses
- Inactivity handlers
- Message count triggers
- Lead capture automation
- Scheduled messages

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `workspaces` | Tenant organizations |
| `workspace_memberships` | User-workspace associations |
| `admin_users` | Platform users |
| `bots` | Bot configurations |
| `bot_settings` | Extended bot settings |
| `bot_templates` | Industry templates |
| `widget_settings` | Widget customization |
| `automation_workflows` | Automation rules |
| `chat_sessions` | Conversation sessions |
| `leads` | Captured leads |
| `conversation_analytics` | Usage metrics |

## Testing

Run the test suite:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

Current test coverage:
- Unit tests for planLimits, automations, conversationLogger
- 48+ passing tests

## Development

### File Structure

```
├── client/                 # React frontend
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route pages
│       └── lib/            # Utilities
├── server/                 # Express backend
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   ├── automations.ts      # Automation engine
│   └── env.ts              # Environment validation
├── shared/
│   └── schema.ts           # Drizzle schema + Zod types
└── scripts/
    └── seed-demo-data.ts   # Demo data seeder
```

### Adding New Bot Templates

1. Add template to `scripts/seed-demo-data.ts`
2. Run `npx tsx scripts/seed-demo-data.ts`
3. Template will be available in the bot wizard

### Creating New API Routes

1. Add route handler in `server/routes.ts`
2. Use storage interface for database operations
3. Add Zod validation for request bodies
4. Include proper error handling

## License

Proprietary - Treasure Coast AI
