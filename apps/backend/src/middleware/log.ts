import { getAsyncStore } from './async-store.js'
import { logger } from '#services/logger.service.js'
import type { Request, Response, NextFunction } from 'express'

export function log(req: Request, res: Response, next: NextFunction) {
    const { baseUrl, method, body, params } = req
    const store = getAsyncStore()!

	logger.info(baseUrl, method, body, params, store)
	next()
}
