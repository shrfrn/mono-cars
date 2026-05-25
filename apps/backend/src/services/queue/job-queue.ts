// Generic BullMQ-backed queue manager. Translates outbox events into BullMQ
// jobs across one or more queues. The queues map is the single source of truth
// for queue names, per-queue worker count, and event-to-job fan-out. Worker-
// side idempotency is enforced via a completedJobs collection in Mongo.

import { Redis } from 'ioredis'
import { Queue, Worker, Job } from 'bullmq'
import { ClientSession } from 'mongodb'

import { endSession, getCollection, startSession } from '#services/db.service.js'

import type { EventEmitter } from './event-bus.js'
import type { OutboxTask } from './outbox.js'

export type JobHandler<TPayload> = (
	job: Job<OutboxTask<TPayload>>,
	session: ClientSession,
) => Promise<void>

export type JobType<TPayload> = {
	name: string,
	handler: JobHandler<TPayload>,
}

export type EventJobs<TMap extends Record<string, OutboxTask<unknown>>> = {
	[K in keyof TMap & string]: { evType: K, jobTypes: JobType<TMap[K]['payload']>[] }
}[keyof TMap & string]

export type QueueDef<TMap extends Record<string, OutboxTask<unknown>>> = {
	workerCount?: number,
	events: EventJobs<TMap>[],
}

export type RuntimeQueue = {
	instance: Queue,
	workers: Worker[],
}

export type CompletedJob = {
	_id: string,
	completedAt: Date,
	taskId: string,
	jobName: string,
}

export type CreateQueueManagerOptions<
	TMap extends Record<string, OutboxTask<unknown>>,
	TQueues extends Record<string, QueueDef<TMap>>,
> = {
	emitter: EventEmitter<TMap>,
	connection: Redis,
	queues: TQueues,
	completedCollection?: string,
}

export function createQueueManager<
	TMap extends Record<string, OutboxTask<unknown>>,
	const TQueues extends Record<string, QueueDef<TMap>>,
>(args: CreateQueueManagerOptions<TMap, TQueues>) {
	const { emitter, connection, queues: defs, completedCollection = 'completedJobs' } = args

	const runtime = {} as { [K in keyof TQueues]: RuntimeQueue }

	for (const [name, def] of Object.entries(defs) as [keyof TQueues & string, QueueDef<TMap>][]) {
		const instance = new Queue(name, { connection })
		const handlerMap = _buildHandlerMap(def.events)
		const workers = _spawnWorkers(name, def.workerCount ?? 1, handlerMap, connection, completedCollection)

		_wireEmitter(emitter, instance, def.events)
		runtime[name] = { instance, workers }
	}

	return {
		queues: runtime,
		async stop() {
			for (const { instance, workers } of Object.values(runtime) as RuntimeQueue[]) {
				await Promise.all(workers.map(w => w.close()))
				await instance.close()
			}
		},
	}
}

type AnyHandler = JobHandler<unknown>

function _buildHandlerMap<TMap extends Record<string, OutboxTask<unknown>>>(events: EventJobs<TMap>[]) {
	const map = new Map<string, AnyHandler>()

	events.forEach(ev =>
		ev.jobTypes.forEach(jobType =>
			map.set(jobType.name, jobType.handler as AnyHandler)))

	return map
}

function _spawnWorkers(
	queueName: string,
	count: number,
	handlerMap: Map<string, AnyHandler>,
	connection: Redis,
	completedCollection: string,
) {
	const workers: Worker[] = []

	for (let i = 0; i < count; i++) {
		workers.push(new Worker(queueName, async (job: Job) => {
			const handler = handlerMap.get(job.name)
			if (handler) await _runHandler(job, handler, completedCollection)
		}, { connection }))
	}

	return workers
}

async function _runHandler(job: Job, handler: AnyHandler, completedCollection: string) {
	const completedJobs = await getCollection<CompletedJob>(completedCollection)
	const alreadyDone = job.id ? await completedJobs.findOne({ _id: job.id }) : null

	if (alreadyDone) return
	const session = await startSession()

	try {
		await session.withTransaction(async () => {
			await handler(job as Job<OutboxTask<unknown>>, session)
			await _registerCompleted(job, completedCollection, session)
		})
	} finally {
		await endSession(session)
	}
}

async function _registerCompleted(job: Job, collectionName: string, session: ClientSession) {
	if (!job.id) return

	const completedJobs = await getCollection<CompletedJob>(collectionName)
	const taskId = (job.data as OutboxTask<unknown>)._id

	await completedJobs.insertOne({
		_id: job.id,
		completedAt: new Date(),
		taskId,
		jobName: job.name,
	}, { session })
}

function _wireEmitter<TMap extends Record<string, OutboxTask<unknown>>>(
	emitter: EventEmitter<TMap>,
	queue: Queue,
	events: EventJobs<TMap>[],
) {
	events.forEach(ev =>
		ev.jobTypes.forEach(jobType =>
			emitter.on(ev.evType, async task => {
				const jobId = `${jobType.name}:${task._id}`
				await queue.add(jobType.name, task, { jobId })
			})))
}
