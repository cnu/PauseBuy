# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PauseBuy is an AI-powered Chrome extension that helps users resist impulse purchases by introducing intelligent friction at checkout. It uses OpenAI GPT-5 Mini API to generate contextual reflective questions when users are about to buy something.

**Status:** Active development - extension scaffold complete

## Repository Structure

```
PauseBuy/
├── extension/              # Chrome extension (Plasmo)
│   ├── src/
│   │   ├── popup.tsx       # Extension popup UI
│   │   ├── options.tsx     # Dashboard/options page
│   │   ├── background.ts   # Service worker
│   │   ├── contents/       # Content scripts
│   │   └── style.css       # Shared styles
│   ├── assets/             # Icons, images
│   ├── package.json
│   └── tsconfig.json
├── backend/                # Vercel Edge Functions
│   ├── api/
│   │   └── generate.ts     # OpenAI GPT-5 Mini proxy endpoint
│   ├── lib/
│   │   └── validate.ts     # Zod request validation
│   ├── package.json
│   └── vercel.json
├── docs/                   # Planning documents
│   ├── PauseBuy_PRD.md
│   ├── PauseBuy_Technical_Architecture.md
│   └── PauseBuy_Style_Guide.md
├── images/                 # Brand assets
└── .beads/                 # Issue tracking
```

## Build Commands

### From Root (pnpm workspace)
```bash
pnpm install          # Install all workspace dependencies
pnpm build            # Build extension
pnpm build:all        # Build all packages
pnpm test             # Run all tests
pnpm lint             # Lint all packages
```

### Extension
```bash
cd extension
pnpm dev              # Development mode with hot reload
pnpm build            # Production build → extension/build/chrome-mv3-prod/
pnpm test             # Run tests (Vitest)
pnpm lint             # Lint code
```

### Backend
```bash
cd backend
pnpm dev              # Local dev server (Vercel CLI)
pnpm deploy           # Deploy to Vercel
```

### Loading Extension in Chrome
1. Run `pnpm build` in `extension/`
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `extension/build/chrome-mv3-prod/`

## Tech Stack

| Component | Technology |
|-----------|------------|
| Extension Framework | Plasmo (Manifest V3) |
| Language | TypeScript (strict mode) |
| UI | React 18 + Tailwind CSS |
| State | Zustand + Chrome Storage |
| AI | OpenAI GPT-5 Mini via proxy |
| Backend | Vercel Edge Functions |
| Validation | Zod schemas |
| Observability | Comet Opik |

## Architecture Overview

### Client-Heavy with Proxy Backend
- All user data stored locally via Chrome Storage API (privacy-first)
- LLM calls route through Vercel Edge proxy (API key never exposed to client)
- Only anonymized context sent to proxy (no PII, URLs, or goal amounts)

### Extension Components (Manifest V3)
- `background.ts` - Service worker: API calls, alarms, message routing
- `contents/detector.ts` - Content script: DOM analysis, purchase detection
- `popup.tsx` - Quick stats, toggle, cooling-off list preview
- `options.tsx` - Full analytics dashboard, goal management, settings

### Purchase Detection Pipeline
Multi-stage confidence scoring (URL patterns + button text + DOM analysis). Threshold of 60+ triggers the reflection overlay. Site-specific configs for major retailers (Amazon, Shopify, eBay, etc.).

### Privacy Model
- **Local storage:** Full purchase history, financial goals, settings
- **Sent to proxy:** Product name, price, category, time of day, goal name (no amount)
- **Never sent:** URLs, browsing history, PII, goal amounts

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
- Logo icon: ⏸️ Pause button
- Tone: Warm, supportive, non-judgmental
- Nature-focused icons (🌱🌿) over generic symbols

## Issue Tracking

This project uses **beads** (`bd`) for issue tracking.

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
