import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { reviews, matchParticipants } from '../db/schema.js'
import { sql } from 'drizzle-orm'

export async function statsRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    const [[{ reviewCount }], [{ playerCount }], tagRows] = await Promise.all([
      db.execute(sql`SELECT COUNT(*)::int AS "reviewCount" FROM reviews`),
      db.execute(sql`SELECT COUNT(DISTINCT subject_puuid)::int AS "playerCount" FROM reviews`),
      db.execute(sql`
        SELECT tag, COUNT(*)::int AS count
        FROM reviews, UNNEST(tags) AS tag
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 5
      `),
    ])

    reply.send({
      reviewCount: (reviewCount as { reviewCount: number }).reviewCount,
      playerCount: (playerCount as { playerCount: number }).playerCount,
      topTags: tagRows,
    })
  })
}
