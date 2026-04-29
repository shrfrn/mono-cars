import type { Request, Response, NextFunction } from 'express'
import { getAsyncStore } from './async-store.js'
import { UserRoles } from '@car/shared'
import { ForbidenError, UnauthorizedError } from '../errors/app-errors.js'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const { authUser } = getAsyncStore()!

    if (!authUser) throw new UnauthorizedError()
    next()
}

export function requireRole(role: UserRoles | UserRoles[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const roles = Array.isArray(role) ? role : [role]
        const { authUser } = getAsyncStore()!
    
        if (!authUser) throw new UnauthorizedError()
        if (!roles.includes(authUser.role)) throw new ForbidenError()

        next()
    }
}
