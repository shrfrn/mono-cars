import { beforeEach, describe, expect, it, vi } from 'vitest'

const { loggerWarn } = vi.hoisted(() => ({
	loggerWarn: vi.fn(),
}))

vi.mock('#services/logger.service.js', () => ({
	logger: {
		warn: loggerWarn,
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}))

import { createEventEmitter } from '#src/services/queue/event-bus.js'

type QueueEvents = {
	'review.add': { _id: string, payload: { reviewId: string } },
}

describe('event-bus integration', () => {
	beforeEach(() => {
		loggerWarn.mockReset()
	})

	it('emits to all handlers and preserves payload shape', async () => {
		const calls: string[] = []
		const emitter = createEventEmitter<QueueEvents>()

		emitter.on('review.add', async task => {
			calls.push(`h1:${task.payload.reviewId}`)
		})

		emitter.on('review.add', async task => {
			calls.push(`h2:${task._id}`)
		})

		await emitter.emit('review.add', {
			_id: 'task-1',
			payload: { reviewId: 'r1' },
		})

		expect(calls).toEqual(['h1:r1', 'h2:task-1'])
		expect(loggerWarn).not.toHaveBeenCalled()
	})

	it('uses default handler when event has no listeners', async () => {
		const defaultHandler = vi.fn().mockResolvedValue(undefined)
		const emitter = createEventEmitter<QueueEvents>(defaultHandler)

		await emitter.emit('review.add', {
			_id: 'task-2',
			payload: { reviewId: 'r2' },
		})

		expect(defaultHandler).toHaveBeenCalledWith('review.add', {
			_id: 'task-2',
			payload: { reviewId: 'r2' },
		})
	})
})
