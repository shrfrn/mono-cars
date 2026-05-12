import { Request, Response } from 'express'

import { UserPublicSchema } from '@car/shared'
import type { UserQueryOptions, UserParams, UserBase, UserPublic } from '@car/shared'

import { userService } from './user.service.js'

export async function getUsers(req: Request<{}, {}, {}, UserQueryOptions>, res: Response) {
	const users = await userService.query(req.query)
	const validated = UserPublicSchema.array().parse(users)
	res.json(validated)
}

export async function getUserById(req: Request<UserParams, UserPublic>, res: Response) {
	const user = await userService.getById(req.params.id)
	const validated = UserPublicSchema.parse(user)
	res.json(validated)
}

export async function postUser(req: Request<{}, UserPublic, UserBase>, res: Response) {
	const user = await userService.post(req.body)
	const validated = UserPublicSchema.parse(user)
	res.status(201).json(validated)
}

