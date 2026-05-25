// App composition layer: wires the generic infra (event-bus, outbox, queue
// manager) with the app's specific event catalog, queue topology and handlers.
// Importing this module instantiates the emitter, outbox and queue manager
// and starts the outbox dispatch loop.

import { Redis } from 'ioredis'
import { Job } from 'bullmq'
import { ClientSession } from 'mongodb'

import { createEventEmitter } from '#services/queue/event-bus.js'
import { createOutbox } from '#services/queue/outbox.js'
import { createQueueManager } from '#services/queue/job-queue.js'

import { AppEventSchema, type AppEventMap } from './event-map.js'

const redisQueueUrl = process.env.REDIS_QUEUE_URL || 'redis://localhost:6379'
const connection = new Redis(redisQueueUrl, { maxRetriesPerRequest: null })

const emitter = createEventEmitter<AppEventMap>()

export const outbox = createOutbox<AppEventMap>({ eventSchema: AppEventSchema, emitter })

export const jobManager = createQueueManager({
	emitter, connection,
	queues: {
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
	},
})

outbox.start()

// Placeholder until real handlers ship in their own modules (e.g. #api/user, #api/notification)
async function placeholder(job: Job, _session: ClientSession) {
	console.log(`[${job.name}]`, job.data)
}
