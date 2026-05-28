import { afterEach, describe, expect, it } from 'vitest'
import { ObjectId } from 'mongodb'
import { Redis } from 'ioredis'
import { Job } from 'bullmq'

import { HttpCodes } from '@cars/shared/src/http.js'

import { AppError } from '#src/errors/app-errors.js'
import { createEventEmitter } from '#src/services/queue/event-bus.js'
import { createQueueManager, type QueueDef } from '#src/services/queue/job-queue.js'
import { type OutboxTask } from '#src/services/queue/outbox.js'
import { getCollection } from '#services/db.service.js'
import { cleanupIntegrationQueues, waitFor } from '#src/test/integration/harness.js'

type QueueEvents = {
	'review.add': OutboxTask<{ reviewId: string }>,
}

describe('job-queue integration', () => {
	const queueName = `queue_it_${new ObjectId().toHexString()}`
	const completedCollection = `completedJobs_it_${new ObjectId().toHexString()}`
	const sideEffects: string[] = []
	let redis: Redis | null = null

	afterEach(async () => {
		if (redis) redis.disconnect()
		redis = null

		const completedJobs = await getCollection(completedCollection)
		await completedJobs.deleteMany({})

		await cleanupIntegrationQueues([queueName])
		sideEffects.length = 0
	})

	it('processes queued job and records completion once per job id', async () => {
		const redisUrl = process.env.REDIS_QUEUE_URL || process.env.TEST_REDIS_URL
		if (!redisUrl) throw new Error('Missing REDIS_QUEUE_URL for integration test')

		redis = new Redis(redisUrl, { maxRetriesPerRequest: null })

		const emitter = createEventEmitter<QueueEvents>()
		const queueDefs = {
			[queueName]: {
				workerCount: 1,
				events: [{
					evType: 'review.add',
					jobTypes: [{
						name: 'user.activity.add',
						handler: async (job: Job<OutboxTask<{ reviewId: string }>>) => {
							sideEffects.push(job.data.payload.reviewId)
						},
					}],
				}],
			},
		} satisfies Record<string, QueueDef<QueueEvents>>

		const manager = createQueueManager({
			emitter,
			queueDefs,
			connection: redis,
			completedCollection,
		})

		try {
			await emitter.emit('review.add', { _id: 'task-1', payload: { reviewId: 'r1' } })

			await waitFor(async () => {
				const completedJobs = await getCollection(completedCollection)
				const completed = await completedJobs.findOne({ _id: 'user.activity.add-task-1' })

				expect(completed?._id).toBe('user.activity.add-task-1')
				expect(sideEffects).toEqual(['r1'])
			}, { message: 'job was not processed in time' })

			await emitter.emit('review.add', { _id: 'task-1', payload: { reviewId: 'r1' } })
			await new Promise(resolve => setTimeout(resolve, 150))

			expect(sideEffects).toEqual(['r1'])
		} finally {
			await manager.stop()
		}
	})

	it('classifies AppError 4xx as unrecoverable in worker', async () => {
		const redisUrl = process.env.REDIS_QUEUE_URL || process.env.TEST_REDIS_URL
		if (!redisUrl) throw new Error('Missing REDIS_QUEUE_URL for integration test')

		redis = new Redis(redisUrl, { maxRetriesPerRequest: null })

		const emitter = createEventEmitter<QueueEvents>()
		const queueDefs = {
			[queueName]: {
				workerCount: 1,
				events: [{
					evType: 'review.add',
					jobTypes: [{
						name: 'user.activity.add',
						handler: async () => {
							throw new AppError('bad payload', HttpCodes.BadRequest)
						},
					}],
				}],
			},
		} satisfies Record<string, QueueDef<QueueEvents>>

		const manager = createQueueManager({
			emitter,
			queueDefs,
			connection: redis,
			completedCollection,
		})

		try {
			await emitter.emit('review.add', { _id: 'task-2', payload: { reviewId: 'r2' } })

			await waitFor(async () => {
				const queue = manager.queues[queueName]?.instance
				const failed = await queue.getFailed()

				expect(failed.length).toBeGreaterThan(0)
				expect(failed[0]?.attemptsMade).toBe(1)
			}, { message: 'job did not fail as unrecoverable in time' })
		} finally {
			await manager.stop()
		}
	})
})
