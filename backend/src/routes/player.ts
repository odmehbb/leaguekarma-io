import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { matches, matchParticipants, reviews, riotAccounts, reviewVotes } from '../db/schema.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { eq, and, inArray, sql, ilike, desc, count, isNotNull, ne } from 'drizzle-orm'

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

  // GET /api/player/:gameName/:tagLine/public-reviews — anonymized reviews with vote counts
  app.get('/:gameName/:tagLine/public-reviews', async (req, reply) => {
    const { gameName, tagLine } = req.params as { gameName: string; tagLine: string }

    // Try to get current user from cookie (optional auth)
    let viewerUserId: string | null = null
    try {
      await req.jwtVerify()
      viewerUserId = (req.user as { userId: string }).userId
    } catch { /* not logged in, that's fine */ }

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

    // Only fetch reviews that have notes (the "text feedbacks")
    const noteReviews = await db.query.reviews.findMany({
      where: and(
        eq(reviews.subjectPuuid, subjectPuuid),
        isNotNull(reviews.note),
        ne(reviews.note, '')
      ),
      with: { votes: true },
      limit: 50,
    })

    const result = noteReviews
      .map((r) => ({
        id: r.id,
        tags: r.tags,
        note: r.note,
        createdAt: r.createdAt,
        voteCount: r.votes.length,
        myVote: viewerUserId ? r.votes.some((v) => v.voterUserId === viewerUserId) : false,
      }))
      .sort((a, b) => b.voteCount - a.voteCount || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    reply.send(result)
  })

  // POST /api/player/reviews/:reviewId/vote — toggle upvote (auth required)
  app.post('/reviews/:reviewId/vote', { preHandler: requireAuth }, async (req, reply) => {
    const { reviewId } = req.params as { reviewId: string }
    const { userId } = req.user as { userId: string }

    const review = await db.query.reviews.findFirst({ where: eq(reviews.id, reviewId) })
    if (!review) return reply.code(404).send({ error: 'Review not found' })

    // Cannot vote on reviews for yourself
    // (check if subject is the current user)
    const myAccount = await db.query.riotAccounts.findFirst({
      where: eq(riotAccounts.userId, userId),
    })
    if (myAccount && review.subjectPuuid === myAccount.puuid) {
      return reply.code(400).send({ error: 'Cannot vote on your own reviews' })
    }

    const existing = await db.query.reviewVotes.findFirst({
      where: and(eq(reviewVotes.reviewId, reviewId), eq(reviewVotes.voterUserId, userId)),
    })

    if (existing) {
      // Unvote
      await db.delete(reviewVotes).where(eq(reviewVotes.id, existing.id))
      const [{ voteCount }] = await db.select({ voteCount: count() }).from(reviewVotes).where(eq(reviewVotes.reviewId, reviewId))
      return reply.send({ voted: false, voteCount })
    } else {
      // Vote
      await db.insert(reviewVotes).values({ reviewId, voterUserId: userId })
      const [{ voteCount }] = await db.select({ voteCount: count() }).from(reviewVotes).where(eq(reviewVotes.reviewId, reviewId))
      return reply.send({ voted: true, voteCount })
    }
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
