import { Filter, FindOptions, ObjectId, SortDirection } from 'mongodb'

import { getAsyncStore } from '#middleware/async-store.js'
import { getCollection, byObjectId, prepareInsert, prepareUpdate } from '#services/db.service.js'
import { makeId } from '#services/util.service.js'

import type { Car, CarBase, CarPatch, CarQueryOptions, Comment } from '@cars/shared'
import { CarSchema, CommentSchema } from '@cars/shared'

import { EntityNotFoundError, ForbidenError, UnauthorizedError } from '../../errors/app-errors.js'

export const carService = {
	query,
	remove,
	getById,
	post,
	patch,

	addComment,
	removeComment,
	
	like,
	unlike,
}

type MongoCar = Omit<Car, '_id'>

async function query(queryOptions: CarQueryOptions): Promise<Car[]> {
    const { criteria, sort } = _parseQueryOptions(queryOptions)
	const options: FindOptions = { sort }

	const collection = await getCollection<MongoCar>('car')
    const cars = await collection.find(criteria, options).toArray()
	
    return CarSchema.array().parse(cars)
}

async function getById(carId: string): Promise<Car | null> {
	const collection = await getCollection<MongoCar>('car')
	const car = await collection.findOne(byObjectId(carId))

	if (!car) return null
	return CarSchema.parse(car)
}

async function remove(carId: string): Promise<void> {
    const { authUser } = getAsyncStore()!
    if (!authUser) throw new UnauthorizedError()

	// Check if the car exists and...
	const criteria: { _id: ObjectId, 'owner._id'?: string} = { _id: new ObjectId(carId) }
	
	// ...is owned by the authenticated user or authenticated user is an admin/moderator
	if (authUser.role !== 'Admin' && authUser.role !== 'Moderator') criteria['owner._id'] = authUser._id

	const collection = await getCollection<MongoCar>('car')
	const { deletedCount } = await collection.deleteOne(criteria)

	if (deletedCount === 0) throw new ForbidenError() // Assuming car exists but with different owner
}

async function post(carBase: CarBase): Promise<Car> {
    const { authUser: owner } = getAsyncStore()!
    if (!owner) throw new UnauthorizedError()

	const collection = await getCollection<MongoCar>('car')
    const car = { ...prepareInsert(carBase), owner }

	await collection.insertOne(car)
	return CarSchema.parse(car)
}

async function patch(carPatch: CarPatch): Promise<Car> {
    const { authUser } = getAsyncStore()!
    if (!authUser) throw new UnauthorizedError()
    
	const { criteria, update } = prepareUpdate(carPatch)

	// If car is owned by the authenticated user or authenticated user is an admin/moderator
	if (authUser.role !== 'Admin' && authUser.role !== 'Moderator') criteria['owner._id'] = authUser._id
	
	const collection = await getCollection<MongoCar>('car')
	const updated = await collection.findOneAndUpdate(criteria, update, { returnDocument: 'after' })

	if (!updated) throw new ForbidenError() // Assuming car exists but with different owner
	return CarSchema.parse(updated)
}

async function addComment(carId: string, txt: string): Promise<Comment> {
	const { authUser: author } = getAsyncStore()!
	if (!author) throw new UnauthorizedError()

	const comment = {
		id: makeId(),
		createdAt: Date.now(),
		txt,
		author,
	}

	const collection = await getCollection<MongoCar>('car')

	const { modifiedCount } = await collection.updateOne(byObjectId(carId), { $push: { comments: comment } })
	if (modifiedCount === 0) throw new EntityNotFoundError('Car not found')

	return CommentSchema.parse(comment)
}

async function removeComment(carId: string, commentId: string): Promise<void> {
	const { authUser } = getAsyncStore()!
	if (!authUser) throw new UnauthorizedError()

	// Check if the comment exists and...
	const criteria: { id: string, 'author._id'?: string} = { id: commentId }

	// ...was authored by the authenticated user or authenticated user is an admin/moderator
	if (authUser.role !== 'Admin' && authUser.role !== 'Moderator') criteria['author._id'] = authUser._id

	const collection = await getCollection<MongoCar>('car')
	const { modifiedCount } = await collection.updateOne(byObjectId(carId), { $pull: { comments: criteria } })

	if (modifiedCount === 0) throw new ForbidenError() // Assuming comment exists but with different author
}

async function like(carId: string): Promise<void> {
	const { authUser: owner } = getAsyncStore()!
	if (!owner) throw new UnauthorizedError()

	const like = {
		createdAt: Date.now(),
		by: owner,
	}

	const collection = await getCollection<MongoCar>('car')
	const { modifiedCount } = await collection.updateOne(byObjectId(carId), { $push: { likedBy: like } })

	if (modifiedCount === 0) throw new EntityNotFoundError('Car not found')
}

async function unlike(carId: string): Promise<void> {
	const { authUser } = getAsyncStore()!
	if (!authUser) throw new UnauthorizedError()

	const collection = await getCollection<MongoCar>('car')
	const { modifiedCount } = await collection.updateOne(byObjectId(carId), { $pull: { likedBy: { 'by._id': authUser._id }}})

	if (modifiedCount === 0) throw new EntityNotFoundError('Car not found')
}

function _parseQueryOptions(queryOptions: CarQueryOptions) {
	const { filterBy, sortBy } = queryOptions

	const criteria: Filter<MongoCar> = {}
	const sort: Record<string, SortDirection> = {}

	if (filterBy?.txt) {
		criteria.make = { $regex: filterBy.txt, $options: 'i' }
	}

    if (filterBy?.minSpeed) {
		criteria.maxSpeed = { $gte: filterBy.minSpeed! }
    }
    
    if (filterBy?.type) {
		criteria.type = filterBy.type!
	}
	
	if (sortBy?.sortField) {
		sort[sortBy.sortField] = sortBy.sortDir
	}

	return { criteria, sort }
}