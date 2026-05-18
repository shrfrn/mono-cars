import { Request, Response } from 'express'

import { AggregatedReviewPublicSchema, AggregatedReviewSchema, ReviewPublicSchema } from '@car/shared'
import type { ReviewQueryOptions, ReviewParams, ReviewBase, ReviewPatch, ReviewPublic, AggregatedReview } from '@car/shared'

import { reviewService } from './review.service.js'
import { getAsyncStore } from '#middleware/async-store.js'
import { UnauthorizedError } from '../../errors/app-errors.js'

export async function getReviews(req: Request<{}, {}, {}, ReviewQueryOptions>, res: Response) {
	const reviews = await reviewService.query(res.locals.query)

	const validated = AggregatedReviewPublicSchema.array().parse(reviews)
	res.json(validated)
}

export async function getReviewById(req: Request<ReviewParams, ReviewPublic>, res: Response) {
	const reviewId = res.locals.params.id
	const review = await reviewService.getById(reviewId)
	const validated = ReviewPublicSchema.parse(review)

	res.json(validated)
}

export async function postReview(req: Request<{}, AggregatedReview, ReviewBase, {}>, res: Response) {
	const { authUser: byUser } = getAsyncStore()!
	if (!byUser) throw new UnauthorizedError()

	const addedReview = await reviewService.post(res.locals.body)
	const validated = AggregatedReviewPublicSchema.parse(addedReview)

	res.json(validated)
}

export async function patchReview(req: Request<ReviewParams, ReviewPublic, ReviewPatch>, res: Response) {
    const review = res.locals.body

	const updatedReview = await reviewService.patch(review)
	const validated = ReviewPublicSchema.parse(updatedReview)
	res.json(validated)
}

export async function removeReview(req: Request<ReviewParams>, res: Response) {
	const reviewId = res.locals.params.id
	await reviewService.remove(reviewId)

	res.status(204).send()
}