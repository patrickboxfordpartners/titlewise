# TITLEwise Personality Injection

**Date:** 2026-05-06  
**Target:** Marketing site + Dashboard UI  
**Goal:** Eliminate AI slop, inject personality without breaking professional trust

---

## Design Principles Applied

### **1. Multiple Accent Colors**
**Before:** Monochrome primary color throughout  
**After:** Product-specific color system
- **Blue** → Core tools (Status Updates, Title Analyzer, Closing Checklist)
- **Red** → Security/wire fraud tools (Wire Fraud Prevention, Wire Fraud Memory)
- **Purple** → Analysis tools (CD Reviewer, HOA Reviewer, Autonomous Agent)
- **Green** → Financial tools (Fee Estimator, Tax Proration)
- **Orange** → Compliance (TRID Engine)

### **2. Hard Shadows Instead of Blur**
**Before:** `shadow-sm`, `shadow-md` (subtle blur)  
**After:** `boxShadow: "6px 6px 0px rgba(59, 130, 246, 0.25)"` (hard offset)
- Marketing cards: 8px offset
- Dashboard cards: 6px offset
- Hover: Increases to 10px-12px with spring physics

### **3. Magnetic Hover Interactions**
**Before:** Static hover with translate-y  
**After:** Magnetic tracking with `useMotionValue` + `useSpring`
```typescript
const x = useMotionValue(0)
const y = useMotionValue(0)
const springConfig = { damping: 15, stiffness: 150 }
// Follows cursor within 20% of distance from center
x.set(distanceX * 0.2)
```

### **4. Punchier Copy**
**Before:** "Draft a professional client update email in seconds."  
**After:** "Client emails drafted. Seconds, not minutes."

Hero headline:
- Before: "Your AI closing coordinator. From intake to clear-to-close."
- After: "30 minutes back. Every file."

### **5. Condensed Typography**
**Before:** `text-2xl font-semibold`  
**After:** `text-3xl font-black tracking-tight`
- Hero: `text-7xl font-black leading-[0.95]`
- Section headlines: `font-black` (900 weight)
- Body copy: `font-medium` (500 weight, up from 400)

### **6. Animated Grain Texture**
Added to hero section:
```typescript
<motion.div
  className="absolute inset-0 opacity-[0.03]"
  style={{ backgroundImage: `url("data:image/svg+xml,...")` }}
  animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
  transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
/>
```

### **7. Overlapping Elements**
Hero trust cards:
- Right card: `-mr-6` (overlaps left card)
- Left card: `-ml-6` + `relative z-10` (brings to front)

### **8. Color-Coded Dashboard Status**
Matter cards with dynamic colors:
- **Complete** (100%): Green border, green progress bar
- **Urgent** (closing < 7 days): Orange border, orange progress bar, orange date
- **Normal**: Blue border, blue progress bar

---

## Files Changed

### **Marketing Site**

#### `components/landing/HeroSectionPersonality.tsx`
- Magnetic buttons with spring physics
- Animated grain texture overlay
- Hard shadows on trust cards (8px offset)
- Multiple accent colors (blue badge, red wire fraud card, purple AI tools card, green autonomous card)
- Punchier headline: "30 minutes back. Every file."
- Fixed animations: `initial={{ opacity: 1, y: 0 }}` (no viewport fade-in)

#### `components/landing/FeaturesSectionPersonality.tsx`
- Color-coded tool cards (8 core + 4 premium)
- Hard shadows with hover animation
- Punchier descriptions ("Client emails drafted. Seconds, not minutes.")
- Magnetic CTA button
- Color-coded section labels (blue for "Core Tools", purple for "Advanced")

#### `app/page.tsx`
- Updated imports:
  - `HeroSectionUpgraded` → `HeroSectionPersonality`
  - `FeaturesSectionUpgraded` → `FeaturesSectionPersonality`

### **Dashboard UI**

#### `app/(dashboard)/dashboard/page.tsx`
- **MagneticCard** component for all tool cards
- Color-coded tools with hard shadows
- Dynamic matter status colors (green/orange/blue)
- Bolder typography (`font-black`, `font-bold`)
- Thicker icon strokes (`strokeWidth={2.5}`, up from 1.5)
- Section headers with accent colors (blue for "Core Tools", purple for "Advanced")
- Enhanced hover states (magnetic + shadow increase)

**Key improvements:**
- Tools instantly recognizable by color (red = security, purple = analysis, green = money)
- Urgent closings highlighted in orange automatically
- Magnetic interaction makes primary actions feel responsive
- Hard shadows add depth without feeling heavy

---

## Color Palette

```typescript
const colorClasses = {
  blue: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    icon: "text-blue-600",
    shadow: "rgba(59, 130, 246, 0.25)"
  },
  purple: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
    icon: "text-purple-600",
    shadow: "rgba(168, 85, 247, 0.25)"
  },
  red: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    icon: "text-red-600",
    shadow: "rgba(239, 68, 68, 0.25)"
  },
  green: {
    border: "border-green-500/30",
    bg: "bg-green-500/10",
    icon: "text-green-600",
    shadow: "rgba(34, 197, 94, 0.25)"
  },
  orange: {
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
    icon: "text-orange-600",
    shadow: "rgba(249, 115, 22, 0.25)"
  }
}
```

---

## Typography System

| Element | Before | After |
|---------|--------|-------|
| **Dashboard H1** | `text-2xl font-semibold` | `text-3xl font-black tracking-tight` |
| **Hero H1** | `text-5xl font-bold` | `text-5xl font-black leading-[0.95]` |
| **Section H2** | `text-4xl font-bold` | `text-4xl font-black tracking-tighter` |
| **Card Title** | `font-semibold` | `font-black tracking-tight` |
| **Body** | `text-sm` (400 weight) | `text-sm font-medium` (500 weight) |
| **Labels** | `font-semibold uppercase` | `font-black uppercase tracking-widest` |

---

## Motion System

### **Magnetic Hover**
```typescript
const MagneticCard = ({ children, href, color }) => {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { damping: 20, stiffness: 200 })
  const springY = useSpring(y, { damping: 20, stiffness: 200 })
  
  const handleMouseMove = (e) => {
    // Calculate distance from center, apply 8% of that distance
    x.set(distanceX * 0.08)
    y.set(distanceY * 0.08)
  }
}
```

### **Shadow Hover**
```typescript
whileHover={{
  boxShadow: `8px 8px 0px ${colors.hoverShadow}`,
  transition: { type: "spring", stiffness: 300, damping: 20 }
}}
```

### **No Viewport Fade-In**
```typescript
// Before (causes void in screenshots)
initial={{ opacity: 0, y: 60 }}
whileInView={{ opacity: 1, y: 0 }}

// After (always visible)
initial={{ opacity: 1, y: 0 }}
animate={{ opacity: 1, y: 0 }}
```

---

## Legal/Professional Balance

### **Constraints**
- Legal audience = conservative design expectations
- Cannot be too playful (no hand-drawn elements, cartoon icons)
- Trust indicators must remain prominent (wire fraud, compliance)

### **How Personality Was Injected Without Breaking Trust**
1. **Color system** is functional (red = security, not decoration)
2. **Hard shadows** add depth but stay professional (25% opacity, not 50%)
3. **Magnetic hover** is subtle (8% follow, not 30%)
4. **Punchier copy** is specific, not casual ("30 minutes back" vs "super fast!")
5. **Font weight** (black/900) conveys authority, not playfulness

---

## Before/After Summary

| Element | Before (Generic) | After (Personality) |
|---------|------------------|---------------------|
| **Color** | Monochrome primary | 5-color functional system |
| **Shadows** | Subtle blur | Hard 6-8px offset |
| **Hover** | Static translate-y | Magnetic tracking + shadow |
| **Copy** | Corporate speak | Punchy, specific |
| **Typography** | `font-semibold` | `font-black` |
| **Status** | Muted neutral | Color-coded (green/orange/blue) |
| **Icons** | `strokeWidth={1.5}` | `strokeWidth={2.5}` |
| **Borders** | `border` (1px) | `border-2` (2px) |
| **Spacing** | Generic gap-3 | Asymmetric (gap-4, gap-3 mixed) |

---

## Result

**Marketing site:** No longer looks like a generic SaaS template. Color system differentiates product categories, magnetic hovers make CTAs feel responsive, grain texture adds depth.

**Dashboard UI:** Tools instantly recognizable by color. Urgent matters highlighted automatically. Magnetic cards make interactions feel alive. Hard shadows add depth without feeling heavy.

**Professional trust maintained:** Color system is functional, not decorative. Typography is bold, not playful. Copy is specific, not casual. Legal audience expectations met.
