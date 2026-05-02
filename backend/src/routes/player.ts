import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { matches, matchParticipants, reviews, riotAccounts } from '../db/schema.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { eq, and, inArray, sql, ilike, desc } from 'drizzle-orm'

export async function playerRoutes(app: FastifyInstance) {
  // GET /api/player/:gameName/:tagLine — public karma profile
  app.get('/:gameName/:tagLine', async (req, reply) => {
    const { gameName, tagLine } = req.params as { gameName: string; tagLine: string }

    const account = await db.query.riotAccounts.findFirst({
      where: and(
        eq(riotAccounts.gameName, gameName),
        eq(riotAccounts.tagLine, tagLine)
      ),
    })

    // Fall back to matchParticipants to find PUUID for unregistered players
    let subjectPuuid = account?.puuid
    if (!subjectPuuid) {
      const participant = await db.query.matchParticipants.findFirst({
        where: and(
          ilike(matchParticipants.gameName, gameName),
          ilike(matchParticipants.tagLine, tagLine)
        ),
      })
      subjectPuuid = participant?.puuid ?? undefined
    }

    if (!subjectPuuid) {
      return reply.send({
        gameName,
        tagLine,
        notFound: true,
        registered: false,
        tagCounts: {},
        reviewCount: 0,
        account: null,
      })
    }

    const allReviews = await db.query.reviews.findMany({
      where: eq(reviews.subjectPuuid, subjectPuuid),
    })

    const tagCounts: Record<string, number> = {}
    for (const review of allReviews) {
      for (const tag of review.tags) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
      }
    }

    reply.send({
      gameName,
      tagLine,
      registered: true,
      account,
      tagCounts,
      reviewCount: allReviews.length,
    })
  })

  // GET /api/player/:gameName/:tagLine/public-reviews — anonymized reviews with notes
  app.get('/:gameName/:tagLine/public-reviews', async (req, reply) => {
    const { gameName, tagLine } = req.params as { gameName: string; tagLine: string }

    const account = await db.query.riotAccounts.findFirst({
      where: and(eq(riotAccounts.gameName, gameName), eq(riotAccounts.tagLine, tagLine)),
    })

    let subjectPuuid = account?.puuid
    if (!subjectPuuid) {
      const participant = await db.query.matchParticipants.findFirst({
        where: and(
          ilike(matchParticipants.gameName, gameName),
          ilike(matchParticipants.tagLine, tagLine)
        ),
      })
      subjectPuuid = participant?.puuid ?? undefined
    }

    if (!subjectPuuid) return reply.send([])

    const recentReviews = await db.query.reviews.findMany({
      where: eq(reviews.subjectPuuid, subjectPuuid),
      orderBy: [desc(reviews.createdAt)],
      limit: 20,
    })

    reply.send(
      recentReviews.map((r) => ({
        tags: r.tags,
        note: r.note,
        createdAt: r.createdAt,
      }))
    )
  })

  // GET /api/player/:gameName/:tagLine/matches
  app.get('/:gameName/:tagLine/matches', async (req, reply) => {
    const { gameName, tagLine } = req.params as { gameName: string; tagLine: string }

    const account = await db.query.riotAccounts.findFirst({
      where: and(
        eq(riotAccounts.gameName, gameName),
        eq(riotAccounts.tagLine, tagLine)
      ),
    })

    if (!account) return reply.send([])

    const participations = await db.query.matchParticipants.findMany({
      where: eq(matchParticipants.puuid, account.puuid),
      with: { match: true },
    })

    const result = participations
      .flatMap((p) => {
        if (!p.match) return []
        const match = p.match
        return [{
          ...match,
          participant: {
            championName: p.championName,
            win: p.win,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            role: p.role,
          },
        }]
      })
      .sort((a, b) => b.gameEndTimestamp.getTime() - a.gameEndTimestamp.getTime())

    reply.send(result)
  })

  // GET /api/player/:gameName/:tagLine/shared-matches — auth required
  app.get(
    '/:gameName/:tagLine/shared-matches',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { gameName, tagLine } = req.params as { gameName: string; tagLine: string }
      const { userId } = req.user as { userId: string }

      const [myAccount, theirAccount] = await Promise.all([
        db.query.riotAccounts.findFirst({ where: eq(riotAccounts.userId, userId) }),
        db.query.riotAccounts.findFirst({
          where: and(
            eq(riotAccounts.gameName, gameName),
            eq(riotAccounts.tagLine, tagLine)
          ),
        }),
      ])

      if (!myAccount || !theirAccount) return reply.send([])

      // Find matches where both puuids participated
      const myMatchIds = (
        await db
          .select({ matchId: matchParticipants.matchId })
          .from(matchParticipants)
          .where(eq(matchParticipants.puuid, myAccount.puuid))
      ).map((r) => r.matchId)

      if (myMatchIds.length === 0) return reply.send([])

      const sharedParticipations = await db.query.matchParticipants.findMany({
        where: and(
          eq(matchParticipants.puuid, theirAccount.puuid),
          inArray(matchParticipants.matchId, myMatchIds)
        ),
        with: { match: true },
      })

      reply.send(
        sharedParticipations
          .flatMap((p) => {
            if (!p.match) return []
            const match = p.match
            return [{
              ...match,
              theirParticipant: {
              championName: p.championName,
              win: p.win,
              kills: p.kills,
              deaths: p.deaths,
              assists: p.assists,
              role: p.role,
            },
          }]
          })
          .sort((a, b) => b.gameEndTimestamp.getTime() - a.gameEndTimestamp.getTime())
      )
    }
  )
}
