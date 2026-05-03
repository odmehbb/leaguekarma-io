import * as dotenv from 'dotenv'
dotenv.config()

import { db } from '../src/db/index.js'
import { matchParticipants } from '../src/db/schema.js'
import { getLeagueEntriesByPuuid } from '../src/services/riot.js'
import { isNull, sql } from 'drizzle-orm'

// Get distinct puuids that have a tagLine but no rank yet
const rows = await db
  .selectDistinct({ puuid: matchParticipants.puuid, tagLine: matchParticipants.tagLine })
  .from(matchParticipants)
  .where(isNull(matchParticipants.soloTier))

const withTag = rows.filter(r => r.tagLine)
console.log(`Backfilling rank for ${withTag.length} unique participants...`)

let ok = 0, fail = 0
for (let i = 0; i < withTag.length; i++) {
  const row = withTag[i]
  if (i % 10 === 0) console.log(`  Progress: ${i}/${withTag.length} (${ok} ranked, ${fail} failed)`)
  try {
    const entries = await getLeagueEntriesByPuuid(row.puuid, row.tagLine!)
    const solo = entries.find(e => e.queueType === 'RANKED_SOLO_5x5')
    if (solo) {
      await db
        .update(matchParticipants)
        .set({ soloTier: solo.tier, soloRank: solo.rank })
        .where(sql`${matchParticipants.puuid} = ${row.puuid}`)
      ok++
    } else {
      fail++ // unranked, not an error
    }
    await new Promise(r => setTimeout(r, 1400))
  } catch (err) {
    console.error(`  Failed for ${row.puuid}: ${(err as Error).message}`)
    fail++
    await new Promise(r => setTimeout(r, 1400))
  }
}

console.log(`Done. ${ok} ranked, ${fail} unranked/failed.`)
process.exit(0)
