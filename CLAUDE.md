# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**leaguekarma.io** is a post-game reputation platform for League of Legends. Players sign in with Google, link their Riot ID, and leave karma reviews on teammates from recent matches. Profiles are public — anyone can look up any EUW player's reputation.

## Project Structure

Monorepo with two packages:
- `backend/` — Fastify v5 + TypeScript + PostgreSQL (Drizzle ORM) + Redis/BullMQ
- `frontend/` — React 18 + Vite + TailwindCSS + shadcn/ui + React Query

## Commands

### Root
```bash
npm run dev           # Run backend + frontend concurrently
npm run install:all   # Install all deps (root + backend + frontend)
```

### Backend (`cd backend`)
```bash
npm run dev        # Start dev server (tsx watch)
npm run build      # Compile TypeScript
npm start          # Run production build
npm run db:migrate # Apply DB migrations
npm run db:generate # Generate Drizzle migration files after schema changes
npm run db:push    # Push schema directly (dev shortcut, skips migrations)
npm run db:studio  # Open Drizzle Studio
npm run release    # Run migrations in production (used in deploy)
```

### Frontend (`cd frontend`)
```bash
npm run dev        # Vite dev server (port 5173, proxies /api to :3001)
npm run build      # Type-check + Vite build (outputs to backend/public/)
npm run lint       # ESLint
```

### Docker (production)
```bash
docker-compose -f docker-compose.prod.yml up --build
```

## Architecture

### Authentication Flow
1. User clicks "Sign in with Google" → `GET /api/auth/google`
2. Backend initiates Google OAuth (PKCE via `arctic`), stores code verifier in Redis
3. Callback upserts user, issues JWT in httpOnly cookie, redirects to `/dashboard`
4. User links Riot ID via `POST /api/auth/link-riot` (verifies against Riot API)
5. Match sync job enqueued immediately on Riot ID link

### Match Sync (BullMQ)
- Worker fetches from Riot API (`europe` regional cluster, `euw1` platform)
- First sync: last 20 matches; subsequent: last 5
- Only queues 420 (ranked solo) and 400 (normal draft)
- 5-minute cooldown per account to avoid Riot API rate limits
- All 10 participants stored per match; `riotAccountId` linked when they register

### Review Constraints
- Reviewer must share a match with subject (verified via `matchParticipants`)
- Unique per (reviewerAccountId, subjectPuuid, matchId) — upsert allows edits
- Reviewer identity never exposed; only aggregated tag counts shown
- 12-tag fixed vocabulary (5 positive, 7 negative)

### Database Schema (Drizzle, PostgreSQL)
- `users` — Google OAuth accounts
- `riotAccounts` — Riot ID + PUUID, linked to users
- `matches` — LoL match records from Riot API
- `matchParticipants` — all 10 players per match (composite PK: matchId + puuid)
- `reviews` — karma reviews with tags + optional note (280 chars)

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/app.ts` | Fastify app setup, route registration |
| `backend/src/config.ts` | Zod-validated environment config |
| `backend/src/db/schema.ts` | All Drizzle table definitions |
| `backend/src/jobs/sync-matches.ts` | BullMQ worker for Riot API match sync |
| `backend/src/services/riot.ts` | Riot API client (account, summoner, matches) |
| `backend/src/routes/auth.ts` | Google OAuth + Riot ID linking |
| `frontend/src/lib/api.ts` | Axios instance + all API functions |
| `frontend/src/lib/utils.ts` | Tag vocabulary + cn() utility |
| `frontend/src/pages/PlayerPage.tsx` | Public karma profile view |
| `frontend/src/pages/DashboardPage.tsx` | User's matches + Riot ID linking |
| `docs/architecture.md` | Full design decisions and API spec |

## Environment Variables

Copy `.env.example` and fill in:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET` — min 16-char secret
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `GOOGLE_CALLBACK_URL` — must match registered OAuth redirect URI
- `RIOT_API_KEY` — from developer.riotgames.com (personal key expires every 24h)
- `FRONTEND_URL` — used for CORS and post-auth redirect

## Tag Vocabulary

**Positive:** `great-comms`, `good-shotcaller`, `positive-attitude`, `carried-us`, `great-teammate`

**Negative:** `flamer`, `inted`, `afk`, `bad-attitude`, `no-comms`, `surrendered-early`, `sabotage`

## Notes

- No test suite yet
- EU only at MVP (`euw1` platform, `europe` regional cluster)
- Riot personal API key expires every 24h — must be refreshed during development
- Deployment target is Railway (`railway.toml`)
- Frontend Vite build outputs directly to `backend/public/` (served as static by Fastify)
- Drizzle migrations live in `backend/drizzle/`
