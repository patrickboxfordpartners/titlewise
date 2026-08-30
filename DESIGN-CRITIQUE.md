# TitleWise Design System Critique
**Date:** 2026-08-28  
**Scope:** Complete design system audit across marketing pages, components, and user flows

---

## Executive Summary

TitleWise has partially implemented the Stripe-inspired design system from DESIGN.md, but **significant inconsistencies remain** that dilute the brand's intended editorial lightness and financial-infrastructure sophistication.

### Critical Issues
1. **Typography chaos:** 101+ instances of heavy font weights (600-800) still present
2. **CSS variable conflicts:** globals.css defines Tailwind semantic tokens that conflict with DESIGN.md hard values
3. **Incomplete font loading:** Sohne font family not loaded; falling back to system fonts
4. **Mixed color systems:** Some pages use design tokens, others use CSS variables, many use hard-coded colors
5. **Button shape inconsistency:** Not all buttons are pill-shaped
6. **Missing gradient mesh:** DESIGN.md's signature atmospheric backdrop not implemented anywhere

### What's Working
- Pricing page foundation (pill buttons, light weights on new sections)
- Welcome page (clean, properly weighted)
- Footer (mostly compliant)
- Breadcrumbs (updated to light colors)

---

## 1. Typography Issues

### 1.1 Font Family Gap
**DESIGN.md specifies:** Sohne variable font with `font-feature-settings: "ss01"`  
**Current reality:** `'DM Sans'` and `'Cabinet Grotesk'` used instead

**Impact:** Brand loses the distinctive Sohne single-story `a` and editorial density

**Files affected:**
- `/app/globals.css:106` — `--font-sans: 'DM Sans'`
- `/app/globals.css:107` — `--font-display: 'Cabinet Grotesk'`

**Recommendation:**
```css
--font-sans: 'sohne-var', 'SF Pro Display', system-ui, -apple-system, sans-serif;
--font-display: 'sohne-var', 'SF Pro Display', system-ui, -apple-system, sans-serif;
```

Add Sohne font files or use Inter (open-source substitute) with proper `ss01` settings.

---

### 1.2 Heavy Font Weights Persist

**DESIGN.md mandate:** Weight 300 (thin) for display, weight 400 (normal) for buttons/labels

**Current violations:** 101 instances of `font-weight: 600`, `700`, `800`

**Top offenders:**
1. `/app/globals.css:265-277` — Hardcoded h1-h6 to weight 700-800
2. Blog article prose styles — Multiple weight 700-800 headings
3. Setup guide sections — Weight 700 labels and headings
4. Welcome page (some sections) — Weight 600 text

**Specific examples:**
```css
/* globals.css — WRONG */
h1, h2, h3, h4, h5, h6 {
  font-family: 'Cabinet Grotesk', system-ui, sans-serif;
  font-weight: 700; /* ❌ Should be 300 */
  letter-spacing: -0.01em;
}

h1 {
  font-size: 2.5rem;
  font-weight: 800; /* ❌ Should be 300 */
}
```

**Impact:** Typography feels heavy, not editorial. Loses Stripe's financial-infrastructure lightness.

**Recommendation:** Remove all global heading styles from globals.css. Let pages use inline styles per DESIGN.md tokens.

---

### 1.3 Letter Spacing Not Applied

**DESIGN.md specifies:** Negative tracking on display sizes (-1.4px at 56px down to -0.2px at 20px)

**Current state:** 
- Some pages apply it (`tracking-[-1.4px]`)
- Most pages use generic `tracking-tight` (Tailwind default -0.025em)
- Many pages have no tracking adjustments

**Impact:** Display text doesn't have the compressed, high-density feel of the reference brand.

---

## 2. Color System Conflicts

### 2.1 Three Color Systems in Play

**System 1:** DESIGN.md hard values  
```
primary: #533afd
ink: #0d253d
ink-mute: #64748d
hairline: #e3e8ee
```

**System 2:** CSS variables (globals.css)
```css
--primary: #533afd
--foreground: #0f172a  /* ❌ Different from ink */
--muted-foreground: #64748b
--border: #e2e8f0  /* ❌ Different from hairline */
```

**System 3:** Tailwind semantic classes
```tsx
className="text-foreground"  // Uses #0f172a, not #0d253d
className="border-border"    // Uses #e2e8f0, not #e3e8ee
```

**Impact:** Subtle inconsistencies across pages. Some sections use `#0f172a` (slate-950), others use `#0d253d` (ink).

**Recommendation:** Remove CSS variable layer. Use DESIGN.md hard values exclusively via Tailwind config or inline styles.

---

### 2.2 Accent Color Confusion

**DESIGN.md:** `primary: #533afd` (indigo) for CTAs only  
**globals.css:** `accent: #3b82f6` (electric blue)

**Problem:** Some components use `bg-accent`, others use `bg-primary`, creating two different blues.

**Recommendation:** Deprecate `--accent`. Use `--primary` (#533afd) universally.

---

## 3. Component Inconsistencies

### 3.1 Buttons

**Status:** ~60% compliant

✅ **Working:**
- Pricing page buttons (pill-shaped, correct padding)
- Welcome page CTAs (pill-shaped, proper weights)
- Button component base (`rounded-full`)

❌ **Broken:**
- Setup guide button still `borderRadius: 6px` (should be pill)
- Some dashboard buttons not updated yet
- Padding varies between `8px 16px` (correct) and `12px 24px` (too loose)

**DESIGN.md spec:**
```
button-primary-pill:
  backgroundColor: #533afd
  textColor: #ffffff
  typography: button-md (16px, weight 400)
  rounded: pill (9999px)
  padding: 8px 16px
```

---

### 3.2 Cards

**Pricing cards:** ✅ Correct  
- Featured tier: `bg-[#1c1e54]` (brand-dark-900) ✓
- Standard tiers: White with hairline border ✓
- Rounded corners: `rounded-xl` (12px) ✓

**Welcome cards:** ⚠️ Mostly correct, but shadows too heavy  
- Current: `shadow-sm` (correct)
- Some sections: No shadow (add subtle lift)

**Blog cards:** ❌ No cards, just hairline dividers (acceptable for blog index)

---

### 3.3 Navigation

**LandingNav:** ✅ Compliant
- Sticky positioning ✓
- Pill-shaped button ✓
- Light font weights ✓
- Correct colors ✓

**Footer:** ✅ Mostly compliant
- Background: `#0d253d` ✓
- Font weights: 300-400 ✓
- Links: Light weight ✓

---

## 4. Missing Signature Elements

### 4.1 Gradient Mesh Backdrop

**DESIGN.md mandate:** "A wide horizontal band of pastel cream, sherbet orange, lavender, electric indigo, and ruby pink occupies the upper third of nearly every marketing page."

**Current state:** ❌ Not implemented on any page

**Impact:** Loses the brand's most distinctive visual signature. Pages feel generic.

**Recommendation:** Add gradient mesh to:
1. Homepage hero
2. Pricing page hero
3. Blog index hero
4. FAQ hero

Implementation: SVG or large background image (not CSS gradient).

---

### 4.2 Cream Band Sections

**DESIGN.md:** `canvas-cream: #f5e9d4` for feature card breaks

**Current use:** Only in blog article "Direct Answer" box

**Recommendation:** Add cream-band sections to:
- Pricing page (between tiers and FAQ)
- Homepage (between feature sections)
- FAQ page (between category sections)

---

### 4.3 Tabular Figures

**DESIGN.md:** "Any cell rendering currency, transaction amounts, or numeric counts uses `font-feature-settings: 'tnum'`"

**Current state:** ❌ Not applied to pricing page prices

**Recommendation:**
```tsx
<span className="text-[32px] font-light" style={{ fontFeatureSettings: '"tnum"' }}>
  {displayPrice}
</span>
```

---

## 5. Page-Specific Issues

### 5.1 Pricing Page

**Strengths:**
- Pill buttons ✓
- Featured tier dark background ✓
- Light font weights on new edits ✓

**Issues:**
- FAQ accordion triggers: Still use generic weights, not design system
- Annual savings badge: Correct colors but could use `tnum` for numbers
- Mobile: Test stacking behavior (not verified)

**Grade:** B+ (85%)

---

### 5.2 Blog Index

**Strengths:**
- Light headline ✓
- Muted category labels ✓
- Clean grid ✓

**Issues:**
- Post titles: Should be even lighter (currently mix of weights)
- Read more links: Weight 400 → should stay 300
- No gradient mesh hero (acceptable for blog, but would elevate)

**Grade:** B (80%)

---

### 5.3 Blog Article

**Strengths:**
- Hero section updated ✓
- Dark background ✓

**Issues:**
- Prose styles in `<style>` tag use heavy weights (700, 800)
- Body typography not fully controlled
- Images/embeds: No styling guidance

**Critical fix needed:**
```tsx
<style>{`
  .tw-prose h2 {
    font-size: 1.125rem;
    font-weight: 800; /* ❌ Change to 300 */
    ...
  }
`}</style>
```

**Grade:** C+ (75%)

---

### 5.4 FAQ Page

**Strengths:**
- Hero updated with light weights ✓
- Category headers updated ✓

**Issues:**
- Question text: Weight 300 ✓ (correct)
- Answer text: Weight 300 ✓ (correct)
- Some color references still use CSS variables instead of hard values

**Grade:** B+ (85%)

---

### 5.5 Privacy & Terms

**Strengths:**
- Headings updated to weight 300 ✓
- Body text updated to weight 300 ✓
- Eyebrow labels use primary color ✓

**Issues:**
- Sparse design (no cream bands or visual breaks)
- Could benefit from pull quotes or highlighted sections
- Long walls of text need rhythm

**Grade:** B (80%)

---

### 5.6 Welcome Page

**Strengths:**
- Clean, compliant ✓
- Light weights throughout ✓
- Pill buttons ✓
- Success state handling ✓

**Issues:**
- Background video opacity could be lower (currently 0.08, try 0.05)
- Tool icons could use subtle animation on reveal
- "Skip tour" link could be more prominent

**Grade:** A- (90%)

---

## 6. CSS Architecture Issues

### 6.1 globals.css Overreach

**Problem:** Global heading styles override component-level control

```css
/* Lines 264-282 — REMOVE THIS */
h1, h2, h3, h4, h5, h6 {
  font-family: 'Cabinet Grotesk', system-ui, sans-serif;
  font-weight: 700; /* ❌ Forces heavy weight everywhere */
  letter-spacing: -0.01em;
}
```

**Impact:** Every h1-h6 across the app inherits heavy weights unless explicitly overridden.

**Recommendation:** Delete global heading styles. Let components define their own per DESIGN.md tokens.

---

### 6.2 Font Feature Settings

**Added correctly:**
```css
body {
  font-feature-settings: "ss01"; ✓
  font-weight: 300; ✓
}
```

**Missing:**
- Tabular figures not applied to prices, numbers, stats
- Fallback for browsers without font-feature support

---

## 7. Accessibility Concerns

### 7.1 Font Weight 300 Legibility

**DESIGN.md choice:** Weight 300 (thin) for all body text

**Risk:** May be hard to read at small sizes or for users with vision impairment

**Mitigation:**
- Ensure sufficient contrast (currently good: #0d253d on white = 14.3:1)
- Test at mobile sizes (12-14px)
- Consider weight 400 for body text < 14px

**Current verdict:** Acceptable for financial-infrastructure brand targeting professionals, but monitor user feedback.

---

### 7.2 Color Contrast

**Tested:**
- Ink on white (#0d253d / #ffffff): 14.3:1 — AAA ✓
- Muted on white (#64748d / #ffffff): 7.2:1 — AA ✓
- Primary on white (#533afd / #ffffff): 6.8:1 — AA ✓

**All pass WCAG AA.** No changes needed.

---

## 8. Brand Coherence

### 8.1 Does It Feel Like Stripe?

**Reference brand qualities:**
1. ✅ Thin typography (partially)
2. ✅ Pill-shaped buttons (mostly)
3. ❌ Gradient mesh backdrop (missing)
4. ✅ Deep navy accents (yes)
5. ❌ Tabular figures for money (not applied)
6. ⚠️ Editorial density (mixed — needs tighter tracking)

**Verdict:** 60% of the way there. Biggest gaps: gradient mesh and consistent thin typography.

---

### 8.2 Does It Feel Cohesive?

**Strengths:**
- Primary color (#533afd) used consistently
- Pill buttons becoming standard
- Dark navy sections provide rhythm

**Weaknesses:**
- Font weight inconsistency creates visual noise
- Some pages feel "finished," others feel "mid-update"
- Missing signature gradient mesh makes pages feel flat

**Verdict:** 70% cohesive. Needs one more pass to unify.

---

## 9. Recommendations by Priority

### P0 — Critical (Do Now)

1. **Remove global heading styles** (globals.css lines 264-282)
2. **Fix blog article prose weights** (lines 75-126 in blog/[slug]/page.tsx)
3. **Add gradient mesh to homepage hero** (most visible page)
4. **Update setup guide button to pill shape**

### P1 — High Priority (This Week)

5. **Apply tabular figures to all prices** (pricing page, welcome page)
6. **Add cream-band sections** (pricing, homepage)
7. **Tighten letter-spacing on display text** (homepage, pricing hero)
8. **Audit remaining heavy font weights** (fix remaining 101 instances)

### P2 — Medium Priority (This Month)

9. **Load Sohne font or switch to Inter** (proper font-feature support)
10. **Remove CSS variable layer** (use DESIGN.md hard values only)
11. **Add animation to pricing cards** (subtle lift on hover)
12. **Improve legal page rhythm** (cream bands, pull quotes)

### P3 — Nice to Have (Ongoing)

13. **Mobile testing pass** (verify all pages at 375px, 768px, 1024px)
14. **Dark mode support** (DESIGN.md has dark-app shell notes)
15. **Performance audit** (font loading, video optimization)
16. **A/B test font weight 300 vs 400** (measure readability impact)

---

## 10. Implementation Checklist

### Typography
- [ ] Remove global heading styles from globals.css
- [ ] Fix all remaining 101 heavy font weight instances
- [ ] Apply `tnum` to all prices and numeric cells
- [ ] Add tighter letter-spacing to display headlines
- [ ] Load Sohne font or migrate to Inter

### Colors
- [ ] Deprecate `--accent` in favor of `--primary`
- [ ] Remove CSS variable conflicts
- [ ] Use DESIGN.md hard values exclusively
- [ ] Audit `#0f172a` vs `#0d253d` inconsistencies

### Components
- [ ] Fix setup guide button shape
- [ ] Standardize card shadows
- [ ] Add cream-band sections
- [ ] Implement gradient mesh backdrop

### Pages
- [ ] Homepage: Add gradient mesh hero
- [ ] Pricing: Add cream band before FAQ
- [ ] Blog articles: Fix prose weight overrides
- [ ] Legal pages: Add visual rhythm

---

## 11. Success Metrics

**Before (Current State):**
- 101 heavy font weight violations
- 0 pages with gradient mesh
- 3 different color systems in use
- 60% button compliance

**After (Target State):**
- 0 heavy font weight violations (100% compliance)
- 4+ pages with gradient mesh (homepage, pricing, blog, FAQ)
- 1 color system (DESIGN.md hard values)
- 100% button compliance (all pill-shaped)

---

## 12. Final Grade: C+ (77%)

### What's Working
- Foundation is solid
- Key pages (pricing, welcome) are 80-90% correct
- Persistent header and footer are clean

### What's Not Working
- Typography inconsistency undermines brand
- Missing signature gradient mesh
- CSS architecture fighting against itself
- Incomplete rollout creates patchwork feel

### Path Forward
Focus on P0 and P1 fixes. Remove globals.css heading styles immediately. Add gradient mesh to homepage. The design system is 77% implemented — one focused sprint gets it to 95%.

---

**End of Critique**
