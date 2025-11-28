# Treasure Coast AI Platform - Design Guidelines

## Design Approach
**Dark Neon-Glass SaaS**: Modern, sophisticated dark theme inspired by Linear, Vercel Dashboard, and premium SaaS platforms. Glass morphism effects, subtle neon accents, and crisp data visualization. This is the single source of truth for all admin surfaces.

## Core Design Principles
- **Data Clarity**: Information hierarchy that makes complex analytics instantly scannable
- **Professional Polish**: Refined details that build trust with business clients
- **Efficient Workflows**: Reduce clicks, surface relevant actions contextually
- **Scalable Design**: Consistent patterns that work from 5 to 500 chatbots
- **Dark-First**: Optimized for extended use with reduced eye strain

## Brand Colors

### Primary Palette
- **Dark Base** (#0B0E13): Primary background, page base
- **Card Surface** (white/5%): Glass card backgrounds
- **Borders** (white/10%): Subtle borders for glass effects
- **Ocean Blue** (#0A5CFF / hsl(219, 100%, 58%)): Primary actions, CTAs, active states
- **Cyan Accent** (#4FC3F7 / hsl(199, 92%, 64%)): Secondary accents, neon glow effects
- **Teal** (#00C2B3 / hsl(174, 100%, 38%)): Success states, positive indicators

### Text Hierarchy
- **Primary Text** (white): Main headings, important content
- **Secondary Text** (white/85%): Body content, descriptions
- **Tertiary Text** (white/55%): Labels, muted content, placeholders
- **Disabled** (white/30%): Inactive elements

### Status Colors
- **Active/Success**: Green (#10B981 / bg-green-500/20 + text-green-400 + border-green-500/30)
- **Demo/Info**: Blue (#3B82F6 / bg-blue-500/20 + text-blue-400 + border-blue-500/30)
- **Paused/Warning**: Amber (#F59E0B / bg-amber-500/20 + text-amber-400 + border-amber-500/30)
- **Error/Danger**: Red (#EF4444 / bg-red-500/20 + text-red-400 + border-red-500/30)

### Glow & Shadow
- **Card Shadow**: 0px 4px 20px rgba(0,0,0,0.45)
- **Glow (cyan)**: 0px 4px 30px rgba(79,195,247,0.15)
- **Focus Ring**: Cyan ring with 2px offset

## Typography

### Font Stacks
- **Primary**: Inter (weights: 400, 500, 600, 700)
- **Mono**: JetBrains Mono (for code, IDs, logs)

### Scale
- **Display**: 24-32px / font-bold (page titles)
- **Heading**: 18-20px / font-semibold (card titles, section headers)
- **Body**: 14-15px / font-normal (content, descriptions)
- **Small**: 12-13px / font-medium (labels, badges, metadata)
- **Micro**: 11px / font-medium (timestamps, footnotes)

## Component Library

### GlassCard (Primary Container)
Use `GlassCard` from `@/components/ui/glass-card.tsx` for all card containers.

```tsx
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";

<GlassCard hover glow>
  <GlassCardHeader>
    <GlassCardTitle>Card Title</GlassCardTitle>
    <GlassCardDescription>Description text</GlassCardDescription>
  </GlassCardHeader>
  <GlassCardContent>
    {/* Content */}
  </GlassCardContent>
</GlassCard>
```

Properties:
- `bg-white/5` base background
- `border border-white/10` subtle glass edge
- `rounded-2xl` large radius for modern feel
- `backdrop-blur-md` glass effect
- `hover`: adds hover state with increased opacity
- `glow`: adds cyan glow on hover

### NeonBadge (Status Indicators)
Status badges with neon glow effects.

```tsx
<Badge className="bg-green-500/20 text-green-400 border border-green-500/30">ACTIVE</Badge>
<Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">DEMO</Badge>
<Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">PAUSED</Badge>
<Badge className="bg-red-500/20 text-red-400 border border-red-500/30">ERROR</Badge>
```

### Glass Inputs
Form inputs with glass aesthetic.

```tsx
<input className="glass-input" />
// Defined in index.css:
// bg-white/5, border-white/10, text-white, placeholder:text-white/40
// focus: border-cyan-400/50, ring-2 ring-cyan-400/20
```

### Buttons on Dark Backgrounds

Primary (Gradient):
```tsx
<Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white">
```

Outline (Glass):
```tsx
<Button variant="outline" className="border-white/10 text-white/85 hover:bg-white/5">
```

Ghost:
```tsx
<Button variant="ghost" className="text-white/85 hover:bg-white/10">
```

### Tabs (Dark Theme)
```tsx
<TabsList className="bg-white/5 border border-white/10 rounded-xl">
  <TabsTrigger 
    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 
               data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30
               data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white"
  >
    Tab Name
  </TabsTrigger>
</TabsList>
```

### Select Dropdowns
```tsx
<SelectTrigger className="bg-white/5 border-white/10 text-white">
<SelectContent className="bg-[#0B0E13] border-white/10">
  <SelectItem className="text-white hover:bg-white/10">
```

## Layout System

### Page Structure
```tsx
<div className="min-h-screen bg-[#0B0E13]">
  <header className="border-b border-white/10 bg-white/5 backdrop-blur-md h-14">
    {/* Navigation */}
  </header>
  <main className="max-w-7xl mx-auto px-6 py-8">
    {/* Content */}
  </main>
</div>
```

### Spacing (8pt Grid)
- **Tight**: gap-2, p-2 (8px)
- **Normal**: gap-4, p-4 (16px)
- **Comfortable**: gap-6, p-6 (24px)
- **Loose**: gap-8, p-8 (32px)

### Grid Layouts
- **Stats Cards**: grid-cols-2 md:grid-cols-4 gap-4
- **Bot Cards**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
- **Form Fields**: grid-cols-1 md:grid-cols-2 gap-4

## Loading States

### Skeleton Loaders
```tsx
<div className="animate-pulse">
  <div className="h-8 bg-white/10 rounded-lg w-32 mb-2" />
  <div className="h-4 bg-white/10 rounded w-48" />
</div>
```

### Inline Loading
```tsx
<div className="text-center py-8 text-white/55">
  <div className="h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
  Loading...
</div>
```

### Button Loading
```tsx
<Button disabled className="opacity-50">
  {isPending ? 'Loading...' : 'Submit'}
</Button>
```

## Error & Empty States

### Error Messages
```tsx
<div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
  <AlertTriangle className="h-4 w-4 inline mr-2" />
  Error loading data. Please try again.
</div>
```

### Empty States
```tsx
<div className="text-center py-12 text-white/40">
  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
  <p className="font-medium">No bots found</p>
  <p className="text-sm mt-1">Create your first chatbot to get started</p>
  <Button className="mt-4">Create Bot</Button>
</div>
```

## Analytics Components

### Stat Cards
```tsx
<GlassCard>
  <div className="p-4 text-center">
    <div className="h-10 w-10 rounded-lg bg-cyan-400/10 flex items-center justify-center mx-auto mb-2">
      <Icon className="h-5 w-5 text-cyan-400" />
    </div>
    <div className="text-2xl font-bold text-white">1,234</div>
    <div className="text-xs text-white/55">Metric Label</div>
  </div>
</GlassCard>
```

### Charts
- Primary data: Cyan (#4FC3F7)
- Secondary data: Blue (#3B82F6)
- Grid lines: white/10%
- Axis labels: white/55%
- Tooltips: bg-[#0B0E13] with white/10% border

## Mobile Optimization
- Navigation: Hamburger menu below lg breakpoint
- Sidebars: Slide-out drawer on mobile
- Cards: Stack to single column (grid-cols-1)
- Stat cards: 2-column grid on mobile
- Tables: Horizontal scroll with sticky first column

## Accessibility
- All interactive elements: min h-10 (40px) touch targets
- Focus indicators: 2px cyan ring with offset
- Color contrast: WCAG AA compliant
- Form validation: Error messages below fields with icon
- Loading states: Skeleton screens for card/table content

## Animation & Interaction
- Page transitions: Fade-in 150ms
- Card hover: shadow elevation + opacity change, 200ms ease
- Button press: Slight scale down (0.98) on active
- Modal appearance: Fade + slide-up 250ms
- No distracting auto-play animations

## Data Test IDs
All interactive and display elements must include data-testid attributes:
- Interactive: `{action}-{target}` (e.g., button-create-bot, input-email)
- Display: `{type}-{content}` (e.g., stat-total-messages, badge-status-active)
- Dynamic: `{type}-{description}-{id}` (e.g., card-bot-faith_house)
