# Product Requirements Document

# PauseBuy
### AI-Powered Impulse Purchase Blocker

**Browser Extension for Mindful Shopping**

---

**Hackathon:** Commit to Change - AI Agents Hackathon  
**Category:** Financial Health ($5,000)  
**Version:** 1.0 | January 2025

---

## Document Information

| Field | Details |
|-------|---------|
| Product Name | PauseBuy |
| Version | 1.0 (MVP) |
| Target Platform | Chrome Extension (Manifest V3) |
| Hackathon Category | Financial Health ($5,000) |
| Timeline | 3 weeks (January 13 - February 3, 2025) |
| Tech Stack | TypeScript, React, Tailwind CSS, OpenAI GPT-5 Mini, Comet Opik |

---

## 1. Executive Summary

PauseBuy is an AI-powered browser extension that helps users break the cycle of impulse purchasing. By introducing intelligent friction at the moment of purchase, it transforms mindless buying into mindful decision-making. The extension uses conversational AI to understand the emotional and practical context behind purchases, helping users distinguish between genuine needs and impulsive wants.

Unlike simple website blockers or purchase trackers, PauseBuy acts as a thoughtful financial companion that learns your patterns, understands your goals, and intervenes with personalized questions exactly when you need a moment of reflection.

---

## 2. Problem Statement

### 2.1 The Impulse Buying Epidemic

- **88% of impulse purchases** are regretted within a week (Credit Karma, 2023)
- The average American spends **$5,400 annually** on impulse purchases
- **73% of purchases** are made with emotional rather than rational motivations
- E-commerce sites use **dark patterns** (urgency timers, limited stock warnings) to trigger impulsive behavior

### 2.2 Why Existing Solutions Fail

| Solution Type | Why It Fails | PauseBuy Difference |
|---------------|--------------|---------------------|
| Website Blockers | Too rigid; users just disable them | Flexible friction that adapts to context |
| Budgeting Apps | Track spending after the fact | Intervenes before the purchase |
| Wishlist Features | No accountability; easy to ignore | Active engagement with AI coaching |
| Browser Cart Abandonment | Passive; no reflection triggered | Personalized questions force genuine thought |

---

## 3. Target Users

### 3.1 Primary Personas

#### Persona 1: The Stressed Shopper (Sarah)

- **Demographics:** 28-year-old marketing professional
- **Behavior:** Shops online when stressed or bored, especially late at night
- **Pain Point:** Credit card debt growing despite decent income
- **Goal:** Save for a house down payment within 2 years
- **Trigger Categories:** Fashion, home decor, beauty products

#### Persona 2: The Tech Enthusiast (Marcus)

- **Demographics:** 34-year-old software developer
- **Behavior:** Buys gadgets and tech products impulsively
- **Pain Point:** Drawer full of unused gadgets, recurring buyer's remorse
- **Goal:** Only buy tech that genuinely improves life
- **Trigger Categories:** Electronics, gaming, software subscriptions

#### Persona 3: The New Year Resolver (Jamie)

- **Demographics:** 25-year-old recent graduate
- **Behavior:** Made a New Year resolution to be more financially responsible
- **Pain Point:** Good intentions but lacks tools for follow-through
- **Goal:** Build an emergency fund and pay off student loans faster
- **Trigger Categories:** Everything - needs general impulse control help

---

## 4. User Stories & Acceptance Criteria

### 4.1 Core User Stories

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| US1 | As a user, I want the extension to detect when I'm about to make a purchase so it can prompt me to pause. | Extension detects checkout buttons/pages on top 50 e-commerce sites with 95%+ accuracy |
| US2 | As a user, I want to answer reflective questions before buying so I can evaluate if the purchase is truly necessary. | AI generates 2-3 contextual questions within 2 seconds of trigger |
| US3 | As a user, I want to set my financial goals so the AI can reference them in its prompts. | User can set multiple goals with target amounts and dates |
| US4 | As a user, I want to see how this purchase impacts my goals so I can make informed decisions. | Shows goal impact calculation (e.g., "This delays your house fund by 3 days") |
| US5 | As a user, I want to add items to a "cooling off" list instead of buying immediately. | One-click add to 48-hour waiting list with automatic reminder |
| US6 | As a user, I want to track my impulse purchase patterns so I can understand my triggers. | Dashboard shows time-of-day, category, and emotional trigger patterns |
| US7 | As a user, I want the AI to learn my weak spots and provide extra friction for those categories. | After 10+ interactions, AI increases friction for high-risk categories |
| US8 | As a user, I want to celebrate wins when I resist impulse purchases. | Shows money saved, streak counter, and achievement badges |

---

## 5. Feature Specifications

### 5.1 Core Features (MVP)

#### Feature 1: Smart Purchase Detection

**Description:** Automatically detects when user is on a checkout page or clicking a "Buy Now" button

**Detection Methods:**
- URL pattern matching (checkout, cart, payment paths)
- Button text analysis (Buy, Purchase, Pay, Checkout, Place Order)
- DOM analysis for cart totals and payment forms
- Site-specific selectors for major retailers

**Supported Sites (MVP):**
- Amazon, eBay, Walmart, Target, Best Buy, Etsy, Shopify stores, AliExpress, ASOS, Zara, H&M, Nike, Apple Store

---

#### Feature 2: AI Reflection Engine

**Description:** LLM-powered conversational agent that asks personalized reflective questions

**Question Categories:**

| Category | Example Question |
|----------|------------------|
| **Need vs. Want** | "What problem does this solve that you can't solve with something you already own?" |
| **Emotional Check** | "On a scale of 1-10, how stressed are you right now? Sometimes we shop to feel better." |
| **Future Self** | "If you don't buy this, how will you feel about it in 2 weeks?" |
| **Goal Alignment** | "You mentioned saving for [X]. Does this purchase support that goal?" |
| **Practical** | "Where will this item live in your home? Do you have space for it?" |

**Context Awareness:**
- Time of day (late night = higher friction)
- Purchase amount relative to usual spending
- Product category (user's known weak spots)
- Recent purchase history

---

#### Feature 3: Cooling-Off List

**Description:** A 48-hour waiting list for items user decides to pause on

**Functionality:**
- One-click save of product (title, price, URL, image)
- Automatic notification after 48 hours: "Still want this?"
- Price drop alerts (bonus feature)
- Statistics: X% of items were never purchased after cooling off

---

#### Feature 4: Goal-Based Impact Calculator

**Description:** Shows how purchase affects user's financial goals

**Display:**
- "This $150 purchase delays your vacation fund by 5 days"
- "If invested instead, this could be worth $180 in 5 years"
- Visual progress bar showing goal impact

---

#### Feature 5: Analytics Dashboard

**Description:** Insights into user's shopping behavior and progress

**Metrics Tracked:**
- Total money saved (purchases prevented)
- Impulse resistance streak (consecutive days)
- Most triggered categories
- Peak impulse times (heatmap)
- Reflection question effectiveness ratings

---

## 6. Technical Architecture

### 6.1 System Overview

PauseBuy follows a client-heavy architecture with minimal backend requirements, optimized for privacy and speed.

| Component | Technology | Purpose |
|-----------|------------|---------|
| Browser Extension | TypeScript, React, Tailwind CSS | UI, detection logic, local storage |
| AI Service | OpenAI GPT-5 Mini | Generate reflective questions |
| Observability | Comet Opik | LLM tracing, evaluation, optimization |
| Data Storage | Chrome Storage API (local) | User preferences, history, goals |
| Analytics Backend | Vercel Edge Functions | Anonymous aggregated analytics |

### 6.2 Extension Architecture

**Manifest V3 Components:**

| Component | File | Purpose |
|-----------|------|---------|
| Service Worker | `background.ts` | Manages API calls, alarm scheduling, notification triggers |
| Content Script | `content.ts` | DOM analysis, purchase detection, overlay injection |
| Popup | `popup.tsx` | Quick stats, toggle on/off, access to dashboard |
| Options Page | `dashboard.tsx` | Full analytics, goal management, settings |

### 6.3 AI Integration Details

**LLM Selection:** OpenAI GPT-5 Mini (`gpt-5-mini`)

**Rationale:**
- Fast response time (<1 second) for seamless UX
- Very low cost - cheaper than alternatives for sustainable free tier
- Sufficient intelligence for reflection question generation

**Prompt Engineering:**

System prompt includes user's goals, recent history, time context, and product category. Structured to generate 2-3 questions that are empathetic, non-judgmental, and action-oriented.

---

## 7. Comet Opik Integration

Comprehensive observability implementation to qualify for the "Best Use of Opik" prize track.

### 7.1 Tracing Implementation

- **All LLM Calls Traced:** Every OpenAI API call logged with full request/response
- **Span Hierarchy:** Purchase Detection → Context Gathering → Question Generation → User Response
- **Metadata Captured:** Product category, price, time of day, user friction level, outcome (bought/saved)

### 7.2 Evaluation Metrics

| Metric | Measurement | Target |
|--------|-------------|--------|
| Question Relevance | LLM-as-judge scoring (1-5) | Average > 4.0 |
| User Engagement | % of prompts answered vs. dismissed | > 60% engagement rate |
| Prevention Rate | % of triggered purchases prevented | > 30% prevention |
| Latency | Time from trigger to question display | < 2 seconds P95 |
| Cost Efficiency | API cost per intervention | < $0.002 per trigger |

### 7.3 A/B Testing Framework

- **Prompt Variants:** Test different question styles (direct vs. Socratic, emotional vs. practical)
- **Friction Levels:** Test 1 question vs. 2-3 questions vs. full conversation
- **Timing:** Test intervention at "Add to Cart" vs. "Checkout" vs. "Pay Now"

### 7.4 Opik Dashboard Views

- Real-time trace explorer for debugging
- Evaluation score trends over time
- Cost and latency monitoring
- A/B test comparison reports

---

## 8. UI/UX Design

### 8.1 Design Principles

1. **Non-Judgmental:** Never shame the user; be a supportive friend
2. **Minimal Friction for Real Needs:** Quick bypass for genuine purchases
3. **Delightful Rewards:** Celebrate wins with satisfying animations
4. **Transparent:** User always knows why they're seeing the prompt

### 8.2 Key Screens

| Screen | Key Elements |
|--------|--------------|
| **Reflection Overlay** | Semi-transparent overlay on checkout page with AI questions, "Save for Later" and "Proceed Anyway" buttons, goal impact preview |
| **Popup Quick View** | Money saved today/week/month, current streak, cooling-off list count, quick toggle on/off |
| **Dashboard** | Savings chart, pattern heatmap, category breakdown, goal progress, achievement badges |
| **Onboarding** | 3-step setup: financial goals, trigger categories, friction preference level |
| **Cooling-Off List** | Saved items with countdown timers, "Still Want It?" actions, price tracking |

### 8.3 Reflection Overlay Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│                                                           [X]   │
│                                                                 │
│                    🤔 Before you buy...                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Wireless Headphones - $149.99                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Let me ask you a couple of questions:                          │
│                                                                 │
│  1. You already have AirPods. What would these do differently?  │
│                                                                 │
│  2. It's 11:47 PM - are you shopping because you're tired       │
│     or stressed?                                                │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  💰 This delays your vacation fund by 4 days               │  │
│  │  ████████████░░░░░░░░ 62% → 59%                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│     ┌─────────────────┐       ┌─────────────────┐              │
│     │  Save for Later │       │ I Still Want It │              │
│     │    (48 hours)   │       │                 │              │
│     └─────────────────┘       └─────────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Data Model

### 9.1 Local Storage Schema

All user data stored locally via Chrome Storage API for maximum privacy.

```typescript
interface UserProfile {
  id: string;                    // Anonymous UUID
  createdAt: Date;
  settings: {
    frictionLevel: 1 | 2 | 3 | 4 | 5;  // 1 = minimal, 5 = maximum
    enabledSites: string[];
    quietHours: { start: string; end: string } | null;
    notifications: boolean;
  };
}

interface FinancialGoal {
  id: string;
  name: string;                  // "House Down Payment"
  targetAmount: number;          // 50000
  currentAmount: number;         // 12500
  deadline: Date;
  priority: 'high' | 'medium' | 'low';
}

interface TriggerCategory {
  category: string;              // "Electronics"
  riskLevel: 'high' | 'medium' | 'low';
  autoFriction: boolean;         // Increase friction automatically
  totalSpent: number;
  purchaseCount: number;
}

interface PurchaseEvent {
  id: string;
  timestamp: Date;
  product: {
    name: string;
    price: number;
    category: string;
    url: string;
    image?: string;
  };
  site: string;
  outcome: 'bought' | 'saved' | 'cooled_off';
  questionsAsked: string[];
  userResponses: string[];
  reflectionTime: number;        // seconds spent on reflection
}

interface CoolingOffItem {
  id: string;
  product: {
    name: string;
    price: number;
    url: string;
    image?: string;
  };
  savedAt: Date;
  expiresAt: Date;               // Default: 48 hours
  status: 'pending' | 'purchased' | 'expired' | 'deleted';
  priceHistory: { date: Date; price: number }[];
}

interface Achievement {
  id: string;
  type: 'streak' | 'savings' | 'milestone';
  name: string;                  // "First $100 Saved"
  unlockedAt: Date;
  data: Record<string, any>;
}
```

---

## 10. MVP Scope & Timeline

### 10.1 MVP Features (Must Have)

- [ ] Purchase detection on top 10 e-commerce sites
- [ ] AI-powered reflection questions (2-3 per trigger)
- [ ] Single financial goal tracking
- [ ] Basic cooling-off list
- [ ] Popup with savings summary
- [ ] Comet Opik integration for tracing and basic evaluation

### 10.2 Development Timeline (3 Weeks)

| Week | Focus Area | Deliverables |
|------|------------|--------------|
| **Week 1** | Foundation & Detection | Extension scaffold, purchase detection for Amazon/Shopify, basic UI overlay, Opik setup |
| **Week 2** | AI & Core Features | OpenAI GPT-5 Mini integration, prompt engineering, cooling-off list, goal tracking, popup UI |
| **Week 3** | Polish & Evaluation | Dashboard, Opik evaluations, A/B tests, bug fixes, documentation, demo video |

### 10.3 Detailed Week 1 Tasks

```
Day 1-2: Project Setup
├── Initialize Plasmo extension project
├── Configure TypeScript, React, Tailwind
├── Set up Comet Opik account and SDK
└── Create basic extension structure (background, content, popup)

Day 3-4: Purchase Detection
├── Implement URL pattern matching for Amazon
├── Add button text detection (Buy Now, Checkout, etc.)
├── Create site-specific selectors for top 5 sites
└── Test detection accuracy

Day 5-7: Basic UI
├── Design reflection overlay component
├── Implement overlay injection into page
├── Create popup with placeholder stats
└── Add extension icon and basic branding
```

### 10.4 Post-MVP Roadmap

- Firefox and Safari support
- Mobile companion app (iOS/Android)
- Bank account integration for automatic budget awareness
- Social accountability features (share goals with friends)
- Price tracking and deal alerts for cooling-off items
- Therapist/coach mode for severe impulse control issues

---

## 11. Success Metrics

### 11.1 Hackathon Success Criteria

| Metric | Target | Priority |
|--------|--------|----------|
| Working Demo | Functional extension with 3+ sites supported | Critical |
| AI Integration Quality | Contextual questions that feel helpful, not annoying | Critical |
| Opik Implementation | Comprehensive tracing + 2 evaluation metrics | Critical |
| User Experience | Clean UI, smooth interactions, <2s latency | High |
| Demo Video | Compelling 3-minute walkthrough | High |

### 11.2 Product Success Metrics (Post-Launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **User Retention** | 40% DAU/MAU ratio after 30 days | Analytics |
| **Prevention Rate** | >30% of triggered purchases prevented | Event tracking |
| **User Satisfaction** | 4.5+ star rating | Chrome Web Store |
| **Money Saved** | Average $200+/month per user | Self-reported + calculated |
| **Engagement** | >60% of prompts receive responses | Event tracking |

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| User annoyance leading to uninstall | High | High | Adjustable friction levels, easy bypass for genuine needs, learn user patterns |
| E-commerce sites block extension | Medium | Medium | Graceful degradation, generic detection methods, no site modification |
| API costs exceed budget | Medium | Medium | Use GPT-5 Mini model, cache common questions, implement usage limits |
| Detection fails on new sites | High | Low | Generic heuristics + user-reported site requests |
| Privacy concerns | Low | High | All data local, no purchase data sent to servers, transparent policy |
| LLM generates inappropriate questions | Low | Medium | Content filtering, user feedback loop, prompt guardrails |

---

## 13. Appendix

### 13.1 Competitive Analysis

| Competitor | Approach | Weakness | Our Advantage |
|------------|----------|----------|---------------|
| Icebox (Chrome) | Adds items to 30-day list | No AI, no personalization | Intelligent questions, goal tracking |
| Rakuten/Honey | Find deals, not prevent purchases | Encourages more buying | Opposite goal - mindful spending |
| YNAB/Mint | Post-purchase tracking | No real-time intervention | Intervenes before purchase |
| Website Blockers | Block entire sites | Too restrictive, easily bypassed | Contextual friction, not blocking |
| Impulse Blocker | Simple delay timer | No intelligence, no learning | AI-powered, learns patterns |

### 13.2 Sample Prompt Template

```
SYSTEM PROMPT:
You are a supportive financial wellness companion helping users make 
mindful purchase decisions. Your tone is warm, curious, and 
non-judgmental - like a thoughtful friend who wants the best for them.

Guidelines:
- Never shame or criticize the user
- Ask questions that promote genuine reflection
- Be brief - 2-3 questions maximum
- Reference their specific goals when relevant
- Consider time of day and emotional context
- End with an empowering choice, not a command

USER CONTEXT:
- Product: {product_name}
- Price: ${price}
- Category: {category}
- Current time: {time_of_day}
- User's primary goal: {goal_name} - ${goal_amount} by {goal_date}
- Goal progress: {goal_percent}%
- Recent purchases in this category: {recent_count} in last 7 days
- User's friction preference: {friction_level}/5

Generate 2-3 reflective questions that help the user pause and 
consider this purchase. Focus on need vs want, emotional state, 
and goal alignment. Keep each question under 20 words.

Format as a JSON array of strings.
```

### 13.3 Sample AI Response

```json
{
  "questions": [
    "You bought headphones 3 weeks ago - what would these do that yours can't?",
    "It's almost midnight. Are you shopping because you need this, or because you can't sleep?",
    "This is 3% of your vacation fund. Worth the trade?"
  ],
  "goalImpact": {
    "goalName": "Summer Vacation",
    "delayDays": 4,
    "newProgress": 59
  },
  "riskLevel": "high",
  "reasoning": "Late night purchase, recent similar category buy, high-risk category for user"
}
```

### 13.4 Tech Stack Details

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Extension Framework | Plasmo | React-based, Manifest V3 compatible, great DX |
| Styling | Tailwind CSS | Rapid UI development, small bundle |
| State Management | Zustand | Lightweight, Chrome Storage sync support |
| AI SDK | OpenAI TypeScript SDK | Official SDK, good types |
| Observability | Comet Opik | Required for hackathon, excellent LLM tracing |
| Charts | Recharts | React-native, good for dashboards |
| Build | Vite + TypeScript | Fast builds, excellent type safety |
| Testing | Vitest + Playwright | Unit + E2E coverage |

### 13.5 API Cost Estimation

| Scenario | Triggers/Day | Tokens/Trigger | Daily Cost | Monthly Cost |
|----------|--------------|----------------|------------|--------------|
| Light User | 2 | ~500 | $0.002 | $0.06 |
| Average User | 5 | ~500 | $0.005 | $0.15 |
| Heavy User | 15 | ~500 | $0.015 | $0.45 |

*Based on OpenAI GPT-5 Mini pricing - significantly lower than alternatives*

### 13.6 Privacy Policy Summary

- **No data leaves your device** except AI prompts (anonymized)
- **No purchase history** sent to any server
- **No tracking pixels** or third-party analytics
- **Full data export** available anytime
- **One-click delete** removes all local data
- **Open source** - audit the code yourself

---

## 14. References

- [Chrome Extension Manifest V3 Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [Plasmo Framework](https://docs.plasmo.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [Comet Opik Documentation](https://www.comet.com/docs/opik/)
- [Encode Club Hackathon Details](https://www.encodeclub.com/programmes/comet-resolution-v2-hackathon)

---

*Document Version: 1.0*  
*Last Updated: January 2025*  
*Author: [Your Name]*

---

**End of Document**
