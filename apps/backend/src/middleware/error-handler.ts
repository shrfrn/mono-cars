import type { Request, Response, NextFunction } from 'express'
import { ApiErrorResponse, HttpCodes, ErrorCode, HttpCode } from '@cars/shared/src/http.js'
import { ZodError } from 'zod'
import { logger } from '#services/logger.service.js'

export function errorHandler(err: any, req: Request, res: Response<ApiErrorResponse>, next: NextFunction) {
	let type = err.status || 'error'
	let httpCode: HttpCode = err.httpCode || HttpCodes.InternalServerError
	let code: ErrorCode = err.code || 'INTERNAL_ERROR'
	let message = err.message || 'Something went wrong'
    let zodErrors

	if (err instanceof ZodError) {
		httpCode = HttpCodes.UnprocessableEntity
		type = 'fail'
		code = 'VALIDATION_FAILED'

        zodErrors = err.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
        }))
	}
    const errorResponse: ApiErrorResponse = { type, code, message,
        ...process.env.NODE_ENV === 'development' && { stack: err.stack }}

    if (zodErrors) errorResponse.details = zodErrors

    logger.error(errorResponse)
    res.status(httpCode).send(errorResponse)
}
