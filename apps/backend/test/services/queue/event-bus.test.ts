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

type TestEvents = {
	'task.created': { id: string, value: number },
}

describe('createEventEmitter', () => {
	beforeEach(() => {
		loggerWarn.mockReset()
	})

	it('uses default handler when no listeners are registered', async () => {
		const defaultHandler = vi.fn().mockResolvedValue(undefined)
		const emitter = createEventEmitter<TestEvents>(defaultHandler)

		await emitter.emit('task.created', { id: 't1', value: 1 })

		expect(defaultHandler).toHaveBeenCalledOnce()
		expect(defaultHandler).toHaveBeenCalledWith('task.created', { id: 't1', value: 1 })
	})

	it('removes listeners with off', async () => {
		const handler = vi.fn().mockResolvedValue(undefined)
		const emitter = createEventEmitter<TestEvents>()

		emitter.on('task.created', handler)
		emitter.off('task.created', handler)

		await emitter.emit('task.created', { id: 't1', value: 2 })

		expect(handler).not.toHaveBeenCalled()
		expect(loggerWarn).toHaveBeenCalledOnce()
	})

	it('throws when at least one handler rejects and logs rejection reason', async () => {
		const goodHandler = vi.fn().mockResolvedValue(undefined)
		const failure = new Error('queue failed')
		const badHandler = vi.fn().mockRejectedValue(failure)
		const emitter = createEventEmitter<TestEvents>()

		emitter.on('task.created', goodHandler)
		emitter.on('task.created', badHandler)

		await expect(
			emitter.emit('task.created', { id: 't1', value: 3 }),
		).rejects.toThrow('queue failed')

		expect(goodHandler).toHaveBeenCalledOnce()
		expect(badHandler).toHaveBeenCalledOnce()
		expect(loggerWarn).toHaveBeenCalledWith('Event handler failed: task.created', failure)
	})
})
