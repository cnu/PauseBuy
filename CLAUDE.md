# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PauseBuy is an AI-powered Chrome extension that helps users resist impulse purchases by introducing intelligent friction at checkout. It uses Claude API to generate contextual reflective questions when users are about to buy something.

**Status:** Pre-development (planning documents complete, no code yet)

## Tech Stack (Planned)

- **Extension Framework:** Plasmo (React-based, Manifest V3)
- **Language:** TypeScript
- **UI:** React + Tailwind CSS
- **State:** Zustand with Chrome Storage sync
- **AI:** Claude 3 Haiku via proxy backend
- **Backend:** Vercel Edge Functions (proxy for API calls)
- **Observability:** Comet Opik for LLM tracing
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Validation:** Zod schemas

## Architecture Overview

### Client-Heavy with Proxy Backend
- All user data stored locally via Chrome Storage API (privacy-first)
- LLM calls route through Vercel Edge proxy (API key never exposed to client)
- Only anonymized context sent to proxy (no PII, URLs, or goal amounts)

### Extension Components (Manifest V3)
- `background.ts` - Service worker: API calls, alarms, message routing
- `content.ts` - Content script: DOM analysis, purchase detection, overlay injection
- `popup.tsx` - Quick stats, toggle, cooling-off list preview
- `dashboard.tsx` - Full analytics, goal management, settings

### Planned Directory Structure
```
pausebuy/
├── src/
│   ├── background/       # Service worker
│   │   ├── api/          # Proxy client, Opik client
│   │   └── handlers/     # Purchase events, storage ops
│   ├── content/
│   │   ├── detectors/    # Site-specific purchase detection
│   │   ├── extractors/   # Product info extraction
│   │   └── overlay/      # React overlay component
│   ├── popup/            # Extension popup UI
│   ├── dashboard/        # Options page
│   └── shared/           # Types, constants, utils
├── backend/              # Vercel Edge Functions
│   ├── api/
│   │   └── generate.ts   # Claude API proxy
│   └── lib/              # Rate limiting, validation, Opik
└── tests/
```

## Key Design Decisions

### Purchase Detection Pipeline
Multi-stage confidence scoring (URL patterns + button text + DOM analysis). Threshold of 60+ triggers the reflection overlay. Site-specific configs for major retailers (Amazon, Shopify, eBay, etc.).

### Privacy Model
- Local storage: Full purchase history, financial goals, settings
- Sent to proxy: Product name, price, category, time of day, goal name (no amount)
- Never sent: URLs, browsing history, PII, goal amounts

### Rate Limiting
100 requests/day per anonymous client ID, enforced server-side via Vercel KV.

## Style Guide Essentials

### Color Palette (Natural Green Theme)
```css
--color-forest-green: #2c5f2d;  /* Primary */
--color-fresh-green: #97c04c;   /* Secondary/Success */
--color-sage-green: #5d8a3a;    /* Info */
--color-terracotta: #f4a259;    /* Warning */
--color-clay: #e76f51;          /* Danger */
--gradient-primary: linear-gradient(135deg, #2c5f2d 0%, #97c04c 100%);
```

### Brand Identity
- Logo icon: Pause button (literal representation of "pause before buying")
- Tone: Warm, supportive, non-judgmental - like a thoughtful friend
- Nature-focused icons preferred (use growth emojis like plant/seedling over generic checkmarks)

### Voice Guidelines
- Warm but not overly casual
- Wise but not preachy
- Supportive but honest
- Growth-oriented (celebrate progress, not just avoidance)

## Issue Tracking

This project uses **beads** (`bd`) for issue tracking. Issues are stored in `.beads/issues.jsonl`.

```bash
bd ready                              # Find available work
bd show <id>                          # View issue details
bd update <id> --status in_progress   # Claim work
bd close <id>                         # Complete work
bd sync                               # Sync with git
```

## Session Completion Workflow

When ending a work session:
1. File issues for remaining work
2. Run quality gates (tests, linters, builds)
3. Update issue statuses
4. **Push to remote** (mandatory - work is not complete until pushed)
5. Verify with `git status` showing "up to date with origin"

## Reference Documents

- `PauseBuy_PRD.md` - Product requirements, user stories, acceptance criteria
- `PauseBuy_Technical_Architecture.md` - Detailed system design, data flows, API schemas
- `PauseBuy_Style_Guide.md` - Complete design system, components, accessibility
