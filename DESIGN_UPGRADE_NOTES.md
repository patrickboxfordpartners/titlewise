# TitleWise Design Upgrade - Taste Skill Applied

**Date:** 2026-05-05  
**Skill Used:** design-taste-frontend (Anti-Slop Design Framework)  
**Dial Settings:**
- DESIGN_VARIANCE: 5 (conservative for legal professionals)
- MOTION_INTENSITY: 3 (subtle, professional)
- VISUAL_DENSITY: 5 (balanced)

## Changes Applied

### Hero Section (`HeroSectionUpgraded.tsx`)

**Before:**
- Centered layout (generic SaaS pattern)
- Badge → H1 → Description → 2 Buttons (predictable pattern)
- Max-width: 3xl (768px)
- Standard motion: fade-in, scale

**After (Anti-Slop Principles Applied):**

1. **Layout Variance (Rule 3: ANTI-CENTER BIAS)**
   - Split screen layout: `lg:grid-cols-[1.2fr_1fr]` (asymmetric 55/45 split)
   - Left: content, Right: trust indicators
   - Breaks the "every SaaS hero is centered" pattern

2. **Typography (Rule 1: Deterministic Typography)**
   - H1: `text-5xl md:text-6xl lg:text-7xl tracking-tighter`
   - Added `leading-[1.1]` for tighter line height
   - Split headline with muted second half for visual hierarchy
   - Body: `max-w-[65ch]` for optimal readability (not arbitrary max-w-2xl)

3. **Viewport Stability (Section 2)**
   - Changed `pt-32 pb-20` to `min-h-[100dvh] flex items-center`
   - Prevents layout jumping on mobile (iOS Safari)

4. **Tactile Feedback (Rule 5)**
   - Added `active:translate-y-[1px]` to buttons for physical push feel

5. **Right Visual: Trust Indicators**
   - Asymmetric card grid (different sizes)
   - Rounded-3xl corners (premium feel vs generic rounded-xl)
   - Glassmorphism: `bg-card/50 backdrop-blur-sm`
   - Shadow removed (cleaner, uses borders instead)

### Contact Section (`ContactSectionUpgraded.tsx`)

**Before:**
- Standard 50/50 two-column layout
- Form in card with `p-8`
- Standard success state

**After (Anti-Slop Principles Applied):**

1. **Layout Variance**
   - Asymmetric split: `lg:grid-cols-[0.9fr_1.1fr]` (40/60 instead of 50/50)
   - Left column sticky: `lg:sticky lg:top-32` (stays in view while scrolling)

2. **Typography**
   - H2: `text-4xl md:text-5xl tracking-tighter`
   - Form labels: `text-xs tracking-wide uppercase` (editorial feel)

3. **Materiality (Rule 4)**
   - Removed excessive card styling
   - Rounded-[2rem] for premium feel (32px vs 16px)
   - Diffusion shadow: `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`
   - Trust indicator card with glassmorphism

4. **Spring Physics (Rule 5)**
   - Success animation: `type: "spring", stiffness: 200, damping: 15`
   - Not linear easing - weighted, premium feel

5. **Form UX**
   - Removed two-column grid on mobile (cleaner single column)
   - Input height: `h-11` (consistent)
   - Textarea: `resize-none` (no ugly drag handle)
   - Better label hierarchy with uppercase tracking

6. **Benefits List**
   - Individual motion animations with stagger
   - Cleaner bullet (1.5px dot vs 2px circle)
   - Better spacing: `space-y-5` and `gap-4`

## Design Principles Enforced

### From Section 3 (Bias Correction)

✅ **Rule 1: Deterministic Typography**
- tracking-tighter on headlines
- max-w-[65ch] for body text
- Proper line height (`leading-[1.1]`, `leading-relaxed`)

✅ **Rule 3: Layout Diversification**
- ANTI-CENTER BIAS enforced (split screen, asymmetric)
- Avoided generic centered hero

✅ **Rule 4: Materiality**
- Rounded-[2rem] and rounded-3xl vs generic rounded-xl
- Diffusion shadows vs harsh drop-shadows
- Glassmorphism with `backdrop-blur-sm`

✅ **Rule 5: Interactive UI States**
- Tactile feedback: `active:translate-y-[1px]`
- Spring physics on success animation
- Proper loading/error states maintained

### From Section 5 (Performance)

✅ **Viewport Stability**
- `min-h-[100dvh]` instead of `h-screen`

✅ **Hardware Acceleration**
- Only animating `transform` and `opacity`
- No `top`, `left`, `width`, `height` animations

### From Section 7 (AI Tells - Forbidden Patterns)

✅ **NO Centered Hero** (when DESIGN_VARIANCE > 4)
✅ **NO 3-Column Card Layouts** (used asymmetric 2-column instead)
✅ **NO Generic Shadows** (diffusion shadow instead)
✅ **NO Oversized H1s** (controlled with weight and hierarchy)

## What Was NOT Changed

- **Color palette** - Kept existing design system (zinc/slate neutral base)
- **Brand voice** - Kept existing copy unchanged
- **Animation intensity** - Conservative per MOTION_INTENSITY: 3
- **Existing components** - Only upgraded Hero and Contact sections
- **Font stack** - Using existing fonts (didn't force Geist/Satoshi since not specified in package.json)

## Mobile Responsiveness

All asymmetric layouts collapse to single column on mobile:
- Hero: `lg:grid-cols-[1.2fr_1fr]` → single column below 1024px
- Contact: `lg:grid-cols-[0.9fr_1.1fr]` → single column below 1024px
- Right visual in hero: `hidden lg:grid` (mobile doesn't see it)

## Performance Considerations

1. All animations use transform/opacity only
2. Spring physics properly configured (stiffness: 200, damping: 15)
3. `min-h-[100dvh]` prevents iOS Safari layout jumping
4. No expensive filters on scrolling containers
5. Proper cleanup in useEffect (not added new effects, maintained existing)

## Next Steps

1. **Test both versions** - Original files still exist as `HeroSection.tsx` and `ContactSection.tsx`
2. **Review upgraded versions** - New files: `HeroSectionUpgraded.tsx`, `ContactSectionUpgraded.tsx`
3. **Update page.tsx** - Switch imports to upgraded versions when ready
4. **Expand to other sections** - Apply same principles to:
   - StatsSection
   - FeaturesSection
   - BenefitsSection
   - FAQSection
5. **Typography audit** - Consider Geist or Satoshi font for premium feel
6. **Color audit** - Ensure consistent palette (zinc vs slate)

## All Sections Upgraded

### StatsSection → StatsSectionUpgraded
- Asymmetric grid: `lg:grid-cols-[1.2fr_0.9fr_0.9fr_1fr]` instead of equal 4-column
- First stat left-aligned, others centered
- Monospace font for numbers (Rule 6: Cockpit Mode)
- tracking-tighter on numbers
- Better easing: `[0.16, 1, 0.3, 1]`

### FeaturesSection → FeaturesSectionUpgraded
- Cards upgraded to `rounded-[2rem]` (32px vs 16px)
- Premium cards have subtle gradient: `from-card to-primary/5`
- Better spring physics: `stiffness: 300, damping: 20`
- Removed shadow-on-hover, uses border transitions instead
- Section labels: uppercase tracking-widest at 11px
- Max-width: `[1400px]` instead of `6xl`

### HowItWorksSection → HowItWorksSectionUpgraded
- Icons larger: 24px in 96px containers with `rounded-[2rem]`
- Badge style: inline rounded-full background
- Connection lines repositioned asymmetrically
- Better spring hover: `stiffness: 400, damping: 20`
- Text max-width: `[32ch]` for better line length

### BenefitsSection → BenefitsSectionUpgraded
- Split layout: `lg:grid-cols-[1.3fr_0.7fr]` (65/35 instead of 100)
- Right column: sticky trust indicator card with stats
- Stats use monospace font
- Card: `rounded-[2rem]` with glassmorphism
- Better spacing between checkmarks: `space-y-6`

### FAQSection → FAQSectionUpgraded
- Asymmetric: `lg:grid-cols-[0.8fr_1.2fr]` (40/60 split)
- Left title column sticky: `lg:sticky lg:top-32`
- Individual FAQ items stagger-animate
- Better accordion hover states
- Border opacity reduced: `border-border/50`

## Files Created

- `/components/landing/HeroSectionUpgraded.tsx` - Split-screen hero
- `/components/landing/ContactSectionUpgraded.tsx` - Asymmetric contact form
- `/components/landing/StatsSectionUpgraded.tsx` - Asymmetric stats grid
- `/components/landing/FeaturesSectionUpgraded.tsx` - Premium card styling
- `/components/landing/HowItWorksSectionUpgraded.tsx` - Larger icons, better spacing
- `/components/landing/BenefitsSectionUpgraded.tsx` - Split layout with trust indicator
- `/components/landing/FAQSectionUpgraded.tsx` - Asymmetric FAQ layout
- `/DESIGN_UPGRADE_NOTES.md` - This file

## Applied to Production

✅ `app/page.tsx` updated to use all upgraded components

All original files remain unchanged for reference.
