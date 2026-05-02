import * as dotenv from 'dotenv'
dotenv.config()

import { db } from '../src/db/index.js'
import { matchParticipants } from '../src/db/schema.js'
import { getAccountByPuuid } from '../src/services/riot.js'
import { isNull, sql } from 'drizzle-orm'

const rows = await db
  .select({ matchId: matchParticipants.matchId, puuid: matchParticipants.puuid })
  .from(matchParticipants)
  .where(isNull(matchParticipants.gameName))

console.log(`Backfilling ${rows.length} participants...`)

let ok = 0, fail = 0
for (const row of rows) {
  try {
    const account = await getAccountByPuuid(row.puuid)
    await db
      .update(matchParticipants)
      .set({ gameName: account.gameName, tagLine: account.tagLine })
      .where(
        sql`${matchParticipants.matchId} = ${row.matchId} AND ${matchParticipants.puuid} = ${row.puuid}`
      )
    ok++
    // Dev key: 100 req / 2 min → 1 req per 1.2s to be safe
    await new Promise(r => setTimeout(r, 1300))
  } catch {
    fail++
  }
}

console.log(`Done. ${ok} updated, ${fail} failed.`)
process.exit(0)
