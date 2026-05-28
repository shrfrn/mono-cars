import { describe, expect, it } from 'vitest'

import { AppError } from '#src/errors/app-errors.js'
import { HttpCodes } from '@cars/shared/src/http.js'
import { outboxTestUtils } from '#src/services/queue/outbox.js'

describe('outbox helper behavior', () => {
	it('formats AppError reason using message', () => {
		const reason = new AppError('validation failed', HttpCodes.BadRequest)

		expect(outboxTestUtils.formatErrorReason(reason)).toBe('validation failed')
	})

	it('formats generic error reason using message', () => {
		const reason = new Error('temporary network issue')

		expect(outboxTestUtils.formatErrorReason(reason)).toBe('temporary network issue')
	})

	it('falls back to unknown reason for non-error values', () => {
		expect(outboxTestUtils.formatErrorReason({ bad: 'shape' })).toBe('Unknown error')
	})

	it('composes failed update shape with status and formatted reason', () => {
		const result = { status: 'rejected', reason: new Error('emit failed') } as PromiseRejectedResult

		expect(outboxTestUtils.composeUpdate('PENDING', result)).toEqual({
			$set: {
				status: 'PENDING',
				errorReason: 'emit failed',
			},
		})
	})
})
