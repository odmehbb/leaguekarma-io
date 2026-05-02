import Fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt from '@fastify/jwt'
import fastifyStatic from '@fastify/static'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from './config.js'
import { authRoutes } from './routes/auth.js'
import { playerRoutes } from './routes/player.js'
import { reviewRoutes } from './routes/review.js'
import { matchRoutes } from './routes/match.js'
import { rankingsRoutes } from './routes/rankings.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function buildApp() {
  const app = Fastify({ logger: config.nodeEnv === 'development' })

  await app.register(fastifyCors, {
    origin: config.frontendUrl,
    credentials: true,
  })

  await app.register(fastifyCookie)

  await app.register(fastifyJwt, {
    secret: config.jwtSecret,
    cookie: { cookieName: 'token', signed: false },
  })

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(playerRoutes, { prefix: '/api/player' })
  await app.register(reviewRoutes, { prefix: '/api/player' })
  await app.register(matchRoutes, { prefix: '/api/match' })
  await app.register(rankingsRoutes, { prefix: '/api/rankings' })

  // Health check
  app.get('/health', async () => ({ status: 'ok' }))

  // Serve frontend static files in production
  const publicDir = path.join(__dirname, '..', 'public')
  await app.register(fastifyStatic, { root: publicDir, wildcard: false })
  app.setNotFoundHandler((_req, reply) => {
    reply.sendFile('index.html')
  })

  return app
}
