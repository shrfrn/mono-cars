import { describe, expect, it } from 'vitest'

import { AppError } from '#src/errors/app-errors.js'
import { HttpCodes } from '@cars/shared/src/http.js'
import { jobQueueTestUtils } from '#src/services/queue/job-queue.js'

describe('job retry classification', () => {
	it('marks AppError 4xx as non-retryable', () => {
		const error = new AppError('invalid payload', HttpCodes.BadRequest)

		expect(jobQueueTestUtils.isNonRetryableJobError(error)).toBe(true)
	})

	it('marks AppError 5xx as retryable', () => {
		const error = new AppError('db unavailable', HttpCodes.InternalServerError)

		expect(jobQueueTestUtils.isNonRetryableJobError(error)).toBe(false)
	})

	it('marks non-AppError values as retryable', () => {
		expect(jobQueueTestUtils.isNonRetryableJobError(new Error('timeout'))).toBe(false)
		expect(jobQueueTestUtils.isNonRetryableJobError('failed')).toBe(false)
	})
})
