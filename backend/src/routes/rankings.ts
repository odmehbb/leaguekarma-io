import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { reviews, riotAccounts } from '../db/schema.js'
import { sql, eq } from 'drizzle-orm'

const POSITIVE_TAGS = ['great-comms', 'good-shotcaller', 'positive-attitude', 'carried-us', 'great-teammate']
const NEGATIVE_TAGS = ['flamer', 'inted', 'afk', 'bad-attitude', 'no-comms', 'surrendered-early', 'sabotage']

export async function rankingsRoutes(app: FastifyInstance) {
  // GET /api/rankings
  app.get('/', async (_req, reply) => {
    // Count positive tags per subject puuid
    const praised = await db.execute(sql`
      SELECT subject_puuid, COUNT(*) as score
      FROM reviews, UNNEST(tags) AS tag
      WHERE tag = ANY(ARRAY[${sql.raw(POSITIVE_TAGS.map((t) => `'${t}'`).join(','))}])
      GROUP BY subject_puuid
      ORDER BY score DESC
      LIMIT 10
    `)

    const reported = await db.execute(sql`
      SELECT subject_puuid, COUNT(*) as score
      FROM reviews, UNNEST(tags) AS tag
      WHERE tag = ANY(ARRAY[${sql.raw(NEGATIVE_TAGS.map((t) => `'${t}'`).join(','))}])
      GROUP BY subject_puuid
      ORDER BY score DESC
      LIMIT 10
    `)

    // Enrich with Riot account info
    async function enrich(rows: { subject_puuid: string; score: string }[]) {
      return Promise.all(
        rows.map(async (row) => {
          const account = await db.query.riotAccounts.findFirst({
            where: eq(riotAccounts.puuid, row.subject_puuid),
          })
          return {
            puuid: row.subject_puuid,
            score: Number(row.score),
            gameName: account?.gameName ?? null,
            tagLine: account?.tagLine ?? null,
          }
        })
      )
    }

    reply.send({
      praised: await enrich(praised.rows as { subject_puuid: string; score: string }[]),
      reported: await enrich(reported.rows as { subject_puuid: string; score: string }[]),
    })
  })
}
