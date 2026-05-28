// App composition layer: wires the generic services (event-bus, outbox, queue
// manager) with the app's specific event catalog, queue topology and handlers.
// Importing this module instantiates the emitter, outbox and queue manager.

import { Redis } from 'ioredis'
import { Job } from 'bullmq'
import { ClientSession } from 'mongodb'

import { createEventEmitter } from '#services/queue/event-bus.js'
import { createOutbox } from '#services/queue/outbox.js'
import { createQueueManager, QueueDef } from '#services/queue/job-queue.js'
import { logger } from '#services/logger.service.js'

import { AppEventSchema, type AppEventMap } from './event-map.js'

const redisQueueUrl = process.env.REDIS_QUEUE_URL || 'redis://localhost:6379'
export const redisConnection = new Redis(redisQueueUrl, { maxRetriesPerRequest: null })

const emitter = createEventEmitter<AppEventMap>()
export const outbox = createOutbox<AppEventMap>({ eventSchema: AppEventSchema, emitter })

const queueDefs = {
	user: {
		workerCount: 3,
		events: [
			{ evType: 'car.comment.add', jobTypes: [
				{ name: 'user.activity.add', handler: placeholder },
				{ name: 'user.score.update', handler: placeholder },
			]},
			{ evType: 'review.add', jobTypes: [
				{ name: 'user.activity.add', handler: placeholder },
				{ name: 'user.score.update', handler: placeholder },
				{ name: 'email.send',        handler: placeholder },
			]},
		],
	},
	notification: {
		events: [
			{ evType: 'review.add', jobTypes: [
				{ name: 'email.send', handler: placeholder },
			]},
		],
	},

} satisfies Record<string, QueueDef<AppEventMap>>

// Make sure redisConnection is alive before calling createQueueManager()

try {
	await redisConnection.ping()
} catch (err) {
	logger.error('Cannot connect to Redis', err)
	process.exit(1)
}

// createQueueManager() spins up the Queues & Workers
// and subscribes Queues to emitter events
// adding all event derived jobTypes to the Queue

export const jobManager = createQueueManager({ queueDefs, emitter, connection: redisConnection })

export function startQueues() {
	outbox.start()
}

// Placeholder until real handlers ship in their own modules (e.g. #api/user, #api/notification)
async function placeholder(job: Job, _session: ClientSession) {
	logger.info(`[${job.name}]`, job.data)
}
