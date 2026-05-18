import { ErrorCode, HttpCodes, type HttpCode } from '@cars/shared/src/http.js'

export class AppError extends Error {
    public type: 'fail' | 'error' = 'fail'
    public httpCode: HttpCode
    public code: ErrorCode = 'BAD_REQUEST'
    public expected: boolean = true
    
	constructor(message: string, httpCode: HttpCode) {
		super(message)
		this.httpCode = httpCode
		Error.captureStackTrace(this, this.constructor)
	}
}

// Http 4xx errors
export class EntityNotFoundError extends AppError {
	constructor(entity = 'Entity') {
		super(`${entity} not found`, HttpCodes.NotFound)
        this.code = 'ENTITY_NOT_FOUND'
	}
}

export class ResourceNotFoundError extends AppError {
	constructor(resource = 'Resource') {
		super(`${resource} not found`, HttpCodes.NotFound)
        this.code = 'ENTITY_NOT_FOUND'
	}
}

export class ValidationError extends AppError {
	constructor(message = 'Validation Error') {
		super(message, HttpCodes.UnprocessableEntity)
        this.code = 'VALIDATION_FAILED'
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = 'Authentication required') {
		super(message, HttpCodes.Unauthorized)
        this.code = 'NOT_AUTHENTICATED'
	}
}

export class ForbidenError extends AppError {
	constructor(message = 'Insufficient permissions') {
		super(message, HttpCodes.Forbidden)
        this.code = 'INSUFFICIENT_PERMISSIONS'
	}
}

export class ConflictError extends AppError {
	constructor(message = 'Document changed since you loaded it - reload and retry.') {
		super(message, HttpCodes.Conflict)
        this.code = 'ENTITY_CHANGED'
	}
}

// Http 5xx errors
export class InternalServerError extends AppError {
	constructor(message = 'Internal server error', code: ErrorCode = 'INTERNAL_ERROR' ) {
		super(message, HttpCodes.InternalServerError)
        this.type = 'error'
        this.code = code
	}
}

export class UnexpectedServerError extends AppError {
	constructor(message = 'Internal server error') {
		super(message, HttpCodes.InternalServerError)
        this.type = 'error'
        this.code = 'INTERNAL_ERROR'
        this.expected = false
	}
}
