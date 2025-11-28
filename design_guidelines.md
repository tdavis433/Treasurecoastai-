# Treasure Coast AI Platform - Design Guidelines

## Design Approach
**Hybrid Reference-Based**: Modern B2B SaaS platforms (Linear, Vercel, Stripe Dashboard) with emphasis on data clarity, professional polish, and efficient workflows. Clean, sophisticated visual language that balances approachability with enterprise credibility.

## Core Design Principles
- **Data Clarity**: Information hierarchy that makes complex analytics instantly scannable
- **Professional Polish**: Refined details that build trust with business clients
- **Efficient Workflows**: Reduce clicks, surface relevant actions contextually
- **Scalable Design**: Consistent patterns that work from 5 to 500 chatbots

## Brand Colors
- **Ocean Blue** (#0A5CFF): Primary actions, CTAs, active states, links
- **Aqua Teal** (#00C2B3): Secondary accents, progress indicators, success states
- **Charcoal** (#1A1A1A): Primary text, headings
- **Grays**: #F8F9FA (backgrounds), #E5E7EB (borders), #6B7280 (secondary text)
- **Status Colors**: Green (#10B981) Active, Blue (#0A5CFF) Demo, Orange (#F59E0B) Demo-active, Red (#EF4444) On-Hold
- **Shadows**: Subtle elevation using rgba(0,0,0,0.05) to rgba(0,0,0,0.12)

## Typography
- **Font Family**: Inter (primary), SF Pro Display (fallback)
- **Display**: 32px/36px bold for dashboard titles
- **Headings**: 24px/28px semibold for section headers, 18px/24px medium for card titles
- **Body**: 15px/22px regular for primary content, 14px/20px for secondary
- **Labels**: 13px/18px medium for form labels, 12px/16px medium for badges
- **Monospace**: JetBrains Mono 14px for API keys, code snippets

## Layout System
**8pt Grid**: All spacing uses multiples of 8px (Tailwind: 2, 3, 4, 6, 8, 12, 16, 20, 24)
- **Page container**: max-w-7xl with px-6 lg:px-8
- **Card padding**: p-6 standard, p-8 for prominent cards
- **Section spacing**: space-y-8 between major sections, space-y-6 for card groups
- **Component gaps**: gap-4 for form fields, gap-3 for button groups, gap-6 for grid cards

## Component Library

### Navigation
**Top Bar**: Full-width, white background, border-b, h-16
- Logo left (40px height), navigation center (Dashboard, Chatbots, Clients, Analytics, Settings), user menu right (avatar + dropdown)
- Active state: Ocean Blue text with 2px bottom border

**Sidebar** (Dashboard pages): 240px fixed width, gray background (#F8F9FA)
- Section headers (12px uppercase gray), nav items with icons (40px height)
- Hover: light blue background, Active: Ocean Blue left border + background

### Dashboard Cards
- White background, rounded-xl (12px), shadow-sm
- Header: flex justify-between with title (18px semibold) and action button/dropdown
- Content padding: p-6
- Hover: shadow-md transition
- Variants: Stats card (large number + label + trend), list card (scrollable), chart card

### Data Tables
- Sticky header row (gray background, 14px semibold text)
- Row height: 56px with px-6 padding
- Zebra striping: subtle alternating background (#FAFBFC)
- Row hover: light blue highlight
- Action column: right-aligned icon buttons (edit, delete, more)
- Pagination: bottom-right, 10/25/50 per page options

### Status Badges
- Pill shape (rounded-full), px-3 py-1, 12px medium text
- Active: Green background (#D1FAE5) + green text (#059669)
- Demo: Blue background (#DBEAFE) + Ocean Blue text
- Demo (active): Orange background (#FEF3C7) + orange text (#D97706)
- On-Hold: Red background (#FEE2E2) + red text (#DC2626)

### Forms
- Input fields: h-10, px-4, rounded-lg, border gray, focus ring Ocean Blue
- Labels: 13px medium, mb-2, Charcoal
- Textareas: min-h-24, resize-y
- Select dropdowns: Chevron icon right
- Toggle switches: Ocean Blue when active, gray when off
- Primary button: Ocean Blue background, white text, h-10, px-6, rounded-lg, medium weight
- Secondary button: White background, Ocean Blue border/text
- Danger button: Red background for destructive actions

### Analytics Components
- Line/bar charts: Ocean Blue primary data, Aqua Teal secondary
- Chart grid: subtle gray lines
- Tooltips: White background, shadow-lg, rounded-lg, 13px text
- Legend: horizontal below chart, 12px with colored dot indicators
- Date range picker: Right-aligned, opens calendar dropdown

### Chatbot Management Cards
- Grid layout: 3 columns desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Card content: Chatbot name (16px semibold), status badge, stats row (messages/users), action buttons
- Thumbnail: 48px square chatbot avatar/icon top-left
- Footer: Last active timestamp (12px gray text)

### Modals & Overlays
- Backdrop: rgba(0,0,0,0.4) with backdrop blur
- Modal: max-w-2xl, rounded-2xl, white, shadow-2xl
- Header: p-6 with title (20px semibold) and close button
- Content: p-6, max-h-[70vh] overflow-y-auto
- Footer: p-6 border-t, flex justify-end gap-3

### Empty States
- Centered content with illustration/icon (96px), heading (18px), description (14px gray)
- Primary action button below
- Used for: No chatbots created, no data in date range, no search results

## Page-Specific Layouts

### Dashboard Home
- Hero stats row: 4 cards showing total chatbots, active conversations, monthly messages, clients
- Charts section: 2-column grid (conversations over time, top performing chatbots)
- Recent activity table below

### Chatbots List
- Header: Title + "Create Chatbot" button (Ocean Blue)
- Filter bar: Search input, status filter dropdown, sort dropdown
- Grid of chatbot cards (3-col responsive)

### Chatbot Detail
- Header breadcrumb: Dashboard > Chatbots > [Name]
- Tabbed interface: Overview, Analytics, Settings, Appearance, Integrations
- Left content area (2/3 width), right sidebar (1/3) with quick stats and actions

### Client Management
- Table view with company name, contact, # chatbots, plan type, status, actions
- Click row to expand inline details
- Bulk action checkboxes for multi-select

## Images
**Hero Image**: Yes - Dashboard landing page features abstract tech/AI visualization
- Location: Top of marketing/login pages, 60vh height
- Style: Gradient mesh with Ocean Blue/Aqua Teal flowing shapes
- Overlay: Semi-transparent gradient for text readability
- CTA buttons on hero: Blurred background (backdrop-blur-sm) with white/10 background

**Product Screenshots**: Use throughout marketing pages showing dashboard UI
**Client Logos**: Gray-scale grid on "Trusted by" section

## Mobile Optimization
- Navigation: Hamburger menu replaces top nav below lg breakpoint
- Sidebar: Slide-out drawer on mobile
- Cards: Stack to single column (grid-cols-1)
- Tables: Horizontal scroll wrapper with sticky first column
- Stats: 2-column grid on mobile vs 4-column desktop
- Form modals: Full-screen on mobile (rounded corners only on desktop)

## Accessibility
- All interactive elements: min h-10 (40px) touch targets
- Focus indicators: 2px Ocean Blue ring with offset
- Color contrast: WCAG AA compliant throughout
- Form validation: Error messages below fields in red with icon
- Loading states: Skeleton screens for card/table content

## Animation & Interaction
- Page transitions: Fade-in 150ms
- Card hover: shadow elevation 200ms ease
- Button press: Slight scale down (0.98) on active
- Modal appearance: Fade + slide-up 250ms
- Chart animations: Stagger data points 50ms each
- No distracting auto-play animations