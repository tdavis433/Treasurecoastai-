# Treasure Coast AI Platform - Design Guidelines

## Design Approach
**Dark Luxury SaaS with Neon-Glass Accents**: Premium AI platform aesthetic inspired by Linear, Vercel, and Stripe. Deep blacks (#000000, #0A0A0F, #0B0E13) create sophisticated depth. Glassmorphism cards with subtle blur effects and glowing neon borders. Vibrant cyan/teal primary with electric purple secondary. Smooth micro-animations create a polished, expensive feel that commands attention.

## Brand Colors

### Background Layers
- **Deep Black** (#000000): Page backgrounds, maximum depth
- **Charcoal** (#0A0A0F): Secondary backgrounds, section dividers
- **Slate** (#0B0E13): Card surfaces, elevated elements
- **Glass Surface** (white/3-5%): Glassmorphism card backgrounds

### Accent Palette
- **Vibrant Cyan** (#00E5CC / hsl(174, 100%, 45%)): Primary CTAs, active states, links
- **Electric Purple** (#A855F7 / hsl(283, 89%, 65%)): Secondary accents, premium features, highlights
- **Neon Teal** (#00C2B3): Success states, positive metrics
- **Midnight Blue** (#0A5CFF): Information, neutral actions

### Text Hierarchy
- **Primary**: white (100%)
- **Secondary**: white/90%
- **Tertiary**: white/60%
- **Muted**: white/40%

### Status Colors
- **Success**: Emerald (#10B981) - bg-emerald-500/15, text-emerald-400, border-emerald-500/40
- **Info**: Blue (#3B82F6) - bg-blue-500/15, text-blue-400, border-blue-500/40
- **Warning**: Amber (#F59E0B) - bg-amber-500/15, text-amber-400, border-amber-500/40
- **Error**: Rose (#EF4444) - bg-rose-500/15, text-rose-400, border-rose-500/40

### Glow Effects
- **Cyan Glow**: 0 0 30px rgba(0,229,204,0.15), 0 0 60px rgba(0,229,204,0.08)
- **Purple Glow**: 0 0 30px rgba(168,85,247,0.15), 0 0 60px rgba(168,85,247,0.08)
- **Card Shadow**: 0 8px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)

## Typography

**Font Stack**: Inter (400, 500, 600, 700) + JetBrains Mono for code/IDs

- **Display**: 28-36px, font-bold, tracking-tight, text-white
- **Heading**: 20-24px, font-semibold, text-white
- **Body**: 15-16px, font-normal, text-white/90
- **Label**: 13-14px, font-medium, text-white/60
- **Micro**: 11-12px, font-medium, text-white/50

## Component Specifications

### Glass Cards
- Background: bg-white/3 to bg-white/5
- Border: 1px solid white/10 with gradient overlay (white/15 top to white/5 bottom)
- Border radius: 16-20px (rounded-2xl)
- Backdrop blur: backdrop-blur-xl
- Padding: p-6 to p-8
- Shadow: 0 8px 40px rgba(0,0,0,0.6)
- Hover: Increase bg to white/7, add subtle cyan glow

### Premium Buttons

**Primary (Gradient)**: 
- Background: Linear gradient cyan (#00E5CC) to teal (#00C2B3)
- Text: white, font-semibold
- Padding: px-6 py-3
- Rounded: rounded-xl
- Glow: Cyan shadow on hover

**Secondary (Purple)**:
- Background: Linear gradient purple (#A855F7) to violet (#7C3AED)
- Same specs as primary
- Glow: Purple shadow on hover

**Ghost/Outline**:
- Border: 1px solid white/15
- Background: transparent, hover bg-white/5
- Text: white/90

**Buttons on Images**: 
- Background: bg-black/40 backdrop-blur-md
- No gradient overlays

### Status Badges
Glassmorphic with neon glow borders:
- Background: Status color at 15% opacity
- Border: 1px solid status color at 40% opacity
- Text: Status color at full brightness
- Padding: px-3 py-1
- Rounded: rounded-lg
- Font: 12px, font-medium, uppercase, tracking-wide

### Form Inputs
- Background: bg-white/5
- Border: 1px solid white/10
- Focus: border-cyan-400/60, ring-2 ring-cyan-400/20, glow effect
- Placeholder: text-white/40
- Text: text-white
- Rounded: rounded-xl
- Padding: px-4 py-3

### Data Tables
- Header: bg-white/5, text-white/60, font-medium, uppercase, text-xs
- Row: border-b border-white/5, hover:bg-white/3
- Cell padding: px-4 py-4
- Alternating rows: Subtle bg-white/2 on even rows

## Layout System

**Spacing (8pt Grid)**: 
- Tight: gap-2, p-2
- Normal: gap-4, p-4
- Comfortable: gap-6, p-6
- Loose: gap-8, p-8
- Extra Loose: gap-12, p-12

**Container**: max-w-7xl mx-auto px-6

**Grid Patterns**:
- Stat Cards: grid-cols-2 md:grid-cols-4 gap-4
- Feature Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Bot Management: grid-cols-1 lg:grid-cols-2 gap-6

## Animations (Subtle Luxury)

- **Card Entrance**: Fade-in with slight translate-y (20px to 0), 400ms ease-out, staggered 80ms delay
- **Hover Elevation**: Transform scale(1.02), shadow expansion, 250ms ease
- **Button Press**: Scale(0.98), 150ms
- **Glow Pulse**: Subtle opacity animation on cyan/purple glows, 2s infinite
- **Loading Spinners**: Cyan gradient border with rotation
- **Page Transitions**: 200ms cross-fade

## Images

**Hero Section**: 
Full-width gradient mesh background (dark to darker with subtle cyan/purple gradients). Overlay abstract AI neural network visualization with animated glow points. Translucent particles floating across viewport. Hero text overlays with glassmorphic container.

**Dashboard Sections**:
Abstract data visualization backgrounds - flowing lines, gradient orbs, geometric patterns with cyan/purple accents. Keep subtle and non-distracting.

**Bot Builder**:
AI-themed iconography, chat bubble illustrations with glow effects. High-quality mockups of chatbot interfaces on glass cards.

**Client Portal**:
Clean, minimal. Analytics charts as primary visuals with occasional abstract accent graphics.

## Special Elements

**Navigation Header**:
- Height: 64px
- Background: bg-black/60 backdrop-blur-xl
- Border: border-b border-white/10
- Logo glow: Subtle cyan on hover
- Active link: Cyan underline with gradient

**Sidebar (Admin)**:
- Width: 280px
- Background: bg-black with gradient overlay
- Icons with cyan/purple accent on active
- Hover: bg-white/5 transition

**Analytics Cards**:
- Glass background with metric icon in gradient circle (cyan/purple)
- Large numbers: 32-40px bold
- Trend indicators: Small arrows with green/red states
- Sparkline charts in muted cyan

**Empty States**:
- Large icon with gradient fill (cyan to purple)
- Text: "No data yet" in white/60
- CTA button with gradient

## Accessibility & Polish
- Focus rings: 2px cyan with 3px offset
- Touch targets: min-h-12 on mobile
- WCAG AA contrast maintained
- Error messages: Below fields with rose accent
- Loading states: Skeleton with subtle shimmer animation (white/5 to white/10)