import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { reviews, riotAccounts, matchParticipants } from '../db/schema.js'
import { eq, desc } from 'drizzle-orm'

const POSITIVE_TAGS = new Set(['great-comms', 'good-shotcaller', 'positive-attitude', 'carried-us', 'great-teammate'])

export async function activityRoutes(app: FastifyInstance) {
  // GET /api/activity — recent reviews (anonymized subject names)
  app.get('/', async (_req, reply) => {
    const recent = await db.query.reviews.findMany({
      orderBy: [desc(reviews.createdAt)],
      limit: 10,
    })

    const enriched = await Promise.all(
      recent.map(async (r) => {
        // Find subject name
        const account = await db.query.riotAccounts.findFirst({
          where: eq(riotAccounts.puuid, r.subjectPuuid),
        })
        let gameName = account?.gameName ?? null
        let tagLine = account?.tagLine ?? null
        if (!gameName) {
          const p = await db.query.matchParticipants.findFirst({
            where: eq(matchParticipants.puuid, r.subjectPuuid),
          })
          gameName = p?.gameName ?? null
          tagLine = p?.tagLine ?? null
        }

        const positive = r.tags.some((t) => POSITIVE_TAGS.has(t))
        return {
          subjectGameName: gameName,
          subjectTagLine: tagLine,
          tags: r.tags,
          note: r.note,
          positive,
          createdAt: r.createdAt,
        }
      })
    )

    // Only return entries where we resolved a name
    reply.send(enriched.filter((e) => e.subjectGameName))
  })
}
