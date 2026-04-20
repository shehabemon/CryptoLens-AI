# CryptoLens-AI — AI-Powered Crypto Intelligence Dashboard

Full-stack market intelligence platform with real-time data, portfolio P&L tracking, and an AI analyst that actually knows your positions.

Live demo: [example.com](https://example.com) &nbsp;·&nbsp; Demo login: `demo@cryptolens.dev` / `demo1234`

---

## What this is

A real-time crypto dashboard backed by PostgreSQL, JWT auth, and a server-side market data cache. Not a toy — the kind of thing where you register, log in, add holdings, and they're still there when you come back on a different device.

Built because I wanted something that felt smarter than the tools I was already using. Every existing dashboard shows you price data. None of them know your positions.

The AI analyst is the differentiator. It doesn't give you "Bitcoin is a decentralised currency" — it gives you "Your BTC position is up 12.3% since your January buy, outperforming your ETH allocation by 8 points." Every message is injected with your live portfolio: holdings, cost basis, current value, P&L per position. The model reasons over your data, not the internet's.

---

## What makes this different

**Proper auth, not localStorage.** JWT access tokens live in memory (not localStorage — XSS-proof). Refresh tokens are in httpOnly cookies, stored in a `refresh_tokens` table, single-use with rotation. Log out, and the token is invalidated server-side. This isn't "save a flag in the browser and call it auth."

**Server-side market data proxy.** CoinGecko calls go through Express with a TTL cache. First user to request prices pays the API call — everyone else gets the cache for 30 seconds. API keys never leave the server, rate limits are centralised, and the frontend never makes a cross-origin request to a third party.

**AI that reads your portfolio, not your prompt history.** Before every Gemini request, a context builder serialises your positions into structured plaintext and injects it as a system instruction. The model treats it as ground truth. Context refreshes per-message — never stale from conversation start.

**Data-dense UI built for numbers.** `tabular-nums` for column alignment, monospace numerics, price flash animations that use `background-color` only (composite-friendly — no layout thrash with 30 assets updating). The design prioritises information density over whitespace.

---

## Features

- **Market dashboard** — Top 30 cryptos with 30s auto-refresh, 7-day sparklines, and per-asset price flash indicators
- **Asset detail panel** — Interactive price charts (1D/7D/30D/90D/1Y), market stats grid, one-click watchlist/portfolio actions
- **Portfolio tracker** — Holdings table with live P&L, allocation donut chart, add/edit/delete with full validation, persisted per-user in PostgreSQL
- **Watchlist** — Compact data table with price, 24h/7d change, market cap, volume, ATH/ATL
- **AI analyst** — Streaming chat (Gemini 2.5 Flash via SSE), portfolio context injection, live context sidebar showing exactly what data the model sees
- **Search** — Keyboard-navigable fuzzy search across all loaded assets
- **Auth** — Register, login, silent session restore via refresh token, user menu with sign out

---

## Tech stack

| Layer | What | Why |
|---|---|---|
| Frontend | React 18, TypeScript strict, Vite 5 + SWC | SWC compiles ~20x faster than Babel. Strict mode catches bugs CI won't |
| Server state | TanStack React Query v5 | stale-while-revalidate, background polling, request deduplication — better fit than global state for API data |
| Client state | Zustand v5 | Three stores, each under 50 lines. Redux would add boilerplate with no benefit at this scale |
| Styling | Tailwind CSS 3 + Radix UI + shadcn/ui | Utility classes for layout, unstyled accessible primitives underneath |
| Charts | Recharts | Declarative, composable, handles responsive containers. Lighter than D3 for this use case |
| Backend | Express 5, TypeScript | Layered architecture: routes → controllers → services → Prisma. Not a single file |
| Database | PostgreSQL 16 + Prisma ORM | Type-safe queries, automatic migrations, proper foreign keys with cascade deletes |
| Auth | JWT access (15min) + httpOnly refresh (7d), bcrypt | Refresh token rotation — each token is single-use. Replay detection built in |
| AI | Gemini 2.5 Flash | Streaming via SSE, low latency, good at structured reasoning over injected context |
| Security | Helmet, express-rate-limit, Zod | 100 req/15min global, 10 req/15min on auth. Zod validates every API input |
| Logging | Pino | Structured JSON in production, pretty-print in dev |
| Testing | Vitest + Testing Library, Playwright | Vite-native test runner, no config friction |
| DevOps | Docker + Docker Compose | One command to spin up PostgreSQL locally |

---

## Architecture

### Server

The backend follows a strict layered pattern — controllers handle HTTP, services handle logic, Prisma handles data. Nothing leaks across layers.

```
server/
├── config/env.ts              # Zod-validated environment config — crashes on startup if vars are missing
├── lib/
│   ├── prisma.ts              # Prisma client singleton (survives HMR)
│   ├── logger.ts              # Pino — structured JSON in prod, pretty-print in dev
│   └── cache.ts               # In-memory TTL cache for market data
├── middleware/
│   ├── auth.ts                # JWT verification, attaches userId to request
│   ├── validate.ts            # Zod schema middleware for request bodies
│   ├── rateLimiter.ts         # Tiered rate limits (global + auth-specific)
│   └── errorHandler.ts        # Global error handler with typed error classes
├── services/
│   ├── auth.service.ts        # bcrypt, JWT signing, refresh token rotation
│   ├── portfolio.service.ts   # Holdings CRUD with user ownership checks
│   ├── watchlist.service.ts   # Idempotent upsert, cascading deletes
│   └── market.service.ts      # CoinGecko proxy with cache-or-fetch pattern
├── controllers/               # HTTP request handling — thin, delegates to services
├── routes/                    # Route composition with middleware chains
├── prisma/schema.prisma       # Database schema (User, Holding, WatchlistItem, RefreshToken)
├── app.ts                     # Express factory (testable without starting the server)
└── index.ts                   # Entry point with graceful shutdown (SIGTERM/SIGINT)
```

If you need to swap the in-memory cache for Redis, you change one file. That's the point.

### Frontend

```
src/
├── components/
│   ├── auth/                  # ProtectedRoute — redirects to /login, preserves intended destination
│   ├── dashboard/             # AssetCard, AssetDetailPanel, PriceChart, WatchlistPanel
│   ├── portfolio/             # HoldingsTable, AllocationChart, AddHoldingModal
│   ├── layout/                # AppLayout, Sidebar, Header (with user menu)
│   ├── ui/                    # shadcn/ui primitives
│   ├── ErrorBoundary.tsx      # Context-aware error boundary with retry
│   └── PriceFlash.tsx         # Composite-friendly price change animation
├── hooks/
│   ├── useMarketData.ts       # React Query wrapper — 30s polling, stale-while-revalidate
│   ├── usePortfolio.ts        # Joins holdings (Zustand) with prices (React Query), memoised P&L
│   └── useAIChat.ts           # SSE streaming, context builder, abort controller
├── lib/
│   ├── api/client.ts          # Fetch wrapper — auto token injection, 401 intercept, silent refresh
│   ├── api/coingecko.ts       # Calls server proxy, not CoinGecko directly
│   └── ai/contextBuilder.ts   # Portfolio → plaintext serialisation for AI system prompt
├── store/
│   ├── authStore.ts           # Login/register/logout, session initialisation via refresh token
│   ├── portfolioStore.ts      # Holdings CRUD — API-backed, not localStorage
│   ├── watchlistStore.ts      # Optimistic add/remove with rollback on API failure
│   └── aiStore.ts             # Chat messages, streaming state
├── pages/                     # Route-level components (Dashboard, Portfolio, Watchlist, AI, Login, Register)
└── types/                     # Shared TypeScript interfaces
```

### How data flows

```
Browser → Vite proxy → Express → Prisma → PostgreSQL     (user data)
Browser → Vite proxy → Express → TTL Cache → CoinGecko   (market data)
Browser → Vite proxy → Express → Gemini API → SSE stream  (AI chat)
```

Market data requests hit the TTL cache first. Cache miss → fetch from CoinGecko, store for 30s, return. Cache hit → return immediately. The browser never talks to CoinGecko directly.

### Auth flow

```
Register/Login → Server returns { accessToken, user } + sets httpOnly refresh cookie
               → Client stores accessToken in memory (NOT localStorage)
               → Client stores user in Zustand

API request    → Client attaches Authorization: Bearer <token> header
               → If 401: silently POST /api/auth/refresh (cookie sent automatically)
               → New accessToken returned → retry original request
               → If refresh fails: redirect to /login

Page reload    → Client calls POST /api/auth/refresh on mount
               → If valid cookie exists: session restored silently
               → If not: show login page
```

---

## Running locally

**Prerequisites:** Node.js ≥ 18, PostgreSQL 16

**1. Clone and install**

```bash
git clone https://github.com/HelloKol/cryptolens-dashboard.git
cd cryptolens-dashboard
npm install
```

**2. Spin up Postgres**

Option A — Docker (recommended):

```bash
docker compose up -d
```

Option B — Homebrew (macOS):

```bash
brew install postgresql@16
brew services start postgresql@16
createuser -s cryptolens
psql -U $(whoami) -d postgres -c "ALTER USER cryptolens WITH PASSWORD 'cryptolens_dev';"
createdb -U cryptolens -O cryptolens cryptolens
```

**3. Environment variables**

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://cryptolens:cryptolens_dev@localhost:5432/cryptolens

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<64-char-hex-string>
JWT_REFRESH_SECRET=<64-char-hex-string>

# Free at https://aistudio.google.com/apikey
GEMINI_API_KEY=your_key_here

NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:8080
```

**4. Migrate and run**

```bash
npm run db:migrate
npm run dev
```

Client on `http://localhost:8080`, API on `http://localhost:3001`. Register an account and you're in.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts both servers (Vite + Express with watch mode) |
| `npm run dev:client` | Vite only |
| `npm run dev:server` | Express only (with tsx watch) |
| `npm run build` | Production frontend build |
| `npm run test` | Run all tests with Vitest |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

---

## Database

| Model | Purpose |
|---|---|
| `User` | Auth identity — owns all holdings, watchlist items, and refresh tokens |
| `Holding` | A crypto position: asset ID, symbol, amount, buy price, buy date. Cascade deletes on user removal |
| `WatchlistItem` | A tracked asset per user. Unique constraint on `[userId, assetId]` |
| `RefreshToken` | Single-use tokens for session restoration. Indexed by both token and userId |

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Access token signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing secret (min 32 chars) |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `PORT` | — | API port (default: 3001) |
| `NODE_ENV` | — | `development` or `production` |
| `CORS_ORIGIN` | — | Allowed client origin |

---

## Technical decisions worth mentioning

### Refresh token rotation

Refresh tokens are single-use. Every time you refresh, the old token is deleted and a new one is issued. If an attacker replays a stolen refresh token, it's already been consumed — the server rejects it. Most tutorials skip this. It matters.

### Optimistic updates with rollback

Watchlist mutations update the UI immediately. The API call happens in the background. If it fails, the UI rolls back to the previous state. Better UX than showing a spinner for a 100ms operation, and the rollback prevents inconsistency.

```typescript
addToWatchlist: async (id) => {
  set((s) => ({ watchedIds: [...s.watchedIds, id] }));
  try {
    await apiJson("/api/watchlist", { method: "POST", body: JSON.stringify({ assetId: id }) });
  } catch {
    set((s) => ({ watchedIds: s.watchedIds.filter((w) => w !== id) }));
  }
}
```

### Store isolation on user switch

When a user logs out, all Zustand stores are cleared (`clearHoldings()`, `clearWatchlist()`). This resets `isLoaded` to `false`, so the next login triggers fresh API fetches for the new user. Without this, you'd see the previous user's portfolio until a hard refresh — a subtle but real bug.

### API client token refresh deduplication

If three API calls return 401 simultaneously, you don't want three refresh requests race-conditioning each other. The API client uses a shared promise:

```typescript
function getRefreshPromise(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;  // All callers await the same promise
}
```

---

## Accessibility

Targets **WCAG 2.1 AA**:

- Global focus indicators on all focusable elements
- `role="alert"` on error states, `aria-label` on icon-only buttons, `aria-hidden` on decorative icons
- Full keyboard navigation — search, modals, portfolio actions, AI input
- Screen reader labels on charts and interactive regions
- Colour contrast ratios exceed AA minimums on all text

---

## Things I'd do differently at scale

- **Move the AI context builder server-side.** Right now it's assembled on the client before being sent up, which leaks the shape of the data. A server-side builder would also let me enforce what context fields are exposed.
- **WebSockets for price streaming.** Currently polling CoinGecko every 30 seconds through the cache. Real-time would mean one persistent connection with server-push, no polling overhead.
- **Redis for token blocklisting.** Refresh tokens currently just expire on a timer. A Redis blocklist would let invalidation happen immediately on sign-out — matters if a token is compromised.
- **Proper E2E coverage for the auth flow.** The Playwright config is wired up; test coverage against the actual auth sequence isn't there yet.
- **Rate limit per user, not just per IP.** Current rate limiting is IP-based. A logged-in user behind a shared IP shouldn't benefit from another user's allowance.

---

## Licence

MIT
