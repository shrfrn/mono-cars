import { UserProfileSchema, UserSchema } from '@cars/shared'
import type { Car, User, UserBase, UserProfile, UserQueryOptions } from '@cars/shared'

import { EntityNotFoundError } from '../../errors/app-errors.js'
import { byObjectId, getCollection, prepareInsert } from '#services/db.service.js'
import { Filter, FindOptions, ObjectId, SortDirection } from 'mongodb'

export const userService = {
	query,
	getById,
	getUserProfile,
    getByUsername,
	post,
}

type MongoUser = Omit<User, '_id'>
type MongoCar = Omit<Car, '_id'>

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

async function getUserProfile(userId: string): Promise<UserProfile> {
	const userCollection = await getCollection<MongoUser>('user')
	
	const user = await userCollection.findOne(byObjectId(userId))
	if (!user) throw new EntityNotFoundError(`User with _id ${userId}`)
		
	const pipeline = _buildProfilePipeline(userId)
	const carCollection = await getCollection<MongoCar>('car')

	const [facetResult] = await carCollection.aggregate(pipeline).toArray()
	const { comments = [], likedCars = [] } = facetResult ?? {}

	const profile = { ...user, comments, likedCars }
    return UserProfileSchema.parse(profile)
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

function _buildProfilePipeline(userId: string) {
	const match = {
		$or : [
			{ 'likedBy.by._id': userId },
			{ 'comments.author._id': userId },
		]
	}

	const miniCar = {
		_id: '$_id',
		make: '$make',
		maxSpeed: '$maxSpeed',
		type: '$type',
		owner: '$owner'
	}

	const commentProjection = {
		_id: 0,
		id: '$comments.id',
		txt: '$comments.txt',
		createdAt: '$comments.createdAt',
		car: miniCar,
	}

	return [
		{ $match: match },
		{
			$facet: {
				likedCars: [
					{ $match: { 'likedBy.by._id': userId } },
					{ $project: miniCar },
					{ $sort: { make: 1 } },
				],
				comments: [
					{ $match: { 'comments.author._id': userId }},
					{ $unwind: '$comments' },
					{ $match: { 'comments.author._id': userId }},
					{ $project: commentProjection },
					{ $sort: { createdAt: -1 }}
				]
			}
		}
	]
}