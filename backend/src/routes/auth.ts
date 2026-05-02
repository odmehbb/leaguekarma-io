import type { FastifyInstance } from 'fastify'
import { Google } from 'arctic'
import { z } from 'zod'
import { db } from '../db/index.js'
import { users, riotAccounts } from '../db/schema.js'
import { config } from '../config.js'
import { redis } from '../redis/index.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { syncMatchesQueue } from '../jobs/queue.js'
import { getAccountByRiotId, getSummonerByPuuid, getLeagueEntries } from '../services/riot.js'
import { eq } from 'drizzle-orm'

const google = new Google(
  config.googleClientId,
  config.googleClientSecret,
  config.googleCallbackUrl
)

export async function authRoutes(app: FastifyInstance) {
  // GET /api/auth/google — initiate OAuth
  app.get('/google', async (_req, reply) => {
    const state = crypto.randomUUID()
    const codeVerifier = crypto.randomUUID() + crypto.randomUUID()

    await redis.set(`oauth:state:${state}`, codeVerifier, 'EX', 600)

    const url = await google.createAuthorizationURL(state, codeVerifier, ['openid', 'email', 'profile'])
    reply.redirect(url.toString())
  })

  // GET /api/auth/google/callback
  app.get('/google/callback', async (req, reply) => {
    const { code, state } = req.query as { code?: string; state?: string }
    if (!code || !state) return reply.code(400).send({ error: 'Missing code or state' })

    const codeVerifier = await redis.get(`oauth:state:${state}`)
    if (!codeVerifier) return reply.code(400).send({ error: 'Invalid or expired state' })
    await redis.del(`oauth:state:${state}`)

    const tokens = await google.validateAuthorizationCode(code, codeVerifier)
    const accessToken = tokens.accessToken()

    const googleUser = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((r) => r.json()) as { sub: string; email: string; name: string }

    // Upsert user
    const [user] = await db
      .insert(users)
      .values({
        googleId: googleUser.sub,
        email: googleUser.email,
        displayName: googleUser.name,
      })
      .onConflictDoUpdate({
        target: users.googleId,
        set: { displayName: googleUser.name },
      })
      .returning()

    const token = app.jwt.sign({ userId: user.id }, { expiresIn: '30d' })

    reply
      .setCookie('token', token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      })
      .redirect(`${config.frontendUrl}/dashboard`)
  })

  // GET /api/auth/me
  app.get('/me', { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req.user as { userId: string }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { riotAccount: true },
    })

    if (!user) return reply.code(404).send({ error: 'User not found' })
    reply.send(user)
  })

  // POST /api/auth/link-riot
  app.post('/link-riot', { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { gameName, tagLine } = z
      .object({ gameName: z.string(), tagLine: z.string() })
      .parse(req.body)

    const riotAccount = await getAccountByRiotId(gameName, tagLine)
    const summoner = await getSummonerByPuuid(riotAccount.puuid, tagLine)
    const entries = await getLeagueEntries(summoner.id, tagLine)
    const solo = entries.find((e) => e.queueType === 'RANKED_SOLO_5x5') ?? null

    const existing = await db.query.riotAccounts.findFirst({
      where: eq(riotAccounts.userId, userId),
    })

    const isFirstSync = !existing

    const [account] = await db
      .insert(riotAccounts)
      .values({
        userId,
        puuid: riotAccount.puuid,
        gameName: riotAccount.gameName,
        tagLine: riotAccount.tagLine,
        summonerId: summoner.id,
        profileIconId: summoner.profileIconId,
        summonerLevel: summoner.summonerLevel,
        soloTier: solo?.tier ?? null,
        soloRank: solo?.rank ?? null,
        soloLp: solo?.leaguePoints ?? null,
        soloWins: solo?.wins ?? null,
        soloLosses: solo?.losses ?? null,
      })
      .onConflictDoUpdate({
        target: riotAccounts.userId,
        set: {
          puuid: riotAccount.puuid,
          gameName: riotAccount.gameName,
          tagLine: riotAccount.tagLine,
          summonerId: summoner.id,
          profileIconId: summoner.profileIconId,
          summonerLevel: summoner.summonerLevel,
          soloTier: solo?.tier ?? null,
          soloRank: solo?.rank ?? null,
          soloLp: solo?.leaguePoints ?? null,
          soloWins: solo?.wins ?? null,
          soloLosses: solo?.losses ?? null,
        },
      })
      .returning()

    await syncMatchesQueue.add('sync', {
      riotAccountId: account.id,
      puuid: account.puuid,
      isFirstSync,
    })

    reply.send(account)
  })

  // POST /api/auth/sync — manually trigger match sync for current user
  app.post('/sync', { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const account = await db.query.riotAccounts.findFirst({
      where: eq(riotAccounts.userId, userId),
    })
    if (!account) return reply.code(400).send({ error: 'No linked Riot account' })

    await syncMatchesQueue.add('sync', {
      riotAccountId: account.id,
      puuid: account.puuid,
      isFirstSync: false,
    })

    reply.send({ ok: true })
  })

  // POST /api/auth/logout
  app.post('/logout', { preHandler: requireAuth }, async (_req, reply) => {
    reply.clearCookie('token', { path: '/' }).send({ ok: true })
  })
}

