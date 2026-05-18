import path from 'node:path'

import type { Request, Response, NextFunction } from 'express'
import { ApiErrorResponse, HttpCodes } from '@cars/shared/src/http.js'
import { ZodError, z } from 'zod'
import { logger } from '#services/logger.service.js'
import { AppError } from '../errors/app-errors.js'

const isDev = process.env.NODE_ENV !== 'production'


export function errorHandler(err: Error, req: Request, res: Response<ApiErrorResponse>, _next: NextFunction) {
	logger.error(`${req.method} ${req.originalUrl} →`, err)

	if (err instanceof ZodError) return _sendZodError(err, res)
	if (err instanceof AppError) return _sendAppError(err, res)

	_sendUnexpected(err, res)
}


function _sendZodError(err: ZodError, res: Response<ApiErrorResponse>) {
	const response: ApiErrorResponse = {
		type: 'fail',
		code: 'VALIDATION_FAILED',
		message: 'Validation failed',
		details: _formatZodIssues(err),
		...(isDev && { pretty: z.prettifyError(err) }),
	}

	res.status(HttpCodes.UnprocessableEntity).send(response)
}


function _sendAppError(err: AppError, res: Response<ApiErrorResponse>) {
	const response: ApiErrorResponse = {
		type: err.type,
		code: err.code,
		message: err.message,
		...(isDev && { stack: _cleanStack(err) }),
	}

	res.status(err.httpCode).send(response)
}


function _sendUnexpected(err: Error, res: Response<ApiErrorResponse>) {
	const response: ApiErrorResponse = {
		type: 'error',
		code: 'INTERNAL_ERROR',
		message: isDev ? (err.message || 'Something went wrong') : 'Something went wrong',
		...(isDev && { stack: _cleanStack(err) }),
	}

	res.status(HttpCodes.InternalServerError).send(response)
}


function _formatZodIssues(err: ZodError) {
	return err.issues.map(issue => {
		const detail: Record<string, unknown> = {
			path: issue.path.length ? issue.path.join('.') : '(root)',
			code: issue.code,
			message: issue.message,
		}

		if (issue.code === 'invalid_type') detail.expected = issue.expected
		if (issue.code === 'invalid_value') detail.expected = issue.values
		if (issue.code === 'unrecognized_keys') detail.keys = issue.keys

		return detail
	})
}


// Cleans an Error stack trace by:
// 1. Filtering out node_modules and internal Node/Express frames.
// 2. Converting absolute paths to relative paths from the project root.

function _cleanStack(error: Error, projectRoot = process.cwd()) {
	if (!error.stack) return ''

	const stackLines = error.stack.split('\n')
	const cleanedLines = stackLines
		.filter(line => {
			if (!line.trim().startsWith('at ')) return true // keep header lines

			const isInternal =
				line.includes('node_modules') ||
				line.includes('node:internal') ||
				line.includes('node:events')

			return !isInternal
		})
		.map(line => {
			return line.replace(/(\/|\w:)[^:\s)]+/g, match => {
				if (path.isAbsolute(match)) return path.relative(projectRoot, match)
				return match
			})
		})

	return cleanedLines.join('\n')
}
