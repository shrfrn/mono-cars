import {
	MongoError,
	MongoNetworkError,
	MongoServerError,
	MongoServerSelectionError,
} from 'mongodb'

import type { AppError } from './app-errors.js'
import {
	ConflictError,
	UnexpectedServerError,
	ValidationError,
} from './app-errors.js'

const NOT_PRIMARY_CODES = new Set([10107, 11600, 11602, 13435, 13436])

export function isMongoError(err: unknown): err is MongoError | Error {
	if (err instanceof MongoError) return true
	if (err instanceof Error && err.name === 'BSONError') return true
	return false
}

export function isTransientMongoError(err: unknown): boolean {
	if (!(err instanceof MongoError)) return false

	if (err instanceof MongoNetworkError) return true
	if (err instanceof MongoServerSelectionError) return true
	if (err.hasErrorLabel('RetryableWriteError')) return true
	if (err.hasErrorLabel('PoolRequestedRetry')) return true
	if (err.hasErrorLabel('TransientTransactionError')) return true
	if (err.hasErrorLabel('UnknownTransactionCommitResult')) return true

	return false
}

export function mapMongoError(err: MongoError | Error): AppError {
	if (err.name === 'BSONError') return new ValidationError(err.message)

	if (!(err instanceof MongoError)) return new UnexpectedServerError(err.message)

	if (err instanceof MongoServerError && err.code === 11000) {
		const keyValue = err.keyValue
			? Object.entries(err.keyValue).map(([k, v]) => `${k}: ${v}`).join(', ')
			: undefined

		return new ConflictError(
			keyValue ? `Duplicate key (${keyValue})` : 'Duplicate key violation',
		)
	}

	if (err instanceof MongoNetworkError || err instanceof MongoServerSelectionError) {
		return new UnexpectedServerError('Database unavailable')
	}

	if (err instanceof MongoServerError && typeof err.code === 'number' && NOT_PRIMARY_CODES.has(err.code)) {
		return new UnexpectedServerError('Database unavailable')
	}

	if (err.name === 'MongoInvalidArgumentError' || err.message.includes('ObjectId')) {
		return new ValidationError(err.message)
	}

	return new UnexpectedServerError(err.message || 'Database error')
}
