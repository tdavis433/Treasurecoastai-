# Treasure Coast AI - Premium AI Chatbot Platform

## Overview
Treasure Coast AI is a streamlined, visually stunning AI chatbot platform where the admin (agency) creates world-class GPT-4 powered chatbots for clients. The platform features a powerful admin dashboard for bot building including website scraping, AI knowledge management, and personality customization. Clients receive a simple analytics dashboard showing chats, leads, and bookings with embed codes for their websites.

## Design Philosophy
**Dark Luxury SaaS with Neon-Glass Accents** - Premium aesthetic inspired by Linear, Vercel, and Stripe:
- Deep blacks (#000000, #0A0A0F) with sophisticated depth
- Glassmorphism cards with backdrop blur and subtle borders
- Vibrant cyan primary (#00E5CC) with electric purple secondary (#A855F7)
- Neon glow effects and smooth micro-animations
- Premium feel that makes people say "damn I gotta try this"

## Two-Surface System
1. **Admin Dashboard (Agency Side):** Powerful bot builder with website scraping, knowledge management, FAQs, personality customization, widget design, and deployment tools
2. **Client Dashboard:** Simple analytics-only view showing conversations, leads, bookings - clients contact admin for any changes

## Key Features

### Website Scraper
- Admin pastes client's website URL
- AI extracts business information (name, services, pricing, FAQs, hours, contact)
- GPT-4 structures raw content into clean JSON
- Admin reviews/tweaks extracted data before deployment
- One-click to populate bot knowledge base

### AI Engine (GPT-4 Powered)
- World-class conversational AI that handles any question brilliantly
- Dynamic context building from bot settings, knowledge, FAQs, services
- Smart lead detection (name/email/phone extraction)
- Booking intent recognition with calendar link suggestions
- Safety layer with graceful fallbacks

### Chat Widget
- Gorgeous glassmorphism design with neon accents
- Smooth animations (pulse, slide-up, typing indicator)
- Customizable colors, position, avatar
- Lightweight embed.js for client websites
- Mobile responsive

### Client Analytics
- Conversation history with AI summaries
- Lead management with status tracking
- Booking overview
- Simple settings (bot on/off, notification email)

## Tech Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL (Neon) with Drizzle ORM
- **AI:** OpenAI GPT-4
- **Payments:** Stripe integration

## Authentication
- **Admin:** admin / admin123 (super admin with full access)
- **Clients:** Individual accounts with dashboard access only

## API Endpoints

### Core
- `POST /api/chat/:clientId/:botId` - AI chat interaction
- `GET /api/widget/:botId` - Widget configuration

### Admin (Protected)
- `GET/POST /api/clients` - Manage client businesses
- `GET/PUT /api/bots/:botId` - Bot configuration
- `POST /api/scrape` - Website scraper
- `GET /api/analytics` - Platform analytics

### Client Dashboard (Protected)
- `GET /api/client/conversations` - View conversations
- `GET /api/client/leads` - View/update leads
- `GET /api/client/stats` - Dashboard statistics

## File Structure
```
client/src/
├── pages/
│   ├── home.tsx           - Landing page
│   ├── login.tsx          - Authentication
│   ├── admin-dashboard.tsx - Admin overview
│   ├── bot-dashboard.tsx   - Bot builder
│   └── client-dashboard.tsx - Client analytics
├── components/
│   └── ui/                - shadcn components
server/
├── routes.ts              - API endpoints
├── botConfig.ts           - Bot configuration
├── storage.ts             - Database layer
└── env.ts                 - Environment validation
shared/
└── schema.ts              - Drizzle schemas
```

## Environment Variables
- `OPENAI_API_KEY` - GPT-4 access
- `DATABASE_URL` - PostgreSQL connection
- `DEFAULT_ADMIN_PASSWORD` - Admin password override
- `WIDGET_TOKEN_SECRET` - Widget authentication
- `STRIPE_SECRET_KEY` - Payment processing

## Recent Changes (Dec 2024)
- Streamlined platform - removed enterprise bloat (flow builder, knowledge hub with pgvector, multi-channel inbox)
- Implemented stunning dark luxury design with glassmorphism
- Updated CSS with premium color palette and glow effects
- Cleaned up routes and removed unused imports
- Focus on core value: Admin builds bots, Clients view analytics
