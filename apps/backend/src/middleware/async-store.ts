import { randomUUID } from 'crypto'

import type { NextFunction, Request, Response } from 'express'
import { AsyncLocalStorage } from 'async_hooks'

import { authService } from '../api/auth/auth.service.js'
import { MiniUserSchema } from '@car/shared'

import z from 'zod'

const RequestStoreSchema = z.object({
    requestId: z.uuid(),
    authUser: MiniUserSchema.optional(),
})
type RequestStore = z.infer<typeof RequestStoreSchema>

const asyncLocalStorage = new AsyncLocalStorage<RequestStore>()

export async function setupAsyncStore(req: Request, res: Response, next: NextFunction) {
	const storage = {
        requestId: randomUUID(),
    }
    
	asyncLocalStorage.run(storage, () => {
		if (!req.cookies?.loginToken) return next()
		const authUser = authService.validateToken(req.cookies.loginToken)

		if (authUser) {
			const alsStore = asyncLocalStorage.getStore()!
			alsStore.authUser = authUser
		}
		next()
	})
}

export function getAsyncStore() {
    return asyncLocalStorage.getStore()
}