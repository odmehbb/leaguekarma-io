import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { matches, matchParticipants } from '../db/schema.js'
import { eq } from 'drizzle-orm'

export async function matchRoutes(app: FastifyInstance) {
  // GET /api/match/:riotMatchId/participants
  app.get('/:riotMatchId/participants', async (req, reply) => {
    const { riotMatchId } = req.params as { riotMatchId: string }

    const match = await db.query.matches.findFirst({
      where: eq(matches.riotMatchId, riotMatchId),
    })

    if (!match) return reply.code(404).send({ error: 'Match not found' })

    const participants = await db.query.matchParticipants.findMany({
      where: eq(matchParticipants.matchId, match.id),
      with: { riotAccount: true },
    })

    reply.send(participants)
  })
}
