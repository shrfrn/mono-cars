import z from 'zod'
import { AnyBulkWriteOperation, ClientSession, ObjectId, Document } from 'mongodb'

import { createEntitySchemas } from '@car/shared'
import { EventPayload, EventType, EventTypeSchema, EventSchema as PayloadEventSchema } from './event.types.js'
import { getCollection, prepareInsert } from './db.service.js'
import { createEventEmitter } from './async-event-bus.js'

const DISPATCH_INTERVAL = 400
const MAX_ATTEMPTS = 5
const BATCH_SIZE = parseInt(process.env.OUTBOX_BATCH_SIZE || '10', 10)
const STUCK_TIMEOUT_MS = parseInt(process.env.STUCK_TIMEOUT_MS || '60000', 60_000) 

export const outboxDispatcher = createEventEmitter()

const EventStatusSchema = z.enum(['PENDING', 'PROCESSING', 'COMPLETE', 'FAILED'])
type EventStatus = z.infer<typeof EventStatusSchema>

export const EventFieldsSchema = z.object({
	eventType: EventTypeSchema,
	payload: z.unknown(),
	status: EventStatusSchema.default('PENDING'),
	startedAt: z.date().nullable().default(null),
	attempts: z.number().int().default(0),
	errorReason: z.string().nullable().default(null),
	expiresAt: z.date().nullable().default(null),
})

export const { 
    fullSchema: EventSchema, 
    baseSchema: EventBaseSchema, 
    patchSchema: EventPatchSchema } = createEntitySchemas(EventFieldsSchema)

type Event = z.infer<typeof EventSchema>
type EventBase = z.infer<typeof EventBaseSchema>

export async function registerTask<T extends EventType>(evType: T, payload: EventPayload<T>, session: ClientSession) {

	// Strict validation (Guarantees payload matches eventType)
	const validEvent = PayloadEventSchema.parse({ evType, payload })
	// Add metadata (We know the payload is correct, so z.unknown() is safe here)
	const eventBase = EventBaseSchema.parse(validEvent)	

	const preparedEvent = prepareInsert(eventBase)
	const taskOutbox = await getCollection('taskOutbox')
	await taskOutbox.insertOne(preparedEvent, { session })
}

export async function dispatchOutbox() {
	try {
		// Calculate the cutoff time for stuck tasks
		const stuckCutoff = new Date(Date.now() - STUCK_TIMEOUT_MS)
		
		const taskOutbox = await getCollection('taskOutbox')
		const tasks = await taskOutbox.find({ $or: [
			{ status: 'PENDING' },
			{ status: 'PROCESSING', startedAt: { $lt: stuckCutoff }}
		]}).limit(BATCH_SIZE).toArray()
	
		if (tasks.length === 0) return

		const taskIds = tasks.map(task => task._id)
		await taskOutbox.updateMany({ _id: { $in: taskIds } },{ $set: { status: 'PROCESSING' }})

		const emitPrms = tasks.map(task => outboxDispatcher.emit(task.eventType, task.payload))
		const results = await Promise.allSettled(emitPrms)

		const successIds: ObjectId[] = []
		const failedUpdates: AnyBulkWriteOperation<Document>[] = []

		results.forEach((result, idx) => {
			const task = tasks[idx]

			if (result.status === 'fulfilled') {
				successIds.push(taskIds[idx])
			} else {
				const attempts = (task.attempts || 0) + 1
				const status = attempts > MAX_ATTEMPTS ? 'FAILED' : 'PENDING'

				failedUpdates.push({
					updateOne: {
						filter: { _id: task._id },
						update: _composeUpdate(status, attempts, result),
					}
				})
			}
		})

		if (successIds.length > 0) {
			await taskOutbox.updateMany({ _id: { $in: successIds }}, { $set: { status: 'COMPLETE' }})
		}

		if (failedUpdates.length > 0) {
			await taskOutbox.bulkWrite(failedUpdates)
		}
	} catch (err) {
		console.error('Critical error in outbox dispatcher:', err)
	} finally {
		setTimeout(dispatchOutbox, DISPATCH_INTERVAL)
	}
}

function _composeUpdate(status: EventStatus, attempts: number, result: PromiseRejectedResult) {
	return {
		$set: {
			status,
			attempts,
			errorReson: result.reason?.message || 'Unknown error',
		}
	}
}