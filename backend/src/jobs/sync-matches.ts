import type { Job } from 'bullmq'
import { db } from '../db/index.js'
import { matches, matchParticipants, riotAccounts } from '../db/schema.js'
import { getMatchIdsByPuuid, getMatch, getAccountByPuuid, getLeagueEntriesByPuuid } from '../services/riot.js'
import { eq } from 'drizzle-orm'

// Rate limit: 100 req/2min hard cap. Track calls in a sliding window and pause when near the limit.
let _apiCallsThisWindow = 0
let _windowStart = Date.now()
const WINDOW_MS = 120_000  // 2 minutes
const MAX_PER_WINDOW = 90  // 10% headroom under the 100/2min hard limit

async function riotApiCall<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now()
  if (now - _windowStart >= WINDOW_MS) {
    _apiCallsThisWindow = 0
    _windowStart = now
  }
  if (_apiCallsThisWindow >= MAX_PER_WINDOW) {
    const waitMs = WINDOW_MS - (Date.now() - _windowStart) + 200
    await new Promise((r) => setTimeout(r, waitMs))
    _apiCallsThisWindow = 0
    _windowStart = Date.now()
  }
  _apiCallsThisWindow++
  return fn()
}

export interface SyncMatchesJobData {
  riotAccountId: string
  puuid: string
  isFirstSync: boolean
}

const CURRENT_SEASON = '2025-S1'

export async function syncMatchesProcessor(job: Job<SyncMatchesJobData>) {
  const { riotAccountId, puuid, isFirstSync } = job.data
  const count = isFirstSync ? 20 : 5

  const matchIds = await riotApiCall(() => getMatchIdsByPuuid(puuid, count))

  for (const riotMatchId of matchIds) {
    // Skip if already stored
    const existing = await db.query.matches.findFirst({
      where: eq(matches.riotMatchId, riotMatchId),
    })
    if (existing) continue

    const matchData = await riotApiCall(() => getMatch(riotMatchId))
    const info = matchData.info

    // Upsert match
    const [match] = await db
      .insert(matches)
      .values({
        riotMatchId,
        gameMode: info.gameMode,
        queueId: info.queueId,
        gameDuration: info.gameDuration,
        gameEndTimestamp: new Date(info.gameEndTimestamp),
        season: CURRENT_SEASON,
      })
      .onConflictDoNothing()
      .returning()

    if (!match) continue

    // Upsert all 10 participants
    for (const p of info.participants) {
      // Check if this puuid belongs to a registered user
      const account = await db.query.riotAccounts.findFirst({
        where: eq(riotAccounts.puuid, p.puuid),
      })

      // Fetch Riot ID and rank for this participant
      let gameName: string | null = account?.gameName ?? null
      let tagLine: string | null = account?.tagLine ?? null
      let soloTier: string | null = account?.soloTier ?? null
      let soloRank: string | null = account?.soloRank ?? null

      // Check if we've seen this PUUID before in any prior match — reuse cached data
      if (!gameName || !tagLine || !soloTier) {
        const cachedParticipant = await db.query.matchParticipants.findFirst({
          where: eq(matchParticipants.puuid, p.puuid),
        })
        if (cachedParticipant?.gameName) gameName = gameName ?? cachedParticipant.gameName
        if (cachedParticipant?.tagLine) tagLine = tagLine ?? cachedParticipant.tagLine
        if (cachedParticipant?.soloTier) soloTier = soloTier ?? cachedParticipant.soloTier
        if (cachedParticipant?.soloRank) soloRank = soloRank ?? cachedParticipant.soloRank
      }

      if (!gameName || !tagLine) {
        try {
          const riotId = await riotApiCall(() => getAccountByPuuid(p.puuid))
          gameName = riotId.gameName
          tagLine = riotId.tagLine
        } catch {
          // Non-fatal: fall back to champion name on the frontend
        }
      }

      if (!soloTier && tagLine) {
        try {
          const entries = await riotApiCall(() => getLeagueEntriesByPuuid(p.puuid, tagLine!))
          const solo = entries.find((e) => e.queueType === 'RANKED_SOLO_5x5')
          soloTier = solo?.tier ?? null
          soloRank = solo?.rank ?? null
        } catch {
          // Non-fatal
        }
      }

      await db
        .insert(matchParticipants)
        .values({
          matchId: match.id,
          puuid: p.puuid,
          riotAccountId: account?.id ?? null,
          gameName,
          tagLine,
          soloTier,
          soloRank,
          championName: p.championName,
          teamId: p.teamId,
          win: p.win,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          role: p.teamPosition || p.individualPosition || null,
        })
        .onConflictDoNothing()
    }
  }

  // Update lastSyncedAt
  await db
    .update(riotAccounts)
    .set({ lastSyncedAt: new Date() })
    .where(eq(riotAccounts.id, riotAccountId))
}
