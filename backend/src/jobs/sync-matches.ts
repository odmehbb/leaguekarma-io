import type { Job } from 'bullmq'
import { db } from '../db/index.js'
import { matches, matchParticipants, riotAccounts } from '../db/schema.js'
import { getMatchIdsByPuuid, getMatch, getAccountByPuuid } from '../services/riot.js'
import { eq } from 'drizzle-orm'

export interface SyncMatchesJobData {
  riotAccountId: string
  puuid: string
  isFirstSync: boolean
}

const CURRENT_SEASON = '2025-S1'

export async function syncMatchesProcessor(job: Job<SyncMatchesJobData>) {
  const { riotAccountId, puuid, isFirstSync } = job.data
  const count = isFirstSync ? 20 : 5

  const matchIds = await getMatchIdsByPuuid(puuid, count)

  for (const riotMatchId of matchIds) {
    // Skip if already stored
    const existing = await db.query.matches.findFirst({
      where: eq(matches.riotMatchId, riotMatchId),
    })
    if (existing) continue

    const matchData = await getMatch(riotMatchId)
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

      // Fetch Riot ID (gameName#tagLine) for this participant
      let gameName: string | null = account?.gameName ?? null
      let tagLine: string | null = account?.tagLine ?? null
      if (!gameName || !tagLine) {
        try {
          const riotId = await getAccountByPuuid(p.puuid)
          gameName = riotId.gameName
          tagLine = riotId.tagLine
        } catch {
          // Non-fatal: fall back to champion name on the frontend
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
