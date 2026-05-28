import { randomUUID } from 'node:crypto'
import { MongoClient, Db } from 'mongodb'
import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'

import { createEventEmitter, type EventEmitter } from '#services/queue/event-bus.js'
import { createOutbox, type CreateOutboxOptions, type OutboxTask } from '#services/queue/outbox.js'
import { createQueueManager, type CreateQueueManagerOptions, type QueueDef } from '#services/queue/job-queue.js'

const DEFAULT_DISPATCH_INTERVAL = 25
const DEFAULT_BATCH_SIZE = 10

type WaitForOptions = {
	timeoutMs?: number,
	intervalMs?: number,
	message?: string,
}

export type IntegrationScope = {
	id: string,
	dbName: string,
	queuePrefix: string,
}

export type IntegrationDbContext = {
	client: MongoClient,
	db: Db,
}

export function createIntegrationScope(prefix = 'queue') {
	const id = randomUUID().slice(0, 8)

	return {
		id,
		dbName: `${prefix}_it_${id}`,
		queuePrefix: `${prefix}-it-${id}`,
	}
}

export function applyIntegrationEnv(scope: IntegrationScope) {
	const mongoUrl = process.env.TEST_MONGO_URL
	const redisUrl = process.env.TEST_REDIS_URL

	if (!mongoUrl) throw new Error('Missing TEST_MONGO_URL from integration setup')
	if (!redisUrl) throw new Error('Missing TEST_REDIS_URL from integration setup')

	process.env.MONGO_URL = mongoUrl
	process.env.REDIS_QUEUE_URL = redisUrl
	process.env.MONGO_DB_NAME = scope.dbName
	process.env.NODE_ENV = 'test'
}

export async function connectIntegrationDb(scope: IntegrationScope): Promise<IntegrationDbContext> {
	const mongoUrl = process.env.TEST_MONGO_URL

	if (!mongoUrl) throw new Error('Missing TEST_MONGO_URL from integration setup')

	const client = new MongoClient(mongoUrl)

	await client.connect()

	return {
		client,
		db: client.db(scope.dbName),
	}
}

export async function cleanupIntegrationMongo(scope: IntegrationScope) {
	const { client, db } = await connectIntegrationDb(scope)

	try {
		const collections = await db.collections()

		await Promise.all(collections.map(collection => collection.deleteMany({})))
	} finally {
		await client.close()
	}
}

export async function dropIntegrationDb(scope: IntegrationScope) {
	const { client, db } = await connectIntegrationDb(scope)

	try {
		await db.dropDatabase()
	} finally {
		await client.close()
	}
}

export async function cleanupIntegrationQueues(queueNames: string[]) {
	const redisUrl = process.env.TEST_REDIS_URL

	if (!redisUrl) throw new Error('Missing TEST_REDIS_URL from integration setup')

	const redis = new Redis(redisUrl, { maxRetriesPerRequest: null })

	try {
		await Promise.all(queueNames.map(async queueName => {
			const queue = new Queue(queueName, { connection: redis })

			await queue.drain(true)
			await queue.obliterate({ force: true })
			await queue.close()
		}))
	} finally {
		redis.disconnect()
	}
}

export async function closeWorkers(workers: Worker[]) {
	await Promise.all(workers.map(worker => worker.close()))
}

export async function waitFor(assertion: () => void | Promise<void>, options: WaitForOptions = {}) {
	const timeoutMs = options.timeoutMs ?? 4_000
	const intervalMs = options.intervalMs ?? 30
	const message = options.message ?? 'waitFor timed out'
	const startedAt = Date.now()

	while (Date.now() - startedAt < timeoutMs) {
		try {
			await assertion()
			return
		} catch {
			await sleep(intervalMs)
		}
	}

	throw new Error(message)
}

export function buildTestEmitter<TMap extends Record<string, unknown>>() {
	return createEventEmitter<TMap>()
}

export function buildTestOutbox<TMap extends Record<string, OutboxTask<unknown>>>(
	args: Omit<CreateOutboxOptions<TMap>, 'dispatchInterval' | 'batchSize'> & {
		dispatchInterval?: number,
		batchSize?: number,
	},
) {
	return createOutbox({
		...args,
		dispatchInterval: args.dispatchInterval ?? DEFAULT_DISPATCH_INTERVAL,
		batchSize: args.batchSize ?? DEFAULT_BATCH_SIZE,
	})
}

export function buildTestQueueManager<
	TMap extends Record<string, OutboxTask<unknown>>,
	const TQueues extends Record<string, QueueDef<TMap>>,
>(
	scope: IntegrationScope,
	args: Omit<CreateQueueManagerOptions<TMap, TQueues>, 'queueDefs'> & {
		queueDefs: TQueues,
	},
) {
	const queueDefsWithPrefix = Object.fromEntries(
		Object.entries(args.queueDefs).map(([queueName, def]) => [`${scope.queuePrefix}:${queueName}`, def]),
	) as TQueues

	return createQueueManager({
		...args,
		queueDefs: queueDefsWithPrefix,
	})
}

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms))
}
