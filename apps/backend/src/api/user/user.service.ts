import { UserSchema } from '@cars/shared'
import type { User, UserBase, UserQueryOptions } from '@cars/shared'

import { EntityNotFoundError } from '../../errors/app-errors.js'
import { byObjectId, getCollection, prepareInsert } from '#services/db.service.js'
import { Filter, FindOptions, SortDirection } from 'mongodb'

export const userService = {
	query,
	getById,
    getByUsername,
	post,
}

type MongoUser = Omit<User, '_id'>

async function query(queryOptions: UserQueryOptions): Promise<User[]> {
	const { criteria, sort } = _parseQueryOptions(queryOptions)
	const options: FindOptions = { sort }

	const collection = await getCollection<MongoUser>('user')
	const users = await collection.find(criteria, options).toArray()

    return UserSchema.array().parse(users)
}

async function getById(userId: string): Promise<User> {
	const collection = await getCollection<MongoUser>('user')
	
	const user = await collection.findOne(byObjectId(userId))
	if (!user) throw new EntityNotFoundError(`User with _id ${userId}`)

    return UserSchema.parse(user)
}

async function getByUsername(username: string): Promise<User | undefined> {
	const collection = await getCollection<MongoUser>('user')
	
	const user = await collection.findOne({ username })
	if (!user) return
		
    return UserSchema.parse(user)
}

async function post(userBase: UserBase): Promise<User> {
	const collection = await getCollection<MongoUser>('user')

	const user = { ...prepareInsert(userBase) }
	await collection.insertOne(user)

    return UserSchema.parse(user)
}

function _parseQueryOptions(queryOptions: UserQueryOptions) {
    const { filterBy, sortBy } = queryOptions

    const criteria: Filter<MongoUser> = {}
    const sort: Record<string, SortDirection> = {}

    if (filterBy?.txt) {
		criteria.username = { $regex: filterBy.txt, $options: 'i' }
    }

    if (filterBy?.role) {
		criteria.role = filterBy.role!
    }

    if (sortBy?.sortField) {
		sort[sortBy.sortField] = sortBy.sortDir
    }

    return { criteria, sort }
}