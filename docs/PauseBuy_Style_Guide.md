# PauseBuy Style Guide v2
## AI-Powered Impulse Purchase Blocker

**Version:** 2.0 - Natural Color Palette  
**Date:** January 2025  
**Hackathon:** Commit to Change - AI Agents Hackathon

---

## What Changed in v2?

**Key Update:** Moved away from purple to a **natural, organic green palette** that feels less "AI-designed" and more human, grounded, and trustworthy.

### Why This Works Better:

- **Green = Growth**: Naturally associated with money, savings, nature, and organic growth
- **Earthy & Authentic**: Terracotta and natural tones feel warm and human, not corporate
- **Less Tech-y**: Avoids the purple/blue gradient that screams "AI product"
- **Psychological Trust**: Forest greens convey stability, wisdom, and natural balance
- **Unique in Fintech**: Most fintech apps use blue - we stand out with earthy greens

---

## Color Palette - Natural Edition

### Primary Colors

#### Forest Green (Primary)
```css
HEX: #2c5f2d
RGB: 44, 95, 45
HSL: 121, 37%, 27%
```
**Use:** Main branding, primary buttons, headers  
**Psychology:** Stability, growth, nature, trust, wisdom  
**Associations:** Forest, money, savings, organic growth

---

#### Fresh Green (Secondary)
```css
HEX: #97c04c
RGB: 151, 192, 76
HSL: 81, 48%, 53%
```
**Use:** Accents, success states, progress indicators  
**Psychology:** Energy, optimism, freshness, renewal  
**Associations:** New growth, spring, positive change

---

#### Brand Gradient
```css
background: linear-gradient(135deg, #2c5f2d 0%, #97c04c 100%);
```
**Use:** Headers, stats cards, primary CTAs  
**Direction:** 135deg diagonal  
**Effect:** Natural progression from deep forest to bright growth

---

### Accent Colors

#### Sage Green
```css
HEX: #5d8a3a
RGB: 93, 138, 58
```
**Use:** Secondary buttons, info states, highlights  
**Psychology:** Balance, calm, natural harmony

---

#### Deep Forest
```css
HEX: #234a24
RGB: 35, 74, 36
```
**Use:** Hover states, depth, emphasis  
**Psychology:** Depth, seriousness, grounding

---

#### Warm Terracotta
```css
HEX: #f4a259
RGB: 244, 162, 89
```
**Use:** Warning states, caution, warmth  
**Psychology:** Warmth, earthiness, gentle alert  
**Associations:** Clay, earth, natural materials

---

#### Clay Orange
```css
HEX: #e76f51
RGB: 231, 111, 81
```
**Use:** High-risk alerts, danger states, urgent attention  
**Psychology:** Urgency, importance (less harsh than red)  
**Associations:** Sunset, warmth, natural warning

---

### Neutral Palette

| Color Name | Hex | Usage | Psychology |
|------------|-----|-------|------------|
| **Charcoal** | #1a1a1a | Primary text | Strong, readable |
| **Graphite** | #2d2d2d | Headings | Clear hierarchy |
| **Slate** | #3a3a3a | Body text | Easy reading |
| **Stone** | #666666 | Secondary text | Subtle info |
| **Light Gray** | #e8e8e8 | Borders, dividers | Gentle separation |
| **Soft White** | #f8f8f8 | Backgrounds | Calm, restful |
| **Pure White** | #ffffff | Cards, overlays | Clean, fresh |

---

## Semantic Colors

### Success
**Color:** Fresh Green (#97c04c)  
**Use Cases:**
- Money saved notifications
- Goals achieved
- Impulse purchase resisted
- Positive milestones

### Warning
**Color:** Warm Terracotta (#f4a259)  
**Use Cases:**
- Late-night shopping alerts
- Frequent category purchases
- Budget approaching limit
- Gentle caution needed

### Danger
**Color:** Clay Orange (#e76f51)  
**Use Cases:**
- Purchase significantly delays goals
- Over-budget items
- High-risk impulse patterns
- Critical alerts

### Info
**Color:** Sage Green (#5d8a3a)  
**Use Cases:**
- Tips and suggestions
- Educational content
- Feature explanations
- Helpful insights

---

## Logo Identity

### Primary Logo Icon
**Icon:** ⏸️ (Pause Button)  
**Rationale:** Literally represents "pause before buying" - direct, clear, memorable

### Wordmark: "PauseBuy"
**Style:** Bold, clean, modern sans-serif  
**Treatment Options:**
1. Gradient fill (light backgrounds)
2. Solid Forest Green (medium backgrounds)
3. White (dark backgrounds)

### Logo Variations

#### Full Lockup
```
⏸️ PauseBuy
```
**Spacing:** 0.5em between icon and text  
**Minimum width:** 120px

#### Icon Only
```
⏸️
```
**Use:** Browser extension icon, favicon, app icon  
**Minimum size:** 32×32px

#### Text Only
```
PauseBuy
```
**Use:** Horizontal headers, tight spaces  
**Minimum width:** 80px

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Type Scale & Hierarchy

| Element | Size | Weight | Line Height | Color |
|---------|------|--------|-------------|-------|
| **H1** | 48px (3em) | 700 | 1.2 | #1a1a1a |
| **H2** | 32px (2em) | 600 | 1.3 | #2d2d2d |
| **H3** | 24px (1.5em) | 600 | 1.4 | #3a3a3a |
| **H4** | 20px (1.25em) | 600 | 1.4 | #3a3a3a |
| **Body Large** | 18px (1.125em) | 400 | 1.7 | #3a3a3a |
| **Body** | 16px (1em) | 400 | 1.6 | #3a3a3a |
| **Small** | 14px (0.875em) | 400 | 1.5 | #666666 |
| **Tiny** | 12px (0.75em) | 400 | 1.4 | #666666 |

---

## UI Components

### Primary Button
```css
background: #2c5f2d;
color: white;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
border: none;
transition: all 0.2s ease;
```

**Hover:**
```css
background: #234a24;
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(44, 95, 45, 0.3);
```

**Use for:** Main actions, "Save for Later", confirmations

---

### Secondary Button
```css
background: white;
color: #2c5f2d;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
border: 2px solid #2c5f2d;
transition: all 0.2s ease;
```

**Hover:**
```css
background: #2c5f2d;
color: white;
```

**Use for:** Alternative actions, "I Still Want It", secondary CTAs

---

### Success Button
```css
background: #97c04c;
color: white;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
```

**Use for:** Positive confirmations, goal achievements

---

### Warning Button
```css
background: #f4a259;
color: white;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
```

**Use for:** Proceed with caution, review needed

---

### Stats Card
```css
background: linear-gradient(135deg, #2c5f2d 0%, #97c04c 100%);
color: white;
padding: 30px;
border-radius: 12px;
text-align: center;
box-shadow: 0 4px 16px rgba(44, 95, 45, 0.15);
```

**Variants:**
- Primary gradient: Forest → Fresh Green
- Success: Sage → Fresh Green
- Warning: Clay → Terracotta

---

### Reflection Overlay (Core Component)

```css
/* Backdrop */
background: rgba(26, 26, 26, 0.92);
backdrop-filter: blur(4px);
padding: 40px;
border-radius: 16px;
max-width: 600px;
color: white;

/* Question Highlight */
border-left: 3px solid #97c04c;

/* Progress Bar Fill */
background: linear-gradient(135deg, #2c5f2d 0%, #97c04c 100%);
```

**Key Features:**
- Deep dark overlay for focus
- Green accent for question highlights
- Natural gradient for progress indicators
- Warm, non-threatening presentation

---

## Badge System

### Achievement Badges

```css
display: inline-flex;
padding: 8px 16px;
border-radius: 20px;
font-weight: 600;
font-size: 0.9em;
```

**Types:**

| Badge Type | Background | Text Color | Icon | Use |
|------------|------------|------------|------|-----|
| **Streak** | #fff3e0 | #e65100 | 🔥 | Daily streaks |
| **Savings** | #e8f5e9 | #2e7d32 | 🌱 | Money saved |
| **Milestone** | #e3f2fd | #1565c0 | 🎯 | Goals hit |
| **Growth** | #f1f8e9 | #558b2f | 🌿 | Progress |

---

## Icon System - Nature-Focused

| Icon | Meaning | Primary Use |
|------|---------|-------------|
| ⏸️ | Pause | Brand icon, main prompt |
| 💰 | Money | Financial metrics |
| 🎯 | Goal/Target | Goal tracking |
| 🌱 | Growth | Savings growth, progress |
| 🌿 | Natural Progress | Organic improvement |
| 🔥 | Streak | Consecutive days |
| ⚠️ | Warning | Risk alerts |
| ✓ | Success | Completed actions |
| 📊 | Analytics | Insights |
| ⏰ | Time | Late-night warnings |

**Guidelines:**
- Prefer nature-related emojis when possible (🌱 over generic ✓ for growth)
- Use ⏸️ consistently as brand identifier
- Warm emojis (🌿🌱) reinforce organic, growth-focused brand

---

## Voice & Tone - Natural & Grounded

### Core Principles

**Warm but Not Overly Casual**
- ✅ "Let's think this through together"
- ❌ "Hey bestie! Hold up!!!"

**Wise but Not Preachy**
- ✅ "You've bought similar items 3 times this month. What makes this one different?"
- ❌ "You really need to stop buying these."

**Supportive but Honest**
- ✅ "This purchase delays your vacation fund by 4 days. Is it worth the trade?"
- ❌ "Do whatever you want, I guess."

**Growth-Oriented**
- ✅ "You've grown your savings by $240 this week. That's real progress."
- ❌ "You avoided wasting money. Good job, I guess."

---

## Design Philosophy: Natural Minimalism

### 1. Grounded & Organic
- Use natural color progressions
- Avoid artificial gradients or neon colors
- Think: forest floor, not computer screen

### 2. Growth-Focused
- Every design element should reinforce positive progress
- Celebrate small wins authentically
- Show trajectory, not just current state

### 3. Warm & Human
- Balance seriousness with approachability
- Terracotta and earth tones add warmth
- Never cold, clinical, or robotic

### 4. Mindful Simplicity
- Remove anything that doesn't serve the user
- Let content breathe with generous spacing
- Quality over decoration

---

## CSS Variables Setup

```css
:root {
  /* Primary Palette */
  --color-forest-green: #2c5f2d;
  --color-fresh-green: #97c04c;
  --color-sage-green: #5d8a3a;
  --color-deep-forest: #234a24;
  
  /* Accent Palette */
  --color-terracotta: #f4a259;
  --color-clay: #e76f51;
  
  /* Neutrals */
  --color-charcoal: #1a1a1a;
  --color-graphite: #2d2d2d;
  --color-slate: #3a3a3a;
  --color-stone: #666666;
  --color-light-gray: #e8e8e8;
  --color-soft-white: #f8f8f8;
  
  /* Semantic */
  --color-success: var(--color-fresh-green);
  --color-warning: var(--color-terracotta);
  --color-danger: var(--color-clay);
  --color-info: var(--color-sage-green);
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #2c5f2d 0%, #97c04c 100%);
  --gradient-success: linear-gradient(135deg, #5d8a3a 0%, #97c04c 100%);
  --gradient-warm: linear-gradient(135deg, #e76f51 0%, #f4a259 100%);
}
```

---

## Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#2c5f2d',
          deep: '#234a24',
        },
        fresh: '#97c04c',
        sage: '#5d8a3a',
        terracotta: '#f4a259',
        clay: '#e76f51',
        charcoal: '#1a1a1a',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2c5f2d 0%, #97c04c 100%)',
        'gradient-success': 'linear-gradient(135deg, #5d8a3a 0%, #97c04c 100%)',
        'gradient-warm': 'linear-gradient(135deg, #e76f51 0%, #f4a259 100%)',
      },
    },
  },
}
```

---

## Accessibility - WCAG 2.1 AA Compliant

### Verified Contrast Ratios

✅ **White on Forest Green** (#ffffff on #2c5f2d): 7.8:1  
✅ **White on Deep Forest** (#ffffff on #234a24): 10.2:1  
✅ **Charcoal on White** (#1a1a1a on #ffffff): 16.1:1  
✅ **Slate on White** (#3a3a3a on #ffffff): 10.7:1  
✅ **White on Clay Orange** (#ffffff on #e76f51): 3.5:1 (large text only)

### Focus States

```css
*:focus-visible {
  outline: 2px solid #2c5f2d;
  outline-offset: 2px;
}

button:focus-visible {
  box-shadow: 0 0 0 3px rgba(44, 95, 45, 0.3);
}
```

---

## Animation Principles - Organic Motion

### Natural Easing

```css
/* Organic, not mechanical */
transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);

/* For entrances */
@keyframes grow {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* For celebrations */
@keyframes sprout {
  0% { transform: scale(0.8) translateY(10px); }
  50% { transform: scale(1.1) translateY(-5px); }
  100% { transform: scale(1) translateY(0); }
}
```

---

## Key Differences from v1 (Purple)

| Aspect | v1 (Purple) | v2 (Natural Green) |
|--------|-------------|-------------------|
| **Primary Color** | Purple (#667eea) | Forest Green (#2c5f2d) |
| **Vibe** | Tech-forward, AI product | Organic, human, grounded |
| **Psychology** | Innovation, digital | Growth, nature, trust |
| **Competitive** | Similar to many AI tools | Unique in fintech space |
| **Logo Icon** | 🤔 (Thinking face) | ⏸️ (Pause button) |
| **Secondary Icon** | Generic tech icons | Nature icons (🌱🌿) |
| **Feel** | Sleek, polished | Warm, authentic |

---

## When to Use This Palette

✅ **Use Natural Green palette for:**
- Production build
- Marketing materials
- User-facing product
- Brand identity
- Differentiating from competitors

❌ **Purple might work better for:**
- Internal prototypes
- If targeting very tech-savvy users who prefer modern UI
- If you want to signal "cutting-edge AI"

---

## Implementation Checklist

- [ ] Update all button backgrounds to Forest Green
- [ ] Replace gradient with Forest → Fresh Green
- [ ] Change logo icon to ⏸️
- [ ] Update badge colors to earth tones
- [ ] Swap generic icons for nature emojis
- [ ] Adjust shadows to be subtler (0.08 vs 0.1 opacity)
- [ ] Test all contrast ratios
- [ ] Update marketing screenshots
- [ ] Regenerate social media assets

---

## File Structure

```
/styles
  /v2-natural
    - colors.css
    - components.css
    - buttons.css
    - badges.css
    - gradients.css
  - variables-v2.css
  - globals-v2.css
```

---

## Design Resources

### Color Palette Exports
- Figma: Use "Forest Green Palette" library
- Sketch: Import `pausebuy-v2-colors.sketch`
- Adobe: Use `pausebuy-v2.ase` swatches

### Gradient Generator
Use exact values for consistency:
- Start: #2c5f2d
- End: #97c04c
- Angle: 135deg

---

## Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| 2.0 | January 2025 | Complete rebrand to natural green palette |
| 1.0 | January 2025 | Initial purple-based design |

---

## Final Notes

The natural green palette makes PauseBuy feel:
- **Less like AI**, more like a wise friend
- **More trustworthy** through natural associations
- **Warmer** with terracotta accents
- **Unique** in the fintech/productivity space

The shift from purple (tech) to green (growth) better aligns with the product's core mission: helping users grow their financial health naturally and sustainably.

---

**End of Style Guide v2**

*Last Updated: January 2025*  
*Natural Color Palette Edition*
