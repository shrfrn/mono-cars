import z from 'zod'
import { createEntitySchemas, EntityIdSchema } from './entity.js'
import { MiniUserSchema } from './user.js'
import { CarSchema } from './car.js'

// Review Schemas

export const ReviewFieldsSchema = z.object({
	byUserId: EntityIdSchema,
	aboutCarId: EntityIdSchema,
    txt: z.string(),
    rating: z.number().min(1).max(5),
})

export const { 
	fullSchema: ReviewSchema, 
	baseSchema: ReviewBaseSchema, 
	patchSchema: ReviewPatchSchema } = createEntitySchemas(ReviewFieldsSchema)

export const ReviewBaseInputSchema = ReviewBaseSchema.omit({ 
	byUserId: true,
})

export const ReviewPublicSchema = ReviewSchema    // Nothing to hide in ReviewSchema
export const AggregatedReviewSchema = ReviewSchema.omit({ 
	byUserId: true,
	aboutCarId: true,
})
.extend({
	aboutCar: 
		CarSchema
			.omit({ 
				comments: true, 
				likedBy: true, 
				_createdAt: true, 
				_updatedAt: true, 
				_version: true, 
				owner: true 
			})
			.extend({ 
				owner: MiniUserSchema.omit({ role: true })
			})
			.optional(),
	byUser: 
		MiniUserSchema.omit({ role: true }).optional(),
})
export const AggregatedReviewPublicSchema = AggregatedReviewSchema

export const ReviewFilterSchema = z.object({
	aboutCarId: z.string().optional(),
	byUserId: z.string().optional(),
	minRating: z.coerce.number().min(1).max(5).optional(),
})

export const ReviewSortFieldSchema = z.enum(['rating', 'fullname', 'make', 'maxSpeed']).optional()
export const ReviewSortSchema = z.object({
	sortField: ReviewSortFieldSchema,
	sortDir: z.preprocess(val => Number(val) || 1, z.union([z.literal(1), z.literal(-1)])),
})

export const ReviewQueryOptionsSchema = z.object({
	filterBy: ReviewFilterSchema.optional(),
	sortBy: ReviewSortSchema.optional(),
})

export const ReviewParamsSchema = z.object({
	id: z.string(),
})

export type Review = z.infer<typeof ReviewSchema>

export type ReviewBase = z.infer<typeof ReviewBaseSchema>
export type ReviewBaseInput = z.infer<typeof ReviewBaseInputSchema>
export type ReviewPublic = z.infer<typeof ReviewPublicSchema>

export type AggregatedReview = z.infer<typeof AggregatedReviewSchema>

export type ReviewPatch = z.infer<typeof ReviewPatchSchema>
export type ReviewPatchInput = z.input<typeof ReviewPatchSchema>


export type ReviewFilter = z.infer<typeof ReviewFilterSchema>
export type ReviewSort = z.infer<typeof ReviewSortSchema>
export type ReviewQueryOptions = z.infer<typeof ReviewQueryOptionsSchema>

export type ReviewParams = z.infer<typeof ReviewParamsSchema>