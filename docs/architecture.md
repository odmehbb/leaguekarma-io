# leaguekarma.io — Architecture

## Overview

leaguekarma.io is a post-game reputation platform for League of Legends. Players log in with Google, link their Riot ID, and can leave karma reviews on teammates from recent matches. Profiles are public — anyone can look up a player's karma by Riot ID.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Fastify v5 + TypeScript |
| Database | PostgreSQL 16 + Drizzle ORM |
| Queue | BullMQ v5 + Redis v7 |
| Frontend | React 18 + Vite + TailwindCSS + shadcn/ui |
| Data fetching | TanStack React Query v5 |
| Auth | Google OAuth 2.0 (arctic) + JWT (cookie) |
| Deployment | Railway |

---

## Authentication Flow

1. User clicks "Sign in with Google"
2. Backend initiates Google OAuth (PKCE flow via `arctic`)
3. On callback: upsert user record, issue JWT stored in httpOnly cookie
4. User links their Riot ID (`GameName#TAG`) in settings
5. Backend calls Riot API to verify the account exists, stores `puuid`
6. Match sync job is enqueued immediately

Session is stateless JWT — no server-side session storage needed.

---

## Riot API Integration

**Base URLs (EU):**
- Platform: `https://euw1.api.riotgames.com` — summoner/account lookups
- Regional: `https://europe.api.riotgames.com` — match history, match details

**Key endpoints used:**
- `GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}` — resolve Riot ID → puuid
- `GET /lol/match/v5/matches/by-puuid/{puuid}/ids` — fetch match ID list
- `GET /lol/match/v5/matches/{matchId}` — fetch full match with all 10 participants

**API key:** Personal key for development (expires every 24h). Production key requires Riot developer app approval.

---

## Match Sync Strategy

- **Trigger:** On Riot ID link (first sync) or login (subsequent sync)
- **First sync:** Fetch last 20 matches
- **Subsequent syncs:** Fetch last 5 matches
- **Cooldown:** 5 minutes per user to avoid hammering the API
- **Mechanism:** BullMQ worker (concurrency 3) processes sync jobs
- **Storage:** Upsert matches + all 10 participants into PostgreSQL

Only ranked solo/duo and normal draft matches are stored (no ARAM, rotating modes).

---

## Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| googleId | text unique | Google OAuth sub |
| email | text unique | |
| displayName | text | |
| createdAt | timestamp | |

### `riotAccounts`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| userId | UUID FK → users | |
| puuid | text unique | Riot permanent identifier |
| gameName | text | e.g. "Faker" |
| tagLine | text | e.g. "EUW" |
| summonerId | text | Platform-specific ID |
| profileIconId | int | |
| summonerLevel | int | |
| lastSyncedAt | timestamp | |

### `matches`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| riotMatchId | text unique | e.g. "EUW1_7123456789" |
| gameMode | text | e.g. "CLASSIC" |
| queueId | int | 420=ranked solo, 400=normal draft |
| gameDuration | int | seconds |
| gameEndTimestamp | timestamp | |
| season | text | e.g. "2025-S1" |

### `matchParticipants`
| Column | Type | Notes |
|--------|------|-------|
| matchId | UUID FK → matches | composite PK |
| puuid | text | composite PK |
| riotAccountId | UUID FK → riotAccounts | nullable (unregistered players) |
| championName | text | |
| teamId | int | 100 or 200 |
| win | boolean | |
| kills/deaths/assists | int | |
| role | text | e.g. "JUNGLE", "SUPPORT" |

### `reviews`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| reviewerAccountId | UUID FK → riotAccounts | |
| subjectPuuid | text | Target player (may not be registered) |
| matchId | UUID FK → matches | |
| tags | text[] | From fixed vocabulary |
| note | text | Max 280 chars, optional |
| createdAt | timestamp | |
| updatedAt | timestamp | |
| — | unique | (reviewerAccountId, subjectPuuid, matchId) |

---

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/auth/google | — | Initiate Google OAuth |
| GET | /api/auth/google/callback | — | OAuth callback |
| GET | /api/auth/me | required | Current user + linked Riot account |
| POST | /api/auth/link-riot | required | Link Riot ID (gameName + tagLine) |
| POST | /api/auth/logout | required | Clear JWT cookie |

### Players
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/player/:gameName/:tagLine | — | Public karma profile |
| GET | /api/player/:gameName/:tagLine/matches | — | Synced matches for a player |
| GET | /api/player/:gameName/:tagLine/shared-matches | required | Matches shared with logged-in user |

### Reviews
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/player/:gameName/:tagLine/my-reviews | required | Logged-in user's reviews on this player |
| POST | /api/player/:gameName/:tagLine/reviews | required | Submit or update a review |

### Matches
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/match/:riotMatchId/participants | — | All participants in a match |

### Rankings
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/rankings | — | Top praised / most reported players (EU) |

---

## Review System

### Tag Vocabulary

**Positive (5)**
- `great-comms` — communicates clearly and constructively
- `good-shotcaller` — makes smart macro decisions
- `positive-attitude` — uplifting, keeps morale high
- `carried-us` — mechanically excellent, won the game
- `great-teammate` — overall great to play with

**Negative (7)**
- `flamer` — toxic in chat
- `inted` — intentionally fed
- `afk` — went AFK / disconnected
- `bad-attitude` — negative, tilted the team
- `no-comms` — refused to communicate
- `surrendered-early` — gave up on a winnable game
- `sabotage` — deliberate actions to lose (smite steal, baron throw, etc.)

### Constraints
- Reviewer must have played in the same match as the subject (verified via `matchParticipants`)
- No self-reviews
- One review per (reviewer, subject, match) — updates allowed
- Reviewer identity never exposed publicly — only aggregated tag counts shown
- Note is optional, max 280 characters

---

## Frontend Routes

| Path | Page | Description |
|------|------|-------------|
| / | SearchPage | Look up any player by Riot ID |
| /player/:gameName/:tagLine | PlayerPage | Public karma profile + match list |
| /dashboard | DashboardPage | Logged-in user's matches + review actions |
| /auth/callback | AuthCallbackPage | Google OAuth callback handler |
| * | NotFoundPage | 404 |

---

## Deployment

- **Platform:** Railway
- **Services:** Node.js app, PostgreSQL, Redis
- **Environment variables:** See `.env.example`
- **Build:** Frontend compiled to `public/` and served as static files by Fastify
- **Migrations:** Run via `npm run release` (Drizzle migrate) on deploy

---

## Region Strategy

MVP is EU only (`euw1` platform, `europe` regional cluster). Multi-region support requires:
1. Adding `region` column to `riotAccounts` and `matches`
2. Parameterizing Riot API base URLs by region
3. Region selector in the frontend search UI
