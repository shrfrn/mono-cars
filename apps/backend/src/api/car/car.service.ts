import { Filter, FindOptions, Sort, SortDirection } from 'mongodb'
import type { Car, CarBase, CarPatch, CarQueryOptions } from '@cars/shared'
import { CarSchema } from '@cars/shared'
import { getAsyncStore } from '#middleware/async-store.js'
import { ForbidenError, EntityNotFoundError, UnauthorizedError } from '../../errors/app-errors.js'
import { getCollection, byObjectId, prepareInsert, prepareUpdate } from '#services/db.service.js'

export const carService = {
	query,
	remove,
	getById,
	post,
	patch,
}

type MongoCar = Omit<Car, '_id'>

async function query(queryOptions: CarQueryOptions): Promise<Car[]> {
    const { criteria, sort } = _parseQueryOptions(queryOptions)
	const options: FindOptions = { sort }

	const collection = await getCollection<MongoCar>('cars')
    const cars = await collection.find(criteria, options).toArray()
	
    return CarSchema.array().parse(cars)
}

async function getById(carId: string): Promise<Car | null> {
	const collection = await getCollection<MongoCar>('cars')
	const car = await collection.findOne(byObjectId(carId))

	if (!car) return null
	return CarSchema.parse(car)
}

async function remove(carId: string): Promise<void> {
    const { authUser: owner } = getAsyncStore()!
    if (!owner) throw new UnauthorizedError()

	const collection = await getCollection<MongoCar>('cars')
	const criteria = { ...byObjectId(carId), 'owner._id': owner._id }
	const { deletedCount } = await collection.deleteOne(criteria)

	if (deletedCount === 0) throw new ForbidenError() // Assuming car exists but with different owner
}

async function post(carBase: CarBase): Promise<Car> {
    const { authUser: owner } = getAsyncStore()!
    if (!owner) throw new UnauthorizedError()

	const collection = await getCollection<MongoCar>('cars')
    const car = { ...carBase, ...prepareInsert(carBase), owner }

	await collection.insertOne(car)
	return CarSchema.parse(car)
}

async function patch(carPatch: CarPatch): Promise<Car> {
    const { authUser: owner } = getAsyncStore()!
    if (!owner) throw new UnauthorizedError()
    
	const collection = await getCollection<MongoCar>('cars')
	const { _id, ...car } = { ...prepareUpdate<Car>(carPatch as Car) }

	const criteria = { ...byObjectId(_id), 'owner._id': owner._id }
	const updated = await collection.findOneAndUpdate(criteria, { $set: car }, { returnDocument: 'after' })

	if (!updated) throw new ForbidenError() // Assuming car exists but with different owner
	return CarSchema.parse(updated)
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