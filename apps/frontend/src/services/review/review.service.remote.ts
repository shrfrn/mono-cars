import z from 'zod'

import type { ReviewBaseInput, ReviewPatchInput, ReviewPublic, ReviewQueryOptions } from '@cars/shared'
import { ReviewPatchSchema, ReviewQueryOptionsSchema, ReviewBaseInputSchema, ReviewPublicSchema, AggregatedReviewSchema } from '@cars/shared'

import { httpService } from '../http.service'

const BASE_URL = 'review/'

export const reviewService = {
    query,
    getById,
    remove,
    save,

    getEmptyReview,
    getEmptyReviewOptions,
}

async function query(options: ReviewQueryOptions = {}): Promise<ReviewPublic[]>{
    const queryOptions = ReviewQueryOptionsSchema.parse(options)

    const data = await httpService.get(BASE_URL, queryOptions)
    const reviews = z.array(AggregatedReviewSchema).parse(data)

    return reviews
}

async function getById(reviewId: string): Promise<ReviewPublic | undefined> {
    const data = await httpService.get(BASE_URL + reviewId)
    return ReviewPublicSchema.parse(data)
}

async function remove(reviewId: string): Promise<void> {
    return httpService.delete(BASE_URL + reviewId)
}

async function save(review: ReviewPatchInput | ReviewBaseInput): Promise<ReviewPublic> {
    let validated, data
	
	if ('_id' in review) {
		validated = ReviewPatchSchema.parse(review)
		data = await httpService.patch(BASE_URL, validated)
	} else {
		validated = ReviewBaseInputSchema.parse(review)
		data = await httpService.post(BASE_URL, validated)
	}
    return ReviewPublicSchema.parse(data)
}

function getEmptyReview(): ReviewBaseInput {
    return {
        txt: '',
        rating: 1,
        aboutCarId: '',
    }
}

function getEmptyReviewOptions(): ReviewQueryOptions {
    return {
        filterBy: {
            minRating: 1,
            byUserId: '',
            aboutCarId: '',
        },
        sortBy: {
            sortField: undefined,
            sortDir: 1,
        }
    }
}