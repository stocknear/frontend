# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stocknear is an open-source stock analysis platform frontend. Built with SvelteKit 2 (Svelte 5), Tailwind CSS 4, and DaisyUI 5. Uses PocketBase for auth/database and connects to multiple backend services (Fastify REST API, WebSocket server) for financial data.

Not a monorepo — single package with all code in `/src`.

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run check            # Type check (svelte-kit sync + svelte-check)
npm run check:watch      # Type check in watch mode
npm run lint             # Check formatting (Prettier)
npm run format           # Auto-format (Prettier)
npm run test             # Playwright E2E tests
npm run test:unit        # Vitest unit tests
npm run test:chrome      # Chromium-only E2E tests
```

Before building, Paraglide i18n must be compiled:
```bash
npx @inlang/paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide
```

Production deployment uses PM2 — see `deploy.sh`.

## Local Development with Mock Data

The app normally requires live backend services (API, PocketBase, WebSocket). For local frontend development without real backends, a mock data system is available using XOM (Exxon Mobil) fixture data.

### Quick Start

```bash
npm install
make dev-mock
```

This regenerates the fixture JSON and starts the dev server at `http://localhost:5173`. Navigate to `/stocks/XOM/financials` to see the mock data in action.

### How It Works

1. **CSV fixtures** in `fixtures/` contain real XOM financial data (income statement, balance sheet, cash flow, ratios — both annual and quarterly)
2. **`scripts/generate-mock-data.js`** converts the CSVs into `fixtures/mock/xom.json` with the camelCase property names the app expects
3. **`src/lib/server/mock.ts`** provides `getMockFinancialStatement()` and `getMockBulkData()` functions that return the fixture data
4. When `VITE_MOCK_DATA=true`, `hooks.server.ts` skips PocketBase auth and sets a mock Pro user, and the `+page.server.ts` loaders return fixture data instead of calling the API

### Make Targets

```bash
make dev-mock    # Generate fixtures + start dev server with mock data
make mock-data   # Just regenerate fixtures/mock/xom.json from CSVs
make dev         # Normal dev server (requires real .env)
```

### What's Covered

Mock data currently supports the financials pages:
- `/stocks/XOM/financials` (Income Statement)
- `/stocks/XOM/financials/balance-sheet`
- `/stocks/XOM/financials/cash-flow`
- `/stocks/XOM/financials/ratios`

Each page supports Annual, Quarterly, and TTM tabs. Other stock pages (Overview, Statistics, etc.) will load but won't have mock data for their specific API calls.

### Adding Mock Data for New Pages

To mock a new endpoint, add a handler in `src/lib/server/mock.ts` and add a `locals.useMockData` early-return in the relevant `+page.server.ts` or `+layout.server.ts`.

## Gotchas

- **`node_modules` may be empty** — always run `npm install` before builds or type checks.
- **Production build requires `DISCORD_BOT_TOKEN`** — the build will fail on `src/routes/api/discord-assign-role/+server.ts` without it. This is a pre-existing issue unrelated to other features.
- **Financial data expects `fiscalYear` as a string** — components like `FinancialSection.svelte` call `.slice()` on it. If you're creating mock data or transforming API responses, ensure `fiscalYear` is a string, not a number.
- **Nested layout at `/stocks/[tickerID]/financials/+layout.server.ts`** — fetches `/profile` for all financials sub-pages. Easy to miss when mocking data since there are two layout levels (`[tickerID]/+layout.server.ts` and `[tickerID]/financials/+layout.server.ts`).
- **Auth actions duplicated across financials pages** — all 4 `+page.server.ts` files under `/financials/` export identical `login`, `register`, and `oauth2` actions. These are shared form actions, not page-specific logic.
- **Vite dev server warnings are pre-existing** — a11y warnings, Svelte deprecation notices, and Dart Sass legacy API warnings are expected and can be ignored.

## Architecture

### Server-Side Data Flow

`hooks.server.ts` runs on every request and:
1. Detects locale from Cloudflare `CF-IPCountry` header (falls back to English)
2. Initializes a PocketBase client and loads auth from cookies
3. Injects `event.locals` with: `pb`, `apiURL`, `fastifyURL`, `wsURL`, `apiKey`, `user`, `themeMode`, `locale`
4. Wraps non-API routes in `paraglideMiddleware` for SSR i18n (API routes skip this to avoid body consumption issues)

Page data loading happens in `+page.server.ts` files which use `event.locals` to make backend API calls and return data to the page.

### Backend Services (via env vars)

- `VITE_USEAST_POCKETBASE_URL` — PocketBase (auth, user data, collections)
- `VITE_USEAST_API_URL` — Primary data API
- `VITE_USEAST_FASTIFY_URL` — Fastify REST API
- `VITE_USEAST_WS_URL` — WebSocket for real-time data
- `STOCKNEAR_API_KEY` — Server-side only API key (accessed via `$env/static/private`)

### Client-Side State

`src/lib/store.ts` — Svelte writable stores for all shared state. Includes a client-side LRU cache (`setCache`/`getCache`) with 10-minute expiration and max 50 entries. Many stores persist to localStorage.

### Routing

SvelteKit file-based routing in `src/routes/`. Key patterns:
- `/stocks/[tickerID]/` — Stock detail pages with nested sub-routes (financials, statistics, options, etc.)
- `/etf/[tickerID]/` — ETF detail pages
- `/chart/[slug]` — Interactive charts
- `/chat/[slug]` — AI chat
- `/workspace/[slug]` — User workspaces
- `/api/` — Server-side API endpoints (`+server.ts` files)

### Component Organization

- `src/lib/components/` — All reusable components (100+)
- `src/lib/components/shadcn/` — ShadcN Svelte UI primitives (configured in `components.json`, alias `$lib/components/shadcn`)
- Components are imported via `$lib/components/...` path alias

### Styling

Dark theme by default. Color tokens defined in `app.css`:
- `--color-primary: #1E222D`, `--color-secondary: #2A2E39`
- `--color-positive: #00FC50` (green), `--color-negative: #FF2F1F` (red)
- Theme switching via `mode-watcher` and `data-theme` attribute on HTML

### Web Workers

`src/lib/workers/` — Offloads heavy computation (portfolio calculations, technical indicators, table search, metrics, CSV downloads).

### i18n

Paraglide.js with English (base) and German. Message files in `/messages/`. Generated output in `src/lib/paraglide/` (gitignored, don't edit directly). Config in `project.inlang/settings.json`.

### Key Utilities

- `src/lib/utils.ts` — Large utility file with shared helpers (formatting, serialization, data transforms)
- `src/lib/pocketbase.ts` — PocketBase client initialization
- `src/lib/schemas.js` — Zod validation schemas
- `src/lib/highcharts.ts` — HighCharts configuration

### Charting

Dual charting libraries:
- **HighCharts** — Most charts and visualizations
- **KlineCharts** — Candlestick/trading charts (`src/lib/klinecharts/`)

### Auth

PocketBase auth with cookie-based sessions (httpOnly, secure, 365-day max age). OAuth flow handled at `/oauth`. Login/register pages with Cloudflare Turnstile captcha.

### Payments

LemonSqueezy integration (`src/lib/lemonsqueezy.ts`). Webhook receiver at `/payment`.
