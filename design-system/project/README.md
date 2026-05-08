# Musketeers Design System — Pitch Deck

## Overview

**Musketeers** is a brand and business solutions company serving entrepreneurs and enterprise clients. Founded from necessity, not a business plan — the brand carries genuine scrappiness, earned credibility, and world-class execution. Today the company covers brand, design, strategy, digital products, SaaS partnerships (via Genesys), and a full suite of business solutions.

**Brand statement:** *Musketeers helps entrepreneurs with versatile solutions, driven by persistent innovation that feels vital to their growth.*

**Primary use case:** This design system is built specifically for **pitch decks** (1920×1080 slides). The visual language follows a massive-typography, minimal-layout approach inspired by modern studio presentations — big headlines dominate, body text is secondary, stats are oversized, and the wordmark sits top-center as a quiet brand anchor.

### Sources Provided
- 6 SVG logo files (full logo, logomark, wordmark — dark and light versions)
- 36 Inter & Inter Display OTF font files (Thin through Black, all weights + italics)
- Brand brief + visual identity direction (provided as text)
- Reference deck inspiration (Aranja studio style)

No codebase, Figma link, or existing UI screenshots were provided. This system was built from the brand brief and logo assets.

---

## Company & Products

**Core offering:** Brand identity, website design, strategy, digital products, SaaS co-launches (via Genesys ecosystem partner), CRM integration (GoHighLevel), funnel building, and AI-powered business operations.

**Three customer archetypes:**
- **The Creator-Entrepreneur** (Kristen, 35) — needs brand + platform + content strategy
- **The Growth-Driven Business Owner** (Eric, 40) — delegates to a trusted ecosystem, wants 20% YoY growth
- **The Visionary Investor-Entrepreneur** (Petric, 45) — personal branding, AI solutions, legacy-building

**Three brand pillars:** Persistent · Vital · Growth

---

## CONTENT FUNDAMENTALS

### Tone & Voice
Bold, confident, and conversational — never corporate. The brand speaks like a smart friend who is also a strategic genius. Direct first, warm underneath. Says what others won't.

### Casing
- Headlines: Title Case or ALL CAPS for maximum impact
- Body copy: Sentence case
- Labels/tags: ALL CAPS with wide tracking
- CTA buttons: Title Case ("Get Started", "Let's Talk")

### Pronouns
We-first brand voice ("We don't stop."), but addresses the reader as "you". Never "I" — this is a team brand.

### Copy Style
- Short sentences. Punchy. No fluff.
- Fragments are fine: "Bold by nature. Built for impact."
- Numbers are written as numerals: "20% growth", not "twenty percent"
- Em-dashes used for rhythm — not parentheses
- Ellipses avoided; conviction doesn't trail off

### Emoji
**Never.** Zero emoji in brand communications. This is a Swiss/modernist brand — clean, structured, intentional.

### Examples
- ✓ "We don't stop. We show up again and again with better ideas and stronger execution."
- ✓ "Not a vendor. A lifeline."
- ✓ "From one designer to a world-class team."
- ✗ "We're here to help you grow your business! 🚀"
- ✗ "Our amazing team of experts..."

---

## VISUAL FOUNDATIONS

### Colors
The palette is radically restrained: **black + white carry 90% of every layout.** Four accent colors appear sparingly, like signals.

| Token | Hex | Usage |
|---|---|---|
| `--color-black` | `#000000` | Primary backgrounds (power moments), text |
| `--color-white` | `#FFFFFF` | Primary backgrounds (clarity), text on dark |
| `--color-red` | `#FC2E12` | Accent — urgency, energy |
| `--color-blue` | `#0D41FF` | Accent — trust, technology |
| `--color-green` | `#30E047` | Accent — growth, success |
| `--color-yellow` | `#FFD81D` | Accent — warmth, optimism |

**The Diversity Stripe:** The four accent colors (+ transitional purple/teal) form a signature gradient stripe — the brand's visual representation of diversity. It appears as:
- A horizontal rule between sections
- Loading/progress animations
- A structural highlight element in the logomark

Use the stripe **selectively**. When it appears, it means something.

### Typography
- **Inter Display** — headlines, display text (weight: Black/ExtraBold/Bold)
- **Inter** — body, UI text, labels (weight: Regular/Medium/SemiBold)
- Headlines dominate: large, unapologetic, tight leading (-0.04em tracking)
- Body copy is secondary support — never competes with the headline
- No serif fonts. No decorative fonts. Swiss International style only.
- Text-wrap: pretty on all headings

### Pitch Deck Type Scale (1920×1080)
| Level | Family | Weight | Size | Tracking | Leading | Usage |
|---|---|---|---|---|---|---|
| Display Hero | Inter Display | Black (900) | 140px | −0.05em | 0.9 | Slide headlines, hero text |
| Display Stat | Inter Display | Black (900) | 200px | −0.05em | 1.0 | Big numbers, metrics |
| Section Title | Inter Display | Black (900) | 96px | −0.04em | 0.95 | Section divider text |
| Statement | Inter Display | Bold (700) | 56px | −0.03em | 1.15 | Quote slides, key messages |
| Heading | Inter Display | ExtraBold (800) | 40px | −0.02em | 1.1 | Sub-headlines, card titles |
| Body | Inter | Regular (400) | 24px | 0em | 1.6 | Supporting text |
| Body Small | Inter | Regular (400) | 18px | 0em | 1.6 | Secondary descriptions |
| Label | Inter | Bold (700) | 11px | 0.12em | 1.4 | Section labels, uppercase |
| Wordmark | SVG asset | — | 16–20px h | — | — | Top-center brand anchor |

**Rule:** Only 2–3 levels appear on any single slide. Headlines dominate — body is pushed to edges.

### Pitch Deck Slide Layouts
8 canonical layout patterns — see `preview/deck-layouts.html`:
1. **Title** — big headline left-aligned, eyebrow above, wordmark top-center
2. **Big Stat** — oversized number centered, small label above
3. **Statement** — large quote text filling the slide, body text in corners
4. **Section Divider** — massive text on black bg, diversity stripe at bottom
5. **Two Column** — headline left, body text right
6. **List** — items with × markers, large text
7. **Content + Image** — text left, image placeholder right
8. **Closing** — wordmark centered on black, stripe at bottom

### Pitch Deck Wordmark Rules
- Wordmark sits **top-center** on every slide — 16–20px height
- Light slides: `wordmark-dark.svg` at full opacity
- Dark slides: `wordmark-light.svg` at 40% opacity
- Never enlarge the wordmark as a headline — it's a quiet brand anchor
- The diversity stripe appears **only on dark section dividers** — 4px bar at the bottom edge

### Layout
- **Grid-driven.** 12-column grid on desktop, 4-column on mobile
- **Generous white space** — breathing room is a design element
- **Black backgrounds** for power/hero moments; white for clarity/content
- **Asymmetry only earns its place** — not decorative asymmetry
- Section dividers = the diversity stripe (4–8px horizontal line)
- Fixed max-content width: 1440px; comfortable content width: 1200px

### Backgrounds
- Flat black or flat white — no gradients on backgrounds
- No textures, no patterns, no grain
- Full-bleed sections are black; they command attention

### Animation & Motion
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (standard Material-style)
- **Duration:** Fast 120ms (micro), Mid 240ms (transitions), Slow 400ms (hero/entrance)
- Fade + translate-Y(8px) for entrance animations
- The diversity stripe animates in loading states (gradient sweep)
- **No bounces.** No spring physics. Clean, confident, intentional.

### Hover & Press States
- **Hover:** `opacity: 0.8` on icons/secondary elements; background shift to `--color-gray-700` on dark CTAs
- **Press/Active:** scale(0.97) + slight brightness reduction
- **Links:** underline on hover only; no color change

### Borders & Corner Radii
- **Sharp corners everywhere** (`border-radius: 0`) is the default — structural, Swiss
- Small radius (`2–4px`) only on interactive elements like buttons and tags
- **No rounded cards.** Cards use borders (`1px solid --color-border`) or elevation only
- Border color: `--color-gray-200` on light; `--color-gray-700` on dark

### Cards
- **On light:** `1px solid #E8E8E8`, `background: white`, optional `box-shadow: 0 4px 16px rgba(0,0,0,0.1)`
- **On dark:** `1px solid #282828`, `background: #0C0C0C` or `#181818`
- No colored left-border accents. No gradient card backgrounds.
- Corner radius: 0 (default) or 4px maximum

### Shadows
Used minimally — structural shadows only, not decorative.
`--shadow-sm` for cards at rest; `--shadow-lg` for modals/overlays.

### Iconography
No icon system was provided. See ICONOGRAPHY section below.

### Imagery
- **Color vibe:** High contrast. Clean product photography or bold editorial.
- Black & white photography works well with the brand
- No warm/Instagram filters; no grain
- Faces should convey confidence and directness

### Transparency & Blur
- Backdrop blur used sparingly for overlays/modals (`blur(20px)`)
- Never for decorative purposes

---

## ICONOGRAPHY

No icon system or icon files were provided with this design system.

**Recommendation:** Use **Lucide Icons** (https://lucide.dev) — clean, 24px, 1.5px stroke, geometric. Matches the Swiss/modernist aesthetic of the brand perfectly.

**Usage rules:**
- Icons are 20–24px in UI contexts
- Never use emoji as icons
- Icon color inherits text color; never accent-colored unless truly semantic (green = success, red = error)
- Icons pair with labels; standalone icons must have `aria-label`

---

## FILE INDEX

```
README.md                  ← You are here
SKILL.md                   ← Agent skill definition
colors_and_type.css        ← All CSS variables, @font-face declarations, base styles

assets/
  logo-full-dark.svg       ← Full logo (logomark + wordmark), dark/black version
  logo-full-light.svg      ← Full logo, light/white version
  logomark-dark.svg        ← Standalone logomark (bracket-M shape + gradient stripe)
  logomark-light.svg       ← Logomark, light version
  wordmark-dark.svg        ← "Musketeers" wordmark only, dark
  wordmark-light.svg       ← "Musketeers" wordmark only, light

fonts/
  Inter-*.otf              ← Inter, all weights (100–900) + italics
  InterDisplay-*.otf       ← Inter Display, all weights + italics

preview/
  deck-typescale.html    ← Pitch deck type hierarchy (1920×1080 scale)
  deck-layouts.html      ← 8 slide layout patterns as mini-slides
  deck-wordmark.html     ← Wordmark placement rules — light & dark
  colors-base.html       ← Black & white + gray scale swatches
  colors-accents.html    ← Red, Blue, Green, Yellow accent swatches
  colors-stripe.html     ← Diversity stripe gradient
  colors-semantic.html   ← Semantic color mapping
  type-display.html      ← Inter Display specimens
  type-body.html         ← Inter body type scale
  type-weights.html      ← Weight scale showcase
  spacing-tokens.html    ← Spacing scale tokens
  spacing-radii.html     ← Radii + shadow tokens
  components-buttons.html  ← Button variants
  components-badges.html   ← Tags, badges, labels
  components-cards.html    ← Card patterns
  components-inputs.html   ← Form input styles
  brand-logos.html         ← Wordmark variants (dark & light)
  brand-stripe.html        ← Diversity stripe usage

ui_kits/website/
  index.html               ← Musketeers website UI kit (homepage + nav + footer)
  Header.jsx               ← Top navigation component
  Hero.jsx                 ← Hero section
  Services.jsx             ← Services grid section
  Footer.jsx               ← Footer component
```
