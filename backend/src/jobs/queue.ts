import { Queue, Worker } from 'bullmq'
import { redis } from '../redis/index.js'
import { syncMatchesProcessor } from './sync-matches.js'

export const syncMatchesQueue = new Queue('sync-matches', { connection: redis })

export function startWorkers() {
  const worker = new Worker('sync-matches', syncMatchesProcessor, {
    connection: redis,
    concurrency: 3,
  })

  worker.on('completed', (job) => {
    console.log(`sync-matches job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`sync-matches job ${job?.id} failed:`, err.message)
  })

  return worker
}
