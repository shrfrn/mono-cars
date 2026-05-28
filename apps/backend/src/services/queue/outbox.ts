// Generic Mongo-backed transactional outbox. Persists (evType, payload) rows
// inside the producer's transaction, then a background loop dispatches them
// through the supplied event emitter. App provides the runtime schema; static
// safety comes from the TMap generic.

import z from 'zod'
import { AnyBulkWriteOperation, ClientSession, Collection, ObjectId, WithId } from 'mongodb'

import { AppError } from '../../errors/app-errors.js'
import { isTransientMongoError } from '../../errors/mongo-errors.js'
import { getCollection } from '#services/db.service.js'
import { logger } from '#services/logger.service.js'

import type { EventEmitter } from './event-bus.js'

export type OutboxTask<TPayload> = {
	_id: string,
	payload: TPayload,
}

export type CreateOutboxOptions<TMap extends Record<string, OutboxTask<unknown>>> = {
	eventSchema: z.ZodTypeAny,       // discriminated union of { evType, payload }
	emitter: EventEmitter<TMap>,
	collectionName?: string,
	batchSize?: number,
	dispatchInterval?: number,
	stuckTimeoutMs?: number,
	maxAttempts?: number,
}

const EventStatusSchema = z.enum(['PENDING', 'PROCESSING', 'COMPLETE', 'FAILED'])
type EventStatus = z.infer<typeof EventStatusSchema>

type DispatchPhase = 'fetch' | 'claim' | 'emit' | 'complete' | 'fail-write'

export class OutboxDispatchError extends Error {
	phase: DispatchPhase
	taskIds: string[]
	transient: boolean

	constructor(phase: DispatchPhase, taskIds: ObjectId[], cause: unknown) {
		const message = cause instanceof Error ? cause.message : 'Outbox dispatch failed'
		super(message, { cause })
		this.name = 'OutboxDispatchError'
		this.phase = phase
		this.taskIds = taskIds.map(id => id.toHexString())
		this.transient = isTransientMongoError(cause)
	}
}

export function createOutbox<TMap extends Record<string, OutboxTask<unknown>>>(opts: CreateOutboxOptions<TMap>) {
	const {
		eventSchema,
		emitter,
		collectionName = 'taskOutbox',
		batchSize = parseInt(process.env.OUTBOX_BATCH_SIZE || '10', 10),
		dispatchInterval = 400,
		stuckTimeoutMs = parseInt(process.env.STUCK_TIMEOUT_MS || '60000', 10),
		maxAttempts = 5,
	} = opts

	// Infra collection — not an entity. Lifecycle tracked via status / startedAt / attempts.
	const OutboxInsertSchema = z.object({
		evType: z.string(),
		payload: z.unknown(),
		status: EventStatusSchema.default('PENDING'),
		startedAt: z.date().nullable().default(null),
		attempts: z.number().int().default(0),
		errorReason: z.string().nullable().default(null),
		expiresAt: z.date().nullable().default(null),
		createdAt: z.date().default(() => new Date()),
	})

	type OutboxDoc = z.infer<typeof OutboxInsertSchema> & { _id: ObjectId }

	let timerId: NodeJS.Timeout | null = null
	let isRunning = false

	return {
		registerTask,
		start,
		stop,
	}

	async function registerTask<K extends keyof TMap & string>(
		evType: K, payload: TMap[K]['payload'], session: ClientSession
	) {
		const validEvent = eventSchema.parse({ evType, payload })
		const doc = OutboxInsertSchema.parse(validEvent)

		const taskOutbox = await getCollection(collectionName)
		await taskOutbox.insertOne(doc, { session })
	}

	function start() {
		if (isRunning) return
		isRunning = true
		void dispatchLoop()
	}

	function stop() {
		isRunning = false
		if (timerId) clearTimeout(timerId)
	}

	async function dispatchLoop() {
		try {
			await dispatchTaskBatch()
		} catch (err) {
			_logDispatchError(err)
		} finally {
			if (isRunning) timerId = setTimeout(dispatchLoop, dispatchInterval)
		}
	}

	async function dispatchTaskBatch() {
		const taskOutbox = await getCollection<OutboxDoc>(collectionName)
		let phase: DispatchPhase = 'fetch'
		let taskIds: ObjectId[] = []

		try {
			phase = 'fetch'
			const stuckCutoff = new Date(Date.now() - stuckTimeoutMs)
			const rawTasks = await taskOutbox.find({ $or: [
				{ status: 'PENDING' },
				{ status: 'PROCESSING', startedAt: { $lt: stuckCutoff } },
			]}).limit(batchSize).toArray()

			if (rawTasks.length === 0) return

			taskIds = rawTasks.map(task => task._id)

			phase = 'claim'
			const tasks = await _claimTasks(taskOutbox, rawTasks)

			phase = 'emit'
			const results = await _emitEvents(tasks)

			const successIds: ObjectId[] = []
			const failedUpdates: AnyBulkWriteOperation<OutboxDoc>[] = []

			results.forEach((result, idx) => {
				const task = tasks[idx]

				if (result.status === 'fulfilled') {
					successIds.push(task._id)
				} else {
					const status: EventStatus = task.attempts >= maxAttempts ? 'FAILED' : 'PENDING'

					_logTaskDispatchFailure(task, status, result.reason)

					failedUpdates.push({
						updateOne: {
							filter: { _id: task._id },
							update: _composeUpdate(status, result),
						},
					})
				}
			})

			phase = 'complete'
			if (successIds.length > 0) {
				await taskOutbox.updateMany(
					{ _id: { $in: successIds } },
					{ $set: { status: 'COMPLETE' } },
				)
			}

			phase = 'fail-write'
			if (failedUpdates.length > 0) await taskOutbox.bulkWrite(failedUpdates)
		} catch (err) {
			throw new OutboxDispatchError(phase, taskIds, err)
		}
	}

	async function _claimTasks(taskOutbox: Collection<OutboxDoc>, rawTasks: WithId<OutboxDoc>[]) {
		const startedAt = new Date()
		const taskIds = rawTasks.map(task => task._id)

		await taskOutbox.updateMany(
			{ _id: { $in: taskIds } },
			{
				$set: { status: 'PROCESSING', startedAt },
				$inc: { attempts: 1 },
			},
		)

		return rawTasks.map(task => ({
			...task,
			startedAt,
			status: 'PROCESSING' as const,
			attempts: (task.attempts ?? 0) + 1,
		}))
	}

	async function _emitEvents(tasks: WithId<OutboxDoc>[]) {
		const emitPrms = tasks.map(task => {
			const evType = task.evType as keyof TMap & string
			const outboxTask = { _id: task._id.toHexString(), payload: task.payload } as TMap[typeof evType]
			return emitter.emit(evType, outboxTask)
		})
		return Promise.allSettled(emitPrms)
	}
}

function _logDispatchError(err: unknown) {
	if (err instanceof OutboxDispatchError) {
		logger.error(
			`Outbox dispatch failed [${err.phase}] batchSize=${err.taskIds.length} transient=${err.transient}`,
			{ taskIds: err.taskIds, err: err.cause },
		)
		return
	}

	logger.error('Outbox dispatch failed', err)
}

function _composeUpdate(status: EventStatus, result: PromiseRejectedResult) {
	return {
		$set: {
			status,
			errorReason: _formatErrorReason(result.reason),
		},
	}
}

function _formatErrorReason(reason: unknown) {
	if (reason instanceof AppError) return reason.message
	if (reason instanceof Error) return reason.message
	return 'Unknown error'
}

export const outboxTestUtils = {
	composeUpdate: _composeUpdate,
	formatErrorReason: _formatErrorReason,
}

function _logTaskDispatchFailure(
	task: { _id: ObjectId, evType: string, attempts: number },
	status: EventStatus,
	reason: unknown,
) {
	const message = `Outbox task dispatch failed: ${task.evType}`
	const metadata = {
		taskId: task._id.toHexString(),
		evType: task.evType,
		attempts: task.attempts,
		status,
		reason: _formatErrorReason(reason),
	}

	if (status === 'FAILED') {
		logger.error(message, metadata)
		return
	}

	logger.warn(message, metadata)
}
