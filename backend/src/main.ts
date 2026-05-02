import 'dotenv/config'
import { buildApp } from './app.js'
import { config } from './config.js'
import { startWorkers } from './jobs/queue.js'

const app = await buildApp()
startWorkers()

await app.listen({ port: config.port, host: '0.0.0.0' })
console.log(`leaguekarma backend running on port ${config.port}`)
