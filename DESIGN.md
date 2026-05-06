# Design System — TitleWise

## Product Context
- **What this is:** AI-powered closing platform for real estate attorneys — 12 tools that save 30+ minutes per file
- **Who it's for:** Real estate closing attorneys (specialists, not general practice)
- **Space/industry:** Legal tech, specifically real estate closing workflow automation
- **Project type:** B2B SaaS web app + dashboard

## Memorable Thing
**"Serious software that gives 30 minutes back, every file."**

Professional posture meets speed claim. Every design decision serves this north star — the interface should feel FAST, data-dense, and built for attorneys who know what they're doing.

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian
- **Decoration level:** Minimal — typography and data hierarchy do all the work
- **Mood:** Function-first, data-dense, precise. Like Bloomberg Terminal for real estate closings — not generic SaaS trying to be everything to everyone. Specialists deserve specialist software.
- **Reference sites:** Clio (modern legal tech baseline), MyCase (simplified workflows). TitleWise deliberately breaks from their generous spacing and safe aesthetics — we're tighter, faster, bolder.

## Typography
- **Display/Hero:** Cabinet Grotesk (weights 700-800) — Modern, technical, confident. Use for page titles, section headers, hero headings. Never use for body text or long-form content.
- **Body:** DM Sans (weights 400-600, with `font-variant-numeric: tabular-nums`) — Clean, readable, supports tabular numbers for data alignment. Use for all body copy, labels, descriptions, UI text.
- **UI/Labels:** DM Sans (same as body) — consistency across interface
- **Data/Tables:** DM Sans with `tabular-nums` variant enforced — ensures columns align. Also use JetBrains Mono for timestamps and file IDs where monospace reinforces precision.
- **Code:** JetBrains Mono (weights 400-600) — Use for code blocks, file paths, technical identifiers, and timestamps (e.g., "2026-05-06 19:15:42 UTC")
- **Loading:** Bunny Fonts (privacy-respecting Google Fonts alternative):
  ```html
  <link href="https://fonts.bunny.net/css?family=cabinet-grotesk:400,500,600,700,800|dm-sans:400,500,600,700|jetbrains-mono:400,500,600" rel="stylesheet">
  ```
- **Scale (in rem, base 14px):**
  - Display: 3rem (42px) — page titles
  - H1: 1.71rem (24px) — section headers
  - H2: 1.14rem (16px) — subsection headers
  - Body: 1rem (14px) — default text
  - Small: 0.86rem (12px) — labels, captions
  - Tiny: 0.79rem (11px) — metadata, badges

## Color
- **Approach:** Restrained — one accent color (electric blue) + neutrals. Color is rare and meaningful.
- **Background (dark):** `#0f172a` (slate-950) — deep, professional
- **Surface (dark):** `#1e293b` (slate-800) — cards, panels
- **Surface Elevated (dark):** `#334155` (slate-700) — hover states, active elements
- **Border (dark):** `#475569` (slate-600)
- **Primary Text (dark):** `#f1f5f9` (slate-50) — high contrast for readability
- **Muted Text (dark):** `#cbd5e1` (slate-300) — secondary content
- **Dim Text (dark):** `#94a3b8` (slate-400) — metadata, labels
- **Accent:** `#3b82f6` (blue-500) — electric blue, not corporate blue. Use for CTAs, active states, links, focus rings. Signals speed and trust.
- **Accent Hover:** `#2563eb` (blue-600)
- **Semantic Colors:**
  - Success: `#10b981` (emerald-500) — cleared requirements, completed tasks
  - Warning: `#f59e0b` (amber-500) — pending items, needs review
  - Error: `#ef4444` (red-500) — blockers, failures
  - Info: `#3b82f6` (same as accent) — informational badges
- **Dark mode:** Primary UI (dark is default). Light mode available via toggle for accessibility.
  - Light background: `#f8fafc` (slate-50)
  - Light surface: `#ffffff`
  - Light surface elevated: `#f1f5f9` (slate-100)
  - Light border: `#e2e8f0` (slate-200)
  - Light primary text: `#0f172a` (slate-950)
  - Light muted text: `#475569` (slate-600)
  - Light dim text: `#64748b` (slate-500)
  - Accent and semantic colors remain the same

## Spacing
- **Base unit:** 4px
- **Density:** Compact — information density over breathing room. Attorneys need to see more data per screen. This is a deliberate departure from category norms (Clio/MyCase use 8px base with comfortable spacing).
- **Scale (in px):**
  - 2xs: 2px (0.5 units)
  - xs: 4px (1 unit)
  - sm: 8px (2 units)
  - md: 12px (3 units)
  - base: 16px (4 units)
  - lg: 24px (6 units)
  - xl: 32px (8 units)
  - 2xl: 48px (12 units)
  - 3xl: 64px (16 units)
- **Usage:**
  - Card padding: 12-16px (md-base)
  - Section gaps: 48px (2xl)
  - Component gaps: 12px (md)
  - Button padding: 8px 16px (sm, base)
  - Table cell padding: 8px (sm)

## Layout
- **Approach:** Hybrid — grid-disciplined for dashboard (sidebar nav, predictable structure), creative-editorial for marketing pages (asymmetric hero, overlapping elements)
- **Dashboard Grid:** Sidebar + main content
  - Sidebar: 200px fixed width, left-aligned, vertical nav
  - Main content: flexible, 24px padding
  - Max content width: 1400px (wide enough for data tables)
- **Marketing Grid:** Responsive columns
  - Mobile: single column
  - Tablet: 2 columns, 768px breakpoint
  - Desktop: flexible grid, 1280px breakpoint
- **Border radius:** Minimal, consistent
  - Cards: 4px (1 unit)
  - Buttons: 4px (1 unit)
  - Inputs: 4px (1 unit)
  - Badges: 4px (1 unit)
  - No full-rounded elements except pills/tags

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension and speed
- **Easing:**
  - Enter: `ease-out` (elements appearing)
  - Exit: `ease-in` (elements disappearing)
  - Move: `ease-in-out` (position changes)
- **Duration:**
  - Micro: 50-100ms (hover states, focus rings)
  - Short: 150ms (button clicks, dropdown opens)
  - Medium: 250ms (panel slides, modal fades)
  - Long: 400ms (page transitions, heavy animations)
- **Use motion for:**
  - Button hover/active states (background color shift, 150ms)
  - Dropdown/modal open/close (opacity + transform, 250ms)
  - Table row hover (background color, 100ms)
  - Form validation feedback (shake or color change, 150ms)
- **Avoid:**
  - Entrance animations on page load (slows perceived performance)
  - Scroll-driven animations (adds complexity without value)
  - Decorative motion (no floating elements, no parallax)

## Component Patterns

### Buttons
- Primary: `background: accent, color: white, padding: 8px 16px, border-radius: 4px`
- Secondary: `background: surface-elevated, border: 1px border, color: text-primary`
- Ghost: `background: transparent, color: text-muted, hover: surface`
- All buttons: font-weight 600, font-size 13px, uppercase tracking 0.05em

### Badges
- Small pills with semantic colors
- Padding: 4px 8px, border-radius: 4px, font-size 11px, font-weight 600, uppercase
- Success: `background: success/10%, border: 1px success, color: success`
- Warning: `background: warning/10%, border: 1px warning, color: warning`
- Error: `background: error/10%, border: 1px error, color: error`

### Tables
- Header: `font-size: 11px, uppercase, letter-spacing: 0.05em, color: text-muted, padding: 8px`
- Cells: `font-size: 13px, padding: 8px, border-bottom: 1px border, font-variant-numeric: tabular-nums`
- Hover: `background: surface-elevated, transition: 100ms`
- Use JetBrains Mono for file IDs, timestamps, and technical identifiers in cells

### Form Inputs
- Padding: 8px 12px, border: 1px border, border-radius: 4px
- Focus: `border-color: accent, outline: none`
- Background: `background` (darker than surface for contrast)
- Placeholder: `color: text-dim`

### Cards
- Background: `surface`, border: 1px border, border-radius: 4px, padding: 12-16px
- Compact variant: padding 12px (for data-dense layouts)
- Shadow: none (flat design, borders provide structure)

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-06 | Initial design system created | Created by /design-consultation based on product context (real estate closing attorneys) and competitive research (Clio, MyCase). Deliberately breaks from category norms: tighter spacing (4px vs 8px), monospace UI elements (precision signal), electric blue accent (speed + trust). North star: "Serious software that gives 30 minutes back, every file." |
| 2026-05-06 | Cabinet Grotesk for display | Modern, technical, confident. Signals specialist software, not generic SaaS. Avoids overused fonts (Inter, Roboto). |
| 2026-05-06 | DM Sans with tabular-nums for body | Clean, readable, excellent tabular number support for data alignment. |
| 2026-05-06 | JetBrains Mono for timestamps/IDs | Monospace in UI is uncommon in legal SaaS but reinforces precision and attention to detail. |
| 2026-05-06 | 4px base spacing (compact) | Information density matters more than breathing room for specialist users. Fits more data per screen. Risk: may feel cramped to users expecting generous whitespace. |
| 2026-05-06 | Electric blue accent (#3b82f6) | Bolder than corporate blues, signals speed and modernity. Differentiates from competitors who converge on muted blues. |
