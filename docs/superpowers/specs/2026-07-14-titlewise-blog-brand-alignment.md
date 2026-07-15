# TitleWise Blog Brand Alignment

**Date:** 2026-07-14
**Scope:** Blog index, blog post page, globals.css
**Goal:** Align blog with DESIGN.md brand tokens, AEO optimization, consistent nav/footer

---

## Problem

The blog (`/blog` and `/blog/[slug]`) is visually disconnected from the rest of the marketing site:

1. Both pages have duplicate inline nav and footer instead of using `LandingNav` / `LandingFooter`
2. `globals.css` defines `--primary` as `#3b82f6` (blue) but DESIGN.md canonical primary is `#533afd` (indigo)
3. Blog fonts are `-apple-system` instead of Cabinet Grotesk (headings) / DM Sans (body)
4. Direct Answer accent uses `#f97316` (orange) — not in the brand palette
5. `CREAM` constant `#faf7f2` doesn't match DESIGN.md `canvas-cream` `#f5e9d4`
6. Blog index uses a dark background (`#0f1219`) — inconsistent with light canvas direction

---

## Design Decisions

- **Primary color:** `#533afd` (indigo) — canonical per DESIGN.md
- **Secondary/tertiary accent:** `#3b82f6` (electric blue) — demoted, used sparingly
- **Reading surface:** Light throughout (white canvas body, dark navy hero/footer strips)
- **Nav/footer:** Shared `LandingNav` + `LandingFooter` components on both blog pages

---

## Changes

### 1. `app/globals.css`

| Variable | Before | After |
|---|---|---|
| `--primary` | `#3b82f6` | `#533afd` |
| `--accent` | `#3b82f6` | `#3b82f6` (kept, but role is secondary) |
| `--ring` | `#3b82f6` | `#533afd` |
| `--canvas-cream` | missing | `#f5e9d4` |

### 2. `app/(marketing)/blog/page.tsx` (Blog Index)

- Remove inline `<nav>` and `<footer>` — replace with `<LandingNav />` and `<LandingFooter />`
- Background: `var(--background)` (white), not hardcoded `#0f1219`
- Heading font: Cabinet Grotesk via `font-display` class
- Body font: DM Sans via `font-sans` class
- Category labels, "Read more" links: `var(--primary)` (indigo)
- Borders/rules: `var(--border)`
- Muted text: `var(--muted-foreground)`

### 3. `app/(marketing)/blog/[slug]/page.tsx` (Blog Post)

- Remove inline `<nav>` and `<footer>` — replace with `<LandingNav />` and `<LandingFooter />`
- Article body background: `var(--background)` (white)
- Hero strip: `var(--section-dark)` (`#0f172a`) — dark navy, keeps dramatic contrast
- Direct Answer border accent: `var(--primary)` (indigo), not orange
- Direct Answer label color: `var(--primary)`
- Direct Answer background: `var(--canvas-cream)` (`#f5e9d4`)
- Prose `h2`, `h3`: Cabinet Grotesk via inline style or class
- Prose `p`, `li`: DM Sans, `var(--foreground)` for body text
- Prose `a`: `var(--primary)`
- Prose `blockquote` border: `var(--primary)`
- CTA button: `var(--primary)` background, pill shape (`border-radius: 9999px`)
- CTA button text: `var(--primary-foreground)` (white)

### 4. No structural changes

- Same layout sections, same Direct Answer box, same FAQ component, same JSON-LD schema
- AEO structure (answer-first, FAQ, structured data) is preserved exactly

---

## Files Touched

- `app/globals.css`
- `app/(marketing)/blog/page.tsx`
- `app/(marketing)/blog/[slug]/page.tsx`

---

## Out of Scope

- Other marketing pages (landing, pricing) — not touched
- Dashboard app — not touched
- Other product sites (StrideTС, ReviewSniper) — separate sessions
