import { Filter, FindOptions, SortDirection, Document, ObjectId } from 'mongodb'
import type { AggregatedReview, Review, ReviewBase, ReviewBaseInput, ReviewPatch, ReviewQueryOptions } from '@car/shared'
import { AggregatedReviewSchema, ReviewSchema } from '@car/shared'
import { getAsyncStore } from '#middleware/async-store.js'
import { EntityNotFoundError, ForbidenError, InternalServerError, UnauthorizedError } from '../../errors/app-errors.js'
import { getCollection, byObjectId, prepareInsert, prepareUpdate } from '#services/db.service.js'

export const reviewService = {
	query,
	remove,
	getById,
	post,
	patch,

	// getUserReviews,
}

type MongoReview = Omit<Review, '_id' | 'byUserId' | 'aboutCarId'> & {
	byUserId: ObjectId;
	aboutCarId: ObjectId;
}
async function query(queryOptions: ReviewQueryOptions): Promise<AggregatedReview[]> {
    const { criteria, sort } = _parseQueryOptions(queryOptions)
	const pipeline = _buildPipeline(criteria, sort)
	
	const collection = await getCollection<MongoReview>('reviews')
    const reviews = await collection.aggregate(pipeline).toArray()
	
    return AggregatedReviewSchema.array().parse(reviews)
}

async function getById(reviewId: string): Promise<Review | null> {
	const collection = await getCollection<MongoReview>('reviews')
	const review = await collection.findOne(byObjectId(reviewId))

	if (!review) return null
	return ReviewSchema.parse(review)
}

async function remove(reviewId: string): Promise<void> {
    const { authUser } = getAsyncStore()!
    if (!authUser) throw new UnauthorizedError()

	const collection = await getCollection<MongoReview>('reviews')
	// const criteria = { ...byObjectId(reviewId), byUserId: new ObjectId(byUser._id) }
	const criteria: { _id: ObjectId, 'byUserId'?: ObjectId} = byObjectId(reviewId)
	if (authUser.role !== 'Admin' && authUser.role !== 'Moderator') criteria.byUserId = new ObjectId(authUser._id)

	const { deletedCount } = await collection.deleteOne(criteria)

	if (deletedCount === 0) throw new ForbidenError() // Assuming review exists but with different owner
}

async function post(reviewBase: ReviewBaseInput): Promise<Review> {
    const { authUser } = getAsyncStore()!
    if (!authUser) throw new UnauthorizedError()

	const collection = await getCollection<MongoReview>('reviews')
    const review = { 
		...prepareInsert(reviewBase), 
		byUserId: new ObjectId(authUser._id),
		aboutCarId: new ObjectId(reviewBase.aboutCarId),
	}

	await collection.insertOne(review)
	return ReviewSchema.parse(review)
}

async function patch(reviewPatch: ReviewPatch): Promise<Review> {
    const { authUser: byUser } = getAsyncStore()!
    if (!byUser) throw new UnauthorizedError()
    
	const collection = await getCollection<MongoReview>('reviews')
	const { _id, ...review } = { 
		...prepareUpdate(reviewPatch), 
			byUserId: new ObjectId(byUser._id), 
			aboutCarId: new ObjectId(reviewPatch.aboutCarId)}

	const updated = await collection.findOneAndUpdate(byObjectId(_id), { $set: review }, { returnDocument: 'after' })
	if (!updated) throw new InternalServerError(`Couldn't update review`) 

	return ReviewSchema.parse(updated)
}

function _parseQueryOptions(queryOptions: ReviewQueryOptions) {
	const { filterBy, sortBy } = queryOptions

	const criteria: Filter<MongoReview> = {}
	const sort: Record<string, SortDirection> = {}

	if (filterBy?.aboutCarId) {
		criteria.aboutCarId = new ObjectId(filterBy.aboutCarId)
	}

    if (filterBy?.byUserId) {
		criteria.byUserId = new ObjectId(filterBy.byUserId)
    }
    
    if (filterBy?.minRating) {
		criteria.rating = { $gte: filterBy.minRating }
	}
	
	if (sortBy?.sortField === 'rating') {
		sort[sortBy.sortField] = sortBy.sortDir
	} else if (sortBy?.sortField === 'fullname') {
		sort['byUser.fullname'] = sortBy.sortDir
	} else if (sortBy?.sortField === 'make') {
		sort['aboutCar.make'] = sortBy.sortDir
	} else if (sortBy?.sortField === 'maxSpeed') {
		sort['aboutCar.maxSpeed'] = sortBy.sortDir
	}

	sort.createdAt = -1

	return { criteria, sort }
}

function _buildPipeline(criteria: Filter<MongoReview>, sort: Record<string, SortDirection>): Document[] {
	const $project: Record<string, 0 | 1> = { aboutCarId: 0, byUserId: 0 }
	console.log('criteria', criteria)
	if (criteria?.aboutCarId) $project.aboutCar = 0
	if (criteria?.byUserId) $project.byUser = 0

	return [
		{ $match: criteria },
		{ $lookup: { from: 'cars', localField: 'aboutCarId', foreignField: '_id', as: 'aboutCar' } },
		{ $unwind: '$aboutCar' },
		{ $lookup: { from: 'users', localField: 'byUserId', foreignField: '_id', as: 'byUser' } },
		{ $unwind: '$byUser' },
		{ $project },
		{ $sort: sort },
	]
}
// async function getUserReviews(userId: string): Promise<Review[]> {
// 	const collection = await getCollection<MongoReview>('reviews')
// 	const reviews = await collection.find({ byUserId: userId }).toArray()
// 	return ReviewSchema.array().parse(reviews)
// }