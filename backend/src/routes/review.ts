import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { reviews, riotAccounts, matchParticipants, matches } from '../db/schema.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { eq, and } from 'drizzle-orm'

const VALID_TAGS = [
  'great-comms',
  'good-shotcaller',
  'positive-attitude',
  'carried-us',
  'great-teammate',
  'flamer',
  'inted',
  'afk',
  'bad-attitude',
  'no-comms',
  'surrendered-early',
  'sabotage',
] as const

const reviewSchema = z.object({
  matchId: z.string().uuid(),
  tags: z.array(z.enum(VALID_TAGS)).min(1),
  note: z.string().max(280).optional(),
})

const reviewByPuuidSchema = z.object({
  subjectPuuid: z.string(),
  matchId: z.string().uuid(),
  tags: z.array(z.enum(VALID_TAGS)).min(1),
  note: z.string().max(280).optional(),
})

export async function reviewRoutes(app: FastifyInstance) {
  // POST /api/player/reviews/by-puuid — review any participant by puuid (no registration required)
  app.post(
    '/reviews/by-puuid',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { userId } = req.user as { userId: string }
      const body = reviewByPuuidSchema.parse(req.body)

      const myAccount = await db.query.riotAccounts.findFirst({
        where: eq(riotAccounts.userId, userId),
      })
      if (!myAccount) return reply.code(400).send({ error: 'You must link a Riot account first' })
      if (myAccount.puuid === body.subjectPuuid) {
        return reply.code(400).send({ error: 'Cannot review yourself' })
      }

      // Verify both played in the match
      const [reviewerInMatch, subjectInMatch] = await Promise.all([
        db.query.matchParticipants.findFirst({
          where: and(eq(matchParticipants.matchId, body.matchId), eq(matchParticipants.puuid, myAccount.puuid)),
        }),
        db.query.matchParticipants.findFirst({
          where: and(eq(matchParticipants.matchId, body.matchId), eq(matchParticipants.puuid, body.subjectPuuid)),
        }),
      ])

      if (!reviewerInMatch || !subjectInMatch) {
        return reply.code(400).send({ error: 'Both players must have participated in this match' })
      }

      const [review] = await db
        .insert(reviews)
        .values({
          reviewerAccountId: myAccount.id,
          subjectPuuid: body.subjectPuuid,
          matchId: body.matchId,
          tags: body.tags,
          note: body.note ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [reviews.reviewerAccountId, reviews.subjectPuuid, reviews.matchId],
          set: { tags: body.tags, note: body.note ?? null, updatedAt: new Date() },
        })
        .returning()

      reply.code(201).send(review)
    }
  )

  // GET /api/player/reviews/my-match-reviews/:matchId — get all reviews I left in a match
  app.get(
    '/reviews/my-match-reviews/:matchId',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { matchId } = req.params as { matchId: string }
      const { userId } = req.user as { userId: string }

      const myAccount = await db.query.riotAccounts.findFirst({
        where: eq(riotAccounts.userId, userId),
      })
      if (!myAccount) return reply.send([])

      const myReviews = await db.query.reviews.findMany({
        where: and(eq(reviews.reviewerAccountId, myAccount.id), eq(reviews.matchId, matchId)),
      })

      reply.send(myReviews)
    }
  )
  // GET /api/player/:gameName/:tagLine/my-reviews
  app.get(
    '/:gameName/:tagLine/my-reviews',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { gameName, tagLine } = req.params as { gameName: string; tagLine: string }
      const { userId } = req.user as { userId: string }

      const [myAccount, theirAccount] = await Promise.all([
        db.query.riotAccounts.findFirst({ where: eq(riotAccounts.userId, userId) }),
        db.query.riotAccounts.findFirst({
          where: and(eq(riotAccounts.gameName, gameName), eq(riotAccounts.tagLine, tagLine)),
        }),
      ])

      if (!myAccount || !theirAccount) return reply.send([])

      const myReviews = await db.query.reviews.findMany({
        where: and(
          eq(reviews.reviewerAccountId, myAccount.id),
          eq(reviews.subjectPuuid, theirAccount.puuid)
        ),
      })

      reply.send(myReviews)
    }
  )

  // POST /api/player/:gameName/:tagLine/reviews
  app.post(
    '/:gameName/:tagLine/reviews',
    { preHandler: requireAuth },
    async (req, reply) => {
      const { gameName, tagLine } = req.params as { gameName: string; tagLine: string }
      const { userId } = req.user as { userId: string }
      const body = reviewSchema.parse(req.body)

      const [myAccount, theirAccount] = await Promise.all([
        db.query.riotAccounts.findFirst({ where: eq(riotAccounts.userId, userId) }),
        db.query.riotAccounts.findFirst({
          where: and(eq(riotAccounts.gameName, gameName), eq(riotAccounts.tagLine, tagLine)),
        }),
      ])

      if (!myAccount) return reply.code(400).send({ error: 'You must link a Riot account first' })
      if (!theirAccount) return reply.code(404).send({ error: 'Player not found' })
      if (myAccount.puuid === theirAccount.puuid) {
        return reply.code(400).send({ error: 'Cannot review yourself' })
      }

      // Verify both players participated in the match
      const [reviewerInMatch, subjectInMatch] = await Promise.all([
        db.query.matchParticipants.findFirst({
          where: and(
            eq(matchParticipants.matchId, body.matchId),
            eq(matchParticipants.puuid, myAccount.puuid)
          ),
        }),
        db.query.matchParticipants.findFirst({
          where: and(
            eq(matchParticipants.matchId, body.matchId),
            eq(matchParticipants.puuid, theirAccount.puuid)
          ),
        }),
      ])

      if (!reviewerInMatch || !subjectInMatch) {
        return reply.code(400).send({ error: 'Both players must have participated in this match' })
      }

      const [review] = await db
        .insert(reviews)
        .values({
          reviewerAccountId: myAccount.id,
          subjectPuuid: theirAccount.puuid,
          matchId: body.matchId,
          tags: body.tags,
          note: body.note ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [reviews.reviewerAccountId, reviews.subjectPuuid, reviews.matchId],
          set: {
            tags: body.tags,
            note: body.note ?? null,
            updatedAt: new Date(),
          },
        })
        .returning()

      reply.code(201).send(review)
    }
  )
}
