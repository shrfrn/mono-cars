import { Request, Response } from 'express'

import { logger } from '#services/logger.service.js'

import { UserPublicSchema } from '@car/shared'
import type { UserQueryOptions, UserParams, UserBase, UserPublic } from '@car/shared'

import { userService } from './user.service.js'

export async function getUsers(req: Request<{}, {}, {}, UserQueryOptions>, res: Response) {
    try {
        const users = await userService.query(req.query)
        const validated = UserPublicSchema.array().parse(users)
        res.json(validated)
    } catch (err) {
		logger.error('Failed to get users', err)
		res.status(400).send({ err: 'Failed to get users' })
    }
}

export async function getUserById(req: Request<UserParams, UserPublic>, res: Response) {
    try {
        const user = await userService.getById(req.params.id)
        const validated = UserPublicSchema.parse(user)
        res.json(validated)
    } catch (err) {
		logger.error('Failed to get user', err)
		res.status(400).send({ err: 'Failed to get user' })
    }
}

export async function postUser(req: Request<{}, UserPublic, UserBase>, res: Response) {
    try {
        const user = await userService.post(req.body)
        const validated = UserPublicSchema.parse(user)
        res.json(validated)
    } catch (err) {
		logger.error('Failed to add user', err)
		res.status(400).send({ err: 'Failed to add user' })
    }
}

