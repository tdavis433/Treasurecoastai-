# HopeLine Assistant - Design Guidelines

## Design Approach
**Reference-Based**: Healthcare/Support-focused chat interfaces (Crisis Text Line, BetterHelp chat widgets) with emphasis on accessibility, clarity, and emotional safety. Calm, trust-building visual language appropriate for recovery support context.

## Core Design Principles
- **Warmth & Accessibility**: Non-threatening, approachable interface that reduces anxiety
- **Clarity & Simplicity**: Clear hierarchy, easy-to-read typography, no visual complexity
- **Trust & Professionalism**: Polished but not corporate; supportive but not medical
- **Mobile-First**: Optimized for users in various situations and devices

## Color Palette
- **Primary Gradient**: Soft blue to teal (gradient for chat bubble)
- **Chat Bubbles**: White (assistant), soft blue (user messages)
- **Background**: Light neutral (off-white/very light gray)
- **Accents**: Calm greens and blues throughout
- **Shadows**: Gentle, subtle drop shadows for depth without harshness

## Typography
- **Primary Font**: Clean, highly readable sans-serif (Inter, Open Sans, or similar)
- **Header**: 18px, medium weight for "HopeLine Assistant"
- **Subtitle**: 14px, regular weight for tagline
- **Message Text**: 15px, comfortable reading size
- **Button Text**: 14px, medium weight for menu options
- **Hierarchy**: Short paragraphs, bullet lists for scannability, never dense text blocks

## Layout System
**Spacing Primitives**: Tailwind units of 2, 3, 4, 6, 8 for consistent rhythm
- Chat bubble widget: 56px × 56px circle
- Chat window: 360px width (desktop), 94vw (mobile), max-height 600px
- Internal padding: p-4 for window, p-3 for messages
- Button spacing: gap-2 between menu items
- Message spacing: gap-3 between conversation items

## Component Library

### Chat Bubble Widget
- Fixed bottom-right positioning (20px from edges)
- 56px diameter circle
- Blue-to-teal gradient background
- White chat icon (message/speech bubble)
- Subtle pulsing animation on initial load only
- Elevated with medium shadow

### Chat Window
- Rounded corners: 16px
- Subtle box shadow for elevation
- Three-section layout: Header (fixed) / Messages (scrollable) / Input (fixed)

### Header Component
- Title: "HopeLine Assistant"
- Subtitle: "Here to support your next step 🤍"
- Close button (×) in top-right corner
- Bottom border separator

### Message Bubbles
- **Assistant**: Left-aligned, white background, rounded corners (12px), subtle shadow
- **User**: Right-aligned, blue background, white text, rounded corners (12px)
- Max-width: 80% of window
- Padding: p-3
- Margin between messages: gap-3

### Menu Buttons (8 total)
- Pill-shaped (fully rounded)
- White background with blue border
- Blue text, medium weight
- Padding: px-4 py-2
- Hover: light blue background fill
- Grid layout: 2 columns on mobile, wrap naturally
- Labels: "About", "Requirements", "Availability", "Pricing", "Apply Now", "Request Tour/Call", "Crisis Support", "Contact Info"

### Input Area
- Text input field: rounded corners (8px), light border, padding p-3
- Send button: blue background, white arrow/send icon, rounded (8px)
- Layout: Flexbox with input taking flex-1
- Border-top separator from messages area

### Crisis Support Display
- Prominent, non-AI static message
- Large clear text with phone numbers
- Resources: 988 (Suicide & Crisis Lifeline), 1-800-662-HELP, 911
- Red/urgent accent color for this section only
- Full-width, centered display

### Loading States
- Simple animated ellipsis "..." in assistant bubble while AI responds
- No complex spinners or animations

## Interaction Patterns
- Smooth slide-up animation when chat window opens
- Instant button responses (no delays)
- Enter key sends message
- Auto-scroll to newest message
- Fade-in for new messages (200ms)
- Menu buttons hide/show based on conversation context

## Mobile Optimization
- Chat window: 94vw width, full-height minus safe areas
- Larger touch targets (minimum 44px height for buttons)
- Increased padding for thumb-friendly spacing
- Simplified menu: vertical stack on narrow screens
- Fixed positioning handles keyboard appearance

## Accessibility
- High contrast ratios (WCAG AA minimum)
- Focus states on all interactive elements
- Keyboard navigation support
- Screen reader friendly message structure
- Crisis resources always prominently accessible

## Key UX Principles
- First message automatically displays on open with welcome + menu
- Crisis support always available (dedicated menu button)
- Progressive disclosure: Show appointment flow step-by-step
- Confirmation messages after form submissions
- Clear "typing" indicators during AI response
- No auto-open, no intrusive notifications
- Gentle, supportive language throughout all system messages