import type { UserFilter, UserPublic } from '@cars/shared'
import { UserFilterSchema, UserPublicSchema } from '@cars/shared'

import { httpService } from '../http.service'

const BASE_URL = 'user/'

export const userService = {
    query,
    getById,
}

async function query(options: UserFilter = {}): Promise<UserPublic[]> {
	const filterBy = UserFilterSchema.parse(options)

    const data = await httpService.get(BASE_URL, { params: filterBy })
    return UserPublicSchema.array().parse(data)
}

async function getById(userId: string): Promise<UserPublic | undefined> {
    const user = await httpService.get(BASE_URL + userId)
    return user ? UserPublicSchema.parse(user) : undefined
}