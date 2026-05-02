import { randomUUID } from "node:crypto"
import { logger } from "./logger.service.js"

export type Job = {
	timeoutId?: NodeJS.Timeout,
	message: object,
}

export type Message = {
	message: object,
	id: string,
}

export type MessageQueue = {
	push(message: object): void
	waitForJob(): Promise<void>
	pull(): Message | undefined
	complete(id: string): boolean
	fail(id: string): object | undefined
	count(): number
	processingCount(): number
	isEmpty(): boolean
}

export type MessageQueueOptions = {
	timeout: number
	concurrency: number
	delay?: number
	retryCount?: number
	retryDelay?: number
}

export type MessageOptions = Partial<Omit<MessageQueueOptions, 'concurrency'>>

export function createMessageQueue(options: MessageQueueOptions): MessageQueue {
    const queue: object[] = []
	const processing: Map<string, Job> = new Map()

	let notify: (() => void) | null = null

    return {
        push(message: object) {
            queue.unshift(message)
			notify?.()	// If a worker is awaiting, resolve the promise to wake it up
			notify = null
        },
		waitForJob() {
			return new Promise(resolve => notify = resolve)
		},
		pull(): Message | undefined {
			const message = queue.pop()
			if (!message) return

			const id = randomUUID()
			
			// Return the message to the top of the queue after the timeout
			const timeoutId = setTimeout(() => { 
				const message = this.fail(id)
				if (!message) return

				queue.push(message)
			}, options.timeout)
			
			processing.set(id, {timeoutId, message})
			return { id, message }
		},
		complete(id: string) {
			return processing.delete(id)
		},
		fail(id: string) {
			const job = processing.get(id)

			processing.delete(id)
			clearTimeout(job!.timeoutId)
			return job!.message
		},
		count() {
			return queue.length
		},
		processingCount() {
			return processing.size
		},
		isEmpty() {
			return queue.length === 0
		},
    }
}

export function createWorker(queue: MessageQueue, handler: (message: object) => Promise<void>, options = { concurrency: 1 }) {
	const activeJobs = new Map<string, Promise<void>>()

	return {
		async start() {
			while (true) {
				if (activeJobs.size >= options.concurrency) {
					await Promise.race(activeJobs.values())
						.catch(() => {}) // Actual error is handled by the promise catch block
					
				} else {
					const job = queue.pull()
					if (!job) {
						await queue.waitForJob()
						continue
					}
		
					const promise = handler(job.message)
					activeJobs.set(job.id, promise)
					promise
						.then(() => {
							activeJobs.delete(job.id)
							queue.complete(job.id)
						})
						.catch(() => {
							activeJobs.delete(job.id)
							queue.fail(job.id) //retry logic
						})
				}	
			}
		},
	}
}