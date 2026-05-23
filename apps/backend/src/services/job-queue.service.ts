import { Redis } from 'ioredis'
import { Queue, Worker, Job } from 'bullmq'

import type { EventPayload, EventType } from './event.types.js'

import { Review, Comment } from '@car/shared'
import { outboxDispatcher } from './outbox.service.js'

const redisQueueUrl = process.env.REDIS_QUEUE_URL || 'redis://localhost:6379'
const connection = new Redis(redisQueueUrl, { maxRetriesPerRequest: null })

type QueueListItem = {
	name: string,
	instance?: Queue | null,
	workerCount: number,
	workers: Worker[],
}

const queueList: QueueListItem[] = [
	{
		name: 'user' as const,
		workerCount: 3,
		workers: [],
	},
	{
		name: 'notification' as const,
		workerCount: 1,
		workers: [],
	},
]
type QueueName = typeof queueList[number]['name']

type EventJobConfig = {
	[K in EventType]: {
		evType: K
		jobTypes: {
			name: string,
			handler: (job: Job<EventPayload<K>>) => Promise<void>
		}[],
	}
}[EventType]

// Transforms an event from the outbox into one or more jobs
type EventTranslator = Record<QueueName, EventJobConfig[]>
const eventTranslator: EventTranslator = {
	user: [
		{
			evType: 'car.comment.add',
			jobTypes: [ 
				{ name: 'user.activity.add' , handler: func1 },
				{ name: 'user.score.update' , handler: func1 },
			],
		},
		{
			evType: 'review.add',
			jobTypes: [ 
				{ name: 'user.activity.add', handler: func2 },
				{ name: 'user.score.update', handler: func2 },
				{ name: 'email.send', handler: func2 },
			],
		},
	],
	notification: [
		{
			evType: 'review.add',
			jobTypes: [
				{ name: 'email.send', handler: func2 },
			],
		},
	],
}

initQueues(queueList, eventTranslator)

async function initQueues(queues: typeof queueList, translator: EventTranslator) {
	queues.forEach(queue => {
		// Create a Queue
		queue.instance = new Queue(queue.name, { connection })

		const jobHandlers = new Map<string, (job: Job) => Promise<void>>
		const queueEvents = translator[queue.name]
		
		queueEvents.forEach(ev => 
			ev.jobTypes.forEach(jobType => 
				jobHandlers.set(jobType.name, jobType.handler)))
		// Attach Workers to it
		for (let i = 0; i < queue.workerCount; i++) {
			queue.workers[i] = new Worker(queue.name, async (job: Job) => {
				const handler = jobHandlers.get(job.name)
				if (handler) await handler(job)
			}, { connection })
		}

		// Add jobs to the Queue when the Outbox dispatcher fires
		translator[queue.name].forEach(<T extends EventType>(event: EventJobConfig & { evType: T }) => 
			event.jobTypes.forEach(jobType => 
				outboxDispatcher.on(event.evType, async (payload: EventPayload<T>) => {
					await queue.instance?.add(jobType.name, payload)
				})
			)
		)})
}

async function func1(job: Job<Comment>) {
	console.log(job.data)
}

async function func2(job: Job<Review>) {
	console.log(job.data)
}