import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import z from 'zod'
import { ObjectId } from 'mongodb'

import { createEventEmitter } from '#src/services/queue/event-bus.js'
import { createOutbox, type OutboxTask } from '#src/services/queue/outbox.js'
import { getCollection, withTransactionalSession } from '#services/db.service.js'
import { waitFor } from '#src/test/integration/harness.js'

type QueueEvents = {
	'review.add': OutboxTask<{ reviewId: string }>,
}

const EventSchema = z.discriminatedUnion('evType', [
	z.object({
		evType: z.literal('review.add'),
		payload: z.object({ reviewId: z.string() }),
	}),
])

describe('outbox integration', () => {
	const collectionName = `taskOutbox_it_${new ObjectId().toHexString()}`
	const receivedTaskIds: string[] = []

	beforeAll(async () => {
		const taskOutbox = await getCollection(collectionName)
		await taskOutbox.deleteMany({})
	})

	afterEach(async () => {
		const taskOutbox = await getCollection(collectionName)
		await taskOutbox.deleteMany({})
		receivedTaskIds.length = 0
	})

	it('registers an event and dispatches it to completion', async () => {
		const emitter = createEventEmitter<QueueEvents>()
		emitter.on('review.add', async task => {
			receivedTaskIds.push(task._id)
		})

		const outbox = createOutbox<QueueEvents>({
			eventSchema: EventSchema,
			emitter,
			collectionName,
			dispatchInterval: 20,
			maxAttempts: 2,
		})

		try {
			await withTransactionalSession(async session => {
				await outbox.registerTask('review.add', { reviewId: 'r1' }, session)
			})

			outbox.start()

			await waitFor(async () => {
				const taskOutbox = await getCollection(collectionName)
				const task = await taskOutbox.findOne({})

				expect(task?.status).toBe('COMPLETE')
				expect(receivedTaskIds.length).toBe(1)
			}, { message: 'outbox task was not completed in time' })
		} finally {
			outbox.stop()
		}
	})

	it('marks a task as FAILED after max attempts', async () => {
		const emitter = createEventEmitter<QueueEvents>()
		emitter.on('review.add', async () => {
			throw new Error('forced emit failure')
		})

		const outbox = createOutbox<QueueEvents>({
			eventSchema: EventSchema,
			emitter,
			collectionName,
			dispatchInterval: 20,
			maxAttempts: 1,
		})

		try {
			await withTransactionalSession(async session => {
				await outbox.registerTask('review.add', { reviewId: 'r2' }, session)
			})

			outbox.start()

			await waitFor(async () => {
				const taskOutbox = await getCollection(collectionName)
				const task = await taskOutbox.findOne({})

				expect(task?.status).toBe('FAILED')
				expect(task?.attempts).toBe(1)
				expect(task?.errorReason).toContain('forced emit failure')
			}, { message: 'outbox task was not marked as failed in time' })
		} finally {
			outbox.stop()
		}
	})
})
