import path from 'node:path'

import type { Request, Response, NextFunction } from 'express'
import { ApiErrorResponse, HttpCodes, ErrorCode, HttpCode } from '@cars/shared/src/http.js'
import { ZodError } from 'zod'
import { logger } from '#services/logger.service.js'
import { AppError } from '../errors/app-errors.js'

export function errorHandler(err: AppError, req: Request, res: Response<ApiErrorResponse>, next: NextFunction) {
	let type = err.type || 'error'
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
        ...(process.env.NODE_ENV === 'development' && { stack: _cleanStack(err) }) }

	if (zodErrors) errorResponse.details = zodErrors

	logger.error(errorResponse)
	res.status(httpCode).send(errorResponse)
}


// Cleans an Error stack trace by:
// 1. Filtering out node_modules and internal Node/Express frames.
// 2. Converting absolute paths to relative paths from the project root.

function _cleanStack(error: Error, projectRoot = process.cwd()) {
	if (!error.stack) return ''
    
	const stackLines = error.stack.split('\n')
	const cleanedLines = stackLines
		.filter(line => {
			// Keep the first line (the error message)
			if (!line.trim().startsWith('at ')) return true

			// Filter out node_modules and internal Node.js frames
			const isInternal = 
                line.includes('node_modules') || 
                line.includes('node:internal') || line.includes('node:events')

			return !isInternal
		})
		.map(line => {
			// Match absolute paths inside parentheses (e.g., at file.js (/abs/path/to/file.js:1:2))
			// or paths without parentheses (e.g., at /abs/path/to/file.js:1:2)
			return line.replace(/(\/|\w:)[^:\s)]+/g, match => {
				// Only convert if it's a valid absolute path
				if (path.isAbsolute(match)) {
					return path.relative(projectRoot, match)
				}
				return match
			})
		})

	return cleanedLines.join('\n')
}
