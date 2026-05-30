import z from 'zod'

import { CommentSchema, MiniCarSchema } from './car.js'
import { UserPublicSchema } from './user.js'

export const UserProfileCommentSchema = CommentSchema
	.pick({ id: true, createdAt: true, txt: true })
	.extend({ car: MiniCarSchema })

export const UserProfileSchema = UserPublicSchema.extend({
	likedCars: MiniCarSchema.array(),
	comments: UserProfileCommentSchema.array(),
})

export type UserProfile = z.infer<typeof UserProfileSchema>
