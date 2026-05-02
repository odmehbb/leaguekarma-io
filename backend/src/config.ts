import { z } from 'zod'

const schema = z.object({
  databaseUrl: z.string().url(),
  redisUrl: z.string().url(),
  jwtSecret: z.string().min(16),
  googleClientId: z.string(),
  googleClientSecret: z.string(),
  googleCallbackUrl: z.string().url(),
  riotApiKey: z.string(),
  frontendUrl: z.string().url(),
  port: z.coerce.number().default(3001),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  riotPlatformBaseUrl: z.string().url().default('https://euw1.api.riotgames.com'),
  riotRegionalBaseUrl: z.string().url().default('https://europe.api.riotgames.com'),
})

export const config = schema.parse({
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  jwtSecret: process.env.JWT_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
  riotApiKey: process.env.RIOT_API_KEY,
  frontendUrl: process.env.FRONTEND_URL,
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  riotPlatformBaseUrl: process.env.RIOT_PLATFORM_BASE_URL,
  riotRegionalBaseUrl: process.env.RIOT_REGIONAL_BASE_URL,
})
